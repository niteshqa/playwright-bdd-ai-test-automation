const { Given, When, Then } = require('../support/fixtures');
const { expect } = require('@playwright/test');
const { resolveProduct, resolveProducts } = require('../data/resolver');

// Scenarios start from a known-empty cart regardless of what an earlier run left behind.
Given('their cart is empty', async ({ pages }) => {
  await pages.header.resetAppState();
  expect(await pages.header.getCartCount()).toBe(0);
});

// One key ("backpack") or a comma-separated list ("backpack, bikeLight").
When('they add {string} to the cart', async ({ ctx, pages }, productKeys) => {
  for (const product of resolveProducts(productKeys)) {
    await pages.inventory.addToCart(product);
    ctx.lastItem = product;
  }
});

When('they add the product to the cart from its details page', async ({ pages }) => {
  await pages.product.addToCart();
});

When('they remove {string} from the catalog', async ({ pages }, productKey) => {
  await pages.inventory.removeFromCart(resolveProduct(productKey));
});

When('they remove {string} from the cart', async ({ pages }, productKey) => {
  await pages.cart.removeItem(resolveProduct(productKey));
});

When('they open the cart', async ({ pages }) => {
  await pages.header.openCart();
  expect(await pages.cart.isLoaded(), 'cart page did not open').toBe(true);
});

Then('the cart badge shows {int}', async ({ pages }, count) => {
  await expect.poll(() => pages.header.getCartCount()).toBe(count);
});

Then('the cart contains {string}', async ({ pages }, productKeys) => {
  const expected = resolveProducts(productKeys).map((p) => p.name);
  expect((await pages.cart.getItemNames()).sort()).toEqual(expected.sort());
});

Then('the cart is empty', async ({ pages }) => {
  expect(await pages.cart.getItemNames()).toEqual([]);
});
