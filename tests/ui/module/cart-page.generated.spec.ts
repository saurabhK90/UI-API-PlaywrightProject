import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { UIAssertions } from '@assertions/generic/UIAssertions';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

// slowMo adds a pause after every Playwright action so headed runs are easy to follow.
// Set SLOW_MO=0 in CI or when speed matters (e.g. SLOW_MO=0 npx playwright test ...).
test.use({ launchOptions: { slowMo: parseInt(process.env.SLOW_MO ?? '0') } });

test.describe('Cart Page', () => {

  test.describe('Standard User', () => {

    test.beforeEach(async ({ productPage }) => {
      await productPage.navigateToInventory();
    });

    test('Verify user sees correct name, description, price and quantity when a single item is added from the Products page',
      { tag: ['@smoke', '@regression'] },
      async ({ productPage, cartPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Display Cart Items');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      const productName = await productPage.getProductNameTextByIndex(0);
      const productDescription = await productPage.getProductDescriptionByIndex(0);
      const productPrice = await productPage.getProductPriceByIndex(0);
      log.info(`[TC-CP-001] Captured from Products page: "${productName}" — ${productPrice}`);

      // --- Act ---
      log.info(`[TC-CP-001] Adding "${productName}" to cart and navigating to cart page`);
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();

      // --- Assert ---
      log.info('[TC-CP-001] Asserting 1 item with matching name, description, price and quantity=1');
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 1);
      await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(0), productName);
      await UIAssertions.assertElementContainsText(cartPage.getItemDescriptionLocatorByIndex(0), productDescription);
      await UIAssertions.assertElementContainsText(cartPage.getItemPriceLocatorByIndex(0), productPrice);
      await UIAssertions.assertElementText(cartPage.getItemQuantityLocatorByIndex(0), '1');
    });

    test('Verify user sees correct details for all items when multiple products are added from the Products page',
      { tag: '@regression' },
      async ({ productPage, cartPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Display Cart Items');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

      // --- Arrange ---
      const names = await Promise.all([0, 1, 2].map(i => productPage.getProductNameTextByIndex(i)));
      const descriptions = await Promise.all([0, 1, 2].map(i => productPage.getProductDescriptionByIndex(i)));
      const prices = await Promise.all([0, 1, 2].map(i => productPage.getProductPriceByIndex(i)));
      log.info(`[TC-CP-002] Captured 3 products: ${names.join(' | ')}`);

      // --- Act ---
      log.info('[TC-CP-002] Adding 3 products to cart and navigating to cart page');
      await productPage.addNProductsToCart(3);
      await productPage.goToCart();

      // --- Assert ---
      log.info('[TC-CP-002] Asserting all 3 items present in cart with matching details and badge=3');
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 3);
      for (let i = 0; i < 3; i++) {
        await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(i), names[i]);
        await UIAssertions.assertElementContainsText(cartPage.getItemDescriptionLocatorByIndex(i), descriptions[i]);
        await UIAssertions.assertElementContainsText(cartPage.getItemPriceLocatorByIndex(i), prices[i]);
      }
      const badgeCount = await cartPage.getCartBadgeCount();
      test.expect(badgeCount, 'Cart badge should show 3').toBe(3);
    });

    test('Verify user sees cart empty and badge hidden when a single item is removed from the cart',
      { tag: ['@smoke', '@regression'] },
      async ({ productPage, cartPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Remove Cart Items');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-004] Adding 1 product and navigating to cart page');
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-004] Removing item at index 0 from cart');
      await cartPage.removeItemByIndex(0);

      // --- Assert ---
      log.info('[TC-CP-004] Asserting cart is empty and badge is hidden');
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 0);
      await UIAssertions.assertElementHidden(cartPage.getCartBadgeLocator(), 'cart badge');
    });

    test('Verify user sees cart become empty and badge hidden when all items are removed one by one',
      { tag: '@regression' },
      async ({ productPage, cartPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Remove Cart Items');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-005] Adding 3 products and navigating to cart page');
      await productPage.addNProductsToCart(3);
      await productPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-005] Removing all 3 items one by one');
      await cartPage.removeAllItems();

      // --- Assert ---
      log.info('[TC-CP-005] Asserting cart is empty and badge is hidden');
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 0);
      await UIAssertions.assertElementHidden(cartPage.getCartBadgeLocator(), 'cart badge');
    });

    test('Verify user is navigated to the Products page when Continue Shopping is clicked from an empty cart',
      { tag: ['@smoke', '@regression'] },
      async ({ productPage, cartPage, page }) => {
      await allure.feature('Cart Page');
      await allure.story('Continue Shopping Navigation');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-007] Navigating to cart page (empty cart)');
      await productPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-007] Clicking Continue Shopping');
      await cartPage.clickContinueShopping();

      // --- Assert ---
      log.info('[TC-CP-007] Asserting redirect to /inventory.html and Products heading visible');
      await UIAssertions.assertURLContains(page, '/inventory.html');
      await UIAssertions.assertElementVisible(productPage.getPageTitleLocator(), 'Products heading');
    });

    test('Verify user is navigated to the Checkout page when Checkout is clicked with items in cart',
      { tag: ['@smoke', '@regression'] },
      async ({ productPage, cartPage, page }) => {
      await allure.feature('Cart Page');
      await allure.story('Checkout Navigation');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-009] Adding 1 product and navigating to cart page');
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-009] Clicking Checkout');
      await cartPage.clickCheckout();

      // --- Assert ---
      log.info('[TC-CP-009] Asserting redirect to /checkout-step-one.html');
      await UIAssertions.assertURLContains(page, '/checkout-step-one.html');
    });

    test('Verify user is navigated to the Checkout page when Checkout is clicked with an empty cart',
      { tag: '@regression' },
      async ({ productPage, cartPage, page }) => {
      await allure.feature('Cart Page');
      await allure.story('Checkout Navigation');
      await allure.severity(Severity.MINOR);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-010] Navigating to cart page with empty cart (edge case)');
      await productPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-010] Clicking Checkout on empty cart');
      await cartPage.clickCheckout();

      // --- Assert ---
      log.info('[TC-CP-010] Asserting redirect to /checkout-step-one.html');
      await UIAssertions.assertURLContains(page, '/checkout-step-one.html');
    });

    test('Verify user sees previously added items still in cart when returning after navigating to the Products page',
      { tag: '@regression' },
      async ({ productPage, cartPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Display Cart Items');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

      // --- Arrange ---
      const name0 = await productPage.getProductNameTextByIndex(0);
      const name1 = await productPage.getProductNameTextByIndex(1);
      log.info(`[TC-CP-012] Adding 2 products: "${name0}" and "${name1}"`);
      await productPage.addNProductsToCart(2);
      await productPage.goToCart();
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 2);

      // --- Act ---
      log.info('[TC-CP-012] Clicking Continue Shopping → returning to cart via cart icon');
      await cartPage.clickContinueShopping();
      await productPage.goToCart();

      // --- Assert ---
      log.info('[TC-CP-012] Asserting both items still present in cart after round-trip navigation');
      await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 2);
      await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(0), name0);
      await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(1), name1);
    });

  });

  test.describe('Problem User', () => {

    test.beforeEach(async ({ problemUserProductPage }) => {
      await problemUserProductPage.navigateToInventory();
    });

    test('Verify problem user sees correct item details on the cart page when an item is added from the Products page',
      { tag: '@regression' },
      async ({ problemUserProductPage, problemUserCartPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Display Cart Items');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

      // --- Arrange ---
      const productName = await problemUserProductPage.getProductNameTextByIndex(0);
      const productPrice = await problemUserProductPage.getProductPriceByIndex(0);
      log.info(`[TC-CP-003] Problem user — captured: "${productName}" at ${productPrice}`);

      // --- Act ---
      log.info(`[TC-CP-003] Adding "${productName}" to cart and navigating to cart page`);
      await problemUserProductPage.addProductToCartByIndex(0);
      await problemUserProductPage.goToCart();

      // --- Assert ---
      log.info('[TC-CP-003] Asserting cart shows correct item (not affected by image defect on Products page)');
      await UIAssertions.assertElementCount(problemUserCartPage.getCartItemsLocator(), 1);
      await UIAssertions.assertElementContainsText(problemUserCartPage.getItemNameLocatorByIndex(0), productName);
      await UIAssertions.assertElementContainsText(problemUserCartPage.getItemPriceLocatorByIndex(0), productPrice);
    });

    test('Verify problem user sees cart empty and badge hidden when an item is removed from the cart',
      { tag: '@regression' },
      async ({ problemUserProductPage, problemUserCartPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Remove Cart Items');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-006] Problem user — adding product and navigating to cart page');
      await problemUserProductPage.addProductToCartByIndex(0);
      await problemUserProductPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-006] Removing item at index 0 from cart');
      await problemUserCartPage.removeItemByIndex(0);

      // --- Assert ---
      log.info('[TC-CP-006] Asserting cart is empty and badge is hidden');
      await UIAssertions.assertElementCount(problemUserCartPage.getCartItemsLocator(), 0);
      await UIAssertions.assertElementHidden(problemUserCartPage.getCartBadgeLocator(), 'cart badge');
    });

    test('Verify problem user is navigated to the Products page when Continue Shopping is clicked from the cart',
      { tag: '@regression' },
      async ({ problemUserProductPage, problemUserCartPage, problemUserPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Continue Shopping Navigation');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-008] Problem user — navigating to cart page');
      await problemUserProductPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-008] Clicking Continue Shopping');
      await problemUserCartPage.clickContinueShopping();

      // --- Assert ---
      log.info('[TC-CP-008] Asserting redirect to /inventory.html and Products heading visible');
      await UIAssertions.assertURLContains(problemUserPage, '/inventory.html');
      await UIAssertions.assertElementVisible(problemUserProductPage.getPageTitleLocator(), 'Products heading');
    });

    test('Verify problem user is navigated to the Checkout page when Checkout is clicked with an item in cart',
      { tag: '@regression' },
      async ({ problemUserProductPage, problemUserCartPage, problemUserPage }) => {
      await allure.feature('Cart Page');
      await allure.story('Checkout Navigation');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CP-011] Problem user — adding product and navigating to cart page');
      await problemUserProductPage.addProductToCartByIndex(0);
      await problemUserProductPage.goToCart();

      // --- Act ---
      log.info('[TC-CP-011] Clicking Checkout');
      await problemUserCartPage.clickCheckout();

      // --- Assert ---
      log.info('[TC-CP-011] Asserting redirect to /checkout-step-one.html');
      await UIAssertions.assertURLContains(problemUserPage, '/checkout-step-one.html');
    });

  });

});
