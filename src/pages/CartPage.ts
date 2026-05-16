import { Page, Locator } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class CartPage extends BasePage {
  private readonly cartItems = this.page.locator('[data-test="inventory-item"]');
  private readonly continueShoppingBtn = this.page.locator('[data-test="continue-shopping"]');
  private readonly cartTitle = this.page.locator('[data-test="title"]');
  private readonly checkoutBtn = this.page.locator('[data-test="checkout"]');
  private readonly cartBadge = this.page.locator('[data-test="shopping-cart-badge"]');

  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  async navigateToCart(): Promise<void> {
    await this.navigate('/cart.html');
  }

  // ─── Locator accessors ────────────────────────────────────────────────────────

  getCartItemsLocator(): Locator {
    return this.cartItems;
  }

  getCartTitleLocator(): Locator {
    return this.cartTitle;
  }

  getCartBadgeLocator(): Locator {
    return this.cartBadge;
  }

  // ─── Dynamic locators — by index ─────────────────────────────────────────────

  getItemNameLocatorByIndex(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="inventory-item-name"]');
  }

  getItemDescriptionLocatorByIndex(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="inventory-item-desc"]');
  }

  getItemPriceLocatorByIndex(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="inventory-item-price"]');
  }

  getItemQuantityLocatorByIndex(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="item-quantity"]');
  }

  getRemoveButtonByIndex(index: number): Locator {
    return this.cartItems.nth(index).getByRole('button', { name: 'Remove' });
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async getCartItemCount(): Promise<number> {
    return this.getCount(this.cartItems);
  }

  async getItemNameTextByIndex(index: number): Promise<string> {
    return this.getText(this.getItemNameLocatorByIndex(index));
  }

  async getItemDescriptionTextByIndex(index: number): Promise<string> {
    return this.getText(this.getItemDescriptionLocatorByIndex(index));
  }

  async getItemPriceTextByIndex(index: number): Promise<string> {
    return this.getText(this.getItemPriceLocatorByIndex(index));
  }

  async isCartBadgeVisible(): Promise<boolean> {
    return this.isVisible(this.cartBadge);
  }

  async getCartBadgeCount(): Promise<number> {
    const visible = await this.isVisible(this.cartBadge);
    if (!visible) return 0;
    return parseInt(await this.getText(this.cartBadge), 10);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async clickContinueShopping(): Promise<void> {
    await this.click(this.continueShoppingBtn);
    await this.waitForURL(/inventory\.html/);
  }

  async removeItemByIndex(index: number): Promise<void> {
    await this.click(this.getRemoveButtonByIndex(index));
  }

  async removeAllItems(): Promise<void> {
    const count = await this.getCartItemCount();
    for (let i = 0; i < count; i++) {
      await this.click(this.cartItems.first().getByRole('button', { name: 'Remove' }));
    }
  }

  async clickCheckout(): Promise<void> {
    await this.click(this.checkoutBtn);
    await this.waitForURL(/checkout-step-one\.html/);
  }
}
