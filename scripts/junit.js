const fs = require('fs');

// Summarise one JUnit file from its ROOT <testsuites …> aggregate (not the first per-file
// <testsuite>, whose counts are partial). Playwright splits bad outcomes into failures= (assertion
// failures) and errors= (timeouts / thrown errors); "failed" is the sum of both — reading failures=
// alone under-reports and can mislabel a red run as passed. Unparseable → parsed:false, so callers
// fail closed.
function parseJunit(file) {
  try {
    const xml = fs.readFileSync(file, 'utf8');
    const root = (xml.match(/<testsuites\b[^>]*>/) || [''])[0];
    if (!root) return { total: '?', passed: '?', failures: '?', skipped: '?', parsed: false };
    const attr = (name) => parseInt((root.match(new RegExp(`${name}="(\\d+)"`)) || [null, 0])[1]);
    const total = attr('tests');
    const skipped = attr('skipped');
    const failures = attr('failures') + attr('errors');
    return { total, passed: total - failures - skipped, failures, skipped, parsed: true };
  } catch {
    return { total: '?', passed: '?', failures: '?', skipped: '?', parsed: false };
  }
}

module.exports = { parseJunit };
