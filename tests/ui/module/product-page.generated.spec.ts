import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { UIAssertions } from '@assertions/generic/UIAssertions';
import { ProductPageExpectations } from '@assertions/domain';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

const VALID_PASSWORD = process.env.TEST_PASSWORD!;
const PROBLEM_USERNAME = process.env.PROBLEM_USERNAME!;

// slowMo adds a pause after every Playwright action so headed runs are easy to follow.
// Set SLOW_MO=0 in CI or when speed matters (e.g. SLOW_MO=0 npx playwright test ...).
test.use({ launchOptions: { slowMo: parseInt(process.env.SLOW_MO ?? '0') } });

// ─── Standard User ────────────────────────────────────────────────────────────

test.describe('Product Page - Add to Cart', () => {

  test.beforeEach(async ({ productPage }) => {
    log.info('[TC-PP] Navigating to inventory page');
    await productPage.navigateToInventory();
  });

  test('standard user adds a single product to cart and cart count increments to 1',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage }) => {
      allure.feature('Product Page');
      allure.story('Add to Cart');
      allure.severity(Severity.CRITICAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Act ---
      await productPage.addProductToCartByIndex(0);

      // --- Assert ---
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '1');
      await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(0), 'Remove button for first product');
    });

  test('standard user adds multiple products to cart and cart count matches items added',
    { tag: '@regression' },
    async ({ productPage }) => {
      allure.feature('Product Page');
      allure.story('Add to Cart');
      allure.severity(Severity.CRITICAL);
      allure.tag('regression');

      // --- Act ---
      await productPage.addNProductsToCart(3);

      // --- Assert ---
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '3');
      await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(0), 'Remove button for product 1');
      await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(1), 'Remove button for product 2');
      await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(2), 'Remove button for product 3');
    });

});

test.describe('Product Page - Remove from Cart', () => {

  test.beforeEach(async ({ productPage }) => {
    log.info('[TC-PP] Navigating to inventory page');
    await productPage.navigateToInventory();
  });

  test('standard user removes a single product from cart and cart count decrements by 1',
    { tag: '@regression' },
    async ({ productPage }) => {
      allure.feature('Product Page');
      allure.story('Remove from Cart');
      allure.severity(Severity.CRITICAL);
      allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(2);

      // --- Act ---
      await productPage.removeProductFromCartByIndex(0);

      // --- Assert ---
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '1');
      await UIAssertions.assertElementVisible(productPage.getAddToCartButtonByIndex(0), 'Add to cart button reverted for first product');
    });

  test('standard user removes multiple products from cart and count reduces after each removal',
    { tag: '@regression' },
    async ({ productPage }) => {
      allure.feature('Product Page');
      allure.story('Remove from Cart');
      allure.severity(Severity.NORMAL);
      allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(3);

      // --- Act / Assert — first removal ---
      await productPage.removeProductFromCartByIndex(0);
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '2');

      // --- Act / Assert — second removal ---
      await productPage.removeProductFromCartByIndex(1);
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '1');
    });

  test('standard user removes all products from cart and cart badge disappears',
    { tag: '@regression' },
    async ({ productPage }) => {
      allure.feature('Product Page');
      allure.story('Remove from Cart');
      allure.severity(Severity.NORMAL);
      allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(2);

      // --- Act ---
      await productPage.removeNProductsFromCart(2);

      // --- Assert ---
      await UIAssertions.assertElementHidden(productPage.getCartBadgeLocator(), 'cart badge');
      await UIAssertions.assertElementVisible(productPage.getAddToCartButtonByIndex(0), 'Add to cart button for first product');
      await UIAssertions.assertElementVisible(productPage.getAddToCartButtonByIndex(1), 'Add to cart button for second product');
    });

});

test.describe('Product Page - Product Navigation', () => {

  test.beforeEach(async ({ productPage }) => {
    log.info('[TC-PP] Navigating to inventory page');
    await productPage.navigateToInventory();
  });

  test('standard user clicks a product name and is redirected to the product detail page',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage, productDetailPage, page }) => {
      allure.feature('Product Page');
      allure.story('Product Navigation');
      allure.severity(Severity.CRITICAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Arrange ---
      const expectedProductName = await productPage.getProductNameTextByIndex(0);

      // --- Act ---
      await productPage.clickProductByIndex(0);

      // --- Assert ---
      await UIAssertions.assertURLContains(page, ProductPageExpectations.PRODUCT_DETAIL_URL);
      await UIAssertions.assertElementVisible(productDetailPage.getProductNameLocator(), 'product name on detail page');
      await UIAssertions.assertElementText(productDetailPage.getProductNameLocator(), expectedProductName);
    });

});

test.describe('Product Page - Cart Navigation', () => {

  test.beforeEach(async ({ productPage }) => {
    log.info('[TC-PP] Navigating to inventory page');
    await productPage.navigateToInventory();
  });

  test('standard user clicks cart icon with 0 items and navigates to empty cart page',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage, cartPage, page }) => {
      allure.feature('Product Page');
      allure.story('Cart Navigation');
      allure.severity(Severity.NORMAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Arrange ---
      await UIAssertions.assertElementHidden(productPage.getCartBadgeLocator(), 'cart badge absent before navigation');

      // --- Act ---
      await productPage.goToCart();

      // --- Assert ---
      await UIAssertions.assertURLContains(page, ProductPageExpectations.CART_URL);
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 0);
    });

  test('standard user clicks cart icon with one item and navigates to cart page showing that item',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage, cartPage, page }) => {
      allure.feature('Product Page');
      allure.story('Cart Navigation');
      allure.severity(Severity.NORMAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Arrange ---
      await productPage.addProductToCartByIndex(0);

      // --- Act ---
      await productPage.goToCart();

      // --- Assert ---
      await UIAssertions.assertURLContains(page, ProductPageExpectations.CART_URL);
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 1);
    });

  test('standard user clicks cart icon with multiple items and navigates to cart page showing all items',
    { tag: '@regression' },
    async ({ productPage, cartPage, page }) => {
      allure.feature('Product Page');
      allure.story('Cart Navigation');
      allure.severity(Severity.NORMAL);
      allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(3);

      // --- Act ---
      await productPage.goToCart();

      // --- Assert ---
      await UIAssertions.assertURLContains(page, ProductPageExpectations.CART_URL);
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 3);
    });

});

test.describe('Product Page - Cart Persistence', () => {

  test.beforeEach(async ({ productPage }) => {
    log.info('[TC-PP] Navigating to inventory page');
    await productPage.navigateToInventory();
  });

  test('standard user cart count remains consistent after navigating away and returning to products page',
    { tag: '@regression' },
    async ({ productPage, cartPage, page }) => {
      allure.feature('Product Page');
      allure.story('Cart Persistence');
      allure.severity(Severity.NORMAL);
      allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(2);

      // --- Act ---
      await productPage.goToCart();
      await cartPage.clickContinueShopping();

      // --- Assert ---
      await UIAssertions.assertURLContains(page, ProductPageExpectations.INVENTORY_URL);
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '2');
      await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(0), 'Remove button for first product persisted');
      await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(1), 'Remove button for second product persisted');
    });

});

// ─── Problem User Defects ─────────────────────────────────────────────────────

test.describe('Product Page - Problem User Defects', () => {

  test.beforeEach(async ({ page, loginPage }) => {
    log.info('[TC-PP] Logging in as problem_user for defect verification');
    // Clear standard_user session so problem_user can log in cleanly
    await page.context().clearCookies();
    await loginPage.navigateToLogin();
    await loginPage.login(PROBLEM_USERNAME, VALID_PASSWORD);
    // login() waits for /inventory.html — no extra navigation needed
  });

  test('problem user remove button does not reduce the cart quantity',
    { tag: '@regression' },
    async ({ productPage }) => {
      allure.feature('Product Page');
      allure.story('Problem User Defects');
      allure.severity(Severity.BLOCKER);
      allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(2);
      const countBeforeRemove = await productPage.getCartCount();

      // --- Act ---
      await productPage.removeProductFromCartByIndex(0);

      // --- Assert ---
      // Known defect: Remove button has no effect on cart count for problem_user
      const countAfterRemove = await productPage.getCartCount();
      test.expect(countBeforeRemove, 'cart count after adding 2 products').toBe(2);
      test.expect(countAfterRemove, 'cart count should remain 2 — Remove is broken for problem_user').toBe(2);
    });

  test('problem user sees all product images as the same image across all listings',
    { tag: '@regression' },
    async ({ productPage }) => {
      allure.feature('Product Page');
      allure.story('Problem User Defects');
      allure.severity(Severity.BLOCKER);
      allure.tag('regression');

      // --- Act ---
      const imageSrcs = await productPage.getAllProductImageSrcs();

      // --- Assert ---
      const uniqueSrcs = new Set(imageSrcs.filter(Boolean));
      test.expect(
        uniqueSrcs.size,
        'problem_user should see the same (wrong) image repeated across all product cards'
      ).toBe(1);
    });

  test('problem user clicking a product link sees an incorrect image on the detail page',
    { tag: '@regression' },
    async ({ productPage, productDetailPage }) => {
      allure.feature('Product Page');
      allure.story('Problem User Defects');
      allure.severity(Severity.BLOCKER);
      allure.tag('regression');

      // --- Arrange ---
      const listingImageSrcs = await productPage.getAllProductImageSrcs();
      const listingImageForFirstProduct = listingImageSrcs[0];

      // --- Act ---
      await productPage.clickProductByIndex(0);

      // --- Assert ---
      // For problem_user the detail page shows a different wrong image from what was on the listing
      const detailImageSrc = await productDetailPage.getProductImageSrc();
      test.expect(
        detailImageSrc,
        'problem_user detail page image should not match the listing page image for the same product'
      ).not.toBe(listingImageForFirstProduct);
    });

});
