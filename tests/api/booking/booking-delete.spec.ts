import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { APIAssertions } from '@assertions/generic/APIAssertions';
import { acquireToken, createSeedBooking } from '../helpers/bookingHelpers';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

test.describe('DELETE /booking/:id', () => {

  test(
    'Verify API response contains 201 status when requested with a valid cookie token and an existing booking ID',
    { tag: ['@smoke', '@regression'] },
    async ({ bookerAuthAPI, bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Delete Booking');
      allure.severity(Severity.CRITICAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Arrange ---
      const { token, bookingid } = await allure.step('Arrange: obtain auth token and create seed booking', async () => ({
        token: await acquireToken(bookerAuthAPI),
        bookingid: await createSeedBooking(bookingAPI),
      }));
      log.debug('Arrange complete', { bookingid });

      // --- Act ---
      const response = await bookingAPI.deleteBooking(bookingid, token);

      // --- Assert ---
      // Restful-Booker returns 201 on successful delete — a known API quirk, not an error
      await APIAssertions.assertStatus(response, 201);
    }
  );

  test(
    'Verify API response contains 404 status on GET when requested for a previously deleted booking',
    { tag: ['@regression'] },
    async ({ bookerAuthAPI, bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Delete Booking');
      allure.severity(Severity.CRITICAL);
      allure.tag('regression');

      // --- Arrange ---
      const { token, bookingid } = await allure.step('Arrange: obtain auth token and create seed booking', async () => ({
        token: await acquireToken(bookerAuthAPI),
        bookingid: await createSeedBooking(bookingAPI),
      }));
      log.debug('Arrange complete', { bookingid });

      // --- Act ---
      await bookingAPI.deleteBooking(bookingid, token);
      const getResponse = await bookingAPI.getBookingById(bookingid);

      // --- Assert ---
      await APIAssertions.assertStatus(getResponse, 404);
    }
  );

  test(
    'Verify API response contains 403 status when requested without any auth credentials',
    { tag: ['@regression', '@negative'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Delete Booking');
      allure.severity(Severity.CRITICAL);
      allure.tag('regression');
      allure.tag('negative');

      // --- Arrange ---
      const bookingid = await allure.step('Arrange: create seed booking to obtain a valid ID', () =>
        createSeedBooking(bookingAPI)
      );
      log.debug('Arrange complete', { bookingid });

      // --- Act ---
      const response = await bookingAPI.deleteBookingWithoutAuth(bookingid);

      // --- Assert ---
      await APIAssertions.assertStatus(response, 403);
    }
  );

});
