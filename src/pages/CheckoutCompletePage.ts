import { Page, Locator } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class CheckoutCompletePage extends BasePage {
  private readonly completeHeader = this.page.locator('[data-test="complete-header"]');
  private readonly completeText   = this.page.locator('[data-test="complete-text"]');
  private readonly backHomeBtn    = this.page.locator('[data-test="back-to-products"]');

  constructor(page: Page) {
    super(page);
  }

  getCompleteHeaderLocator(): Locator {
    return this.completeHeader;
  }

  getCompleteTextLocator(): Locator {
    return this.completeText;
  }

  async getCompleteHeaderText(): Promise<string> {
    return this.getText(this.completeHeader);
  }

  async clickBackHome(): Promise<void> {
    await this.click(this.backHomeBtn);
    await this.waitForURL(/inventory\.html/);
  }
}
