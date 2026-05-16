/**
 * String manipulation utilities. No Playwright imports.
 */
export class StringUtils {
  static truncate(value: string, maxLength: number, suffix = '…'): string {
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength - suffix.length) + suffix;
  }

  static slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  static toTitleCase(value: string): string {
    return value.replace(/\w\S*/g, word => StringUtils.capitalize(word));
  }

  static toBase64(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  static fromBase64(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  static removeWhitespace(value: string): string {
    return value.replace(/\s+/g, '');
  }

  static normalizeWhitespace(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  static sanitizeForCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  static generateRandomString(length: number, charset = 'abcdefghijklmnopqrstuvwxyz0123456789'): string {
    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
  }

  static extractNumbers(value: string): number[] {
    return (value.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  }

  static stripCurrencySymbols(value: string): string {
    return value.replace(/[^0-9.-]/g, '');
  }

  static containsIgnoreCase(value: string, search: string): boolean {
    return value.toLowerCase().includes(search.toLowerCase());
  }

  static equalsIgnoreCase(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
  }
}
