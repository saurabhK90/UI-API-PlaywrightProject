# Saurabh.TestVagrant.AutomationSuite — Framework Guide

## What This Is

Enterprise-grade Playwright + TypeScript automation suite covering UI and API testing for a demo web application. Single unified repository with separate logical layers for UI and API.

**Current setup:** Single worker, one standard user, storage state authentication.

---

## Quick Start

```bash
npm install
npx playwright install chromium
cp .env.example .env          # fill in BASE_URL, TEST_USERNAME, TEST_PASSWORD
npm run test:smoke             # verify everything works
npm run allure:generate && npm run allure:open   # open the report
```

See `.env.example` for all required environment variables.

---

## Project Structure

```
src/
  base/           BasePage.ts, BaseAPI.ts — all Playwright/HTTP primitives live here
  pages/          Page Object classes (extend BasePage)
  api/
    endpoints/    API client classes (extend BaseAPI)
    models/       Zod schemas + inferred TypeScript types
  assertions/
    generic/      UIAssertions.ts, APIAssertions.ts — reusable across tests
    domain/       Feature-specific assertions (UserAssertions, OrderAssertions …)
  fixtures/       Playwright fixture extensions — dependency injection for tests
  utils/          Pure TypeScript utilities — NO Playwright imports allowed here
  ai/             Optional Anthropic SDK layer (isolated, additive)

tests/
  ui/             module/ e2e/
  api/            booking/ e2e/

resources/
  testdata/       users.json, products.xlsx, orders.csv
  locator-registry/  locators.json — history for self-healing agent

config/
  environments/   dev.env, staging.env, prod.env
  allure/         categories.json, environment.properties

scripts/          CLI tools (generate-schema, generate-test-scripts, heal-locators …)
.claude/
  commands/       Slash-command skills (/generate-test-scripts, /submit-pr …)
  rules/          Convention reference files used by skills
```

---

## Key Conventions

### Imports in tests

```typescript
// Always import test and expect from the fixtures barrel — never from @playwright/test
import { test, expect } from '@fixtures/index';
```

### Page Objects

- Extend `BasePage`
- Locators are `private readonly` class fields — never inline strings
- Methods represent user actions: `login()` not `clickLoginButton()`
- **No assertions in Page Objects** — they only act and query
- Locator priority: `data-testid` → ARIA role → semantic text → CSS → XPath

### API Clients

- Extend `BaseAPI`
- Method names describe use case: `createUser()` not `postUsers()`
- Always return raw `APIResponse` — callers apply schema validation

### Test Files

- Named `kebab-case.spec.ts`
- One logical concern per `test()` block
- Arrange → Act → Assert with blank lines between phases
- `@allure.feature`, `@allure.story`, `@allure.severity` required on every test
- No hardcoded credentials or URLs — always from config or `RandomUtils`

### Wait Strategy (in priority order)

1. Playwright auto-wait — always preferred
2. `waitForLocator(locator)` — explicit wait when data loads after element appears
3. `waitForURL(pattern)` — after navigations
4. `waitForResponse(urlPattern)` — after SPA API calls
5. `waitForLoadState()` — page-level transitions only
6. ❌ `waitForTimeout()` — banned (ESLint enforces this)

---

## Authentication — Storage State

`globalSetup.ts` calls the login API once before any test runs and saves cookies + localStorage to `auth-state/standard-user.json`. Tests that need an authenticated browser get this pre-loaded context via the `authenticatedPage` fixture. No test should perform UI login unless it is specifically testing the login feature.

```typescript
// In a test that needs authentication:
const { authenticatedPage } = test.extend(fixtures);
// authenticatedPage is already logged in — no UI login needed

// In a test that explicitly tests login:
const { loginPage } = test.extend(fixtures);   // fresh, unauthenticated context
```

---

## Available Scripts

| Command | What it does |
|---|---|
| `npm run test:smoke` | Smoke tests on Chrome (fast feedback) |
| `npm run test:regression` | Full UI regression on Chrome |
| `npm run test:api` | API tests only (no browser) |
| `npm run test:headed` | Open browser for local debugging |
| `npm run test:debug` | Playwright inspector |
| `npm run lint` | ESLint check |
| `npm run type-check` | TypeScript type check with no emit |
| `npm run generate-schema` | Bootstrap Zod model from live API response |
| `npm run generate-test-scripts` | AI-assisted fully implemented spec file from requirements |
| `npm run heal-locators` | Suggest fixes for broken locators |
| `npm run analyze-failures` | AI root-cause analysis of Allure results |
| `npm run allure:generate` | Build Allure HTML report from raw results |
| `npm run allure:open` | Open the generated Allure report |

---

## Available Skills (Claude Code Slash Commands)

| Command | What it does |
|---|---|
| `/test-generator <requirement>` | Generate test cases with full detail (ID, steps, assertions) |
| `/generate-test-scripts <jira-id or req-file>` | Create a fully implemented `.generated.spec.ts` file |
| `/implement-tests <spec-file>` | Fill in a generated scaffold using existing page objects |
| `/run-tests [--tag @smoke]` | Run tests and summarise results |
| `/analyze-results` | AI root-cause analysis of the latest Allure output |
| `/fix-and-rerun` | Apply suggested fixes and re-run failed tests |
| `/heal-locators` | Suggest replacements for broken locators |
| `/submit-pr` | Lint + type-check + smoke → push branch → create PR |

---

## AI Features (Optional)

All AI features require `ANTHROPIC_API_KEY` in `.env`. If the key is absent every AI entry point logs a warning and skips gracefully — the full test suite runs without it.

- **Test generation** — `npm run generate-test-scripts -- --req path/to/requirements.txt`
- **Self-healing locators** — `npm run heal-locators` after a locator failure
- **Failure analysis** — `npm run analyze-failures` after a test run
- **Test data generation** — one-time generation step, not called at runtime

---

## Environment Variables

See `.env.example` for the full list. Minimum required to run tests:

```
BASE_URL          URL of the application under test
TEST_USERNAME     Login email for the standard test user
TEST_PASSWORD     Password for the standard test user
```

---

## Adding a New Test — Checklist

1. Choose the right test directory: `tests/ui/` for UI tests, `tests/api/` for API tests
2. Import from `@fixtures/index`, not from `@playwright/test`
3. Add `@allure.feature`, `@allure.story`, `@allure.severity` decorators
4. Use page objects for all UI interactions — never call `page.locator()` directly in tests
5. Use `RandomUtils` for any dynamic test data — no hardcoded values
6. Run locally before pushing: `npm run test:smoke`
7. Run `/submit-pr` to lint, type-check, and create the PR

---

## Adding a New Page Object — Checklist

1. Create `src/pages/NewFeaturePage.ts`
2. Extend `BasePage`
3. Define all locators as `private readonly` fields at the top
4. Prefer `data-testid` locators — fall back to ARIA roles
5. Methods return `this` (same page) or the next Page Object (after navigation)
6. Add to `src/fixtures/baseFixtures.ts` fixture list

See `.claude/rules/locator-strategy.md` for the full locator priority reference.
