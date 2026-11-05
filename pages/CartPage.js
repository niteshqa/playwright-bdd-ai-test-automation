const { BasePage } = require('./BasePage');

class CartPage extends BasePage {
  constructor(page) {
    super(page);
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
  }

  async isLoaded() {
    try {
      return (await this.isAtUrl(/cart\.html/)) && (await this.isShown(this.checkoutButton));
    } catch (e) {
      throw new Error('[PageObject:CartPage.isLoaded] ' + e.message);
    }
  }

  async getItemNames() {
    try {
      return (await this.itemNames.allTextContents()).map((t) => t.trim());
    } catch (e) {
      throw new Error('[PageObject:CartPage.getItemNames] ' + e.message);
    }
  }

  async removeItem(product) {
    try {
      await this.items
        .filter({ has: this.page.getByText(product.name, { exact: true }) })
        .getByRole('button', { name: /remove/i })
        .click();
    } catch (e) {
      throw new Error('[PageObject:CartPage.removeItem] ' + e.message);
    }
  }

  async proceedToCheckout() {
    try {
      await this.checkoutButton.click();
    } catch (e) {
      throw new Error('[PageObject:CartPage.proceedToCheckout] ' + e.message);
    }
  }
}

module.exports = { CartPage };
