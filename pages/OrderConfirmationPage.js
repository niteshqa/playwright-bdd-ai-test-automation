const { BasePage } = require('./BasePage');

class OrderConfirmationPage extends BasePage {
  constructor(page) {
    super(page);
    this.header = page.getByTestId('complete-header').or(page.getByRole('heading', { level: 2 }));
    this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
  }

  async isConfirmed() {
    try {
      return (await this.isAtUrl(/checkout-complete\.html/)) && (await this.isShown(this.header));
    } catch (e) {
      throw new Error('[PageObject:OrderConfirmationPage.isConfirmed] ' + e.message);
    }
  }

  async getHeading() {
    try {
      return ((await this.header.textContent()) || '').trim();
    } catch (e) {
      throw new Error('[PageObject:OrderConfirmationPage.getHeading] ' + e.message);
    }
  }

  async backHome() {
    try {
      await this.backHomeButton.click();
    } catch (e) {
      throw new Error('[PageObject:OrderConfirmationPage.backHome] ' + e.message);
    }
  }
}

module.exports = { OrderConfirmationPage };
