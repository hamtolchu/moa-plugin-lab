#!/usr/bin/env node
// Usage:
//   node dev-server.js start <archivePath>   - start dev server in background, output URL to stdout
//   node dev-server.js stop <archivePath>    - stop dev server
//   node dev-server.js status <archivePath>  - check status (JSON to stdout)

const { spawn } = require('child_process');
const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const EXPECTED_ROOT = path.join(os.homedir(), '.mock-ui-archive');

function validateArchivePath(archivePath) {
  const abs = path.resolve(archivePath);
  if (!abs.startsWith(EXPECTED_ROOT + path.sep) && abs !== EXPECTED_ROOT) {
    throw new Error(`아카이브 경로가 허용 범위 밖입니다: ${abs}`);
  }
  if (!fs.existsSync(abs)) {
    throw new Error(`아카이브 경로를 찾을 수 없습니다: ${abs}`);
  }
  return abs;
}

function readPid(absPath) {
  try {
    return parseInt(fs.readFileSync(path.join(absPath, '.dev-server.pid'), 'utf8').trim(), 10);
  } catch {
    return null;
  }
}

function isPidAlive(pid) {
  if (!pid || isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function stopDevServer(archivePath) {
  // Best-effort: no throw — stopping a non-running server is always a no-op
  const abs = path.resolve(archivePath);
  const pid = readPid(abs);
  if (pid && isPidAlive(pid)) {
    try {
      // Negative PID kills the entire process group (pnpm + child Next.js process).
      // Works because spawn({ detached: true }) makes the child the process group leader.
      process.kill(-pid, 'SIGTERM');
      process.stderr.write(`Dev 서버 정지 (PID ${pid})\n`);
    } catch (err) {
      process.stderr.write(`PID ${pid} 정지 실패: ${err.message}\n`);
    }
  }
  for (const f of [
    path.join(abs, '.dev-server.pid'),
    path.join(abs, '.dev-server.url'),
  ]) {
    try { fs.unlinkSync(f); } catch {}
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

async function findFreePort(start = 3000, end = 3010) {
  for (let port = start; port <= end; port++) {
    if (await isPortFree(port)) return port;
  }
  return null;
}

function pollUntilReady(port, pid, logFile, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      if (!isPidAlive(pid)) {
        reject(new Error(`Dev 서버 프로세스(PID ${pid})가 즉시 종료되었습니다. 로그를 확인하세요: ${logFile}`));
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error(`Dev 서버가 ${timeoutMs / 1000}초 내에 응답하지 않았습니다. 로그: ${logFile}`));
        return;
      }
      const req = http.get(`http://localhost:${port}/`, (res) => {
        res.resume();
        resolve();
      });
      req.setTimeout(1000, () => req.destroy());
      req.on('error', () => setTimeout(attempt, 600));
    }
    // Give the process a moment to start before first poll
    setTimeout(attempt, 1000);
  });
}

async function startDevServer(archivePath) {
  const absPath = validateArchivePath(archivePath);
  const pidFile = path.join(absPath, '.dev-server.pid');
  const urlFile = path.join(absPath, '.dev-server.url');
  const logFile = path.join(absPath, '.dev-server.log');

  // Stop existing server if running (idempotent)
  const existingPid = readPid(absPath);
  if (existingPid && isPidAlive(existingPid)) {
    process.stderr.write(`기존 dev 서버 정지 중 (PID ${existingPid})...\n`);
    stopDevServer(archivePath);
    await new Promise(r => setTimeout(r, 800));
  }

  const port = await findFreePort();
  if (!port) throw new Error('사용 가능한 포트를 찾을 수 없습니다 (3000-3010 모두 사용 중).');

  const logFd = fs.openSync(logFile, 'w');
  const child = spawn('pnpm', ['dev', '--port', String(port)], {
    cwd: absPath,
    detached: true,
    stdio: ['ignore', logFd, logFd],
  });
  // Detach from parent event loop so this script can exit while child lives on
  child.unref();
  fs.closeSync(logFd);

  fs.writeFileSync(pidFile, String(child.pid));
  const url = `http://localhost:${port}`;
  fs.writeFileSync(urlFile, url);

  process.stderr.write(`Dev 서버 시작 중 (PID ${child.pid}, port ${port})...\n`);
  try {
    await pollUntilReady(port, child.pid, logFile);
    process.stderr.write('Dev 서버 준비 완료\n');
  } catch (err) {
    process.stderr.write(`WARNING: ${err.message}\n`);
    // Output the URL anyway — server may just be warming up
  }

  return url;
}

function getDevServerStatus(archivePath) {
  const abs = path.resolve(archivePath);
  const pid = readPid(abs);
  const running = isPidAlive(pid);
  let url;
  try { url = fs.readFileSync(path.join(abs, '.dev-server.url'), 'utf8').trim(); } catch {}
  return { running, ...(pid && { pid }), ...(url && { url }) };
}

if (require.main === module) {
  const [,, command, archivePath] = process.argv;

  if (!command || !archivePath) {
    process.stderr.write('Usage: node dev-server.js start|stop|status <archive-path>\n');
    process.exit(1);
  }

  if (command === 'start') {
    startDevServer(archivePath)
      .then(url => process.stdout.write(url + '\n'))
      .catch(err => {
        process.stderr.write(`ERROR: ${err.message}\n`);
        process.exit(1);
      });
  } else if (command === 'stop') {
    // CLI path-traversal guard (exported stopDevServer is best-effort, no guard needed for programmatic use)
    const abs = path.resolve(archivePath);
    if (!abs.startsWith(EXPECTED_ROOT + path.sep) && abs !== EXPECTED_ROOT) {
      process.stderr.write(`ERROR: 아카이브 경로가 허용 범위 밖입니다: ${abs}\n`);
      process.exit(1);
    }
    stopDevServer(archivePath);
  } else if (command === 'status') {
    try {
      validateArchivePath(archivePath); // guard before reading status
      process.stdout.write(JSON.stringify(getDevServerStatus(archivePath), null, 2) + '\n');
    } catch (err) {
      process.stderr.write(`ERROR: ${err.message}\n`);
      process.exit(1);
    }
  } else {
    process.stderr.write(`알 수 없는 커맨드: ${command}\nUsage: node dev-server.js start|stop|status <archive-path>\n`);
    process.exit(1);
  }
}

module.exports = { startDevServer, stopDevServer, getDevServerStatus };
