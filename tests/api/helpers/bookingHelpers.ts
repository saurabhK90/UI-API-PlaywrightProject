import { APIAssertions } from '@assertions/generic/APIAssertions';
import { BookerAuthAPI } from '@api/endpoints/BookerAuthAPI';
import { BookingAPI } from '@api/endpoints/BookingAPI';
import { AuthTokenSchema } from '@api/models/BookingModel';
import type { Booking } from '@api/models/BookingModel';
import { RandomUtils } from '@utils/RandomUtils';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

/**
 * Builds a fully-populated random booking payload.
 * All fields including additionalneeds are populated so the object can be
 * used directly in create / update calls and compared field-by-field in assertions.
 */
export function buildBooking(): Booking {
  const checkinOffset = RandomUtils.generateInt(10, 60);
  const booking: Booking = {
    firstname: RandomUtils.generateFirstName(),
    lastname: RandomUtils.generateLastName(),
    totalprice: RandomUtils.generatePrice(),
    depositpaid: Math.random() < 0.5,
    bookingdates: {
      checkin: RandomUtils.generateFutureDate(checkinOffset),
      checkout: RandomUtils.generateFutureDate(checkinOffset + RandomUtils.generateInt(1, 7)),
    },
    additionalneeds: RandomUtils.generateSentence(3),
  };
  log.debug('Built random booking payload', {
    firstname: booking.firstname,
    lastname: booking.lastname,
    totalprice: booking.totalprice,
    checkin: booking.bookingdates.checkin,
    checkout: booking.bookingdates.checkout,
  });
  return booking;
}

/**
 * Creates a booking via the API and returns its numeric ID.
 * Pass a pre-built booking when the test needs to reference the same data in assertions.
 * Omit it to get a fresh random booking built internally.
 */
export async function createSeedBooking(bookingAPI: BookingAPI, booking = buildBooking()): Promise<number> {
  log.info('Creating seed booking for test arrange', {
    firstname: booking.firstname,
    lastname: booking.lastname,
  });
  const response = await bookingAPI.createBooking(booking);
  const { bookingid } = (await response.json()) as { bookingid: number };
  log.debug('Seed booking created', { bookingid });
  return bookingid;
}

/**
 * Authenticates with the Booker API using env credentials and returns the session token.
 * The token is validated against AuthTokenSchema before being returned, so a broken
 * auth endpoint fails fast here rather than with a cryptic error later in the test.
 */
export async function acquireToken(bookerAuthAPI: BookerAuthAPI): Promise<string> {
  log.info('Acquiring auth token for test arrange');
  const response = await bookerAuthAPI.authenticate(
    process.env.BOOKER_USERNAME!,
    process.env.BOOKER_PASSWORD!
  );
  const { token } = await APIAssertions.assertResponseMatchesSchema(response, AuthTokenSchema);
  log.debug('Auth token acquired successfully');
  return token;
}
