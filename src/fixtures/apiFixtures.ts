import { test as base, APIRequestContext, request } from '@playwright/test';
import { BookerAuthAPI } from '@api/endpoints/BookerAuthAPI';
import { BookingAPI } from '@api/endpoints/BookingAPI';

export interface APIFixtures {
  /** Unauthenticated API request context — use for testing 401/403 scenarios */
  unauthenticatedRequest: APIRequestContext;
  /** BookerAuthAPI client for restful-booker /auth endpoint */
  bookerAuthAPI: BookerAuthAPI;
  /** BookingAPI client for all restful-booker /booking endpoints */
  bookingAPI: BookingAPI;
}

export const test = base.extend<APIFixtures>({
  unauthenticatedRequest: async ({}, use) => {
    const context = await request.newContext({
      baseURL: process.env.API_BASE_URL ?? process.env.BASE_URL,
    });
    await use(context);
    await context.dispose();
  },

  bookerAuthAPI: async ({ unauthenticatedRequest }, use) => {
    await use(new BookerAuthAPI(unauthenticatedRequest));
  },

  bookingAPI: async ({ unauthenticatedRequest }, use) => {
    await use(new BookingAPI(unauthenticatedRequest));
  },
});

export { expect } from '@playwright/test';
