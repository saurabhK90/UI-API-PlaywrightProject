# Rules for Adding Test Cases

Standards for writing, structuring, and naming test cases in this framework.

---

## Test Case Anatomy

Every test must follow this structure:

```typescript
test('user can place an order with a valid credit card', async ({ checkoutPage, orderAPI }) => {
  // --- Arrange ---
  const testProduct = { id: 'PROD-001', quantity: 1 };

  // --- Act ---
  await checkoutPage.addProductToCart(testProduct.id);
  await checkoutPage.proceedToCheckout();
  await checkoutPage.enterPaymentDetails(PaymentCards.VALID_VISA);
  await checkoutPage.placeOrder();

  // --- Assert ---
  await UIAssertions.assertToastMessage(page, 'Order placed successfully');
  await APIAssertions.assertOrderExists(orderAPI, testProduct.id);
});
```

- Blank lines separate Arrange, Act, and Assert phases
- One logical assertion cluster per test

---

## Test Case ID Convention

Generated test case JSON files use the pattern `TC-[PageAbbrev]-[Number]`:

| Page / Module | Prefix | Example |
|---|---|---|
| Product Page | `TC-PP` | `TC-PP-001` |
| Cart Page | `TC-CP` | `TC-CP-001` |
| Checkout Page | `TC-CK` | `TC-CK-001` |
| Login Page | `TC-LP` | `TC-LP-001` |

The abbreviation is derived from the page name and must stay consistent across all test case files and spec files for that module. Never use a plain feature-name prefix (e.g., `CART-001`).

---

## Test Naming Convention

Use plain English describing **user intent**, not technical implementation:

| ✅ Good | ❌ Bad |
|---|---|
| `'user can log in with valid credentials'` | `'test login'` |
| `'user sees validation error when email is missing'` | `'empty email test'` |
| `'user cannot access admin panel without permissions'` | `'role check'` |
| `'API returns 404 when product ID does not exist'` | `'404 test'` |

---

## Describe Block Naming

`test.describe` blocks map to **features or user stories**, not to files or page objects:

```typescript
test.describe('Guest Checkout', () => {         // ✅ feature name
test.describe('LoginPage tests', () => {        // ❌ page name
test.describe('Checkout flow tests', () => {    // ❌ too vague
```

---

## Required Allure Labels

Every test must have these annotations:

```typescript
test.describe('Order Management', () => {
  test('user can cancel a pending order', async () => {
    allure.feature('Order Management');
    allure.story('Order Cancellation');
    allure.severity(Severity.NORMAL);
    allure.tag('regression');
    // allure.issue('JIRA-1234');   // add when linked to a Jira ticket
    // allure.owner('engineer-name');

    // ... test body
  });
});
```

Severity levels:
- `BLOCKER` — application cannot start or core flow completely broken
- `CRITICAL` — business-critical path broken (login, checkout, payment)
- `NORMAL` — important feature broken but workaround exists
- `MINOR` — cosmetic or low-impact issue
- `TRIVIAL` — very minor, unlikely to impact users

---

## What a Single Test Should Cover

Each test covers **one logical assertion cluster**. If you need to verify multiple unrelated things, write multiple tests:

```typescript
// ✅ One concern per test
test('user sees cart badge update when product is added', ...);
test('user sees subtotal recalculate when quantity changes', ...);

// ❌ Two concerns in one test
test('cart tests', async () => {
  // adds product and checks badge
  // then changes quantity and checks subtotal
});
```

---

## Test Data Rules

- All test data comes from `resources/testdata/` or `RandomUtils` — never hardcoded
- Emails for parallel safety: use `RandomUtils.generateEmail()` (UUID-based)
- Static reference data (product IDs, category names): use `resources/testdata/products.json`
- Passwords: use environment variable `TEST_PASSWORD` — never hardcode

---

## String Constants — No Hardcoded Strings in Tests

Never hardcode UI error messages, API error messages, page titles, or URL segments directly in a test or assertion. Define them as constants in `src/assertions/domain/` and import from there.

**Why:** a single source of truth means when the app changes a message, you update one enum member, not every test that ever checked that string.

```typescript
// ❌ Wrong — hardcoded string buried in a test
test.expect(errorMessage).toContain('Epic sadface: Username is required');

// ✅ Correct — named constant from the domain messages file
import { LoginErrorMessages } from '@assertions/domain';
test.expect(errorMessage).toContain(LoginErrorMessages.USERNAME_REQUIRED);
```

**Where to put constants:**

| Constant type | File |
|---|---|
| UI error messages for a feature | `src/assertions/domain/FeatureMessages.ts` — `enum FeatureErrorMessages` |
| UI page expectations (title, URL) | `src/assertions/domain/FeatureMessages.ts` — `const FeaturePageExpectations` |
| API error response messages | `src/assertions/domain/ResourceAPIMessages.ts` — `enum ResourceAPIErrorMessages` |

Use `enum` for closed sets of known strings (error messages). Use `const … as const` for page-level expectations (titles, URL segments).

---

## Smoke vs Regression Tags

```typescript
allure.tag('smoke');        // critical-path tests that run on every PR
allure.tag('regression');   // full suite tests that run on merge + nightly
allure.tag('contract');     // API schema validation tests
allure.tag('e2e');          // end-to-end journey tests
```

A test can have multiple tags.

---

## Test File Location

| Test type | Directory |
|---|---|
| UI smoke | `tests/ui/smoke/` |
| UI regression | `tests/ui/regression/` |
| UI end-to-end journeys | `tests/ui/e2e/` |
| API smoke | `tests/api/smoke/` |
| API regression | `tests/api/regression/` |
| API contract/schema | `tests/api/contract/` |
| Tests combining UI + API | `tests/integration/` |

---

## Pre-Commit Checklist for a New Test

- [ ] Test name describes user intent in plain English
- [ ] Allure labels: feature, story, severity, tag applied
- [ ] No hardcoded credentials, URLs, or IDs
- [ ] Uses fixture-injected page objects and API clients
- [ ] Arrange / Act / Assert structure with blank lines separating phases
- [ ] One logical concern per test block
- [ ] Passes locally: `npm run test:smoke` (or the specific spec file)
