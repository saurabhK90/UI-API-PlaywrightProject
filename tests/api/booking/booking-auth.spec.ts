import { test } from '@fixtures/index';
import { allure } from 'allure-playwright';
import { Severity } from 'allure-js-commons';
import { APIAssertions } from '@assertions/generic/APIAssertions';
import { AuthTokenSchema, AuthErrorSchema } from '@api/models/BookingModel';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

test.describe('POST /auth', () => {

  test(
    'Verify API response contains a valid non-empty token when requested with correct credentials',
    { tag: ['@smoke', '@regression'] },
    async ({ bookerAuthAPI }) => {
      allure.feature('Booking API Authentication');
      allure.story('Generate Token');
      allure.severity(Severity.CRITICAL);
      allure.tag('smoke');
      allure.tag('regression');

      // --- Act ---
      const response = await bookerAuthAPI.authenticate(
        process.env.BOOKER_USERNAME!,
        process.env.BOOKER_PASSWORD!
      );

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      const data = await APIAssertions.assertResponseMatchesSchema(response, AuthTokenSchema);
      log.debug('Auth response: token present', { tokenLength: data.token.length });
      test.expect(data.token, 'Token must be a non-empty string').toBeTruthy();
    }
  );

  test(
    'Verify API response contains Bad credentials reason when requested with wrong username and password',
    { tag: ['@regression', '@negative'] },
    async ({ bookerAuthAPI }) => {
      allure.feature('Booking API Authentication');
      allure.story('Generate Token');
      allure.severity(Severity.NORMAL);
      allure.tag('regression');
      allure.tag('negative');

      // --- Act ---
      log.debug('Act: authenticating with wrong credentials');
      const response = await bookerAuthAPI.authenticate('wrong_user', 'wrong_pass');

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      const data = await APIAssertions.assertResponseMatchesSchema(response, AuthErrorSchema);
      log.debug('Auth response: error reason received', { reason: data.reason });
      test.expect(data.reason, 'Reason must equal "Bad credentials"').toBe('Bad credentials');
    }
  );

  test(
    'Verify API response contains error reason when requested with empty username and password',
    { tag: ['@regression', '@negative'] },
    async ({ bookerAuthAPI }) => {
      allure.feature('Booking API Authentication');
      allure.story('Generate Token');
      allure.severity(Severity.MINOR);
      allure.tag('regression');
      allure.tag('negative');

      // --- Act ---
      log.debug('Act: authenticating with empty credentials');
      const response = await bookerAuthAPI.authenticate('', '');

      // --- Assert ---
      await APIAssertions.assertStatus(response, 200);
      await APIAssertions.assertContentType(response, 'application/json');
      const data = await APIAssertions.assertResponseMatchesSchema(response, AuthErrorSchema);
      log.debug('Auth response: error reason received', { reason: data.reason });
      test.expect(data.reason, 'Empty credentials must return a non-empty error reason').toBeTruthy();
    }
  );

});
