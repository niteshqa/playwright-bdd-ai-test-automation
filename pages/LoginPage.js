const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.getByPlaceholder('Username').or(page.getByTestId('username'));
    this.passwordInput = page.getByPlaceholder('Password').or(page.getByTestId('password'));
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error');
  }

  async open(baseUrl) {
    try {
      await this.navigate(baseUrl);
    } catch (e) {
      throw new Error('[PageObject:LoginPage.open] ' + e.message);
    }
  }

  async isLoaded() {
    try {
      return await this.isShown(this.loginButton);
    } catch (e) {
      throw new Error('[PageObject:LoginPage.isLoaded] ' + e.message);
    }
  }

  async login(user) {
    try {
      await this.usernameInput.fill(user.username);
      await this.passwordInput.fill(user.password);
      await this.loginButton.click();
    } catch (e) {
      throw new Error('[PageObject:LoginPage.login] ' + e.message);
    }
  }

  async getErrorMessage() {
    try {
      if (!(await this.isShown(this.errorMessage, 5000))) return '';
      return ((await this.errorMessage.textContent()) || '').trim();
    } catch (e) {
      throw new Error('[PageObject:LoginPage.getErrorMessage] ' + e.message);
    }
  }
}

module.exports = { LoginPage };
