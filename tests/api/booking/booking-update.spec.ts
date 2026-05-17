import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { APIAssertions } from '@assertions/generic/APIAssertions';
import { BookingSchema } from '@api/models/BookingModel';
import { RandomUtils } from '@utils/RandomUtils';
import { Logger } from '@utils/Logger';
import { buildBooking, createSeedBooking, acquireToken } from '../helpers/bookingHelpers';

const log = Logger.getInstance();

test.describe('PUT /booking/:id', () => {

  test(
    'Verify API response contains 200 status, valid schema and all updated fields in response when requested with a valid cookie token',
    { tag: ['@smoke', '@regression'] },
    async ({ bookerAuthAPI, bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Update Booking');
      allure.severity(Severity.CRITICAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Arrange ---
      const original = buildBooking();
      const { token, bookingid } = await allure.step('Arrange: obtain auth token and create seed booking', async () => ({
        token: await acquireToken(bookerAuthAPI),
        bookingid: await createSeedBooking(bookingAPI, original),
      }));
      log.debug('Arrange complete', { bookingid });

      const updated = {
        ...original,
        firstname: RandomUtils.generateFirstName(),
        lastname: RandomUtils.generateLastName(),
        totalprice: RandomUtils.generatePrice(),
        depositpaid: !original.depositpaid,
        additionalneeds: RandomUtils.generateSentence(3),
      };

      // --- Act ---
      const response = await bookingAPI.updateBooking(bookingid, updated, token);

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      const data = await APIAssertions.assertResponseMatchesSchema(response, BookingSchema);

      await allure.step('Assert all updated fields are reflected in the response', async () => {
        test.expect(data.firstname).toBe(updated.firstname);
        test.expect(data.lastname).toBe(updated.lastname);
        test.expect(data.totalprice).toBe(updated.totalprice);
        test.expect(data.depositpaid).toBe(updated.depositpaid);
        test.expect(data.bookingdates.checkin).toBe(updated.bookingdates.checkin);
        test.expect(data.bookingdates.checkout).toBe(updated.bookingdates.checkout);
        test.expect(data.additionalneeds).toBe(updated.additionalneeds);
      });
    }
  );

  test(
    'Verify API response contains 200 status and all updated fields when requested using Basic Auth instead of cookie token',
    { tag: ['@regression'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Update Booking');
      allure.severity(Severity.CRITICAL);
      allure.tag('regression');

      // --- Arrange ---
      const original = buildBooking();
      const bookingid = await allure.step('Arrange: create seed booking', () =>
        createSeedBooking(bookingAPI, original)
      );
      log.debug('Arrange complete', { bookingid });

      const updated = {
        ...original,
        firstname: RandomUtils.generateFirstName(),
        totalprice: RandomUtils.generatePrice(),
      };

      // --- Act ---
      const response = await bookingAPI.updateBookingWithBasicAuth(
        bookingid,
        updated,
        process.env.BOOKER_USERNAME!,
        process.env.BOOKER_PASSWORD!
      );

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      const data = await APIAssertions.assertResponseMatchesSchema(response, BookingSchema);

      await allure.step('Assert all updated fields are reflected in the response', async () => {
        test.expect(data.firstname).toBe(updated.firstname);
        test.expect(data.lastname).toBe(updated.lastname);
        test.expect(data.totalprice).toBe(updated.totalprice);
        test.expect(data.depositpaid).toBe(updated.depositpaid);
        test.expect(data.bookingdates.checkin).toBe(updated.bookingdates.checkin);
        test.expect(data.bookingdates.checkout).toBe(updated.bookingdates.checkout);
        test.expect(data.additionalneeds).toBe(updated.additionalneeds);
      });
    }
  );

  test(
    'Verify API response contains 403 status when requested without any auth credentials',
    { tag: ['@regression', '@negative'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('Update Booking');
      allure.severity(Severity.CRITICAL);
      allure.tag('regression');
      allure.tag('negative');

      // --- Arrange ---
      const booking = buildBooking();
      const bookingid = await allure.step('Arrange: create seed booking to obtain a valid ID', () =>
        createSeedBooking(bookingAPI, booking)
      );
      log.debug('Arrange complete', { bookingid });

      // --- Act ---
      const response = await bookingAPI.updateBookingWithoutAuth(bookingid, booking);

      // --- Assert ---
      await APIAssertions.assertStatus(response, 403);
    }
  );

});
