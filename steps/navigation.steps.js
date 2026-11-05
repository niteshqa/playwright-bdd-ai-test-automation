const { Given, Then } = require('../support/fixtures');
const { expect } = require('@playwright/test');
const framework = require('../config/framework.config');

// Every scenario opens its app with this one step; all other steps act on whatever app the browser
// is on, so the app (and, via `target`, the environment) is chosen here.
Given(
  'the user navigates to {string} website',
  async ({ ctx, pages, target, healthCheck }, app) => {
    healthCheck.app = app;
    ctx.app = app;
    ctx.baseUrl = framework.resolveBaseUrl(app, target.env);
    await pages.login.open(ctx.baseUrl);
  }
);

// Monitoring suites target production by default; HEALTH_CHECK_ENV=staging dry-runs them.
Given('the health check runs against production', async ({ target }) => {
  target.env = (process.env.HEALTH_CHECK_ENV || 'prod').toLowerCase();
});

Then('the login page is displayed', async ({ pages }) => {
  expect(await pages.login.isLoaded(), 'login page did not render').toBe(true);
});

Then('the app logo is displayed', async ({ pages }) => {
  expect(await pages.header.isLogoVisible(), 'app logo missing').toBe(true);
});
