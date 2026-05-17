import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseAPI } from '@base/BaseAPI';
import type { Booking } from '@api/models/BookingModel';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

/**
 * Optional query parameters accepted by GET /booking.
 * All fields are optional — omitting them returns every booking in the system.
 * Unrecognised keys are silently ignored by the API.
 */
interface BookingFilters {
  firstname?: string;
  lastname?: string;
  checkin?: string;
  checkout?: string;
}

/**
 * API client for the Restful-Booker /booking resource.
 *
 * Covers the full booking lifecycle: list, read, create, update, delete.
 *
 * Auth contract for write operations (PUT, DELETE):
 *   The API accepts a Cookie-based token (from POST /auth), NOT a Bearer token.
 *   Authenticated methods take a token string and apply it as `Cookie: token=<value>`.
 *   This is set per-instance — each test fixture gets its own BookingAPI instance,
 *   so cookie state never leaks between tests.
 *
 * Unauthenticated variants (updateBookingWithoutAuth, deleteBookingWithoutAuth)
 * exist solely to drive negative test scenarios that verify 403 behaviour.
 * They must not be used in production test flows.
 *
 * Raw APIResponse is always returned. Schema validation and field-level
 * assertions belong in the test layer, not here.
 */
export class BookingAPI extends BaseAPI {
  constructor(request: APIRequestContext) {
    super(request);
    // GET /booking/:id supports content negotiation and may return XML by default.
    // Forcing Accept: application/json ensures consistent JSON responses across all endpoints.
    this.setHeaders({ Accept: 'application/json' });
  }

  /**
   * Retrieve all booking IDs in the system.
   * Pass filters to narrow results by guest name or stay dates.
   * Returns an empty array (not 404) when no bookings match the filter.
   */
  async getAllBookings(filters?: BookingFilters): Promise<APIResponse> {
    log.debug('Fetching all bookings', filters ? { filters } : {});
    return this.get('/booking', filters as Record<string, string> | undefined);
  }

  /**
   * Retrieve the full detail of a single booking by its numeric ID.
   * Returns 404 when the booking does not exist or has been deleted.
   */
  async getBookingById(id: number): Promise<APIResponse> {
    log.debug('Fetching booking by ID', { id });
    return this.get(`/booking/${id}`);
  }

  /**
   * Create a new booking with the provided payload.
   * Returns 200 (not 201) with { bookingid, booking } on success.
   * Returns 500 for an empty or structurally invalid body —
   * the API has no 400-level input validation.
   */
  async createBooking(payload: Booking): Promise<APIResponse> {
    log.info('Creating booking', { firstname: payload.firstname, lastname: payload.lastname, totalprice: payload.totalprice });
    return this.post('/booking', payload);
  }

  /**
   * Fully replace all fields of an existing booking (PUT semantics).
   * Requires a valid token from POST /auth, passed as a Cookie header.
   * Returns 200 with the updated booking on success.
   * Returns 403 when the token is absent or invalid.
   */
  async updateBooking(id: number, payload: Booking, token: string): Promise<APIResponse> {
    log.info('Updating booking with cookie token', { id });
    this.setHeaders({ Cookie: `token=${token}` });
    return this.put(`/booking/${id}`, payload);
  }

  /**
   * PUT without auth. Used exclusively for @negative test coverage verifying
   * that the API correctly rejects unauthenticated updates with 403.
   * Do not call this in any non-negative test path.
   */
  async updateBookingWithoutAuth(id: number, payload: Booking): Promise<APIResponse> {
    log.debug('Updating booking without auth (negative test path)', { id });
    return this.put(`/booking/${id}`, payload);
  }

  /**
   * Fully replace all fields of an existing booking using HTTP Basic Auth.
   * The Restful-Booker API accepts either Cookie-based token auth OR Basic Auth
   * for write operations. This variant sets the Authorization header directly.
   * Credentials are encoded as Base64(username:password) per RFC 7617.
   */
  async updateBookingWithBasicAuth(
    id: number,
    payload: Booking,
    username: string,
    password: string
  ): Promise<APIResponse> {
    log.info('Updating booking with Basic Auth', { id, username });
    this.setBasicAuth(username, password);
    return this.put(`/booking/${id}`, payload);
  }

  /**
   * Delete a booking by ID.
   * Requires a valid token from POST /auth, passed as a Cookie header.
   * Returns 201 with body "Created" on success — this is a known API quirk,
   * not an error. The semantic is "deletion accepted", not "resource created".
   * Returns 403 when the token is absent or invalid.
   */
  async deleteBooking(id: number, token: string): Promise<APIResponse> {
    log.info('Deleting booking', { id });
    this.setHeaders({ Cookie: `token=${token}` });
    return this.delete(`/booking/${id}`);
  }

  /**
   * DELETE without auth. Used exclusively for @negative test coverage verifying
   * that the API correctly rejects unauthenticated deletes with 403.
   * Do not call this in any non-negative test path.
   */
  async deleteBookingWithoutAuth(id: number): Promise<APIResponse> {
    log.debug('Deleting booking without auth (negative test path)', { id });
    return this.delete(`/booking/${id}`);
  }
}
