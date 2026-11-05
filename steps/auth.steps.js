const { Given, When, Then } = require('../support/fixtures');
const { expect } = require('@playwright/test');
const { resolveUser } = require('../data/resolver');

Given('the user logs in as {string}', async ({ ctx, pages }, userKey) => {
  ctx.user = resolveUser(userKey);
  await pages.login.login(ctx.user);
  ctx.loggedIn = true;
});

// Negative paths: any users key (e.g. "lockedOut", "wrongPassword") — no signed-in state expected.
When('the user logs in with the {string} credentials', async ({ pages }, userKey) => {
  await pages.login.login(resolveUser(userKey));
});

When('they log out', async ({ ctx, pages }) => {
  await pages.header.logout();
  ctx.loggedIn = false;
});

Then('they are signed in', async ({ pages }) => {
  expect(await pages.header.isLoggedIn(), 'no signed-in session').toBe(true);
});

Then('the login error {string} is displayed', async ({ pages }, message) => {
  expect(await pages.login.getErrorMessage()).toContain(message);
});
