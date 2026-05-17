# Saurabh.TestVagrant.AutomationSuite

[![Smoke Tests](https://github.com/saurabhK90/UI-API-PlaywrightProject/actions/workflows/smoke.yml/badge.svg)](https://github.com/saurabhK90/UI-API-PlaywrightProject/actions/workflows/smoke.yml)
[![Regression](https://github.com/saurabhK90/UI-API-PlaywrightProject/actions/workflows/regression.yml/badge.svg)](https://github.com/saurabhK90/UI-API-PlaywrightProject/actions/workflows/regression.yml)

Enterprise-grade Playwright + TypeScript automation suite for UI and API testing. Covers smoke, regression, contract, and end-to-end scenarios.

Tests the [Sauce Labs Demo App](https://www.saucedemo.com) (mock e-commerce storefront) for UI coverage and the [Restful Booker API](https://restful-booker.herokuapp.com) for API coverage.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Tests Locally](#running-tests-locally)
- [Framework Architecture](#framework-architecture)
- [Team Onboarding Guide](#team-onboarding-guide)
- [CI/CD Pipeline](#cicd-pipeline)
- [Claude Code Skills](#claude-code-skills)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20.0.0 |
| npm | bundled with Node 20 |
| Chromium | installed via Playwright |

---

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-name>           # directory name matches the repository name

# 2. Install dependencies
npm install

# 3. Install Playwright browser
npx playwright install chromium

# 4. Configure environment variables
cp .env.example .env
```

Edit `.env` and fill in the values for your environment. Full variable reference:

| Variable | Required | Description |
|---|---|---|
| `BASE_URL` | Yes | UI base URL of the application under test |
| `TEST_PASSWORD` | Yes | Password shared by all test users |
| `API_BASE_URL` | No | REST API base URL — falls back to `BASE_URL` when not set |
| `BOOKER_USERNAME` | API tests | Username for Restful Booker auth endpoint |
| `BOOKER_PASSWORD` | API tests | Password for Restful Booker auth endpoint |
| `ADMIN_USERNAME` | Setup/teardown | Admin account used for test data setup via API |
| `ADMIN_PASSWORD` | Setup/teardown | Password for the admin account |
| `GITHUB_TOKEN` | `/submit-pr` skill | Personal access token for creating PRs from Claude Code |
| `JIRA_BASE_URL` | Jira skill | Your Atlassian instance URL (`https://yourorg.atlassian.net`) |
| `JIRA_EMAIL` | Jira skill | Email address for Jira API authentication |
| `JIRA_API_TOKEN` | Jira skill | Jira API token — generate at id.atlassian.com |
| `LOG_LEVEL` | No | `debug` / `info` / `warn` — default `info`; use `debug` locally, `warn` in CI |
| `SLOW_MO` | No | Milliseconds to pause after each Playwright action — useful for visual debugging |
| `AUTH_STATE_DIR` | No | Path to auth state files — default `auth-state` |

```bash
# 5. Verify everything works
npm run test:smoke

# 6. Open the report
npm run allure:generate && npm run allure:open
```

---

## Running Tests Locally

### npm Scripts

| Command | What it runs |
|---|---|
| `npm run test:smoke` | UI + API smoke tests on Chrome — fast PR gate |
| `npm run test:regression` | Full UI + API regression suite on Chrome |
| `npm run test:e2e` | End-to-end user journey tests only |
| `npm run test:api` | All API tests (no browser) |
| `npm run test:ui:smoke` | UI @smoke tests only (no API) |
| `npm run test:api:smoke` | API @smoke tests only (no browser) |
| `npm run test:api:regression` | API @regression tests only |
| `npm run test:headed` | Opens a visible browser — useful for local debugging |
| `npm run test:debug` | Playwright Inspector with step-through debugging |
| `npm run test:ui` | Playwright's interactive UI mode |

### Running a Specific File or Tag

```bash
# Single spec file
npx playwright test tests/ui/module/product-page.generated.spec.ts

# By tag
npx playwright test --grep @smoke
npx playwright test --grep @regression

# By project
npx playwright test --project=api
npx playwright test --project=ui-chrome
npx playwright test --project=integration
```

### Reports

```bash
npm run allure:generate   # Build HTML report from raw allure-results/
npm run allure:open       # Open the built report in a browser
npm run allure:serve      # Serve raw results directly (skips build step)
```

Reports are written to:
- `allure-results/` — raw JSON (input to Allure)
- `allure-report/` — generated HTML report
- `playwright-report/` — built-in Playwright HTML reporter
- `test-results/` — screenshots, videos, and traces on failure

### Code Quality

```bash
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix ESLint issues
npm run type-check        # TypeScript type check (no emit)
npm run format            # Prettier formatting
```

---

## Framework Architecture

### Project Structure

```
AutomationSuite/
├── src/
│   ├── base/             BasePage.ts, BaseAPI.ts — Playwright primitives
│   ├── pages/            Page Object classes (extend BasePage)
│   ├── api/
│   │   ├── endpoints/    API client classes (extend BaseAPI)
│   │   └── models/       Zod schemas + inferred TypeScript types
│   ├── assertions/
│   │   ├── generic/      UIAssertions.ts, APIAssertions.ts (reusable)
│   │   └── domain/       Feature-specific message constants and assertions
│   ├── fixtures/         Playwright fixture extensions (dependency injection)
│   ├── utils/            Pure TypeScript utilities — no Playwright imports
│   └── ai/               Optional Anthropic SDK layer — removing it does not break any test
│
├── tests/
│   ├── ui/
│   │   ├── smoke/        Critical-path tests — run on every PR
│   │   ├── regression/   Full feature coverage — run on merge + nightly
│   │   ├── module/       Module-level generated tests
│   │   └── e2e/          End-to-end user journeys
│   ├── api/
│   │   ├── smoke/        API health checks
│   │   ├── regression/   Full API coverage
│   │   └── contract/     Zod schema validation tests
│   └── integration/      Tests combining UI + API assertions
│
├── auth-state/           Session files written by globalSetup — not committed to git
│
├── resources/
│   ├── testdata/         users.json, products.xlsx, orders.csv
│   └── locator-registry/ locators.json — history for self-healing agent
│
├── config/
│   ├── environments/     dev.env, staging.env, prod.env
│   └── allure/           categories.json, environment.properties
│
├── scripts/              CLI tools (generate-schema, heal-locators, patch-allure-async …)
└── .github/
    └── workflows/        smoke.yml (PR gate), regression.yml (on merge)
```

### Layer Boundaries

Each layer has strict import rules enforced by ESLint:

| Layer | May import from | Must NOT import from |
|---|---|---|
| `src/utils/` | Node builtins, npm packages | `@playwright/test`, `src/base/`, `src/pages/`, `src/api/` |
| `src/base/` | `src/utils/`, `@playwright/test`, `allure-js-commons` | `src/pages/`, `src/api/`, `src/fixtures/` |
| `src/pages/` | `src/base/`, `src/utils/` | `src/api/`, `src/fixtures/`, `src/assertions/` |
| `src/api/` | `src/base/`, `src/utils/`, `zod` | `src/pages/`, `src/fixtures/` |
| `src/assertions/` | `src/utils/`, `zod`, `@playwright/test` | `src/base/`, `src/pages/` |
| `src/fixtures/` | All src layers | Nothing outside `src/` |
| `tests/` | `src/fixtures/index` for test/expect | Direct `@playwright/test` import |

### Authentication Strategy

`globalSetup.ts` calls the login API **once** before any test run and saves cookies and localStorage to `auth-state/standard-user.json`. Tests that need an authenticated browser receive this pre-loaded context via the `authenticatedPage` fixture. No test should perform a UI login unless it is explicitly testing the login flow.

```typescript
// Authenticated test — storage state pre-loaded, no login needed
test('user can view their order history', async ({ authenticatedPage }) => { ... });

// Explicit login test — fresh, unauthenticated context
test('user sees error when password is wrong', async ({ loginPage }) => { ... });
```

### Playwright Projects

| Project | Browser | Tests matched | Purpose |
|---|---|---|---|
| `ui-chrome` | Desktop Chrome | `tests/ui/**/*.spec.ts` | All UI tests with stored auth state |
| `api` | None (HTTP only) | `tests/api/**/*.spec.ts` | API tests — no browser overhead |
| `integration` | Desktop Chrome | `tests/integration/**/*.spec.ts` | Combined UI + API assertions |

### Configuration

| Setting | Value |
|---|---|
| Workers | 1 (single worker — avoids session conflicts on demo site) |
| Parallel | Disabled |
| Retries in CI | 2 |
| Max failures in CI | 10 (fail fast to save runner minutes) |
| Action timeout | 15 seconds |
| Navigation timeout | 30 seconds |
| Traces | On first retry |
| Screenshots | On failure only |
| Videos | Retained on failure |

### Wait Strategy (priority order)

1. **Playwright auto-wait** — always preferred; built into every Playwright action
2. `waitForLocator(locator)` — explicit wait when data loads after an element appears
3. `waitForURL(pattern)` — after navigations
4. `waitForResponse(urlPattern)` — after SPA API calls
5. `waitForLoadState()` — page-level transitions only
6. `waitForTimeout()` — **banned** (ESLint rule enforces this)

### Locator Priority

All locators are `private readonly` class fields in the Page Object. Selection priority:

1. `data-testid` attribute (preferred — decoupled from styling)
2. ARIA role + accessible name
3. Semantic text (`getByLabel`, `getByPlaceholder`, `getByText`)
4. CSS selector with stable class names
5. XPath — last resort, always document the reason in a comment

---

## Team Onboarding Guide

### Writing Your First Test

```typescript
// tests/ui/regression/product-search.spec.ts

import { test, expect } from '@fixtures/index';   // ← always fixtures, never @playwright/test
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';

test.describe('Product Search', () => {
  test('user can search for a product by name', async ({ productPage }) => {
    allure.feature('Product Search');
    allure.story('Keyword Search');
    allure.severity(Severity.NORMAL);
    allure.tag('regression');

    // --- Arrange ---
    const searchTerm = 'Sauce Labs Backpack';

    // --- Act ---
    await productPage.searchFor(searchTerm);

    // --- Assert ---
    await expect(productPage.getFirstResultTitle()).toContainText(searchTerm);
  });
});
```

**Checklist before you write a test:**
- [ ] Import `test` and `expect` from `@fixtures/index`, not `@playwright/test`
- [ ] Use page object methods — never `page.locator()` directly in tests
- [ ] Apply all four Allure annotations: `feature`, `story`, `severity`, `tag`
- [ ] Follow Arrange → Act → Assert with blank lines between phases
- [ ] One logical concern per `test()` block
- [ ] No hardcoded credentials, URLs, or IDs

### Adding a Page Object

```bash
# 1. Create the file
touch src/pages/NewFeaturePage.ts
```

```typescript
// src/pages/NewFeaturePage.ts
import { Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class NewFeaturePage extends BasePage {
  // All locators as private readonly fields — never inline strings in methods
  private readonly pageHeading = this.page.getByRole('heading', { name: 'New Feature' });
  private readonly actionButton = this.page.getByTestId('action-btn');

  constructor(page: Page) {
    super(page);
  }

  async performAction(): Promise<void> {
    await this.click(this.actionButton);
  }

  async getHeadingText(): Promise<string> {
    return this.getText(this.pageHeading);
  }
}
```

```typescript
// 2. Register in src/fixtures/baseFixtures.ts
newFeaturePage: async ({ page }, use) => {
  await use(new NewFeaturePage(page));
},
```

### Adding an API Client

```typescript
// src/api/endpoints/NewResourceAPI.ts
import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from '@base/BaseAPI';

export class NewResourceAPI extends BaseAPI {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async getNewResource(id: string): Promise<APIResponse> {
    return this.get(`/new-resource/${id}`);
  }

  async createNewResource(payload: Record<string, unknown>): Promise<APIResponse> {
    return this.post('/new-resource', payload);
  }
}
```

```bash
# Bootstrap a Zod schema from the live API response
npm run generate-schema -- --endpoint /new-resource/123 --method GET --output NewResourceModel.ts
```

```typescript
// 2. Register in src/fixtures/apiFixtures.ts
newResourceAPI: async ({ request }, use) => {
  await use(new NewResourceAPI(request));
},
```

### Adding Domain Message Constants

Never hardcode UI or API strings in tests. Capture them as constants first:

```typescript
// src/assertions/domain/CheckoutMessages.ts
export enum CheckoutErrorMessages {
  PAYMENT_DECLINED = 'Your payment was declined',
  CARD_EXPIRED     = 'Card expiry date is invalid',
}

export const CheckoutPageExpectations = {
  CONFIRMATION_TITLE:       'Order Confirmed',
  CONFIRMATION_URL_SEGMENT: '/order-confirmation',
} as const;
```

```typescript
// src/assertions/domain/index.ts — add the export
export { CheckoutErrorMessages, CheckoutPageExpectations } from './CheckoutMessages';
```

### Test Case ID Convention

| Page / Module | Prefix | Example |
|---|---|---|
| Login Page | `TC-LP` | `TC-LP-001` |
| Product Page | `TC-PP` | `TC-PP-001` |
| Cart Page | `TC-CP` | `TC-CP-001` |
| Checkout Page | `TC-CK` | `TC-CK-001` |

### Test Tags

```typescript
allure.tag('smoke');      // runs on every PR — must stay fast and stable
allure.tag('regression'); // full suite — runs on merge and nightly
allure.tag('contract');   // API schema validation tests
allure.tag('e2e');        // end-to-end user journeys
```

### Test User Types

Four users are defined in `resources/testdata/users.json`. Each maps to a specific set of fixtures. Use the right user for the right scenario — do not mix them.

| User | Fixtures | When to use |
|---|---|---|
| `standard_user` | `productPage`, `cartPage`, `checkoutStepOnePage`, `checkoutStepTwoPage`, `checkoutCompletePage`, `authenticatedPage` | All standard smoke and regression tests |
| `problem_user` | `problemUserProductPage`, `problemUserCartPage`, `problemUserCheckoutStepOnePage`, `problemUserProductDetailPage` | Tests that verify the app handles UI rendering defects — broken images, misrouted buttons |
| `locked_out_user` | `loginPage` | Login tests that verify the locked-account error message |
| `error_user` | `loginPage` | Login tests that verify intermittent server error handling |

`standard_user` and `problem_user` auth state is created by `globalSetup` before tests start. `locked_out_user` and `error_user` are never authenticated — they are used only in tests that explicitly call `loginPage.login()`.

**Multi-user test example:**

```typescript
// Standard user — happy path
test('user can add item to cart', async ({ productPage, cartPage }) => {
  await productPage.addProductToCartByIndex(0);
  await productPage.goToCart();
  await UIAssertions.assertElementCount(cartPage.getCartItems(), 1);
});

// Problem user — same flow, different fixture, verifies defect behaviour
test('problem user sees correct item image on product page', async ({ problemUserProductPage }) => {
  allure.feature('Product Page');
  allure.story('Problem User Rendering');
  allure.severity(Severity.NORMAL);
  allure.tag('regression');

  // --- Assert ---
  const src = await problemUserProductPage.getFirstProductImageSrc();
  await expect(src).not.toContain('WithGarbageOnItToBreakTheUrl');
});
```

### Generated Spec Files

Files named `*.generated.spec.ts` are scaffolds produced by the `/generate-test-scripts` skill. They contain `TODO` comments where implementation is needed. Fill them in using the `/implement-tests` skill or manually — do not hand-edit the scaffold structure above the test bodies.

---

## CI/CD Pipeline

### Smoke Tests — PR Gate

**Trigger:** every pull request targeting `main` or `develop`

**File:** [.github/workflows/smoke.yml](.github/workflows/smoke.yml)

```
Pull Request opened / updated
        │
        ▼
┌───────────────────────────┐
│  Install + browser setup  │
├───────────────────────────┤
│  API smoke tests  @smoke  │
├───────────────────────────┤
│  UI smoke tests   @smoke  │
└───────────────────────────┘
        │
        ▼
  Upload allure-results + playwright-report as artifacts (7-day retention)
```

- Runs on `ubuntu-latest`, timeout 20 minutes
- Uses `BASE_URL_STAGING`, `API_BASE_URL_STAGING`, `TEST_USERNAME`, `TEST_PASSWORD` from GitHub Secrets
- Retries failing tests up to 2 times before marking the job failed

### Regression — On Merge

**Trigger:** push to `main`, or manual `workflow_dispatch` (choose `staging` or `dev`)

**File:** [.github/workflows/regression.yml](.github/workflows/regression.yml)

```
Push to main  (or manual trigger)
        │
        ├──────────────────────┐
        ▼                      ▼
 API Regression (30 min)  UI Regression (45 min)
        │                      │
        └──────────┬───────────┘
                   ▼
       Generate Allure report
                   │
                   ▼
       Publish to GitHub Pages (gh-pages branch)
```

- API and UI jobs run in parallel
- Allure report is merged from both job artifacts and published to GitHub Pages
- `workflow_dispatch` lets you trigger manually against either `staging` or `dev`

### GitHub Secrets Required

| Secret | Used by |
|---|---|
| `BASE_URL_STAGING` | Both workflows — UI base URL |
| `API_BASE_URL_STAGING` | Both workflows — API base URL (falls back to BASE_URL) |
| `TEST_USERNAME` | Both workflows — login username for standard and problem users |
| `TEST_PASSWORD` | Both workflows — shared password for all test users |
| `BOOKER_USERNAME` | Both workflows — username for Restful Booker `/auth` endpoint |
| `BOOKER_PASSWORD` | Both workflows — password for Restful Booker `/auth` endpoint |
| `GITHUB_TOKEN` | Regression workflow — GitHub Pages deploy |

---

## Claude Code Skills

This repository is configured with Claude Code slash commands for AI-assisted development. Run them inside Claude Code (CLI or IDE extension).

| Skill | What it does |
|---|---|
| `/test-generator <requirement>` | Generate test cases with full detail (ID, steps, assertions, data conditions) |
| `/generate-test-scripts <jira-id or req-file>` | Create a fully implemented `.generated.spec.ts` from requirements |
| `/implement-tests <spec-file>` | Fill in a generated scaffold using existing page objects |
| `/run-tests [--tag @smoke]` | Run tests and produce a structured summary |
| `/analyze-results` | AI root-cause analysis of the latest Allure output |
| `/fix-and-rerun` | Apply suggested fixes from `/analyze-results` and re-run |
| `/heal-locators` | Suggest stable replacements for broken locators |
| `/submit-pr` | Lint + type-check + smoke → push branch → open a GitHub PR |
| `/e2e-test-generator` | Generate journey-aware E2E test cases with entry/exit points |
| `/security-review` | Security review of current branch changes |

### Convention Rules (`.claude/rules/`)

The rules directory contains reference documents that Claude Code skills read automatically:

| File | Purpose |
|---|---|
| `architecture.md` | Layer boundaries and import rules |
| `locator-strategy.md` | Locator priority and naming conventions |
| `adding-test-cases.md` | Test anatomy, naming, Allure labels, tags |
| `adding-test-scripts.md` | Page Objects, API clients, fixtures, utilities |
| `api-testing.md` | API client rules, Zod validation, contract tests |
| `pr-checklist.md` | Full checklist run before any PR is merged |

---

## Troubleshooting

### Global setup fails immediately

```
Error: Global setup failed: TEST_PASSWORD and BASE_URL must be set in .env
```

Copy `.env.example` to `.env` and fill in `BASE_URL` and `TEST_PASSWORD`. The file must exist — `globalSetup.ts` throws before launching any browser if these are absent.

### Browser executable not found

```
browserType.launch: Executable doesn't exist at …/chromium
```

Run `npx playwright install chromium`. This is separate from `npm install` and must be run once per machine (and once per CI runner if not cached).

### Tests show stale data or wrong user session

`globalSetup` saves session files to `auth-state/` and reuses them on subsequent runs as long as the cookies have not expired. If a session is corrupted or the app was redeployed:

```bash
# Force re-authentication for all users
rm auth-state/standard-user.json auth-state/problem-user.json
npm run test:smoke
```

On Windows: `del auth-state\standard-user.json auth-state\problem-user.json`

### Allure report is empty or shows no results

`allure:generate` must be run before `allure:open`. Raw results land in `allure-results/` after each test run — they are not an HTML report.

```bash
npm run allure:generate   # converts allure-results/ → allure-report/
npm run allure:open       # opens allure-report/ in a browser
```

If `allure-results/` itself is empty, the test run did not produce results (run was cancelled, or reporter misconfigured).

### API tests fail with 401 / missing credentials

Ensure `BOOKER_USERNAME` and `BOOKER_PASSWORD` are set in `.env` (local) or in GitHub Secrets (CI). These are separate from `TEST_USERNAME` / `TEST_PASSWORD` which are for the UI app.

### `scripts/patch-allure-async.ts`

This script patches a known async timing issue in the `allure-playwright` reporter that can cause result files to be written after the process exits. It is applied automatically via the `postinstall` npm hook — you do not need to run it manually.

---

## Contributing

### Branch & Commit Conventions

```
feature/JIRA-XXXX-short-description
fix/JIRA-XXXX-description

[JIRA-XXXX] Add guest checkout E2E test
[JIRA-XXXX] Fix locator for order confirmation heading
```

### Pre-PR Checklist

Run the automated checks before pushing:

```bash
npm run lint
npm run type-check
npm run test:smoke
```

Or use the `/submit-pr` skill — it runs all three, then creates the PR with the populated template.

### PR Template

Every pull request must complete the checklist in [.github/pull_request_template.md](.github/pull_request_template.md):

- Code structure and naming conventions
- Locator quality (data-testid / ARIA only)
- Test quality (one concern per test, no hardcoded data)
- Allure annotation completeness
- API schema updated if contract changed
- Smoke tests passing locally

### Anti-Patterns (ESLint-enforced)

| Rule | Enforcement |
|---|---|
| No `page.locator()` in test files | Code review |
| No `waitForTimeout()` | ESLint error |
| No direct `@playwright/test` import in tests | ESLint error |
| No `any` type | ESLint error |
| No assertions in Page Objects | Code review |
| No hardcoded credentials or URLs | Code review |
