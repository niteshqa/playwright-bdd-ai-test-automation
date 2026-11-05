const { When, Then } = require('../support/fixtures');
const { expect } = require('@playwright/test');
const { assertMayWrite } = require('../support/destructiveActionGuard');

// Places a real order — guarded: allowed on known non-prod hosts, otherwise only in a supervised
// run (see support/destructiveActionGuard.js). Never place orders around this guard.
When('they place the order', async ({ ctx, page, pages }) => {
  assertMayWrite(page.url());
  await pages.checkout.finish();
  ctx.orderPlaced = true;
});

Then('the order is confirmed', async ({ pages }) => {
  expect(await pages.orderConfirmation.isConfirmed(), 'no order confirmation').toBe(true);
});

Then('the confirmation message {string} is displayed', async ({ pages }, message) => {
  expect(await pages.orderConfirmation.getHeading()).toContain(message);
});
