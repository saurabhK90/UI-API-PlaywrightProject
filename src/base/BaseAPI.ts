import { APIRequestContext, APIResponse } from '@playwright/test';
import { allure } from 'allure-playwright';
import { Logger } from '@utils/Logger';
import { RetryUtils } from '@utils/RetryUtils';

const log = Logger.getInstance();

/**
 * Abstract base for all API endpoint classes. Every HTTP method wraps the Playwright
 * APIRequestContext with auth handling, Allure logging, and error surfacing.
 * API clients never access the SDK directly — they call this.get(), this.post() etc.
 */
export abstract class BaseAPI {
  protected readonly request: APIRequestContext;
  private authToken: string | null = null;
  private extraHeaders: Record<string, string> = {};

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // ─── HTTP Methods ──────────────────────────────────────────────────────────

  async get(endpoint: string, params?: Record<string, string>): Promise<APIResponse> {
    return allure.step(`GET ${endpoint}`, async () => {
      log.debug(`GET ${endpoint}`, { params });
      const response = await this.request.get(endpoint, {
        params,
        headers: this.buildHeaders(),
      });
      await this.logToAllure('GET', endpoint, undefined, response);
      return response;
    });
  }

  async post(endpoint: string, body: unknown): Promise<APIResponse> {
    return allure.step(`POST ${endpoint}`, async () => {
      log.debug(`POST ${endpoint}`, { body });
      const response = await this.request.post(endpoint, {
        data: body,
        headers: this.buildHeaders(),
      });
      await this.logToAllure('POST', endpoint, body, response);
      return response;
    });
  }

  async put(endpoint: string, body: unknown): Promise<APIResponse> {
    return allure.step(`PUT ${endpoint}`, async () => {
      log.debug(`PUT ${endpoint}`, { body });
      const response = await this.request.put(endpoint, {
        data: body,
        headers: this.buildHeaders(),
      });
      await this.logToAllure('PUT', endpoint, body, response);
      return response;
    });
  }

  async patch(endpoint: string, body: unknown): Promise<APIResponse> {
    return allure.step(`PATCH ${endpoint}`, async () => {
      log.debug(`PATCH ${endpoint}`, { body });
      const response = await this.request.patch(endpoint, {
        data: body,
        headers: this.buildHeaders(),
      });
      await this.logToAllure('PATCH', endpoint, body, response);
      return response;
    });
  }

  async delete(endpoint: string): Promise<APIResponse> {
    return allure.step(`DELETE ${endpoint}`, async () => {
      log.debug(`DELETE ${endpoint}`);
      const response = await this.request.delete(endpoint, {
        headers: this.buildHeaders(),
      });
      await this.logToAllure('DELETE', endpoint, undefined, response);
      return response;
    });
  }

  async postForm(endpoint: string, formData: Record<string, string>): Promise<APIResponse> {
    return allure.step(`POST (form) ${endpoint}`, async () => {
      log.debug(`POST (form) ${endpoint}`, { formData });
      const response = await this.request.post(endpoint, {
        form: formData,
        headers: this.buildHeaders(),
      });
      await this.logToAllure('POST', endpoint, formData, response);
      return response;
    });
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  setAuthToken(token: string): this {
    this.authToken = token;
    return this;
  }

  clearAuth(): this {
    this.authToken = null;
    return this;
  }

  setBasicAuth(username: string, password: string): this {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    this.extraHeaders['Authorization'] = `Basic ${encoded}`;
    return this;
  }

  setHeaders(headers: Record<string, string>): this {
    this.extraHeaders = { ...this.extraHeaders, ...headers };
    return this;
  }

  // ─── Response Helpers ──────────────────────────────────────────────────────

  async parseJSON<T = unknown>(response: APIResponse): Promise<T> {
    return response.json() as Promise<T>;
  }

  getStatusCode(response: APIResponse): number {
    return response.status();
  }

  getHeaders(response: APIResponse): Record<string, string> {
    return response.headers();
  }

  // ─── Retry ─────────────────────────────────────────────────────────────────

  async getWithRetry(
    endpoint: string,
    expectedStatus: number,
    maxRetries = 5,
    delayMs = 2000
  ): Promise<APIResponse> {
    return RetryUtils.retry(
      async () => {
        const response = await this.get(endpoint);
        if (response.status() !== expectedStatus) {
          throw new Error(`Expected status ${expectedStatus}, got ${response.status()}`);
        }
        return response;
      },
      maxRetries,
      delayMs
    );
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.extraHeaders,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async logToAllure(
    method: string,
    endpoint: string,
    requestBody: unknown,
    response: APIResponse
  ): Promise<void> {
    const status = response.status();
    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }

    const logContent = JSON.stringify(
      {
        request: { method, endpoint, body: requestBody ?? null },
        response: { status, body: responseBody },
      },
      null,
      2
    );

    await allure.attachment(`${method} ${endpoint} — ${status}`, logContent, {
      contentType: 'application/json',
    });

    if (status >= 400) {
      log.warn(`${method} ${endpoint} returned ${status}`, { responseBody });
    }
  }
}
