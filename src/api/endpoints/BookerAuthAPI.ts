import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from '@base/BaseAPI';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

/**
 * API client for the Restful-Booker /auth resource.
 *
 * Produces a short-lived token used to authorise write operations
 * (PUT /booking/:id and DELETE /booking/:id). The token is consumed as a
 * Cookie header in those requests — not as a Bearer token — which is an
 * intentional quirk of this API's auth contract.
 *
 * Important: invalid credentials still return HTTP 200. The body switches
 * from { token } to { reason: "Bad credentials" }. Callers must inspect
 * the response body to distinguish success from failure; asserting status
 * alone is not sufficient here.
 */
export class BookerAuthAPI extends BaseAPI {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Exchange credentials for a session token.
   *
   * Success  → HTTP 200, body: { token: string }
   * Failure  → HTTP 200, body: { reason: "Bad credentials" }
   *
   * Pass the returned token to BookingAPI.updateBooking() / deleteBooking().
   */
  async authenticate(username: string, password: string): Promise<APIResponse> {
    log.info('Authenticating booker user', { username });
    return this.post('/auth', { username, password });
  }
}
