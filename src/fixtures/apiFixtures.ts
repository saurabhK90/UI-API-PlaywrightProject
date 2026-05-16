import { test as base, APIRequestContext, request } from '@playwright/test';
import { AuthAPI } from '@api/endpoints/AuthAPI';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

export interface APIFixtures {
  /** Unauthenticated API request context — use for testing 401/403 scenarios */
  unauthenticatedRequest: APIRequestContext;
  /** API request context with Bearer token pre-set — use for most API tests */
  authenticatedRequest: APIRequestContext;
  /** AuthAPI client bound to the unauthenticated context */
  authAPI: AuthAPI;
}

export const test = base.extend<APIFixtures>({
  unauthenticatedRequest: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.API_BASE_URL ?? process.env.BASE_URL,
    });
    await use(context);
    await context.dispose();
  },

  authenticatedRequest: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.API_BASE_URL ?? process.env.BASE_URL,
    });

    const authAPI = new AuthAPI(context);
    const loginResponse = await authAPI.login(
      process.env.TEST_USERNAME!,
      process.env.TEST_PASSWORD!
    );

    if (!loginResponse.ok()) {
      log.warn('API login failed in apiFixtures — authenticatedRequest may lack a valid token');
    } else {
      const body = await loginResponse.json() as { token?: string; accessToken?: string };
      const token = body.token ?? body.accessToken ?? '';
      authAPI.setAuthToken(token);
    }

    await use(context);
    await context.dispose();
  },

  authAPI: async ({ unauthenticatedRequest }, use) => {
    await use(new AuthAPI(unauthenticatedRequest));
  },
});

export { expect } from '@playwright/test';
