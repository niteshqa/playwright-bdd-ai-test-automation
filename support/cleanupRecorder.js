const path = require('path');
const { test } = require('@playwright/test');
const { loadJSON, saveJSON, fileExists } = require('../utils/fs');
const { CleanupLedger } = require('../utils/cleanupLedger');
const framework = require('../config/framework.config');

// The test id is the scenario's numbered tag (e.g. @regression012), not @timeout:N.
function currentTestId() {
  try {
    const info = test.info();
    return ((info.tags || []).find((t) => /^@[A-Za-z]+\d{3}$/.test(t)) || '').replace(/^@/, '');
  } catch {
    return '';
  }
}

// Best-effort: record a record the run created (an order, a booking, an account) so it can be
//   1. listed in the emailed report (reports/created-records.json), and
//   2. cleaned up later from the durable ledger when it was created on a shared/prod environment
//      (see docs/safety-guards.md — record-then-clean-up).
// Never throws — reporting must not fail a passing journey.
function recordForCleanup({ id, type = 'order', total = '', email = '', baseUrl = '' } = {}) {
  try {
    if (!id) return;
    const app = (process.env.APP || framework.defaultApp).toLowerCase();
    const env = framework.isNonProdUrl(baseUrl) ? 'non-prod' : 'prod';
    const rec = { id, type, testId: currentTestId(), total, app, env };

    const file = path.join(process.cwd(), 'reports', 'created-records.json');
    const records = fileExists(file) && Array.isArray(loadJSON(file)) ? loadJSON(file) : [];
    if (!records.some((r) => r.id === id)) records.push(rec);
    saveJSON(file, records);

    // Only production records need the durable cleanup ledger; non-prod data is disposable.
    if (env === 'prod') new CleanupLedger().record({ id, type, app, env, email, total });
    console.log(`  [Created] ${app} ${type} ${id}${total ? ` (${total})` : ''}`);
  } catch {
    // reporting is best-effort — never fail the test on it
  }
}

module.exports = { recordForCleanup };
