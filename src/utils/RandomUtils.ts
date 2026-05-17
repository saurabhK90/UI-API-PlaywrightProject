import { faker } from '@faker-js/faker';

/**
 * Faker.js wrappers with seed support for reproducible test data.
 * Seed a run: RandomUtils.seed(12345) at the start of a test or globalSetup.
 * Replay the exact same data by passing the same seed from CI logs.
 */
export class RandomUtils {
  static seed(value: number): void {
    faker.seed(value);
  }

  /** UUID-based email — guaranteed unique per call, safe for parallel tests */
  static generateEmail(domain = 'testenv.com'): string {
    return `test-${faker.string.uuid()}@${domain}`;
  }

  static generateFirstName(): string {
    return faker.person.firstName();
  }

  static generateLastName(): string {
    return faker.person.lastName();
  }

  static generateFullName(): string {
    return faker.person.fullName();
  }

  static generatePhoneNumber(): string {
    return faker.phone.number();
  }

  static generatePassword(length = 12): string {
    return faker.internet.password({ length, memorable: false });
  }

  static generateUUID(): string {
    return faker.string.uuid();
  }

  static generateAlphanumeric(length: number): string {
    return faker.string.alphanumeric(length);
  }

  static generateNumeric(length: number): string {
    return faker.string.numeric(length);
  }

  static generateSentence(wordCount = 5): string {
    return faker.lorem.sentence(wordCount);
  }

  static generateParagraph(): string {
    return faker.lorem.paragraph();
  }

  static generateInt(min: number, max: number): number {
    return faker.number.int({ min, max });
  }

  static generateFloat(min: number, max: number, precision = 2): number {
    return parseFloat(faker.number.float({ min, max }).toFixed(precision));
  }

  static pickOne<T>(items: T[]): T {
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    return faker.helpers.arrayElement(items);
  }

  static pickMany<T>(items: T[], count: number): T[] {
    return faker.helpers.arrayElements(items, count);
  }

  static generateStreetAddress(): string {
    return faker.location.streetAddress();
  }

  static generateCity(): string {
    return faker.location.city();
  }

  static generatePostcode(): string {
    return faker.location.zipCode();
  }

  static generateCountry(): string {
    return faker.location.country();
  }

  static generateCreditCardNumber(): string {
    return faker.finance.creditCardNumber();
  }

  static generateCompanyName(): string {
    return faker.company.name();
  }

  /** Returns a date exactly `daysOffset` days from today in YYYY-MM-DD format */
  static generateFutureDate(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  /** Random price integer between 50 and 1000 — suitable for booking totalprice */
  static generatePrice(): number {
    return faker.number.int({ min: 50, max: 1000 });
  }
}
