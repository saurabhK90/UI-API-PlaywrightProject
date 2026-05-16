/**
 * Pure date manipulation utilities. No external dependencies, no Playwright imports.
 */
export class DateUtils {
  static today(): Date {
    return new Date();
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static subtractDays(date: Date, days: number): Date {
    return DateUtils.addDays(date, -days);
  }

  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /** Format for HTML date inputs: YYYY-MM-DD */
  static toInputFormat(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /** Format for display: DD/MM/YYYY */
  static toDisplayFormat(date: Date): string {
    return date.toLocaleDateString('en-GB');
  }

  /** Format: DD Month YYYY (e.g., 15 May 2026) */
  static toLongFormat(date: Date): string {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  static toISO(date: Date): string {
    return date.toISOString();
  }

  static fromISO(isoString: string): Date {
    return new Date(isoString);
  }

  static isBefore(date: Date, reference: Date): boolean {
    return date < reference;
  }

  static isAfter(date: Date, reference: Date): boolean {
    return date > reference;
  }

  static differenceInDays(a: Date, b: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((b.getTime() - a.getTime()) / msPerDay);
  }

  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  static nextBusinessDay(from = new Date()): Date {
    let candidate = DateUtils.addDays(from, 1);
    while (DateUtils.isWeekend(candidate)) {
      candidate = DateUtils.addDays(candidate, 1);
    }
    return candidate;
  }
}
