#!/usr/bin/env node
// Usage:
//   node archive.js list              - list all mocks (newest first, JSON)
//   node archive.js metadata <slug>   - show metadata for a specific mock (JSON)

const fs = require('fs');
const path = require('path');
const os = require('os');

const ARCHIVE_DIR = path.join(os.homedir(), '.mock-ui-archive');

function readMetadata(slug) {
  const metaPath = path.join(ARCHIVE_DIR, slug, '.mock-ui.json');
  const archivePath = path.join(ARCHIVE_DIR, slug);
  const base = { slug, archivePath };
  if (!fs.existsSync(metaPath)) return base;
  try {
    return { ...base, ...JSON.parse(fs.readFileSync(metaPath, 'utf8')) };
  } catch {
    return base;
  }
}

function listMocks() {
  if (!fs.existsSync(ARCHIVE_DIR)) return [];
  return fs.readdirSync(ARCHIVE_DIR)
    .filter(name => {
      try { return fs.statSync(path.join(ARCHIVE_DIR, name)).isDirectory(); }
      catch { return false; }
    })
    .sort()
    .reverse() // newest first (date-prefixed slugs)
    .map(readMetadata);
}

function getMockMetadata(slug) {
  const mockDir = path.join(ARCHIVE_DIR, slug);
  if (!fs.existsSync(mockDir)) {
    throw new Error(`Mock '${slug}' not found in ${ARCHIVE_DIR}`);
  }
  return readMetadata(slug);
}

if (require.main === module) {
  const [,, command, arg] = process.argv;

  if (command === 'list') {
    process.stdout.write(JSON.stringify(listMocks(), null, 2) + '\n');
  } else if (command === 'metadata') {
    if (!arg) {
      process.stderr.write('Usage: node archive.js metadata <slug>\n');
      process.exit(1);
    }
    try {
      process.stdout.write(JSON.stringify(getMockMetadata(arg), null, 2) + '\n');
    } catch (err) {
      process.stderr.write(err.message + '\n');
      process.exit(1);
    }
  } else {
    process.stderr.write('Usage: node archive.js list | metadata <slug>\n');
    process.exit(1);
  }
}

module.exports = { listMocks, getMockMetadata };
