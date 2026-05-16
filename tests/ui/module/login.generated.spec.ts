import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { UIAssertions } from '@assertions/generic/UIAssertions';
import { LoginErrorMessages, InventoryPageExpectations } from '@assertions/domain';
import { Logger } from '@utils/Logger';
import users from '@resources/testdata/users.json';

const log = Logger.getInstance();

const VALID_USERNAME = process.env.TEST_USERNAME!;
const VALID_PASSWORD = process.env.TEST_PASSWORD!;
const LOCKED_USERNAME = users.lockedUser.email;
const INVALID_PASSWORD = 'wrong_password';
const INVALID_USERNAME = 'invalid_user_xyz';

// slowMo adds a pause after every Playwright action so headed runs are easy to follow.
// Set SLOW_MO=0 in CI or when speed matters (e.g. SLOW_MO=0 npx playwright test ...).
test.use({ launchOptions: { slowMo: parseInt(process.env.SLOW_MO ?? '0') } });

test.describe('Login', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigateToLogin();
  });

  test('standard user logs in and lands on product catalog page', { tag: ['@smoke', '@regression'] }, async ({ loginPage, page }) => {
    allure.feature('Login');
    allure.story('Successful Authentication');
    allure.severity(Severity.CRITICAL);
    allure.tag('smoke');
    allure.tag('regression');

    // --- Act ---
    log.info('[TC-LP-001] Logging in with valid standard_user credentials');
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);

    // --- Assert ---
    await UIAssertions.assertURLContains(page, InventoryPageExpectations.URL_SEGMENT);
    await UIAssertions.assertPageTitle(page, InventoryPageExpectations.TITLE);
  });

  test('user sees error when correct username but wrong password is entered', { tag: '@regression' }, async ({ loginPage }) => {
    allure.feature('Login');
    allure.story('Authentication Failure');
    allure.severity(Severity.CRITICAL);
    allure.tag('regression');

    // --- Act ---
    log.info('[TC-LP-002] Submitting login with valid username and wrong password');
    await loginPage.enterUsername(VALID_USERNAME);
    await loginPage.enterPassword(INVALID_PASSWORD);
    await loginPage.clickLoginButton();

    // --- Assert ---
    await UIAssertions.assertElementVisible(loginPage.getErrorLocator(), 'Login error message');
    await UIAssertions.assertElementContainsText(loginPage.getErrorLocator(), LoginErrorMessages.CREDENTIALS_MISMATCH);
  });

  test('user sees error when non-existent username is entered with valid password', { tag: '@regression' }, async ({ loginPage }) => {
    allure.feature('Login');
    allure.story('Authentication Failure');
    allure.severity(Severity.NORMAL);
    allure.tag('regression');

    // --- Act ---
    log.info('[TC-LP-003] Submitting login with non-existent username');
    await loginPage.enterUsername(INVALID_USERNAME);
    await loginPage.enterPassword(VALID_PASSWORD);
    await loginPage.clickLoginButton();

    // --- Assert ---
    await UIAssertions.assertElementVisible(loginPage.getErrorLocator(), 'Login error message');
    await UIAssertions.assertElementContainsText(loginPage.getErrorLocator(), LoginErrorMessages.CREDENTIALS_MISMATCH);
  });

  test('locked user sees lockout error message on login attempt', { tag: '@regression' }, async ({ loginPage }) => {
    allure.feature('Login');
    allure.story('Account Lockout');
    allure.severity(Severity.CRITICAL);
    allure.tag('regression');

    // --- Act ---
    log.info('[TC-LP-004] Submitting login as locked_out_user');
    await loginPage.enterUsername(LOCKED_USERNAME);
    await loginPage.enterPassword(VALID_PASSWORD);
    await loginPage.clickLoginButton();

    // --- Assert ---
    await UIAssertions.assertElementVisible(loginPage.getErrorLocator(), 'Account locked error message');
    await UIAssertions.assertElementContainsText(loginPage.getErrorLocator(), LoginErrorMessages.ACCOUNT_LOCKED);
  });

  test('user sees validation error when username field is submitted empty', { tag: '@regression' }, async ({ loginPage }) => {
    allure.feature('Login');
    allure.story('Form Validation');
    allure.severity(Severity.NORMAL);
    allure.tag('regression');

    // --- Act ---
    log.info('[TC-LP-005] Submitting login with empty username field');
    await loginPage.enterPassword(VALID_PASSWORD);
    await loginPage.clickLoginButton();

    // --- Assert ---
    await UIAssertions.assertElementVisible(loginPage.getErrorLocator(), 'Username required error');
    await UIAssertions.assertElementContainsText(loginPage.getErrorLocator(), LoginErrorMessages.USERNAME_REQUIRED);
  });

  test('user sees validation error when password field is submitted empty', { tag: '@regression' }, async ({ loginPage }) => {
    allure.feature('Login');
    allure.story('Form Validation');
    allure.severity(Severity.NORMAL);
    allure.tag('regression');

    // --- Act ---
    log.info('[TC-LP-006] Submitting login with empty password field');
    await loginPage.enterUsername(VALID_USERNAME);
    await loginPage.clickLoginButton();

    // --- Assert ---
    await UIAssertions.assertElementVisible(loginPage.getErrorLocator(), 'Password required error');
    await UIAssertions.assertElementContainsText(loginPage.getErrorLocator(), LoginErrorMessages.PASSWORD_REQUIRED);
  });

  test('user sees validation error when both fields are empty on login attempt', { tag: '@regression' }, async ({ loginPage }) => {
    allure.feature('Login');
    allure.story('Form Validation');
    allure.severity(Severity.MINOR);
    allure.tag('regression');

    // --- Act ---
    log.info('[TC-LP-007] Submitting login with both fields empty');
    await loginPage.clickLoginButton();

    // --- Assert ---
    await UIAssertions.assertElementVisible(loginPage.getErrorLocator(), 'Username required error for empty form');
    await UIAssertions.assertElementContainsText(loginPage.getErrorLocator(), LoginErrorMessages.USERNAME_REQUIRED);
  });

});
