import { Page, Locator } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class CheckoutStepOnePage extends BasePage {
  private readonly firstNameInput  = this.page.locator('[data-test="firstName"]');
  private readonly lastNameInput   = this.page.locator('[data-test="lastName"]');
  private readonly postalCodeInput = this.page.locator('[data-test="postalCode"]');
  private readonly continueBtn     = this.page.locator('[data-test="continue"]');
  private readonly cancelBtn       = this.page.locator('[data-test="cancel"]');
  private readonly errorMessage    = this.page.locator('[data-test="error"]');

  constructor(page: Page) {
    super(page);
  }

  async navigateToCheckoutStepOne(): Promise<void> {
    await this.navigate('/checkout-step-one.html');
  }

  async fillFirstName(firstName: string): Promise<this> {
    await this.type(this.firstNameInput, firstName);
    return this;
  }

  async fillLastName(lastName: string): Promise<this> {
    await this.type(this.lastNameInput, lastName);
    return this;
  }

  async fillZipCode(zipCode: string): Promise<this> {
    await this.type(this.postalCodeInput, zipCode);
    return this;
  }

  // Fills all fields and waits for step 2 URL — use when checkout is expected to succeed.
  async continueToStepTwo(firstName: string, lastName: string, zipCode: string): Promise<void> {
    await this.type(this.firstNameInput, firstName);
    await this.type(this.lastNameInput, lastName);
    await this.type(this.postalCodeInput, zipCode);
    await this.click(this.continueBtn);
    await this.waitForURL(/checkout-step-two\.html/);
  }

  // Clicks Continue without waiting for navigation — use in validation-error tests.
  async clickContinue(): Promise<void> {
    await this.click(this.continueBtn);
  }

  async clickCancel(): Promise<void> {
    await this.click(this.cancelBtn);
  }

  getErrorLocator(): Locator {
    return this.errorMessage;
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async getLastNameValue(): Promise<string> {
    return this.getInputValue(this.lastNameInput);
  }
}
