const { Before, test } = require('./fixtures');
const framework = require('../config/framework.config');

// Per-scenario timeouts/retries use playwright-bdd's built-in special tags (@timeout:240000,
// @retries:2) directly in the .feature files — no hooks needed.

// Environment-blocked scenarios are parked with test.fixme + a documented reason instead of
// reddening the suite. Custom @fixme<Reason> tags rather than the built-in @fixme, because @fixme
// can't carry the reason into the report. Add one Before per reason.
Before('@fixmeDemo', async () => {
  test.fixme(true, 'Demo of a parked scenario — known app defect, tracked outside the suite');
});

// Scenarios that create real data with no undo (bookings, contact submissions) run only against a
// recognised non-prod host. Evaluated before the Background navigates, from the same resolver.
Before('@nonProdOnly', async () => {
  test.skip(
    !framework.isNonProdUrl(framework.resolveBaseUrl()),
    'Non-prod only — this scenario creates data and never runs on production'
  );
});

// Production writes (real orders, payments) are supervised-local-only and fail closed by skipping.
// The write steps' destructiveActionGuard enforces the same rules, and CI also excludes @prodWrite
// with --grep-invert.
Before('@prodWrite', async () => {
  test.skip(!!process.env.CI, 'Production writes never run in CI — supervised local runs only.');
  test.skip(
    process.env.ALLOW_PROD_WRITES !== 'true',
    'Gated off — set ALLOW_PROD_WRITES=true for a supervised local run.'
  );
  test.skip(
    test.info().project.use.headless !== false,
    'Production writes must be run headed — add --headed.'
  );
});
