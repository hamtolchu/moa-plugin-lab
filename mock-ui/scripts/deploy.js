#!/usr/bin/env node
// Usage: node deploy.js <archive-path>
// Requires: VERCEL_TOKEN env var, vercel CLI installed globally

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
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

async function deployMock(archivePath) {
  const absoluteArchive = validateArchivePath(archivePath);
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error(
      'VERCEL_TOKEN 환경변수가 설정되지 않았습니다.\n' +
      'README.md의 "Vercel 토큰 설정" 섹션을 참고하세요.'
    );
  }

  try {
    execFileSync('vercel', ['--version'], { stdio: 'pipe' });
  } catch {
    throw new Error(
      'vercel CLI가 설치되어 있지 않습니다.\n' +
      '  npm install -g vercel\n' +
      '을 실행해 설치하세요.'
    );
  }

  const slug = path.basename(absoluteArchive);
  process.stderr.write(`Deploying ${slug} to Vercel...\n`);

  let output;
  try {
    // execFileSync uses argument array — no shell injection risk
    output = execFileSync(
      'vercel',
      ['deploy', '--prod', `--token=${token}`, '--yes'],
      {
        cwd: absoluteArchive,
        env: { ...process.env, VERCEL_TOKEN: token },
        timeout: 180000, // 3 min
      }
    ).toString();
  } catch (err) {
    const detail = [err.stdout?.toString(), err.stderr?.toString(), err.message]
      .filter(Boolean).join('\n');
    throw new Error(`Vercel 배포 실패:\n${detail}`);
  }

  // Extract the production URL (last https:// line from output)
  const httpsLines = output.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('https://'));
  const url = httpsLines[httpsLines.length - 1];

  if (!url) {
    throw new Error(`배포는 완료됐지만 URL을 파싱할 수 없습니다. Vercel 출력:\n${output}`);
  }

  // Save metadata
  const metadata = { slug, url, archivePath: absoluteArchive, deployedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(absoluteArchive, '.mock-ui.json'), JSON.stringify(metadata, null, 2));

  process.stderr.write(`배포 완료: ${url}\n`);
  return url;
}

if (require.main === module) {
  const archivePath = process.argv[2];
  if (!archivePath) {
    process.stderr.write('Usage: node deploy.js <archive-path>\n');
    process.exit(1);
  }
  deployMock(archivePath)
    .then(url => process.stdout.write(url + '\n'))
    .catch(err => {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    });
}

module.exports = { deployMock };
