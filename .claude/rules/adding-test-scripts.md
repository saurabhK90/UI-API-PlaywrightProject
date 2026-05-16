# Rules for Adding Test Scripts (Page Objects, API Clients, Fixtures)

Standards for extending the framework with new page objects, API endpoint classes, and fixtures.

---

## Adding a New Page Object

### 1. Create the file

```
src/pages/NewFeaturePage.ts
```

### 2. Extend BasePage — minimal template

```typescript
import { Page } from '@playwright/test';
import { BasePage } from '@base/BasePage';

export class NewFeaturePage extends BasePage {
  // All locators as private readonly fields — never inline strings in methods
  private readonly pageHeading = this.page.getByRole('heading', { name: 'New Feature' });
  private readonly actionButton = this.page.getByTestId('action-btn');

  constructor(page: Page) {
    super(page);
  }

  // Methods name user actions, not clicks
  async performAction(): Promise<void> {
    await this.click(this.actionButton);
  }

  async getHeadingText(): Promise<string> {
    return this.getText(this.pageHeading);
  }

  async isActionButtonVisible(): Promise<boolean> {
    return this.isVisible(this.actionButton);
  }
}
```

### 3. Add to baseFixtures.ts

```typescript
newFeaturePage: async ({ page }, use) => {
  await use(new NewFeaturePage(page));
},
```

### 4. Rules

- Constructor takes only `Page` — no extra dependencies
- Locators: `data-testid` first, then ARIA role (see `rules/locator-strategy.md`)
- Methods return `this` (same page) or next Page Object (after navigation)
- No assertions — Page Objects only act and query
- No direct `page.locator()` calls in methods — use `this.click()`, `this.type()` etc. from BasePage

---

## Adding a New API Endpoint Class

### 1. Create the file

```
src/api/endpoints/NewResourceAPI.ts
```

### 2. Extend BaseAPI — minimal template

```typescript
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

  async updateNewResource(id: string, payload: Record<string, unknown>): Promise<APIResponse> {
    return this.put(`/new-resource/${id}`, payload);
  }

  async deleteNewResource(id: string): Promise<APIResponse> {
    return this.delete(`/new-resource/${id}`);
  }
}
```

### 3. Add to apiFixtures.ts

```typescript
newResourceAPI: async ({ request }, use) => {
  await use(new NewResourceAPI(request));
},
```

### 4. Create a Zod model

```
src/api/models/NewResourceModel.ts
```

Bootstrap with:
```bash
npm run generate-schema -- --endpoint /new-resource/123 --method GET --output NewResourceModel.ts
```

Then review and refine the generated file.

---

## Adding a New Fixture

### When to add a fixture

- A new page object needs to be available to tests
- A new API client needs to be available to tests
- A new shared setup (e.g., pre-seeded data) is needed by multiple tests

### Adding to baseFixtures.ts

```typescript
export const test = base.extend<UIFixtures>({
  // ... existing fixtures ...

  newFeaturePage: async ({ page }, use) => {
    await use(new NewFeaturePage(page));
  },
});
```

### Fixture scope guidelines

| Scope | Use when | Example |
|---|---|---|
| `'test'` (default) | Full test isolation needed | Page Objects, API clients |
| `'worker'` | Expensive stateless setup shared across tests | Auth token (one API call per worker) |

### After adding a fixture

Update `src/fixtures/index.ts` to re-export it if needed.

---

## Adding a New Utility

```
src/utils/NewUtils.ts
```

Rules:
- No Playwright imports
- No side effects — pure functions
- No dependencies on other `src/` layers
- Export named functions, not a class with static methods (unless grouping is essential)
- Must be independently testable

---

## Adding Domain Message Constants

When a feature introduces known static strings — UI error messages, page titles, URL segments, or API error response messages — capture them as constants in `src/assertions/domain/` before writing the first test.

### 1. Create the file

```
src/assertions/domain/FeatureMessages.ts      ← UI strings
src/assertions/domain/ResourceAPIMessages.ts  ← API strings
```

### 2. Minimal template

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

### 3. Export from the domain barrel

Add a line to `src/assertions/domain/index.ts`:

```typescript
export { CheckoutErrorMessages, CheckoutPageExpectations } from './CheckoutMessages';
```

### 4. Import in tests via the alias

```typescript
import { CheckoutErrorMessages, CheckoutPageExpectations } from '@assertions/domain';
```

### Rules

- Use `enum` for closed sets of error/status messages (finite, named values)
- Use `const … as const` for page-level expectations (title, URL segment) — they are configuration values, not a closed set
- Never paste the same string literal in two places — if it must exist twice, it belongs in a constant
- `src/assertions/domain/` may only be imported by `tests/` and `src/fixtures/` — not by `src/pages/` or `src/api/`

---

## Naming Reference

| Artifact | Convention | Example |
|---|---|---|
| Page Object | PascalCase + `Page.ts` | `ProductDetailPage.ts` |
| API Endpoint class | PascalCase + `API.ts` | `ProductAPI.ts` |
| API Model | PascalCase + `Model.ts` | `ProductModel.ts` |
| Domain UI messages | PascalCase + `Messages.ts` | `CheckoutMessages.ts` |
| Domain API messages | PascalCase + `APIMessages.ts` | `CheckoutAPIMessages.ts` |
| Test spec | kebab-case + `.spec.ts` | `product-search.spec.ts` |
| Utility | PascalCase + `Utils.ts` | `PriceUtils.ts` |
| Fixture file | camelCase + `Fixtures.ts` | `productFixtures.ts` |
