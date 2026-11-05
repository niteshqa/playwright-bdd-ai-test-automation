const framework = require('../config/framework.config');

// Fail-closed guard for steps that create real data (place an order, submit a payment, book an
// appointment). Allowed without ceremony only on a KNOWN non-prod host (config/framework.config.js).
// Anything else — production, or a host we don't recognise (e.g. a redirect to another domain) —
// requires all three supervised-run conditions: not CI, ALLOW_PROD_WRITES=true, and --headed.
// writeBlockReason is pure (no Playwright) so it can be unit-checked in isolation.

/** Returns why a destructive action must NOT run on `pageUrl`, or null when it's allowed. */
function writeBlockReason(pageUrl, { ci, allowProdWrites, headless }) {
  if (framework.isNonProdUrl(pageUrl)) return null;
  const where = framework.hostOf(pageUrl) || pageUrl;
  if (ci) return `refusing a destructive action on ${where}: never allowed in CI`;
  if (!allowProdWrites)
    return `refusing a destructive action on ${where}: ALLOW_PROD_WRITES is not true`;
  if (headless !== false)
    return `refusing a destructive action on ${where}: requires a supervised --headed run`;
  return null;
}

// Call from every step that can create data — not just "place the order": any step that submits
// (e.g. a third-party payment that completes the order inside its own popup). Playwright is
// required lazily so writeBlockReason stays usable outside a test run.
function assertMayWrite(pageUrl) {
  const { test } = require('@playwright/test');
  const reason = writeBlockReason(pageUrl, {
    ci: !!process.env.CI,
    allowProdWrites: process.env.ALLOW_PROD_WRITES === 'true',
    headless: test.info().project.use.headless,
  });
  if (reason) throw new Error(`[destructiveActionGuard] ${reason}`);
}

module.exports = { writeBlockReason, assertMayWrite };
