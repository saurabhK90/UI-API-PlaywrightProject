import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { APIAssertions } from '@assertions/generic/APIAssertions';
import { BookingListSchema } from '@api/models/BookingModel';
import type { Booking } from '@api/models/BookingModel';
import { RandomUtils } from '@utils/RandomUtils';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

test.describe('GET /booking', () => {

  test(
    'Verify API response contains 200 status, valid schema and a list of booking IDs when requested without filters',
    { tag: ['@smoke', '@regression'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('List Bookings');
      allure.severity(Severity.NORMAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Act ---
      const response = await bookingAPI.getAllBookings();

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      await APIAssertions.assertResponseMatchesSchema(response, BookingListSchema);
    }
  );

  test(
    'Verify API response contains 200 status and at least one result when requested with a firstname filter matching a created booking',
    { tag: ['@regression'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('List Bookings');
      allure.severity(Severity.NORMAL);
      allure.tag('regression');

      // --- Arrange ---
      const uniqueFirstname = `Filter${RandomUtils.generateAlphanumeric(8)}`;
      const checkinOffset = RandomUtils.generateInt(10, 60);
      const seedBooking: Booking = {
        firstname: uniqueFirstname,
        lastname: RandomUtils.generateLastName(),
        totalprice: RandomUtils.generatePrice(),
        depositpaid: true,
        bookingdates: {
          checkin: RandomUtils.generateFutureDate(checkinOffset),
          checkout: RandomUtils.generateFutureDate(checkinOffset + RandomUtils.generateInt(1, 7)),
        },
      };

      await allure.step('Arrange: create a seed booking with a unique firstname for filtering', async () => {
        await bookingAPI.createBooking(seedBooking);
      });
      log.debug('Arrange complete', { uniqueFirstname });

      // --- Act ---
      const response = await bookingAPI.getAllBookings({ firstname: uniqueFirstname });

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      await allure.step('Assert filter returns at least one matching booking', async () => {
        const list = await response.json() as Array<{ bookingid: number }>;
        log.debug('Filter response', { resultCount: list.length, firstname: uniqueFirstname });
        test.expect(list.length, 'Filter must return at least one matching booking').toBeGreaterThan(0);
      });
    }
  );

  test(
    'Verify API response contains 200 status and an empty array when requested with a firstname filter that matches no bookings',
    { tag: ['@regression', '@negative'] },
    async ({ bookingAPI }) => {
      allure.feature('Booking API');
      allure.story('List Bookings');
      allure.severity(Severity.MINOR);
      allure.tag('regression');
      allure.tag('negative');

      // --- Act ---
      const response = await bookingAPI.getAllBookings({ firstname: `NonExistent${RandomUtils.generateAlphanumeric(10)}` });

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      await allure.step('Assert filter returns an empty array', async () => {
        const list = await response.json() as unknown[];
        test.expect(Array.isArray(list)).toBe(true);
        test.expect(list.length, 'Non-matching filter must return an empty array').toBe(0);
      });
    }
  );

});
