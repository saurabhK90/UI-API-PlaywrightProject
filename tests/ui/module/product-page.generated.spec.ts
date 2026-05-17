import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { UIAssertions } from '@assertions/generic/UIAssertions';
import { ProductPageExpectations } from '@assertions/domain';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

// slowMo adds a pause after every Playwright action so headed runs are easy to follow.
// Set SLOW_MO=0 in CI or when speed matters (e.g. SLOW_MO=0 npx playwright test ...).
test.use({ launchOptions: { slowMo: parseInt(process.env.SLOW_MO ?? '0') } });

// ─── Standard User ────────────────────────────────────────────────────────────

test.describe('Product Page - Add to Cart', () => {

  test.beforeEach(async ({ productPage }) => {
    log.info('[TC-PP] Navigating to inventory page');
    await productPage.navigateToInventory();
  });

  test('Verify user sees cart count increment to 1 when a single product is added to cart',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage }) => {
      await allure.feature('Product Page');
      await allure.story('Add to Cart');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Act ---
      await productPage.addProductToCartByIndex(0);

      // --- Assert ---
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '1');
      await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(0), 'Remove button for first product');
    });

  test('Verify user sees cart count match the number of items when multiple products are added to cart',
    { tag: '@regression' },
    async ({ productPage }) => {
      await allure.feature('Product Page');
      await allure.story('Add to Cart');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

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

  test('Verify user sees cart count decrement by 1 when a single product is removed from cart',
    { tag: '@regression' },
    async ({ productPage }) => {
      await allure.feature('Product Page');
      await allure.story('Remove from Cart');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(2);

      // --- Act ---
      await productPage.removeProductFromCartByIndex(0);

      // --- Assert ---
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '1');
      await UIAssertions.assertElementVisible(productPage.getAddToCartButtonByIndex(0), 'Add to cart button reverted for first product');
    });

  test('Verify user sees cart count reduce after each removal when multiple products are removed one by one',
    { tag: '@regression' },
    async ({ productPage }) => {
      await allure.feature('Product Page');
      await allure.story('Remove from Cart');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

      // --- Arrange ---
      await productPage.addNProductsToCart(3);

      // --- Act / Assert — first removal ---
      await productPage.removeProductFromCartByIndex(0);
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '2');

      // --- Act / Assert — second removal ---
      await productPage.removeProductFromCartByIndex(1);
      await UIAssertions.assertElementText(productPage.getCartBadgeLocator(), '1');
    });

  test('Verify user sees cart badge disappear when all products are removed from cart',
    { tag: '@regression' },
    async ({ productPage }) => {
      await allure.feature('Product Page');
      await allure.story('Remove from Cart');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

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

  test('Verify user is redirected to the product detail page when a product name is clicked',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage, productDetailPage, page }) => {
      await allure.feature('Product Page');
      await allure.story('Product Navigation');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

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

  test('Verify user sees an empty cart page when the cart icon is clicked with no items added',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage, cartPage, page }) => {
      await allure.feature('Product Page');
      await allure.story('Cart Navigation');
      await allure.severity(Severity.NORMAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      await UIAssertions.assertElementHidden(productPage.getCartBadgeLocator(), 'cart badge absent before navigation');

      // --- Act ---
      await productPage.goToCart();

      // --- Assert ---
      await UIAssertions.assertURLContains(page, ProductPageExpectations.CART_URL);
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 0);
    });

  test('Verify user sees the added item on the cart page when the cart icon is clicked with one item in cart',
    { tag: ['@smoke', '@regression'] },
    async ({ productPage, cartPage, page }) => {
      await allure.feature('Product Page');
      await allure.story('Cart Navigation');
      await allure.severity(Severity.NORMAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      await productPage.addProductToCartByIndex(0);

      // --- Act ---
      await productPage.goToCart();

      // --- Assert ---
      await UIAssertions.assertURLContains(page, ProductPageExpectations.CART_URL);
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 1);
    });

  test('Verify user sees all added items on the cart page when the cart icon is clicked with multiple items in cart',
    { tag: '@regression' },
    async ({ productPage, cartPage, page }) => {
      await allure.feature('Product Page');
      await allure.story('Cart Navigation');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

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

  test('Verify user sees cart count remain consistent when navigating away from cart and returning to the products page',
    { tag: '@regression' },
    async ({ productPage, cartPage, page }) => {
      await allure.feature('Product Page');
      await allure.story('Cart Persistence');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

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

  test.beforeEach(async ({ problemUserProductPage }) => {
    await problemUserProductPage.navigateToInventory();
  });

  test('Verify user sees cart count unchanged when the remove button is clicked as problem user',
    { tag: '@regression' },
    async ({ problemUserProductPage }) => {
      await allure.feature('Product Page');
      await allure.story('Problem User Defects');
      await allure.severity(Severity.BLOCKER);
      await allure.tag('regression');

      // --- Arrange ---
      await problemUserProductPage.addNProductsToCart(2);
      const countBeforeRemove = await problemUserProductPage.getCartCount();

      // --- Act ---
      await problemUserProductPage.removeProductFromCartByIndex(0);

      // --- Assert ---
      // Known defect: Remove button has no effect on cart count for problem_user
      const countAfterRemove = await problemUserProductPage.getCartCount();
      test.expect(countBeforeRemove, 'cart count after adding 2 products').toBe(2);
      test.expect(countAfterRemove, 'cart count should remain 2 — Remove is broken for problem_user').toBe(2);
    });

  test('Verify user sees all product listing images as the same image when browsing as problem user',
    { tag: '@regression' },
    async ({ problemUserProductPage }) => {
      await allure.feature('Product Page');
      await allure.story('Problem User Defects');
      await allure.severity(Severity.BLOCKER);
      await allure.tag('regression');

      // --- Act ---
      const imageSrcs = await problemUserProductPage.getAllProductImageSrcs();

      // --- Assert ---
      const uniqueSrcs = new Set(imageSrcs.filter(Boolean));
      test.expect(
        uniqueSrcs.size,
        'problem_user should see the same (wrong) image repeated across all product cards'
      ).toBe(1);
    });

  test('Verify user sees a different incorrect image on the detail page when a product link is clicked as problem user',
    { tag: '@regression' },
    async ({ problemUserProductPage, problemUserProductDetailPage }) => {
      await allure.feature('Product Page');
      await allure.story('Problem User Defects');
      await allure.severity(Severity.BLOCKER);
      await allure.tag('regression');

      // --- Arrange ---
      const listingImageSrcs = await problemUserProductPage.getAllProductImageSrcs();
      const listingImageForFirstProduct = listingImageSrcs[0];

      // --- Act ---
      await problemUserProductPage.clickProductByIndex(0);

      // --- Assert ---
      // For problem_user the detail page shows a different wrong image from what was on the listing
      const detailImageSrc = await problemUserProductDetailPage.getProductImageSrc();
      test.expect(
        detailImageSrc,
        'problem_user detail page image should not match the listing page image for the same product'
      ).not.toBe(listingImageForFirstProduct);
    });

});
