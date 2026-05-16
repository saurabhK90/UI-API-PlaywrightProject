/**
 * Static string constants for the Auth API.
 * Update these values to match the actual API error response bodies once the
 * real API contract is confirmed (see src/api/models/UserModel.ts for schemas).
 *
 * Usage:
 *   import { AuthAPIErrorMessages } from '@assertions/domain';
 *   await APIAssertions.assertResponseBodyContains(response, 'message', AuthAPIErrorMessages.INVALID_CREDENTIALS);
 */

export enum AuthAPIErrorMessages {
  // TODO: replace placeholder strings with exact values from the API error response body
  UNAUTHORIZED = 'Unauthorized',
  INVALID_CREDENTIALS = 'Invalid credentials',
  TOKEN_EXPIRED = 'Token has expired',
  ACCOUNT_LOCKED = 'Account has been locked',
}

export const AuthAPIExpectations = {
  LOGIN_ENDPOINT: '/api/login',
  TOKEN_RESPONSE_FIELD: 'token',
} as const;
