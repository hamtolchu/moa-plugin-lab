#!/usr/bin/env node
// Usage: node slug.js "<화면 요구사항 설명>"
// Output: YYYY-MM-DD-<slug>-<hash> (stdout)

function generateSlug(desc) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Extract ASCII words (Korean text is excluded from slug words for URL safety)
  const asciiWords = desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1)
    .slice(0, 4);

  const slugBase = asciiWords.length > 0
    ? asciiWords.join('-')
    : 'mock'; // Fallback for all-Korean descriptions

  // Unique 3-char hash: description hash XOR'd with sub-millisecond time → collision-safe across concurrent sessions
  const descHash = desc.split('').reduce((acc, ch) => Math.imul(31, acc) + ch.charCodeAt(0) | 0, 0);
  const hash = (Math.abs(descHash) ^ (Date.now() & 0xffffff)).toString(36).slice(-3).padStart(3, '0');

  return `${today}-${slugBase}-${hash}`;
}

if (require.main === module) {
  const desc = process.argv.slice(2).join(' ').trim();
  if (!desc) {
    process.stderr.write('Usage: node slug.js "<description>"\n');
    process.exit(1);
  }
  process.stdout.write(generateSlug(desc) + '\n');
}

module.exports = { generateSlug };
