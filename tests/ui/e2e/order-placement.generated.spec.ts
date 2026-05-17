import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { UIAssertions } from '@assertions/generic/UIAssertions';
import { CheckoutPageExpectations } from '@assertions/domain';
import { InventoryPageExpectations } from '@assertions/domain';
import { Logger } from '@utils/Logger';
import users from '@resources/testdata/users.json';

const log = Logger.getInstance();
const VALID_USERNAME = users.standardUser.username;
const VALID_PASSWORD = process.env.TEST_PASSWORD!;

// slowMo adds a pause after every Playwright action so headed runs are easy to follow.
// Set SLOW_MO=0 in CI or when speed matters (e.g. SLOW_MO=0 npx playwright test ...).
test.use({ launchOptions: { slowMo: parseInt(process.env.SLOW_MO ?? '0') } });

test.describe('Order Placement', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigateToLogin();
  });

  // ─── TC-E2E-001 ────────────────────────────────────────────────────────────────
  // Critical path: single item added from the product listing page.

  test('Verify user sees order confirmation with correct pricing when a single item from the product listing page is added and full checkout is completed', async ({
    loginPage, productPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, page,
  }) => {
    await allure.feature('Order Placement');
    await allure.story('Single Item via Product Listing Page');
    await allure.severity(Severity.CRITICAL);
    await allure.tag('e2e');
    await allure.tag('smoke');

    // --- Arrange ---
    log.info('[TC-E2E-001] Logging in and capturing reference product name and price from Products page');
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await UIAssertions.assertURLContains(page, InventoryPageExpectations.URL_SEGMENT);
    await UIAssertions.assertElementVisible(productPage.getPageTitleLocator(), 'Products heading');
    const productName  = await productPage.getProductNameTextByIndex(0);
    const productPrice = await productPage.getProductPriceByIndex(0);

    // --- Act ---
    log.info('[TC-E2E-001] Adding product to cart, navigating through cart and checkout to order confirmation');
    await productPage.addProductToCartByIndex(0);
    await UIAssertions.assertElementContainsText(productPage.getCartBadgeLocator(), '1');
    await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(0), 'Remove button for added product');

    await productPage.goToCart();
    await UIAssertions.assertURLContains(page, '/cart.html');
    await UIAssertions.assertElementVisible(cartPage.getCartTitleLocator(), 'Your Cart heading');
    await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 1);
    await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(0), productName);
    await UIAssertions.assertElementContainsText(cartPage.getItemPriceLocatorByIndex(0), productPrice);

    await cartPage.clickCheckout();
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    await checkoutStepOnePage.continueToStepTwo('John', 'Doe', '10001');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_TWO_URL);
    await UIAssertions.assertElementContainsText(checkoutStepTwoPage.getItemNameLocatorByIndex(0), productName);
    const subtotal = await checkoutStepTwoPage.getSubtotalAmount();
    const tax      = await checkoutStepTwoPage.getTaxAmount();
    const total    = await checkoutStepTwoPage.getTotalAmount();
    await checkoutStepTwoPage.clickFinish();

    // --- Assert ---
    log.info('[TC-E2E-001] Asserting order confirmation page displayed and cart is empty');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.COMPLETE_URL);
    await UIAssertions.assertElementContainsText(
      checkoutCompletePage.getCompleteHeaderLocator(),
      CheckoutPageExpectations.COMPLETE_HEADER,
    );
    await UIAssertions.assertElementVisible(checkoutCompletePage.getCompleteTextLocator(), 'order dispatched message');
    test.expect(total, 'Grand total should equal item total plus tax').toBeCloseTo(subtotal + tax, 2);
    const cartBadgeVisible = await cartPage.isCartBadgeVisible();
    test.expect(cartBadgeVisible, 'Cart badge should not be visible after order is placed').toBe(false);
  });

  // ─── TC-E2E-002 ────────────────────────────────────────────────────────────────
  // Critical path: three items added from the product listing page.

  test('Verify user sees order confirmation with correct pricing when multiple items from the product listing page are added and full checkout is completed', async ({
    loginPage, productPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, page,
  }) => {
    await allure.feature('Order Placement');
    await allure.story('Multiple Items via Product Listing Page');
    await allure.severity(Severity.CRITICAL);
    await allure.tag('e2e');
    await allure.tag('regression');

    // --- Arrange ---
    log.info('[TC-E2E-002] Logging in and capturing reference names and prices for 3 products from Products page');
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await UIAssertions.assertURLContains(page, InventoryPageExpectations.URL_SEGMENT);
    await UIAssertions.assertElementVisible(productPage.getPageTitleLocator(), 'Products heading');
    const names      = await Promise.all([0, 1, 2].map(i => productPage.getProductNameTextByIndex(i)));
    const priceTexts = await Promise.all([0, 1, 2].map(i => productPage.getProductPriceByIndex(i)));
    const prices     = priceTexts.map(p => parseFloat(p.replace('$', '')));
    const expectedSubtotal = prices.reduce((sum, p) => sum + p, 0);

    // --- Act ---
    log.info(`[TC-E2E-002] Adding 3 products to cart, completing checkout; expected subtotal: $${expectedSubtotal.toFixed(2)}`);
    await productPage.addProductToCartByIndex(0);
    await UIAssertions.assertElementContainsText(productPage.getCartBadgeLocator(), '1');
    await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(0), 'Remove button for product 1');

    await productPage.addProductToCartByIndex(1);
    await UIAssertions.assertElementContainsText(productPage.getCartBadgeLocator(), '2');
    await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(1), 'Remove button for product 2');

    await productPage.addProductToCartByIndex(2);
    await UIAssertions.assertElementContainsText(productPage.getCartBadgeLocator(), '3');
    await UIAssertions.assertElementVisible(productPage.getRemoveButtonByIndex(2), 'Remove button for product 3');

    await productPage.goToCart();
    await UIAssertions.assertURLContains(page, '/cart.html');
    await UIAssertions.assertElementVisible(cartPage.getCartTitleLocator(), 'Your Cart heading');
    await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 3);
    for (let i = 0; i < 3; i++) {
      await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(i), names[i]);
      await UIAssertions.assertElementContainsText(cartPage.getItemPriceLocatorByIndex(i), priceTexts[i]);
    }

    await cartPage.clickCheckout();
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    await checkoutStepOnePage.continueToStepTwo('John', 'Doe', '10001');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_TWO_URL);
    await UIAssertions.assertElementCount(checkoutStepTwoPage.getCartItemsLocator(), 3);
    for (let i = 0; i < 3; i++) {
      await UIAssertions.assertElementContainsText(checkoutStepTwoPage.getItemNameLocatorByIndex(i), names[i]);
    }
    const subtotal = await checkoutStepTwoPage.getSubtotalAmount();
    const tax      = await checkoutStepTwoPage.getTaxAmount();
    const total    = await checkoutStepTwoPage.getTotalAmount();
    await checkoutStepTwoPage.clickFinish();

    // --- Assert ---
    log.info('[TC-E2E-002] Asserting order confirmation page displayed, pricing math correct, cart is empty');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.COMPLETE_URL);
    await UIAssertions.assertElementContainsText(
      checkoutCompletePage.getCompleteHeaderLocator(),
      CheckoutPageExpectations.COMPLETE_HEADER,
    );
    await UIAssertions.assertElementVisible(checkoutCompletePage.getCompleteTextLocator(), 'order dispatched message');
    test.expect(subtotal, 'Item total should equal sum of all three product prices').toBeCloseTo(expectedSubtotal, 2);
    test.expect(total, 'Grand total should equal item total plus tax').toBeCloseTo(subtotal + tax, 2);
    const cartBadgeVisible = await cartPage.isCartBadgeVisible();
    test.expect(cartBadgeVisible, 'Cart badge should not be visible after order is placed').toBe(false);
  });

  // ─── TC-E2E-003 ────────────────────────────────────────────────────────────────
  // Alternative path: single item added from the product detail page.

  test('Verify user sees order confirmation with correct pricing when a single item from the product detail page is added and full checkout is completed', async ({
    loginPage, productPage, productDetailPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, page,
  }) => {
    await allure.feature('Order Placement');
    await allure.story('Single Item via Product Detail Page');
    await allure.severity(Severity.CRITICAL);
    await allure.tag('e2e');
    await allure.tag('regression');

    // --- Arrange ---
    log.info('[TC-E2E-003] Logging in and navigating to first product detail page');
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await UIAssertions.assertURLContains(page, InventoryPageExpectations.URL_SEGMENT);
    await productPage.clickProductByIndex(0);
    await UIAssertions.assertURLContains(page, '/inventory-item.html');
    await UIAssertions.assertElementVisible(productDetailPage.getProductNameLocator(), 'product name on detail page');
    await UIAssertions.assertElementVisible(productDetailPage.getProductDescriptionLocator(), 'product description on detail page');
    await UIAssertions.assertElementVisible(productDetailPage.getProductPriceLocator(), 'product price on detail page');
    const productName  = await productDetailPage.getProductName();
    const productPrice = await productDetailPage.getProductPrice();

    // --- Act ---
    log.info(`[TC-E2E-003] Adding "${productName}" from detail page and completing checkout`);
    await productDetailPage.addToCart();
    await UIAssertions.assertElementContainsText(productDetailPage.getCartBadgeLocator(), '1');
    await UIAssertions.assertElementVisible(productDetailPage.getRemoveButtonLocator(), 'Remove button after adding from detail page');

    await productDetailPage.goToCart();
    await UIAssertions.assertURLContains(page, '/cart.html');
    await UIAssertions.assertElementVisible(cartPage.getCartTitleLocator(), 'Your Cart heading');
    await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 1);
    await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(0), productName);
    await UIAssertions.assertElementContainsText(cartPage.getItemPriceLocatorByIndex(0), productPrice);

    await cartPage.clickCheckout();
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    await checkoutStepOnePage.continueToStepTwo('Jane', 'Smith', '90210');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_TWO_URL);
    await UIAssertions.assertElementContainsText(checkoutStepTwoPage.getItemNameLocatorByIndex(0), productName);
    const subtotal = await checkoutStepTwoPage.getSubtotalAmount();
    const tax      = await checkoutStepTwoPage.getTaxAmount();
    const total    = await checkoutStepTwoPage.getTotalAmount();
    await checkoutStepTwoPage.clickFinish();

    // --- Assert ---
    log.info('[TC-E2E-003] Asserting order confirmation page displayed and cart is empty');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.COMPLETE_URL);
    await UIAssertions.assertElementContainsText(
      checkoutCompletePage.getCompleteHeaderLocator(),
      CheckoutPageExpectations.COMPLETE_HEADER,
    );
    await UIAssertions.assertElementVisible(checkoutCompletePage.getCompleteTextLocator(), 'order dispatched message');
    test.expect(total, 'Grand total should equal item total plus tax').toBeCloseTo(subtotal + tax, 2);
    const cartBadgeVisible = await cartPage.isCartBadgeVisible();
    test.expect(cartBadgeVisible, 'Cart badge should not be visible after order is placed').toBe(false);
  });

  // ─── TC-E2E-004 ────────────────────────────────────────────────────────────────
  // Alternative path: two items each added from their individual product detail pages.

  test('Verify user sees order confirmation with correct pricing when multiple items from individual product detail pages are added and full checkout is completed', async ({
    loginPage, productPage, productDetailPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, page,
  }) => {
    await allure.feature('Order Placement');
    await allure.story('Multiple Items via Product Detail Pages');
    await allure.severity(Severity.CRITICAL);
    await allure.tag('e2e');
    await allure.tag('regression');

    // --- Arrange ---
    log.info('[TC-E2E-004] Logging in and navigating to first product detail page');
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await UIAssertions.assertURLContains(page, InventoryPageExpectations.URL_SEGMENT);

    await productPage.clickProductByIndex(0);
    await UIAssertions.assertURLContains(page, '/inventory-item.html');
    await UIAssertions.assertElementVisible(productDetailPage.getProductNameLocator(), 'product name on detail page 1');
    const firstName  = await productDetailPage.getProductName();
    const firstPrice = await productDetailPage.getProductPrice();

    // --- Act ---
    log.info(`[TC-E2E-004] Adding "${firstName}" from detail page 1, returning to listing, adding second item from its detail page`);
    await productDetailPage.addToCart();
    await UIAssertions.assertElementContainsText(productDetailPage.getCartBadgeLocator(), '1');
    await UIAssertions.assertElementVisible(productDetailPage.getRemoveButtonLocator(), 'Remove button for first product');

    await productDetailPage.clickBackToProducts();
    await UIAssertions.assertURLContains(page, InventoryPageExpectations.URL_SEGMENT);
    await UIAssertions.assertElementContainsText(productPage.getCartBadgeLocator(), '1');

    await productPage.clickProductByIndex(1);
    await UIAssertions.assertURLContains(page, '/inventory-item.html');
    await UIAssertions.assertElementVisible(productDetailPage.getProductNameLocator(), 'product name on detail page 2');
    const secondName  = await productDetailPage.getProductName();
    const secondPrice = await productDetailPage.getProductPrice();

    await productDetailPage.addToCart();
    await UIAssertions.assertElementContainsText(productDetailPage.getCartBadgeLocator(), '2');
    await UIAssertions.assertElementVisible(productDetailPage.getRemoveButtonLocator(), 'Remove button for second product');

    await productDetailPage.goToCart();
    await UIAssertions.assertURLContains(page, '/cart.html');
    await UIAssertions.assertElementVisible(cartPage.getCartTitleLocator(), 'Your Cart heading');
    await UIAssertions.assertElementCount(cartPage.getCartItemsLocator(), 2);
    await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(0), firstName);
    await UIAssertions.assertElementContainsText(cartPage.getItemPriceLocatorByIndex(0), firstPrice);
    await UIAssertions.assertElementContainsText(cartPage.getItemNameLocatorByIndex(1), secondName);
    await UIAssertions.assertElementContainsText(cartPage.getItemPriceLocatorByIndex(1), secondPrice);

    await cartPage.clickCheckout();
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    await checkoutStepOnePage.continueToStepTwo('Alex', 'Johnson', '30301');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_TWO_URL);
    await UIAssertions.assertElementCount(checkoutStepTwoPage.getCartItemsLocator(), 2);
    await UIAssertions.assertElementContainsText(checkoutStepTwoPage.getItemNameLocatorByIndex(0), firstName);
    await UIAssertions.assertElementContainsText(checkoutStepTwoPage.getItemNameLocatorByIndex(1), secondName);
    const subtotal = await checkoutStepTwoPage.getSubtotalAmount();
    const tax      = await checkoutStepTwoPage.getTaxAmount();
    const total    = await checkoutStepTwoPage.getTotalAmount();
    const p1       = parseFloat(firstPrice.replace('$', ''));
    const p2       = parseFloat(secondPrice.replace('$', ''));
    await checkoutStepTwoPage.clickFinish();

    // --- Assert ---
    log.info('[TC-E2E-004] Asserting order confirmation page displayed, pricing math correct, cart is empty');
    await UIAssertions.assertURLContains(page, CheckoutPageExpectations.COMPLETE_URL);
    await UIAssertions.assertElementContainsText(
      checkoutCompletePage.getCompleteHeaderLocator(),
      CheckoutPageExpectations.COMPLETE_HEADER,
    );
    await UIAssertions.assertElementVisible(checkoutCompletePage.getCompleteTextLocator(), 'order dispatched message');
    test.expect(subtotal, 'Item total should equal sum of both product prices').toBeCloseTo(p1 + p2, 2);
    test.expect(total, 'Grand total should equal item total plus tax').toBeCloseTo(subtotal + tax, 2);
    const cartBadgeVisible = await cartPage.isCartBadgeVisible();
    test.expect(cartBadgeVisible, 'Cart badge should not be visible after order is placed').toBe(false);
  });

});
