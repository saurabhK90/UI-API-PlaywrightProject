import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { APIAssertions } from '@assertions/generic/APIAssertions';
import {
  AuthTokenSchema,
  BookingSchema,
  CreateBookingResponseSchema,
} from '@api/models/BookingModel';
import type { Booking } from '@api/models/BookingModel';

test.describe('Booking API — End-to-End Flow', () => {

  test(
    'user can create, update, verify, and delete a booking',
    { tag: ['@e2e'] },
    async ({ bookerAuthAPI, bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('CRUD Lifecycle');
      allure.severity(Severity.BLOCKER);
      allure.tag('e2e');

      // ─── Arrange: obtain auth token ────────────────────────────────────────

      const tokenResponse = await bookerAuthAPI.authenticate(
        process.env.BOOKER_USERNAME!,
        process.env.BOOKER_PASSWORD!
      );
      await APIAssertions.assertStatus(tokenResponse, 200);
      const { token } = await APIAssertions.assertResponseMatchesSchema(tokenResponse, AuthTokenSchema);

      const initialBooking: Booking = {
        firstname: 'Alice',
        lastname: 'Walker',
        totalprice: 250,
        depositpaid: true,
        bookingdates: { checkin: '2024-09-01', checkout: '2024-09-07' },
        additionalneeds: 'Sea view room',
      };

      // ─── Step 1: Create ───────────────────────────────────────────────────

      const createResponse = await bookingAPI.createBooking(initialBooking);
      await APIAssertions.assertStatus(createResponse, 200);
      await APIAssertions.assertContentType(createResponse, 'application/json');
      const created = await APIAssertions.assertResponseMatchesSchema(createResponse, CreateBookingResponseSchema);

      test.expect(created.bookingid, 'Booking ID must be a positive integer').toBeGreaterThan(0);
      test.expect(created.booking.firstname).toBe(initialBooking.firstname);
      test.expect(created.booking.totalprice).toBe(initialBooking.totalprice);

      const bookingId = created.bookingid;

      // ─── Step 2: Update ───────────────────────────────────────────────────

      const updatedBooking: Booking = {
        ...initialBooking,
        firstname: 'AliceUpdated',
        totalprice: 400,
        depositpaid: false,
        additionalneeds: 'Early checkin',
      };

      const updateResponse = await bookingAPI.updateBooking(bookingId, updatedBooking, token);
      await APIAssertions.assertStatus(updateResponse, 200);
      await APIAssertions.assertContentType(updateResponse, 'application/json');
      const updated = await APIAssertions.assertResponseMatchesSchema(updateResponse, BookingSchema);

      test.expect(updated.firstname).toBe('AliceUpdated');
      test.expect(updated.totalprice).toBe(400);
      test.expect(updated.depositpaid).toBe(false);
      test.expect(updated.additionalneeds).toBe('Early checkin');

      // ─── Step 3: Verify ───────────────────────────────────────────────────

      const verifyResponse = await bookingAPI.getBookingById(bookingId);
      await APIAssertions.assertStatus(verifyResponse, 200);
      await APIAssertions.assertContentType(verifyResponse, 'application/json');
      const verified = await APIAssertions.assertResponseMatchesSchema(verifyResponse, BookingSchema);

      test.expect(verified.firstname).toBe('AliceUpdated');
      test.expect(verified.totalprice).toBe(400);
      test.expect(verified.bookingdates.checkin).toBe(initialBooking.bookingdates.checkin);
      test.expect(verified.bookingdates.checkout).toBe(initialBooking.bookingdates.checkout);

      // ─── Step 4: Delete ───────────────────────────────────────────────────

      const deleteResponse = await bookingAPI.deleteBooking(bookingId, token);
      await APIAssertions.assertStatus(deleteResponse, 201);

      const confirmDeletedResponse = await bookingAPI.getBookingById(bookingId);
      await APIAssertions.assertStatus(confirmDeletedResponse, 404);
    }
  );

});
