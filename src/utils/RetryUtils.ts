/**
 * Generic retry utility. No Playwright imports — can be used in any layer.
 */
export class RetryUtils {
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    delayMs: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxAttempts) {
          await RetryUtils.sleep(delayMs);
        }
      }
    }

    throw new Error(
      `Failed after ${maxAttempts} attempts. Last error: ${lastError?.message ?? 'unknown'}`
    );
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
