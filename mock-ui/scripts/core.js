// core.js — orchestrates the mock-ui creation pipeline for programmatic callers (MCP server, etc.)
// CC Plugin commands use scripts directly via CLI; this module bridges them for non-CLI use.

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { generateSlug } = require('./slug');
const { startDevServer } = require('./dev-server');

const ARCHIVE_DIR = path.join(os.homedir(), '.mock-ui-archive');

// Step 1 of 2: clone boilerplate + copy resources. Returns {slug, archivePath}.
// Separating scaffold from writeAndBuild lets the LLM fix page.tsx and rebuild without re-cloning.
async function scaffoldMock(description, resourcesDir) {
  const slug = generateSlug(description);
  const archivePath = path.join(ARCHIVE_DIR, slug);

  if (fs.existsSync(archivePath)) {
    throw new Error(`Slug collision: ${archivePath} already exists.`);
  }

  try {
    execFileSync(
      'git',
      ['clone', '--depth', '1', '--branch', 'main',
        'https://github.com/hamtolchu/mao-startkit.git', archivePath],
      { stdio: 'pipe', timeout: 60000 }
    );
  } catch (err) {
    throw new Error(`mao-startkit clone 실패: ${err.stderr?.toString() || err.message}`);
  }

  // Remove .git so the directory is not a git repo (clean for Vercel deploy)
  fs.rmSync(path.join(archivePath, '.git'), { recursive: true, force: true });

  // Override boilerplate resources with plugin's curated versions
  fs.copyFileSync(path.join(resourcesDir, 'COMPONENTS.md'), path.join(archivePath, 'COMPONENTS.md'));
  fs.copyFileSync(path.join(resourcesDir, 'vercel.json'), path.join(archivePath, 'vercel.json'));

  return { slug, archivePath };
}

// Step 2 of 2: write page.tsx, build, start dev server. Returns {slug, archivePath, devUrl}.
// On build failure, throws with {message, buildLog} so the LLM can fix pageTsx and retry.
async function writeAndBuildMock(slug, pageTsx) {
  const archivePath = path.join(ARCHIVE_DIR, slug);
  if (!fs.existsSync(archivePath)) {
    throw new Error(`Archive not found for slug '${slug}'. Call scaffoldMock first.`);
  }

  // Write the LLM-generated page
  fs.writeFileSync(path.join(archivePath, 'app', 'page.tsx'), pageTsx, 'utf8');

  // Install dependencies (cached by pnpm, fast on retry)
  try {
    execFileSync('pnpm', ['install', '--silent'], {
      cwd: archivePath,
      stdio: 'pipe',
      timeout: 120000,
    });
  } catch (err) {
    const detail = err.stdout?.toString() || err.stderr?.toString() || err.message;
    throw Object.assign(new Error(`pnpm install 실패:\n${detail}`), { buildLog: detail });
  }

  // Build
  let buildLog;
  try {
    buildLog = execFileSync('pnpm', ['run', 'build'], {
      cwd: archivePath,
      stdio: 'pipe',
      timeout: 180000,
    }).toString();
  } catch (err) {
    const detail = [err.stdout?.toString(), err.stderr?.toString()].filter(Boolean).join('\n');
    throw Object.assign(new Error(`빌드 실패 — page.tsx를 수정한 뒤 다시 시도하세요.\n${detail}`), { buildLog: detail });
  }

  // Start dev server
  const devUrl = await startDevServer(archivePath);

  return { slug, archivePath, devUrl };
}

module.exports = { scaffoldMock, writeAndBuildMock };
