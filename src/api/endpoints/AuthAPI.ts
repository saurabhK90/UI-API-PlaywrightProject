import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from '@base/BaseAPI';

/**
 * Example API client for authentication endpoints.
 * TODO: update endpoint paths to match your actual API.
 */
export class AuthAPI extends BaseAPI {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async login(username: string, password: string): Promise<APIResponse> {
    // TODO: update this endpoint path to match your API
    return this.post('/api/login', { username, password });
  }

  async logout(token: string): Promise<APIResponse> {
    this.setAuthToken(token);
    return this.post('/api/logout', {});
  }

  async refreshToken(refreshToken: string): Promise<APIResponse> {
    return this.post('/api/refresh', { refreshToken });
  }

  async requestPasswordReset(email: string): Promise<APIResponse> {
    return this.post('/api/password-reset', { email });
  }

  async validateToken(token: string): Promise<APIResponse> {
    this.setAuthToken(token);
    return this.get('/api/validate-token');
  }
}
