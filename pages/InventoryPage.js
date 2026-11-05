const { BasePage } = require('./BasePage');

// Product listing (catalog): tiles with name/price/add-to-cart, plus the sort dropdown.
class InventoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByTestId('product-sort-container');
  }

  _tile(productName) {
    return this.items.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  async isLoaded() {
    try {
      return (await this.isAtUrl(/inventory\.html/)) && (await this.isShown(this.items.first()));
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.isLoaded] ' + e.message);
    }
  }

  async getProductCount() {
    try {
      await this.items.first().waitFor();
      return await this.items.count();
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.getProductCount] ' + e.message);
    }
  }

  // Every tile shows a non-empty name and a "$" price.
  async allTilesShowNameAndPrice() {
    try {
      const names = await this.itemNames.allTextContents();
      const prices = await this.itemPrices.allTextContents();
      return (
        names.length > 0 &&
        names.length === prices.length &&
        names.every((n) => n.trim()) &&
        prices.every((p) => /^\$\d+(\.\d{2})?$/.test(p.trim()))
      );
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.allTilesShowNameAndPrice] ' + e.message);
    }
  }

  // option is the visible label, e.g. "Price (low to high)".
  async sortBy(option) {
    try {
      await this.sortSelect.selectOption({ label: option });
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.sortBy] ' + e.message);
    }
  }

  async getProductNames() {
    try {
      return (await this.itemNames.allTextContents()).map((t) => t.trim());
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.getProductNames] ' + e.message);
    }
  }

  async getProductPrices() {
    try {
      return (await this.itemPrices.allTextContents()).map((t) => parseFloat(t.replace('$', '')));
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.getProductPrices] ' + e.message);
    }
  }

  async addToCart(product) {
    try {
      await this._tile(product.name)
        .getByRole('button', { name: /add to cart/i })
        .click();
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.addToCart] ' + e.message);
    }
  }

  async removeFromCart(product) {
    try {
      await this._tile(product.name)
        .getByRole('button', { name: /remove/i })
        .click();
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.removeFromCart] ' + e.message);
    }
  }

  async openProduct(product) {
    try {
      await this.itemNames.getByText(product.name, { exact: true }).click();
      // The PDP reuses the catalog's test ids and this SPA swaps the DOM a beat after the URL
      // changes, so wait for a PDP-only control — otherwise the next PDP locator matches all six
      // catalog tiles.
      await this.page.getByTestId('back-to-products').waitFor();
    } catch (e) {
      throw new Error('[PageObject:InventoryPage.openProduct] ' + e.message);
    }
  }
}

module.exports = { InventoryPage };
