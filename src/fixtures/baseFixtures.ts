import { test as base, Page } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { ProductPage } from '@pages/ProductPage';
import { ProductDetailPage } from '@pages/ProductDetailPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutStepOnePage } from '@pages/CheckoutStepOnePage';
import { CheckoutStepTwoPage } from '@pages/CheckoutStepTwoPage';
import { CheckoutCompletePage } from '@pages/CheckoutCompletePage';
import { Logger } from '@utils/Logger';
import path from 'path';

const PROBLEM_USER_AUTH_STATE = path.join('auth-state', 'problem-user.json');

export interface UIFixtures {
  /** Unauthenticated page — use for testing login flows */
  loginPage: LoginPage;
  /** Raw authenticated Page object — use when you need the page without a page object */
  authenticatedPage: Page;
  /** Products listing page (/inventory.html) — pre-authenticated as standard_user */
  productPage: ProductPage;
  /** Product detail page (/inventory-item.html) — navigate to it via productPage methods */
  productDetailPage: ProductDetailPage;
  /** Cart page (/cart.html) — navigate to it via productPage.goToCart() */
  cartPage: CartPage;
  /** Checkout step 1 (/checkout-step-one.html) — information form */
  checkoutStepOnePage: CheckoutStepOnePage;
  /** Checkout step 2 (/checkout-step-two.html) — order overview */
  checkoutStepTwoPage: CheckoutStepTwoPage;
  /** Checkout complete (/checkout-complete.html) — confirmation */
  checkoutCompletePage: CheckoutCompletePage;
  /** Internal — writes a spec separator to the log file once per spec file. Auto-use. */
  _specLogger: void;
  // ── Problem user fixtures — separate browser context pre-authenticated as problem_user ──
  /** Raw Page pre-authenticated as problem_user — use when you need the page directly */
  problemUserPage: Page;
  /** Products listing page pre-authenticated as problem_user */
  problemUserProductPage: ProductPage;
  /** Product detail page pre-authenticated as problem_user */
  problemUserProductDetailPage: ProductDetailPage;
  /** Cart page pre-authenticated as problem_user */
  problemUserCartPage: CartPage;
  /** Checkout step 1 pre-authenticated as problem_user */
  problemUserCheckoutStepOnePage: CheckoutStepOnePage;
}

export const test = base.extend<UIFixtures>({
  // Writes a separator line to logs/test-run.log once per spec file when running
  // multiple specs in a single session. Deduplication is handled in Logger.startSpec.
  _specLogger: [async ({}, use, testInfo) => {
    const rel = path.relative(process.cwd(), testInfo.file).replace(/\\/g, '/');
    Logger.startSpec(rel);
    await use();
  }, { auto: true }],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // The ui-chrome project applies storageState at the project level, so the default
  // page fixture already has auth cookies — no need to create a second context here.
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },

  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },

  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutStepOnePage: async ({ page }, use) => {
    await use(new CheckoutStepOnePage(page));
  },

  checkoutStepTwoPage: async ({ page }, use) => {
    await use(new CheckoutStepTwoPage(page));
  },

  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },

  problemUserPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: PROBLEM_USER_AUTH_STATE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  problemUserProductPage: async ({ problemUserPage }, use) => {
    await use(new ProductPage(problemUserPage));
  },

  problemUserProductDetailPage: async ({ problemUserPage }, use) => {
    await use(new ProductDetailPage(problemUserPage));
  },

  problemUserCartPage: async ({ problemUserPage }, use) => {
    await use(new CartPage(problemUserPage));
  },

  problemUserCheckoutStepOnePage: async ({ problemUserPage }, use) => {
    await use(new CheckoutStepOnePage(problemUserPage));
  },
});

export { expect } from '@playwright/test';
