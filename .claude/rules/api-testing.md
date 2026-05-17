# API Testing Rules

Standards for writing API tests and API client code in this framework.

---

## API Client Rules

API clients live in `src/api/endpoints/`. Each file covers one REST resource.

```typescript
// ✅ Method names describe use case
async getUserById(id: string): Promise<APIResponse>
async createUser(payload: CreateUserPayload): Promise<APIResponse>
async updateOrderStatus(id: string, status: OrderStatus): Promise<APIResponse>

// ❌ Method names describe HTTP verbs
async getUsers(): Promise<APIResponse>
async postUser(): Promise<APIResponse>
```

Every method returns the raw `APIResponse` from Playwright — callers apply schema validation.

---

## Zod Schema Validation

Every API endpoint has a corresponding Zod model in `src/api/models/`.

```typescript
// src/api/models/UserModel.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'standard', 'readonly']),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;
```

Bootstrap a schema from a live API response:
```bash
npm run generate-schema -- --endpoint /users/123 --method GET --output UserModel.ts
```

Then review: mark optional fields, add union types, commit.

---

## API Test Structure

```typescript
test('API returns user profile with correct schema', async ({ userAPI }) => {
  // --- Act ---
  const response = await userAPI.getUserById('usr-001');

  // --- Assert ---
  await APIAssertions.assertStatus(response, 200);
  await APIAssertions.assertResponseMatchesSchema(response, UserSchema);
  await APIAssertions.assertResponseTime(response, 2000);
});
```

---

## Status Code Tests

Always test the happy path AND error cases:

```typescript
test('API returns 404 when user does not exist', async ({ userAPI }) => {
  const response = await userAPI.getUserById('non-existent-id');
  await APIAssertions.assertStatus(response, 404);
});

test('API returns 401 when request has no auth token', async ({ unauthenticatedRequest }) => {
  const unauthAPI = new UserAPI(unauthenticatedRequest);
  const response = await unauthAPI.getUserById('usr-001');
  await APIAssertions.assertStatus(response, 401);
});
```

---

## Authentication in API Tests

Use the `authenticatedRequest` fixture for tests that need auth. Use `unauthenticatedRequest` (plain `request`) to test auth error cases.

```typescript
// In apiFixtures.ts
authenticatedRequest: async ({ request }, use) => {
  const authAPI = new AuthAPI(request);
  const loginResponse = await authAPI.login(process.env.TEST_USERNAME!, process.env.TEST_PASSWORD!);
  const { token } = await loginResponse.json() as { token: string };
  await use(request);   // token injected via setAuthToken in the API client
},
```

---

## Response Time Budgets

Add response time assertions to performance-sensitive endpoints:

```typescript
await APIAssertions.assertResponseTime(response, 2000);   // 2 second budget
```

If an endpoint consistently exceeds the budget, flag it — do not increase the budget silently.

---

## Schema Validation in Regression Tests

Schema validation is applied inline within regression tests rather than as a separate test tier. Every test that calls a GET or POST endpoint asserts the response shape against the committed Zod schema.

```typescript
test('API returns booking with correct schema', async ({ bookingAPI }) => {
  allure.tag('regression');

  const response = await bookingAPI.getBookingById(id);
  await APIAssertions.assertStatus(response, 200);
  await APIAssertions.assertResponseMatchesSchema(response, BookingSchema);
});
```

When Zod validation fails with `ZodError`, Allure surfaces it as a structured error — visible without reading raw JSON diffs.

---

## Allure Logging

`BaseAPI` attaches every request and response to Allure automatically. Do not add manual `console.log` statements — use the Allure step output instead.

---

## Test Data for API Tests

- Use `RandomUtils.generateEmail()` for user creation tests — prevents conflicts between runs
- Static test user IDs for read-only tests: `TEST_USER_ID` from `resources/testdata/users.json`
- Clean up created data in `afterEach` when the API supports deletion
