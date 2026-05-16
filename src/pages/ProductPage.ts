import { Page, Locator } from '@playwright/test';
import { BasePage } from '@base/BasePage';

/**
 * Represents the products listing page (/inventory.html).
 *
 * Dynamic methods operate by index (position in the listing) or by product name,
 * so tests can express intent without knowing product-specific data-test slugs.
 */
export class ProductPage extends BasePage {
  private readonly cartLink = this.page.locator('[data-test="shopping-cart-link"]');
  private readonly cartBadge = this.page.locator('[data-test="shopping-cart-badge"]');
  private readonly inventoryItems = this.page.locator('[data-test="inventory-item"]');
  private readonly allProductImages = this.page.locator('.inventory_item_img img');
  private readonly pageTitle = this.page.locator('[data-test="title"]');

  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  async navigateToInventory(): Promise<void> {
    await this.navigate('/inventory.html');
  }

  async goToCart(): Promise<void> {
    await this.click(this.cartLink);
    await this.waitForURL(/cart\.html/);
  }

  // ─── Dynamic locators — by index ──────────────────────────────────────────────
  // Each returns a Locator scoped to the nth product card, making them
  // independent of product-specific data-test slugs.

  getAddToCartButtonByIndex(index: number): Locator {
    return this.inventoryItems.nth(index).getByRole('button', { name: 'Add to cart' });
  }

  getRemoveButtonByIndex(index: number): Locator {
    return this.inventoryItems.nth(index).getByRole('button', { name: 'Remove' });
  }

  getProductNameLocatorByIndex(index: number): Locator {
    return this.inventoryItems.nth(index).locator('[data-test="inventory-item-name"]');
  }

  getProductImageLocatorByIndex(index: number): Locator {
    return this.inventoryItems.nth(index).locator('img');
  }

  // ─── Dynamic locators — by product name ───────────────────────────────────────
  // Scopes the button lookup to the card whose name text matches exactly.
  // Prefer index-based methods when order is known; use name-based when semantics matter.

  getAddToCartButtonByName(productName: string): Locator {
    return this.inventoryItems
      .filter({ has: this.page.locator('[data-test="inventory-item-name"]', { hasText: productName }) })
      .getByRole('button', { name: 'Add to cart' });
  }

  getRemoveButtonByName(productName: string): Locator {
    return this.inventoryItems
      .filter({ has: this.page.locator('[data-test="inventory-item-name"]', { hasText: productName }) })
      .getByRole('button', { name: 'Remove' });
  }

  getCartBadgeLocator(): Locator {
    return this.cartBadge;
  }

  getPageTitleLocator(): Locator {
    return this.pageTitle;
  }

  getProductDescriptionLocatorByIndex(index: number): Locator {
    return this.inventoryItems.nth(index).locator('[data-test="inventory-item-desc"]');
  }

  getProductPriceLocatorByIndex(index: number): Locator {
    return this.inventoryItems.nth(index).locator('[data-test="inventory-item-price"]');
  }

  // ─── Actions — single product ─────────────────────────────────────────────────

  async addProductToCartByIndex(index: number): Promise<this> {
    await this.click(this.getAddToCartButtonByIndex(index));
    return this;
  }

  async removeProductFromCartByIndex(index: number): Promise<this> {
    await this.click(this.getRemoveButtonByIndex(index));
    return this;
  }

  async addProductToCartByName(productName: string): Promise<this> {
    await this.click(this.getAddToCartButtonByName(productName));
    return this;
  }

  async removeProductFromCartByName(productName: string): Promise<this> {
    await this.click(this.getRemoveButtonByName(productName));
    return this;
  }

  async clickProductByIndex(index: number): Promise<void> {
    await this.click(this.getProductNameLocatorByIndex(index));
    await this.waitForURL(/inventory-item\.html/);
  }

  async clickProductByName(productName: string): Promise<void> {
    await this.click(
      this.inventoryItems
        .filter({ has: this.page.locator('[data-test="inventory-item-name"]', { hasText: productName }) })
        .locator('[data-test="inventory-item-name"]')
    );
    await this.waitForURL(/inventory-item\.html/);
  }

  // ─── Actions — bulk ───────────────────────────────────────────────────────────

  async addNProductsToCart(count: number): Promise<this> {
    for (let i = 0; i < count; i++) {
      await this.click(this.getAddToCartButtonByIndex(i));
    }
    return this;
  }

  // Removes the first N products that currently show a "Remove" button,
  // in listing order. Each click re-evaluates the button position so order is stable.
  async removeNProductsFromCart(count: number): Promise<this> {
    const firstRemoveButton = this.page.getByRole('button', { name: 'Remove' }).first();
    for (let i = 0; i < count; i++) {
      await this.click(firstRemoveButton);
    }
    return this;
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async getCartCount(): Promise<number> {
    const visible = await this.isVisible(this.cartBadge);
    if (!visible) return 0;
    return parseInt(await this.getText(this.cartBadge), 10);
  }

  async isCartBadgeVisible(): Promise<boolean> {
    return this.isVisible(this.cartBadge);
  }

  async getProductNameTextByIndex(index: number): Promise<string> {
    return this.getText(this.getProductNameLocatorByIndex(index));
  }

  async getProductDescriptionByIndex(index: number): Promise<string> {
    return this.getText(this.getProductDescriptionLocatorByIndex(index));
  }

  async getProductPriceByIndex(index: number): Promise<string> {
    return this.getText(this.getProductPriceLocatorByIndex(index));
  }

  async getAllProductImageSrcs(): Promise<(string | null)[]> {
    const count = await this.allProductImages.count();
    return Promise.all(
      Array.from({ length: count }, (_, i) => this.allProductImages.nth(i).getAttribute('src'))
    );
  }
}
