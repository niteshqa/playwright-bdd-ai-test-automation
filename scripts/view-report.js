#!/usr/bin/env node

// Console summary of the last run: pass/fail counts from the JUnit report plus any records the run
// created (reports/created-records.json). Handy over SSH or in CI logs where HTML reports aren't.
const fs = require('fs');
const path = require('path');
const { parseJunit } = require('./junit');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const junitFile =
  process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE || path.join(REPORT_DIR, 'junit', 'results.xml');
const recordsFile = path.join(REPORT_DIR, 'created-records.json');

const s = parseJunit(junitFile);
if (!s.parsed) {
  console.log(`No results at ${path.relative(process.cwd(), junitFile)} — run the tests first.`);
  process.exit(0);
}
console.log('\n📊 LAST RUN');
console.log('─'.repeat(40));
console.log(`Total   ${s.total}\nPassed  ${s.passed}\nFailed  ${s.failures}\nSkipped ${s.skipped}`);
if (fs.existsSync(recordsFile)) {
  const recs = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  console.log(`\n🧾 Records created: ${recs.length}`);
  recs.forEach((r) =>
    console.log(`  ${r.testId || '-'}  ${r.app} ${r.type} ${r.id} ${r.total || ''}`)
  );
}
console.log('\nHTML: npm run test:report   Allure: npm run allure:serve');
