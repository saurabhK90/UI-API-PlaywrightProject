import { APIResponse, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { z, ZodSchema } from 'zod';
import { AssertionMessages } from '../AssertionMessages';

/**
 * Generic API assertions reusable across any API test.
 * Zod-backed schema validation surfaces contract violations with structured error details.
 */
export class APIAssertions {
  static async assertStatus(response: APIResponse, expectedStatus: number): Promise<void> {
    await allure.step(`Assert response status is ${expectedStatus}`, async () => {
      expect(
        response.status(),
        AssertionMessages.status(response.status(), expectedStatus)
      ).toBe(expectedStatus);
    });
  }

  static async assertStatusOK(response: APIResponse): Promise<void> {
    await allure.step('Assert response is OK (2xx)', async () => {
      expect(response.ok(), AssertionMessages.status(response.status(), 200)).toBeTruthy();
    });
  }

  static async assertResponseMatchesSchema<T>(
    response: APIResponse,
    schema: ZodSchema<T>
  ): Promise<T> {
    return allure.step('Assert response matches schema contract', async () => {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new Error('Response body is not valid JSON — cannot validate schema');
      }

      const result = schema.safeParse(body);
      if (!result.success) {
        const errorSummary = result.error.errors
          .map(e => `  - ${e.path.join('.')}: ${e.message}`)
          .join('\n');
        throw new Error(AssertionMessages.schema(errorSummary));
      }

      return result.data;
    });
  }

  static async assertHeader(
    response: APIResponse,
    headerName: string,
    expectedValue: string
  ): Promise<void> {
    await allure.step(`Assert response header "${headerName}" is "${expectedValue}"`, async () => {
      const actual = response.headers()[headerName.toLowerCase()] ?? null;
      expect(actual, AssertionMessages.header(headerName, expectedValue, actual)).toBe(
        expectedValue
      );
    });
  }

  static async assertResponseBodyContains(
    response: APIResponse,
    keyPath: string,
    expectedValue: unknown
  ): Promise<void> {
    await allure.step(
      `Assert response body "${keyPath}" equals ${JSON.stringify(expectedValue)}`,
      async () => {
        const body = await response.json() as Record<string, unknown>;
        const keys = keyPath.split('.');
        let current: unknown = body;

        for (const key of keys) {
          if (typeof current !== 'object' || current === null) {
            throw new Error(`Key path "${keyPath}" not found in response body`);
          }
          current = (current as Record<string, unknown>)[key];
        }

        expect(
          current,
          AssertionMessages.responseBodyContains(keyPath, expectedValue, current)
        ).toEqual(expectedValue);
      }
    );
  }

  static async assertResponseTime(response: APIResponse, maxMilliseconds: number): Promise<void> {
    await allure.step(`Assert response time is under ${maxMilliseconds}ms`, async () => {
      const duration = parseInt(response.headers()['x-response-time'] ?? '0', 10);
      if (duration > 0) {
        expect(
          duration,
          AssertionMessages.responseTime(duration, maxMilliseconds)
        ).toBeLessThanOrEqual(maxMilliseconds);
      }
    });
  }

  static async assertPagination(
    response: APIResponse,
    expectedPage: number,
    expectedTotal: number
  ): Promise<void> {
    await allure.step(
      `Assert pagination: page ${expectedPage}, total ${expectedTotal}`,
      async () => {
        const body = await response.json() as Record<string, unknown>;

        const PaginationSchema = z.object({
          page: z.number(),
          total: z.number(),
        });

        const result = PaginationSchema.safeParse(body);
        if (!result.success) {
          throw new Error('Response does not contain pagination fields "page" and "total"');
        }

        expect(result.data.page).toBe(expectedPage);
        expect(result.data.total).toBe(expectedTotal);
      }
    );
  }

  static async assertArrayLength(
    response: APIResponse,
    expectedLength: number
  ): Promise<void> {
    await allure.step(`Assert response array length is ${expectedLength}`, async () => {
      const body = await response.json() as unknown[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(expectedLength);
    });
  }

  static async assertContentType(response: APIResponse, expectedType: string): Promise<void> {
    await allure.step(`Assert content-type contains "${expectedType}"`, async () => {
      const actual = response.headers()['content-type'] ?? '';
      expect(
        actual,
        `Expected content-type to contain "${expectedType}" but got "${actual}"`
      ).toContain(expectedType);
    });
  }
}
