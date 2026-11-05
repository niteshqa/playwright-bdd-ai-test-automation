const { BasePage } = require('./BasePage');

// Product detail page (PDP).
class ProductPage extends BasePage {
  constructor(page) {
    super(page);
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    // PDP-only test id (catalog tiles use add-to-cart-<slug>), so it can't match a lingering tile.
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.backButton = page.getByTestId('back-to-products');
  }

  async getDetails() {
    try {
      await this.backButton.waitFor();
      return {
        name: ((await this.name.textContent()) || '').trim(),
        description: ((await this.description.textContent()) || '').trim(),
        price: ((await this.price.textContent()) || '').trim(),
      };
    } catch (e) {
      throw new Error('[PageObject:ProductPage.getDetails] ' + e.message);
    }
  }

  async addToCart() {
    try {
      await this.addToCartButton.click();
    } catch (e) {
      throw new Error('[PageObject:ProductPage.addToCart] ' + e.message);
    }
  }

  async backToProducts() {
    try {
      await this.backButton.click();
    } catch (e) {
      throw new Error('[PageObject:ProductPage.backToProducts] ' + e.message);
    }
  }
}

module.exports = { ProductPage };
