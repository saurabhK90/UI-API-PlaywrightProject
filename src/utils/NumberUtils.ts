/**
 * Number and currency utilities. No Playwright imports.
 */
export class NumberUtils {
  static formatCurrency(amount: number, currency = 'GBP', locale = 'en-GB'): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  }

  static parseCurrency(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]/g, ''));
  }

  static round(value: number, decimalPlaces: number): number {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }

  static isWithinRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  static percentage(part: number, total: number): number {
    if (total === 0) return 0;
    return NumberUtils.round((part / total) * 100, 2);
  }

  static sum(values: number[]): number {
    return values.reduce((acc, v) => acc + v, 0);
  }

  static average(values: number[]): number {
    if (values.length === 0) return 0;
    return NumberUtils.sum(values) / values.length;
  }

  static toOrdinal(n: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]);
  }
}
