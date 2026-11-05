const { BasePage } = require('./BasePage');

// Two-step checkout: "Your Information" (contact details) → "Overview" (items, totals, Finish).
class CheckoutPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstNameInput = page.getByPlaceholder('First Name').or(page.getByTestId('firstName'));
    this.lastNameInput = page.getByPlaceholder('Last Name').or(page.getByTestId('lastName'));
    this.postalCodeInput = page
      .getByPlaceholder('Zip/Postal Code')
      .or(page.getByTestId('postalCode'));
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.errorMessage = page.getByTestId('error');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
  }

  async isLoaded() {
    try {
      return (
        (await this.isAtUrl(/checkout-step-one\.html/)) && (await this.isShown(this.continueButton))
      );
    } catch (e) {
      throw new Error('[PageObject:CheckoutPage.isLoaded] ' + e.message);
    }
  }

  // contact: { firstName, lastName, postalCode } — blank fields are left empty on purpose
  // (validation scenarios).
  async enterContactDetails(contact) {
    try {
      if (contact.firstName) await this.firstNameInput.fill(contact.firstName);
      if (contact.lastName) await this.lastNameInput.fill(contact.lastName);
      if (contact.postalCode) await this.postalCodeInput.fill(contact.postalCode);
      await this.continueButton.click();
    } catch (e) {
      throw new Error('[PageObject:CheckoutPage.enterContactDetails] ' + e.message);
    }
  }

  async getErrorMessage() {
    try {
      if (!(await this.isShown(this.errorMessage, 5000))) return '';
      return ((await this.errorMessage.textContent()) || '').trim();
    } catch (e) {
      throw new Error('[PageObject:CheckoutPage.getErrorMessage] ' + e.message);
    }
  }

  async isOnOverview() {
    try {
      return (
        (await this.isAtUrl(/checkout-step-two\.html/)) && (await this.isShown(this.finishButton))
      );
    } catch (e) {
      throw new Error('[PageObject:CheckoutPage.isOnOverview] ' + e.message);
    }
  }

  // Overview totals as numbers; itemsSum is the sum of the listed line prices.
  async getTotals() {
    try {
      await this.total.waitFor();
      const num = async (loc) =>
        parseFloat(((await loc.textContent()) || '').replace(/[^\d.]/g, ''));
      const prices = (await this.itemPrices.allTextContents()).map((p) =>
        parseFloat(p.replace('$', ''))
      );
      return {
        itemsSum: Math.round(prices.reduce((a, b) => a + b, 0) * 100) / 100,
        subtotal: await num(this.subtotal),
        tax: await num(this.tax),
        total: await num(this.total),
      };
    } catch (e) {
      throw new Error('[PageObject:CheckoutPage.getTotals] ' + e.message);
    }
  }

  async finish() {
    try {
      await this.finishButton.click();
    } catch (e) {
      throw new Error('[PageObject:CheckoutPage.finish] ' + e.message);
    }
  }
}

module.exports = { CheckoutPage };
