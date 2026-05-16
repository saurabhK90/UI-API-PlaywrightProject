import { Page, Locator } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.getByPlaceholder('Username');
  private readonly passwordInput = this.page.getByPlaceholder('Password');
  private readonly loginButton = this.page.getByRole('button', { name: 'Login' });
  // data-test attribute used by Sauce Demo — testIdAttribute not configured for data-test in playwright.config
  private readonly errorMessage = this.page.locator('[data-test="error"]');

  constructor(page: Page) {
    super(page);
  }

  async navigateToLogin(): Promise<void> {
    await this.navigate('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.loginButton);
    await this.waitForURL(/\/inventory\.html/);
  }

  async enterUsername(username: string): Promise<this> {
    await this.type(this.usernameInput, username);
    return this;
  }

  async enterPassword(password: string): Promise<this> {
    await this.type(this.passwordInput, password);
    return this;
  }

  async clickLoginButton(): Promise<this> {
    await this.click(this.loginButton);
    return this;
  }

  getErrorLocator(): Locator {
    return this.errorMessage;
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }
}
