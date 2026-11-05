const { When, Then } = require('../support/fixtures');
const { expect } = require('@playwright/test');
const { resolveContact } = require('../data/resolver');

When('they proceed to checkout', async ({ pages }) => {
  await pages.cart.proceedToCheckout();
  expect(await pages.checkout.isLoaded(), 'checkout did not open').toBe(true);
});

When('they enter the guest contact details', async ({ pages }) => {
  await pages.checkout.enterContactDetails(resolveContact('guest'));
});

When('they enter the {string} contact details', async ({ pages }, contactKey) => {
  await pages.checkout.enterContactDetails(resolveContact(contactKey));
});

Then('the checkout error {string} is displayed', async ({ pages }, message) => {
  expect(await pages.checkout.getErrorMessage()).toContain(message);
});

Then('the order overview is displayed', async ({ pages }) => {
  expect(await pages.checkout.isOnOverview(), 'order overview not reached').toBe(true);
});

Then('the order totals add up', async ({ pages }) => {
  const t = await pages.checkout.getTotals();
  expect(t.subtotal, 'subtotal ≠ sum of line items').toBeCloseTo(t.itemsSum, 2);
  expect(t.total, 'total ≠ subtotal + tax').toBeCloseTo(t.subtotal + t.tax, 2);
});
