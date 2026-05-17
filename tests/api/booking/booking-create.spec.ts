import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { APIAssertions } from '@assertions/generic/APIAssertions';
import { CreateBookingResponseSchema } from '@api/models/BookingModel';
import type { Booking } from '@api/models/BookingModel';
import { buildBooking } from '../helpers/bookingHelpers';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

test.describe('POST /booking', () => {

  test(
    'Verify API response contains 200 status, valid schema, booking ID and all fields match payload when requested with a complete booking payload',
    { tag: ['@smoke', '@regression'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Create Booking');
      allure.severity(Severity.CRITICAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Arrange ---
      const booking = buildBooking();
      log.debug('Arrange: booking payload ready', { firstname: booking.firstname, totalprice: booking.totalprice });

      // --- Act ---
      const response = await bookingAPI.createBooking(booking);

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      const data = await APIAssertions.assertResponseMatchesSchema(response, CreateBookingResponseSchema);

      await allure.step('Assert booking ID is a positive integer', async () => {
        test.expect(data.bookingid, 'Created booking must have a positive integer ID').toBeGreaterThan(0);
      });

      await allure.step('Assert all booking fields match the sent payload', async () => {
        test.expect(data.booking.firstname).toBe(booking.firstname);
        test.expect(data.booking.lastname).toBe(booking.lastname);
        test.expect(data.booking.totalprice).toBe(booking.totalprice);
        test.expect(data.booking.depositpaid).toBe(booking.depositpaid);
        test.expect(data.booking.bookingdates.checkin).toBe(booking.bookingdates.checkin);
        test.expect(data.booking.bookingdates.checkout).toBe(booking.bookingdates.checkout);
        test.expect(data.booking.additionalneeds).toBe(booking.additionalneeds);
      });
    }
  );

  test(
    'Verify API response contains 500 status and non-empty error body when requested with an empty body',
    { tag: ['@regression', '@negative'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Create Booking');
      allure.severity(Severity.MINOR);
      allure.tag('regression');
      allure.tag('negative');

      // --- Act ---
      // Restful-Booker returns 500 (not 400) for malformed bodies — no input validation middleware
      log.debug('Act: sending empty booking payload to trigger 500');
      const response = await bookingAPI.createBooking({} as Booking);

      // --- Assert ---
      await APIAssertions.assertStatus(response, 500);
      await allure.step('Assert error response body is not empty', async () => {
        const body = await response.text();
        test.expect(body, 'Error response body must not be empty').toBeTruthy();
      });
    }
  );

});
