import { Page, Locator } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class ProductDetailPage extends BasePage {
  private readonly productName        = this.page.locator('[data-test="inventory-item-name"]');
  private readonly productDescription = this.page.locator('[data-test="inventory-item-desc"]');
  private readonly productPrice       = this.page.locator('[data-test="inventory-item-price"]');
  private readonly productImage       = this.page.locator('.inventory_details_img');
  private readonly addToCartBtn       = this.page.locator('[data-test="add-to-cart"]');
  private readonly removeBtn          = this.page.locator('[data-test="remove"]');
  private readonly backToProductsBtn  = this.page.locator('[data-test="back-to-products"]');
  private readonly cartLink           = this.page.locator('[data-test="shopping-cart-link"]');
  private readonly cartBadge          = this.page.locator('[data-test="shopping-cart-badge"]');

  constructor(page: Page) {
    super(page);
  }

  // ─── Locator accessors ────────────────────────────────────────────────────────

  getProductNameLocator(): Locator {
    return this.productName;
  }

  getProductDescriptionLocator(): Locator {
    return this.productDescription;
  }

  getProductImageLocator(): Locator {
    return this.productImage;
  }

  getProductPriceLocator(): Locator {
    return this.productPrice;
  }

  getAddToCartButtonLocator(): Locator {
    return this.addToCartBtn;
  }

  getRemoveButtonLocator(): Locator {
    return this.removeBtn;
  }

  getCartBadgeLocator(): Locator {
    return this.cartBadge;
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async getProductName(): Promise<string> {
    return this.getText(this.productName);
  }

  async getProductDescription(): Promise<string> {
    return this.getText(this.productDescription);
  }

  async getProductPrice(): Promise<string> {
    return this.getText(this.productPrice);
  }

  async getProductImageSrc(): Promise<string | null> {
    return this.getAttribute(this.productImage, 'src');
  }

  async getCartBadgeCount(): Promise<number> {
    const visible = await this.isVisible(this.cartBadge);
    if (!visible) return 0;
    return parseInt(await this.getText(this.cartBadge), 10);
  }

  async isCartBadgeVisible(): Promise<boolean> {
    return this.isVisible(this.cartBadge);
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async addToCart(): Promise<void> {
    await this.click(this.addToCartBtn);
  }

  async removeFromCart(): Promise<void> {
    await this.click(this.removeBtn);
  }

  async goToCart(): Promise<void> {
    await this.click(this.cartLink);
    await this.waitForURL(/cart\.html/);
  }

  async clickBackToProducts(): Promise<void> {
    await this.click(this.backToProductsBtn);
    await this.waitForURL(/inventory\.html/);
  }
}
