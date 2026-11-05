const { BasePage } = require('../BasePage');

// The app header shared by every signed-in page: burger menu (logout, reset app state), cart link
// and its item-count badge.
class Header extends BasePage {
  constructor(page) {
    super(page);
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page
      .getByTestId('logout-sidebar-link')
      .or(page.getByRole('link', { name: 'Logout' }));
    this.resetLink = page
      .getByTestId('reset-sidebar-link')
      .or(page.getByRole('link', { name: 'Reset App State' }));
    this.closeMenuButton = page.getByRole('button', { name: 'Close Menu' });
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.appLogo = page.locator('.app_logo');
  }

  async isLoggedIn() {
    try {
      return await this.isShown(this.menuButton);
    } catch (e) {
      throw new Error('[PageObject:Header.isLoggedIn] ' + e.message);
    }
  }

  async isLogoVisible() {
    try {
      return await this.isShown(this.appLogo);
    } catch (e) {
      throw new Error('[PageObject:Header.isLogoVisible] ' + e.message);
    }
  }

  async _openMenu() {
    await this.menuButton.click();
    await this.logoutLink.waitFor({ state: 'visible' });
  }

  async logout() {
    try {
      await this._openMenu();
      await this.logoutLink.click();
    } catch (e) {
      throw new Error('[PageObject:Header.logout] ' + e.message);
    }
  }

  // Server-side cart state lives in the app; "Reset App State" clears it for a clean scenario start.
  async resetAppState() {
    try {
      await this._openMenu();
      await this.resetLink.click();
      await this.closeMenuButton.click();
      await this.cartBadge.waitFor({ state: 'hidden' });
      // The reset clears the cart but not the buttons already rendered; reload to resync them.
      await this.page.reload({ waitUntil: 'domcontentloaded' });
    } catch (e) {
      throw new Error('[PageObject:Header.resetAppState] ' + e.message);
    }
  }

  async openCart() {
    try {
      await this.cartLink.click();
    } catch (e) {
      throw new Error('[PageObject:Header.openCart] ' + e.message);
    }
  }

  // Number on the cart badge; 0 when the badge is absent (empty cart).
  async getCartCount() {
    try {
      if (!(await this.cartBadge.isVisible())) return 0;
      return parseInt((await this.cartBadge.textContent()) || '0', 10);
    } catch (e) {
      throw new Error('[PageObject:Header.getCartCount] ' + e.message);
    }
  }
}

module.exports = { Header };
