# Architecture Rules

Rules enforced across the entire framework. ESLint enforces the import rules; code review enforces the rest.

---

## Layer Boundaries

| Layer | May import from | Must NOT import from |
|---|---|---|
| `src/utils/` | Node.js builtins, npm packages | `@playwright/test`, `src/base/`, `src/pages/`, `src/api/` |
| `src/base/` | `src/utils/`, `@playwright/test`, `allure-js-commons` | `src/pages/`, `src/api/`, `src/fixtures/` |
| `src/pages/` | `src/base/`, `src/utils/` | `src/api/`, `src/fixtures/`, `src/assertions/` |
| `src/api/` | `src/base/`, `src/utils/`, `zod` | `src/pages/`, `src/fixtures/` |
| `src/assertions/` | `src/utils/`, `zod`, `@playwright/test` | `src/base/`, `src/pages/` |
| `src/fixtures/` | All src layers | Nothing outside `src/` |
| `tests/` | `src/fixtures/index` ONLY for test/expect | Direct `@playwright/test` import |
| `src/ai/` | All src layers, `@anthropic-ai/sdk` | `tests/` |

---

## File Naming

| Artifact | Convention | Example |
|---|---|---|
| Page Object | PascalCase + `Page.ts` | `CheckoutPage.ts` |
| API Endpoint class | PascalCase + `API.ts` | `OrderAPI.ts` |
| API Model (Zod) | PascalCase + `Model.ts` | `OrderModel.ts` |
| Test spec | kebab-case + `.spec.ts` | `guest-checkout.spec.ts` |
| Utility | PascalCase + `Utils.ts` | `DateUtils.ts` |
| Fixture file | camelCase + `Fixtures.ts` | `baseFixtures.ts` |
| AI component | PascalCase, descriptive | `LocatorHealer.ts` |

---

## What Belongs Where

**`src/base/`** — Playwright and HTTP primitives only. No business logic.
**`src/pages/`** — Screen-level interactions. One file per logical page or significant component.
**`src/api/endpoints/`** — HTTP operations per resource. Return raw `APIResponse`.
**`src/api/models/`** — Zod schemas. TypeScript types inferred from schemas. No logic.
**`src/assertions/generic/`** — Assertions reusable across any domain.
**`src/assertions/domain/`** — Business-logic assertions per resource/feature.
**`src/fixtures/`** — Playwright dependency injection. Page objects and API clients injected here.
**`src/utils/`** — Pure TypeScript. No side effects. Each util is independently unit-testable.
**`src/ai/`** — Anthropic SDK integration. Fully isolated. Removing this directory must not break any test.

---

## Anti-Patterns (Never Do These)

- No `page.locator()` calls directly in test files — use page object methods
- No assertions in Page Object classes
- No Playwright imports in `src/utils/`
- No hardcoded test data (emails, passwords, IDs) in test files
- No `waitForTimeout()` — use explicit locator or network waits
- No `test.describe.serial` without a comment explaining the sequential dependency
- No shared mutable state (global variables, module-level objects mutated between tests)
- No direct imports of `test`/`expect` from `@playwright/test` in test files — use `src/fixtures/index`
