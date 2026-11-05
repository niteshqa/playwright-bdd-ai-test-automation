#!/usr/bin/env node
/**
 * run-cleanup.js — Phase B of record-then-clean-up (docs/safety-guards.md).
 *
 * Reads pending records from the cleanup ledger (utils/cleanupLedger.js), hands each to the app's
 * adapter (config/cleanup.adapter.js), and writes the outcome back. Safe to re-run: cleaned records
 * are never touched again; failed ones are retried with --include-failed.
 *
 * Usage: node scripts/run-cleanup.js [--dry-run] [--include-failed] [--headed]
 */
require('dotenv').config();
const { chromium } = require('@playwright/test');
const { CleanupLedger } = require('../utils/cleanupLedger');
const adapter = require('../config/cleanup.adapter');

const args = new Set(process.argv.slice(2));

async function main() {
  const ledger = new CleanupLedger();
  const pending = ledger.listPending({
    minAgeMinutes: adapter.minAgeMinutes,
    includeFailed: args.has('--include-failed'),
  });
  console.log(`🧹 ${pending.length} record(s) eligible for cleanup.`);
  if (!pending.length || args.has('--dry-run')) {
    pending.forEach((r) => console.log(`  - ${r.app} ${r.type} ${r.id} (created ${r.createdAt})`));
    return;
  }

  const browser = await chromium.launch({ headless: !args.has('--headed') });
  const page = await browser.newPage();
  let failed = 0;
  try {
    for (const rec of pending) {
      let result;
      try {
        result = await adapter.cleanup(rec, { page });
      } catch (e) {
        result = { ok: false, error: e.message };
      }
      if (result && result.ok) {
        ledger.markCleaned(rec.id, { reason: result.reason });
        console.log(`  ✅ ${rec.id} cleaned`);
      } else {
        failed += 1;
        ledger.markFailed(rec.id, { error: result && result.error });
        console.log(`  ❌ ${rec.id} — ${(result && result.error) || 'unknown error'}`);
      }
    }
  } finally {
    await browser.close();
  }
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`❌ Cleanup run failed: ${err.message}`);
  process.exit(1);
});
