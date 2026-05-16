## Description

<!-- What does this PR add or fix? Link to the Jira ticket if applicable. -->

Jira: <!-- JIRA-XXXX -->

---

## Test Automation PR Checklist

### Code Structure & Architecture
- [ ] New files follow naming conventions: `Page=PascalCase+Page.ts`, `API=PascalCase+API.ts`, `spec=kebab-case.spec.ts`, `utils=PascalCase+Utils.ts`
- [ ] No Playwright/page/browser imports in `src/utils/` — utils must be pure TypeScript
- [ ] No assertions in Page Object classes — Page Objects only act and query
- [ ] No generic/reusable action methods added to a Page class — generic methods belong in `BasePage`
- [ ] New page objects extend `BasePage`; new API clients extend `BaseAPI`

### Locators & Interactions
- [ ] Locators use `data-testid` or ARIA role — not positional CSS, index-based selectors, or XPath
- [ ] All locators are `private readonly` class fields at the top of the Page class
- [ ] No `waitForTimeout()` added — used explicit locator wait or network wait instead

### Test Quality
- [ ] Each test asserts exactly one logical outcome — no multi-concern tests
- [ ] Test names describe user intent: `'user can …'` or `'user sees …'`
- [ ] No hardcoded test data (credentials, IDs, emails) — data from `resources/` or `RandomUtils`
- [ ] No hardcoded environment URLs — all from `process.env` / `config/environments/`
- [ ] Imports `test` and `expect` from `src/fixtures/index`, not from `@playwright/test`

### Allure & Reporting
- [ ] `allure.feature`, `allure.story`, `allure.severity` applied to every test
- [ ] `allure.issue()` added if test is linked to a Jira ticket
- [ ] `allure.tag('smoke')` or `allure.tag('regression')` applied

### API & Schema
- [ ] Zod schema in `src/api/models/` updated if the API contract changed
- [ ] New API endpoint class extends `BaseAPI`

### CI & Execution
- [ ] Smoke tests pass locally: `npm run test:smoke`
- [ ] No new `test.skip()` without a Jira ticket reference
