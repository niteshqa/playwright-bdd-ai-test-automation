const { When, Then } = require('../support/fixtures');
const { expect } = require('@playwright/test');
const { resolveProduct } = require('../data/resolver');

Then('the product catalog is displayed', async ({ pages }) => {
  expect(await pages.inventory.isLoaded(), 'catalog did not load').toBe(true);
});

Then('the catalog lists {int} products', async ({ pages }, count) => {
  expect(await pages.inventory.getProductCount()).toBe(count);
});

Then('every product shows a name and a price', async ({ pages }) => {
  expect(await pages.inventory.allTilesShowNameAndPrice(), 'a tile is missing name/price').toBe(
    true
  );
});

When('they sort the catalog by {string}', async ({ pages }, option) => {
  await pages.inventory.sortBy(option);
});

// order: "ascending" | "descending"; field: "name" | "price"
Then('the products are sorted by {string} {string}', async ({ pages }, field, order) => {
  const values =
    field === 'price'
      ? await pages.inventory.getProductPrices()
      : await pages.inventory.getProductNames();
  const sorted = [...values].sort((a, b) =>
    field === 'price' ? a - b : String(a).localeCompare(String(b))
  );
  if (order === 'descending') sorted.reverse();
  expect(values).toEqual(sorted);
});

When('they open the {string} product', async ({ ctx, pages }, productKey) => {
  ctx.lastItem = resolveProduct(productKey);
  await pages.inventory.openProduct(ctx.lastItem);
});

Then('the product details show its name, description and price', async ({ ctx, pages }) => {
  const details = await pages.product.getDetails();
  expect(details.name).toBe(ctx.lastItem.name);
  expect(details.description, 'empty description').not.toBe('');
  expect(details.price).toBe(`$${ctx.lastItem.price}`);
});

When('they go back to the catalog', async ({ pages }) => {
  await pages.product.backToProducts();
});
