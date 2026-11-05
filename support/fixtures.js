// The one fixture file: extends playwright-bdd's own `test` (itself an extension of
// @playwright/test's) — createBdd() requires that ancestry to inject Given/When/Then into the test.
const { test: base, createBdd } = require('playwright-bdd');
const { pageRegistry } = require('../pages');
const { withSteps } = require('./stepLabels');
const framework = require('../config/framework.config');

const HEALTH_TAG = /^@HC\d+$/;

const test = base.extend({
  // One instance of every registered page object (pages/index.js), each wrapped so its public
  // methods show as named steps in the report (e.g. "LoginPage.login (standard_user)").
  pages: async ({ page, context }, use) => {
    // Abort third-party beacons (config.blockedRoutes) context-wide before the first navigation —
    // they add nondeterministic latency/CORS noise and are never asserted on.
    for (const pattern of framework.blockedRoutes || []) {
      await context.route(pattern, (route) => route.abort());
    }
    const pages = Object.fromEntries(
      Object.entries(pageRegistry).map(([key, PageClass]) => [
        key,
        withSteps(new PageClass(page), PageClass.name),
      ])
    );
    await use(pages);
  },

  // Per-scenario state shared between steps: which app is open, whether a user is signed in, the
  // last item added, whether the order was already placed, and any values a later Then compares.
  // eslint-disable-next-line no-empty-pattern
  ctx: async ({}, use) => {
    await use({
      app: undefined,
      baseUrl: undefined,
      loggedIn: false,
      lastItem: null,
      orderPlaced: false,
    });
  },

  // Which environment "the user navigates to … website" resolves against. undefined → TEST_ENV,
  // else config.defaultEnv. Monitoring Backgrounds point it at production.
  // eslint-disable-next-line no-empty-pattern
  target: async ({}, use) => {
    await use({ env: undefined });
  },

  // Health-check matrix recorder. Each health-check scenario carries an @HC### tag; the app is set
  // by its "navigates to … website" step. On teardown the test's outcome becomes that matrix cell's
  // pass/fail, attached as `health-status` ({ app, status: { HC001: 'pass'|'fail' } }) for
  // scripts/write-health-matrix.js.
  // eslint-disable-next-line no-empty-pattern
  healthCheck: async ({}, use, testInfo) => {
    const healthCheck = { app: null };
    await use(healthCheck);

    const ids = testInfo.tags.filter((t) => HEALTH_TAG.test(t)).map((t) => t.slice(1));
    if (!healthCheck.app || !ids.length || testInfo.status === 'skipped') return;
    const outcome = testInfo.status === 'passed' ? 'pass' : 'fail';
    await testInfo.attach('health-status', {
      body: JSON.stringify({
        app: healthCheck.app,
        status: Object.fromEntries(ids.map((id) => [id, outcome])),
      }),
      contentType: 'application/json',
    });
  },
});

const { Given, When, Then, Before, After } = createBdd(test);

module.exports = { Given, When, Then, Before, After, test, expect: test.expect };
