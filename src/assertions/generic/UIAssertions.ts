import { Page, Locator, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { AssertionMessages } from '../AssertionMessages';

/**
 * Generic UI assertions reusable across any test domain.
 * All assertions are wrapped with Allure steps for a human-readable execution log.
 */
export class UIAssertions {
  static async assertPageTitle(page: Page, expected: string): Promise<void> {
    await allure.step(`Assert page title is "${expected}"`, async () => {
      const actual = await page.title();
      expect(actual, AssertionMessages.pageTitle(expected, actual)).toBe(expected);
    });
  }

  static async assertURL(page: Page, pattern: string | RegExp): Promise<void> {
    await allure.step(`Assert URL matches "${pattern.toString()}"`, async () => {
      await expect(page).toHaveURL(pattern);
    });
  }

  static async assertURLContains(page: Page, substring: string): Promise<void> {
    await allure.step(`Assert URL contains "${substring}"`, async () => {
      const currentURL = page.url();
      expect(
        currentURL,
        AssertionMessages.urlPattern(substring, currentURL)
      ).toContain(substring);
    });
  }

  static async assertElementVisible(locator: Locator, description = ''): Promise<void> {
    await allure.step(
      `Assert element is visible${description ? `: "${description}"` : ''}`,
      async () => {
        await expect(
          locator,
          AssertionMessages.elementVisible(description || locator.toString())
        ).toBeVisible();
      }
    );
  }

  static async assertElementHidden(locator: Locator, description = ''): Promise<void> {
    await allure.step(
      `Assert element is hidden${description ? `: "${description}"` : ''}`,
      async () => {
        await expect(
          locator,
          AssertionMessages.elementHidden(description || locator.toString())
        ).toBeHidden();
      }
    );
  }

  static async assertElementText(locator: Locator, expected: string): Promise<void> {
    await allure.step(`Assert element text is "${expected}"`, async () => {
      await expect(locator).toHaveText(expected);
    });
  }

  static async assertElementContainsText(locator: Locator, expected: string): Promise<void> {
    await allure.step(`Assert element contains text "${expected}"`, async () => {
      await expect(locator).toContainText(expected);
    });
  }

  static async assertElementCount(locator: Locator, expected: number): Promise<void> {
    await allure.step(`Assert element count is ${expected}`, async () => {
      const actual = await locator.count();
      expect(actual, AssertionMessages.elementCount(expected, actual)).toBe(expected);
    });
  }

  static async assertElementEnabled(locator: Locator): Promise<void> {
    await allure.step('Assert element is enabled', async () => {
      await expect(locator).toBeEnabled();
    });
  }

  static async assertElementDisabled(locator: Locator): Promise<void> {
    await allure.step('Assert element is disabled', async () => {
      await expect(locator).toBeDisabled();
    });
  }

  static async assertElementChecked(locator: Locator): Promise<void> {
    await allure.step('Assert element is checked', async () => {
      await expect(locator).toBeChecked();
    });
  }

  static async assertInputValue(locator: Locator, expected: string): Promise<void> {
    await allure.step(`Assert input value is "${expected}"`, async () => {
      await expect(locator).toHaveValue(expected);
    });
  }

  static async assertToastMessage(page: Page, expected: string): Promise<void> {
    await allure.step(`Assert toast message is "${expected}"`, async () => {
      const toast = page.getByRole('alert').or(page.getByTestId('toast-message'));
      await expect(toast).toContainText(expected);
    });
  }

  static async assertTableRow(
    tableLocator: Locator,
    rowIndex: number,
    expectedValues: string[]
  ): Promise<void> {
    await allure.step(`Assert table row ${rowIndex} contains expected values`, async () => {
      const row = tableLocator.locator('tr').nth(rowIndex);
      for (const value of expectedValues) {
        await expect(row).toContainText(value);
      }
    });
  }

  static async assertElementAttribute(
    locator: Locator,
    attribute: string,
    expected: string
  ): Promise<void> {
    await allure.step(`Assert element has attribute "${attribute}"="${expected}"`, async () => {
      await expect(locator).toHaveAttribute(attribute, expected);
    });
  }
}
