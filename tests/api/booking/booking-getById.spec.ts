import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { APIAssertions } from '@assertions/generic/APIAssertions';
import { BookingSchema } from '@api/models/BookingModel';
import { buildBooking, createSeedBooking } from '../helpers/bookingHelpers';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

test.describe('GET /booking/:id', () => {

  test(
    'Verify API response contains 200 status, valid schema and all fields match created booking when requested with a valid booking ID',
    { tag: ['@smoke', '@regression'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Get Booking');
      allure.severity(Severity.NORMAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Arrange ---
      const booking = buildBooking();
      const bookingid = await allure.step('Arrange: create a seed booking to obtain a valid booking ID', () =>
        createSeedBooking(bookingAPI, booking)
      );
      log.debug('Arrange complete', { bookingid });

      // --- Act ---
      const response = await bookingAPI.getBookingById(bookingid);

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      const data = await APIAssertions.assertResponseMatchesSchema(response, BookingSchema);

      await allure.step('Assert all returned fields match the created booking', async () => {
        test.expect(data.firstname).toBe(booking.firstname);
        test.expect(data.lastname).toBe(booking.lastname);
        test.expect(data.totalprice).toBe(booking.totalprice);
        test.expect(data.depositpaid).toBe(booking.depositpaid);
        test.expect(data.bookingdates.checkin).toBe(booking.bookingdates.checkin);
        test.expect(data.bookingdates.checkout).toBe(booking.bookingdates.checkout);
        test.expect(data.additionalneeds).toBe(booking.additionalneeds);
      });
    }
  );

  test(
    'Verify API response contains 404 status and Not Found body when requested with a non-existent booking ID',
    { tag: ['@regression', '@negative'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Get Booking');
      allure.severity(Severity.NORMAL);
      allure.tag('regression');
      allure.tag('negative');

      // --- Act ---
      log.debug('Act: fetching non-existent booking ID 999999999');
      const response = await bookingAPI.getBookingById(999999999);

      // --- Assert ---
      await APIAssertions.assertStatus(response, 404);
      await allure.step('Assert response body contains Not Found', async () => {
        const body = await response.text();
        test.expect(body, 'Response body must contain "Not Found"').toContain('Not Found');
      });
    }
  );

});
