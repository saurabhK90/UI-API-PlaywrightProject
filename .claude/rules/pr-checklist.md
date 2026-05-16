# PR Checklist Rules

Standards checked before any PR is merged. The `/submit-pr` skill runs the automated checks; this file documents the full manual review checklist.

---

## Automated Checks (run by /submit-pr)

These are machine-verified and must pass before push:

- [ ] `npm run lint` — ESLint passes with no errors
- [ ] `npm run type-check` — TypeScript compiles with no errors (`tsc --noEmit`)
- [ ] `npm run test:smoke` — smoke suite passes locally

---

## Code Structure & Architecture

- [ ] New files follow naming conventions (see `rules/adding-test-scripts.md`)
- [ ] No Playwright imports in `src/utils/` — utils must be pure TypeScript
- [ ] No assertions in Page Object classes — Page Objects only act and query
- [ ] No generic/reusable actions added to a Page class — they belong in `BasePage`
- [ ] No duplicate utility methods — checked `src/utils/` before writing a new helper
- [ ] New Page Objects extend `BasePage`; new API clients extend `BaseAPI`

---

## Locators & Interactions

- [ ] Locators use `data-testid` or ARIA role — not positional CSS, index-based selectors, or XPath
- [ ] All locators are `private readonly` class fields — no inline strings in methods
- [ ] No `waitForTimeout()` added — used explicit locator wait or network wait instead

---

## Test Quality

- [ ] Each test asserts exactly one logical outcome — no multi-concern tests
- [ ] Test names describe user intent: `'user can …'` or `'user sees …'`
- [ ] No hardcoded test data (credentials, IDs, emails) — data comes from `resources/` or `RandomUtils`
- [ ] No hardcoded environment URLs — all come from `process.env` / `config/environments/`
- [ ] No `test.describe.serial` unless sequential dependency is unavoidable (comment the reason)
- [ ] No shared mutable state between tests (global variables, module-level objects)
- [ ] Imports `test` and `expect` from `src/fixtures/index`, not from `@playwright/test`

---

## Allure & Reporting

- [ ] `allure.feature`, `allure.story`, `allure.severity` applied to every test
- [ ] `allure.issue()` added if test is linked to a Jira ticket
- [ ] `allure.tag('smoke')` or `allure.tag('regression')` applied appropriately

---

## API & Schema

- [ ] Zod schema in `src/api/models/` updated if the API contract changed
- [ ] New API endpoint class extends `BaseAPI`
- [ ] `generate-schema` script run for new endpoints to bootstrap the model

---

## Branch & Commit Conventions

- [ ] Branch name: `feature/JIRA-XXXX-short-description` or `fix/JIRA-XXXX-description`
- [ ] Commits: `[JIRA-XXXX] <imperative sentence describing the change>`
- [ ] PR title: concise (under 70 chars), imperative — e.g., `Add guest checkout E2E test`
- [ ] PR description: links to Jira ticket, lists changed files, includes test run evidence

---

## CI

- [ ] Tests pass locally before pushing
- [ ] No new `test.skip()` without a Jira ticket reference and expiry condition
- [ ] Smoke workflow passes on the PR in GitHub Actions
