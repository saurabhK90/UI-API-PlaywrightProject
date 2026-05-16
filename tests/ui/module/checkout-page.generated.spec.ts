import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { UIAssertions } from '@assertions/generic/UIAssertions';
import { CheckoutErrorMessages, CheckoutPageExpectations } from '@assertions/domain';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();
const VALID_PASSWORD    = process.env.TEST_PASSWORD!;
const PROBLEM_USERNAME  = process.env.PROBLEM_USERNAME!;

// slowMo adds a pause after every Playwright action so headed runs are easy to follow.
// Set SLOW_MO=0 in CI or when speed matters (e.g. SLOW_MO=0 npx playwright test ...).
test.use({ launchOptions: { slowMo: parseInt(process.env.SLOW_MO ?? '0') } });

test.describe('Checkout', () => {

  test.describe('Standard User', () => {

    test.beforeEach(async ({ productPage }) => {
      await productPage.navigateToInventory();
    });

    test('user proceeds from checkout step 1 to step 2 with valid form data',
      { tag: ['@smoke', '@regression'] },
      async ({ productPage, cartPage, checkoutStepOnePage, page }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Step 1 - Information');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CK-001] Adding 1 product to cart and navigating to checkout step 1');
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();
      await cartPage.clickCheckout();

      // --- Act ---
      log.info('[TC-CK-001] Filling checkout form with valid data and clicking Continue');
      await checkoutStepOnePage.continueToStepTwo('John', 'Doe', '10001');

      // --- Assert ---
      log.info('[TC-CK-001] Asserting URL reflects checkout step 2');
      await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_TWO_URL);
    });

    test('checkout step 2 displays correct items and accurate order total including tax',
      { tag: ['@smoke', '@regression'] },
      async ({ productPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Step 2 - Overview');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      const itemName      = await productPage.getProductNameTextByIndex(0);
      const itemPriceText = await productPage.getProductPriceByIndex(0);
      const itemPrice     = parseFloat(itemPriceText.replace('$', ''));
      log.info(`[TC-CK-002] Adding "${itemName}" (${itemPriceText}) to cart and navigating to step 2`);
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();
      await cartPage.clickCheckout();

      // --- Act ---
      log.info('[TC-CK-002] Completing checkout step 1 form and proceeding to step 2');
      await checkoutStepOnePage.continueToStepTwo('John', 'Doe', '10001');

      // --- Assert ---
      log.info('[TC-CK-002] Asserting item shown and item total, tax, grand total are mathematically correct');
      await UIAssertions.assertElementContainsText(checkoutStepTwoPage.getItemNameLocatorByIndex(0), itemName);
      const subtotal = await checkoutStepTwoPage.getSubtotalAmount();
      const tax      = await checkoutStepTwoPage.getTaxAmount();
      const total    = await checkoutStepTwoPage.getTotalAmount();
      test.expect(subtotal, 'Item total should equal product price').toBeCloseTo(itemPrice, 2);
      test.expect(total,    'Grand total should equal item total + tax').toBeCloseTo(subtotal + tax, 2);
    });

    test('checkout step 2 order total is correct when multiple items are added',
      { tag: '@regression' },
      async ({ productPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Step 2 - Overview');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

      // --- Arrange ---
      const names      = await Promise.all([0, 1, 2].map(i => productPage.getProductNameTextByIndex(i)));
      const priceTexts = await Promise.all([0, 1, 2].map(i => productPage.getProductPriceByIndex(i)));
      const prices     = priceTexts.map(p => parseFloat(p.replace('$', '')));
      const expectedSubtotal = prices.reduce((sum, p) => sum + p, 0);
      log.info(`[TC-CK-008] Adding 3 products: ${names.join(' | ')} — expected subtotal: $${expectedSubtotal.toFixed(2)}`);
      await productPage.addNProductsToCart(3);
      await productPage.goToCart();
      await cartPage.clickCheckout();

      // --- Act ---
      log.info('[TC-CK-008] Completing checkout step 1 and proceeding to step 2');
      await checkoutStepOnePage.continueToStepTwo('John', 'Doe', '10001');

      // --- Assert ---
      log.info('[TC-CK-008] Asserting all 3 items listed and subtotal, tax, grand total are mathematically correct');
      await UIAssertions.assertElementCount(checkoutStepTwoPage.getCartItemsLocator(), 3);
      for (let i = 0; i < 3; i++) {
        await UIAssertions.assertElementContainsText(checkoutStepTwoPage.getItemNameLocatorByIndex(i), names[i]);
      }
      const subtotal = await checkoutStepTwoPage.getSubtotalAmount();
      const tax      = await checkoutStepTwoPage.getTaxAmount();
      const total    = await checkoutStepTwoPage.getTotalAmount();
      test.expect(subtotal, 'Item total should equal sum of all product prices').toBeCloseTo(expectedSubtotal, 2);
      test.expect(total,    'Grand total should equal item total + tax').toBeCloseTo(subtotal + tax, 2);
    });

    test('user sees thank you confirmation message after completing purchase',
      { tag: ['@smoke', '@regression'] },
      async ({ productPage, cartPage, checkoutStepOnePage, checkoutStepTwoPage, checkoutCompletePage, page }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Complete');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('smoke');
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CK-003] Adding 1 product and navigating through full checkout flow to step 2');
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();
      await cartPage.clickCheckout();
      await checkoutStepOnePage.continueToStepTwo('John', 'Doe', '10001');

      // --- Act ---
      log.info('[TC-CK-003] Clicking Finish on checkout step 2');
      await checkoutStepTwoPage.clickFinish();

      // --- Assert ---
      log.info('[TC-CK-003] Asserting URL is checkout-complete and thank you heading is visible');
      await UIAssertions.assertURLContains(page, CheckoutPageExpectations.COMPLETE_URL);
      await UIAssertions.assertElementContainsText(
        checkoutCompletePage.getCompleteHeaderLocator(),
        CheckoutPageExpectations.COMPLETE_HEADER
      );
    });

    test('Continue button shows first name required error when all fields are left empty',
      { tag: '@regression' },
      async ({ productPage, cartPage, checkoutStepOnePage, page }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Step 1 - Form Validation');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CK-004] Adding 1 product and navigating to checkout step 1 with all fields empty');
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();
      await cartPage.clickCheckout();

      // --- Act ---
      log.info('[TC-CK-004] Clicking Continue with all form fields empty');
      await checkoutStepOnePage.clickContinue();

      // --- Assert ---
      log.info('[TC-CK-004] Asserting first name required error shown and user remains on step 1');
      await UIAssertions.assertElementContainsText(
        checkoutStepOnePage.getErrorLocator(),
        CheckoutErrorMessages.FIRST_NAME_REQUIRED
      );
      await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    });

    test('Continue button shows last name required error when last name is missing',
      { tag: '@regression' },
      async ({ productPage, cartPage, checkoutStepOnePage, page }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Step 1 - Form Validation');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CK-005] Adding 1 product and navigating to checkout step 1');
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();
      await cartPage.clickCheckout();

      // --- Act ---
      log.info('[TC-CK-005] Filling first name and zip but leaving last name empty, clicking Continue');
      await checkoutStepOnePage.fillFirstName('John');
      await checkoutStepOnePage.fillZipCode('10001');
      await checkoutStepOnePage.clickContinue();

      // --- Assert ---
      log.info('[TC-CK-005] Asserting last name required error shown and user remains on step 1');
      await UIAssertions.assertElementContainsText(
        checkoutStepOnePage.getErrorLocator(),
        CheckoutErrorMessages.LAST_NAME_REQUIRED
      );
      await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    });

    test('Continue button shows postal code required error when zip code is missing',
      { tag: '@regression' },
      async ({ productPage, cartPage, checkoutStepOnePage, page }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Step 1 - Form Validation');
      await allure.severity(Severity.NORMAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CK-006] Adding 1 product and navigating to checkout step 1');
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();
      await cartPage.clickCheckout();

      // --- Act ---
      log.info('[TC-CK-006] Filling first name and last name but leaving zip code empty, clicking Continue');
      await checkoutStepOnePage.fillFirstName('John');
      await checkoutStepOnePage.fillLastName('Doe');
      await checkoutStepOnePage.clickContinue();

      // --- Assert ---
      log.info('[TC-CK-006] Asserting postal code required error shown and user remains on step 1');
      await UIAssertions.assertElementContainsText(
        checkoutStepOnePage.getErrorLocator(),
        CheckoutErrorMessages.POSTAL_CODE_REQUIRED
      );
      await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    });

  });

  test.describe('Problem User', () => {

    test.beforeEach(async ({ loginPage }) => {
      await loginPage.navigateToLogin();
      await loginPage.login(PROBLEM_USERNAME, VALID_PASSWORD);
    });

    test('problem user cannot complete checkout because last name field rejects input',
      { tag: '@regression' },
      async ({ productPage, cartPage, checkoutStepOnePage, page }) => {
      await allure.feature('Checkout');
      await allure.story('Checkout Step 1 - Problem User Behaviour');
      await allure.severity(Severity.CRITICAL);
      await allure.tag('regression');

      // --- Arrange ---
      log.info('[TC-CK-007] Problem user — adding product and navigating to checkout step 1');
      await productPage.navigateToInventory();
      await productPage.addProductToCartByIndex(0);
      await productPage.goToCart();
      await cartPage.clickCheckout();

      // --- Act ---
      log.info('[TC-CK-007] Filling first name and zip, attempting to type last name, clicking Continue');
      await checkoutStepOnePage.fillFirstName('Jane');
      await checkoutStepOnePage.fillLastName('Smith');
      const lastNameValue = await checkoutStepOnePage.getLastNameValue();
      log.info(`[TC-CK-007] Last name field value after typing: "${lastNameValue}"`);
      await checkoutStepOnePage.fillZipCode('90210');
      await checkoutStepOnePage.clickContinue();

      // --- Assert ---
      log.info('[TC-CK-007] Asserting last name required error shown — field did not retain input');
      await UIAssertions.assertElementContainsText(
        checkoutStepOnePage.getErrorLocator(),
        CheckoutErrorMessages.LAST_NAME_REQUIRED
      );
      await UIAssertions.assertURLContains(page, CheckoutPageExpectations.STEP_ONE_URL);
    });

  });

});
