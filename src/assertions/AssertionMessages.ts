/**
 * Centralised assertion failure messages. Consistent, human-readable error descriptions
 * across the entire suite — engineers read these during triage, not raw Playwright errors.
 */
export const AssertionMessages = {
  status: (actual: number, expected: number): string =>
    `Expected HTTP status ${expected} but received ${actual}`,

  schema: (errors: string): string =>
    `API response does not match the committed schema contract:\n${errors}`,

  responseTime: (actual: number, max: number): string =>
    `Response time ${actual}ms exceeded the ${max}ms budget`,

  header: (name: string, expected: string, actual: string | null): string =>
    `Expected header "${name}" to be "${expected}" but was "${actual ?? '(not present)'}"`,

  elementVisible: (locatorDescription: string): string =>
    `Expected element to be visible: ${locatorDescription}`,

  elementHidden: (locatorDescription: string): string =>
    `Expected element to be hidden: ${locatorDescription}`,

  elementText: (expected: string, actual: string): string =>
    `Expected element text to be "${expected}" but was "${actual}"`,

  elementCount: (expected: number, actual: number): string =>
    `Expected ${expected} elements but found ${actual}`,

  pageTitle: (expected: string, actual: string): string =>
    `Expected page title "${expected}" but got "${actual}"`,

  urlPattern: (pattern: string, actual: string): string =>
    `Expected URL to match "${pattern}" but current URL is "${actual}"`,

  toastMessage: (expected: string, actual: string): string =>
    `Expected toast message "${expected}" but got "${actual}"`,

  responseBodyContains: (keyPath: string, expected: unknown, actual: unknown): string =>
    `Expected response body at "${keyPath}" to be ${JSON.stringify(expected)} but was ${JSON.stringify(actual)}`,
};
