import { Page, Locator } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class CheckoutStepTwoPage extends BasePage {
  private readonly cartItems    = this.page.locator('[data-test="inventory-item"]');
  private readonly subtotalLabel = this.page.locator('[data-test="subtotal-label"]');
  private readonly taxLabel     = this.page.locator('[data-test="tax-label"]');
  private readonly totalLabel   = this.page.locator('[data-test="total-label"]');
  private readonly finishBtn    = this.page.locator('[data-test="finish"]');
  private readonly cancelBtn    = this.page.locator('[data-test="cancel"]');

  constructor(page: Page) {
    super(page);
  }

  // ─── Locator accessors ────────────────────────────────────────────────────────

  getCartItemsLocator(): Locator {
    return this.cartItems;
  }

  getItemNameLocatorByIndex(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="inventory-item-name"]');
  }

  getItemPriceLocatorByIndex(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="inventory-item-price"]');
  }

  getSubtotalLabelLocator(): Locator {
    return this.subtotalLabel;
  }

  getTaxLabelLocator(): Locator {
    return this.taxLabel;
  }

  getTotalLabelLocator(): Locator {
    return this.totalLabel;
  }

  // ─── Queries ──────────────────────────────────────────────────────────────────

  async getCartItemCount(): Promise<number> {
    return this.getCount(this.cartItems);
  }

  async getSubtotalText(): Promise<string> {
    return this.getText(this.subtotalLabel);
  }

  async getTaxText(): Promise<string> {
    return this.getText(this.taxLabel);
  }

  async getTotalText(): Promise<string> {
    return this.getText(this.totalLabel);
  }

  // Parses "Item total: $55.97" → 55.97
  async getSubtotalAmount(): Promise<number> {
    const text = await this.getSubtotalText();
    return parseFloat(text.replace('Item total: $', ''));
  }

  // Parses "Tax: $4.48" → 4.48
  async getTaxAmount(): Promise<number> {
    const text = await this.getTaxText();
    return parseFloat(text.replace('Tax: $', ''));
  }

  // Parses "Total: $60.45" → 60.45
  async getTotalAmount(): Promise<number> {
    const text = await this.getTotalText();
    return parseFloat(text.replace('Total: $', ''));
  }

  // ─── Actions ──────────────────────────────────────────────────────────────────

  async clickFinish(): Promise<void> {
    await this.click(this.finishBtn);
    await this.waitForURL(/checkout-complete\.html/);
  }

  async clickCancel(): Promise<void> {
    await this.click(this.cancelBtn);
  }
}
