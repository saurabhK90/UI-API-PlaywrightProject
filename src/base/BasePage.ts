import { Page, Locator, FrameLocator, Download } from '@playwright/test';
import { allure } from 'allure-playwright';
import { Logger } from '@utils/Logger';

const log = Logger.getInstance();

/**
 * Abstract base for all Page Objects. Every action method wraps the Playwright primitive
 * with auto-wait logging and Allure step annotation. Page Objects never call
 * page.click() / page.locator() directly — they call this.click() / this.type() etc.
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async navigate(url: string): Promise<void> {
    await allure.step(`Navigate to ${url}`, async () => {
      log.debug(`Navigating to ${url}`);
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    });
  }

  async reload(): Promise<void> {
    await allure.step('Reload page', async () => {
      log.debug(`Reloading page: ${this.page.url()}`);
      await this.page.reload({ waitUntil: 'domcontentloaded' });
    });
  }

  async goBack(): Promise<void> {
    await allure.step('Navigate back', async () => {
      log.debug(`Navigating back from: ${this.page.url()}`);
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
    });
  }

  // ─── Interaction ───────────────────────────────────────────────────────────

  async click(locator: Locator): Promise<void> {
    await allure.step(`Click on "${await this.describeLocator(locator)}"`, async () => {
      log.debug(`Clicking: ${locator}`);
      await locator.click();
    });
  }

  async doubleClick(locator: Locator): Promise<void> {
    await allure.step(`Double-click on "${await this.describeLocator(locator)}"`, async () => {
      log.debug(`Double-clicking: ${locator}`);
      await locator.dblclick();
    });
  }

  async rightClick(locator: Locator): Promise<void> {
    await allure.step(`Right-click on "${await this.describeLocator(locator)}"`, async () => {
      log.debug(`Right-clicking: ${locator}`);
      await locator.click({ button: 'right' });
    });
  }

  async type(locator: Locator, value: string): Promise<void> {
    await allure.step(
      `Type "${value}" into "${await this.describeLocator(locator)}"`,
      async () => {
        log.debug(`Typing "${value}" into ${locator}`);
        await locator.clear();
        await locator.fill(value);
      }
    );
  }

  async clearAndType(locator: Locator, value: string): Promise<void> {
    await allure.step(
      `Clear and type "${value}" into "${await this.describeLocator(locator)}"`,
      async () => {
        log.debug(`Clearing and typing "${value}" into ${locator}`);
        await locator.click({ clickCount: 3 });
        await locator.fill(value);
      }
    );
  }

  async selectOption(locator: Locator, value: string): Promise<void> {
    await allure.step(
      `Select option "${value}" in "${await this.describeLocator(locator)}"`,
      async () => {
        log.debug(`Selecting option "${value}" in ${locator}`);
        await locator.selectOption(value);
      }
    );
  }

  async check(locator: Locator): Promise<void> {
    await allure.step(`Check "${await this.describeLocator(locator)}"`, async () => {
      log.debug(`Checking: ${locator}`);
      await locator.check();
    });
  }

  async uncheck(locator: Locator): Promise<void> {
    await allure.step(`Uncheck "${await this.describeLocator(locator)}"`, async () => {
      log.debug(`Unchecking: ${locator}`);
      await locator.uncheck();
    });
  }

  async hover(locator: Locator): Promise<void> {
    await allure.step(`Hover over "${await this.describeLocator(locator)}"`, async () => {
      log.debug(`Hovering over: ${locator}`);
      await locator.hover();
    });
  }

  async dragAndDrop(source: Locator, target: Locator): Promise<void> {
    await allure.step('Drag and drop', async () => {
      log.debug(`Dragging ${source} → ${target}`);
      await source.dragTo(target);
    });
  }

  async uploadFile(locator: Locator, filePath: string): Promise<void> {
    await allure.step(`Upload file "${filePath}"`, async () => {
      log.debug(`Uploading file "${filePath}" via ${locator}`);
      await locator.setInputFiles(filePath);
    });
  }

  async pressKey(locator: Locator, key: string): Promise<void> {
    await allure.step(`Press key "${key}" on "${await this.describeLocator(locator)}"`, async () => {
      log.debug(`Pressing key "${key}" on ${locator}`);
      await locator.press(key);
    });
  }

  async pressGlobalKey(key: string): Promise<void> {
    await allure.step(`Press global key "${key}"`, async () => {
      log.debug(`Pressing global key "${key}"`);
      await this.page.keyboard.press(key);
    });
  }

  async scrollIntoView(locator: Locator): Promise<void> {
    log.debug(`Scrolling into view: ${locator}`);
    await locator.scrollIntoViewIfNeeded();
  }

  // ─── Query ─────────────────────────────────────────────────────────────────

  async getText(locator: Locator): Promise<string> {
    const text = (await locator.textContent())?.trim() ?? '';
    log.debug(`getText → "${text}" from ${locator}`);
    return text;
  }

  async getInputValue(locator: Locator): Promise<string> {
    const value = await locator.inputValue();
    log.debug(`getInputValue → "${value}" from ${locator}`);
    return value;
  }

  async getAttribute(locator: Locator, attribute: string): Promise<string | null> {
    const value = await locator.getAttribute(attribute);
    log.debug(`getAttribute "${attribute}" → "${value ?? 'null'}" from ${locator}`);
    return value;
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return locator.isEnabled();
  }

  async isChecked(locator: Locator): Promise<boolean> {
    return locator.isChecked();
  }

  async getCount(locator: Locator): Promise<number> {
    const count = await locator.count();
    log.debug(`getCount → ${count} for ${locator}`);
    return count;
  }

  async getAllTexts(locator: Locator): Promise<string[]> {
    const texts = await locator.allTextContents();
    log.debug(`getAllTexts → [${texts.map(t => `"${t.trim()}"`).join(', ')}] from ${locator}`);
    return texts;
  }

  // ─── Wait ──────────────────────────────────────────────────────────────────

  async waitForLocator(
    locator: Locator,
    options: { state?: 'visible' | 'hidden' | 'attached' | 'detached'; timeout?: number } = {}
  ): Promise<void> {
    const state = options.state ?? 'visible';
    log.debug(`Waiting for locator to be ${state}`);
    await locator.waitFor({ state, timeout: options.timeout });
  }

  async waitForURL(pattern: string | RegExp): Promise<void> {
    await allure.step(`Wait for URL: ${pattern.toString()}`, async () => {
      log.debug(`Waiting for URL matching: ${pattern.toString()}`);
      await this.page.waitForURL(pattern);
    });
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded'): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  async waitForResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(urlPattern);
  }

  async waitForRequest(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForRequest(urlPattern);
  }

  /**
   * Waits until the element is visible AND its bounding box has not changed for 200ms.
   * Handles animated modals and loading spinners.
   */
  async waitForElementStable(locator: Locator, timeout = 10_000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });

    const deadline = Date.now() + timeout;
    let previousBox = await locator.boundingBox();

    while (Date.now() < deadline) {
      await this.page.waitForTimeout(200);
      const currentBox = await locator.boundingBox();

      if (
        previousBox &&
        currentBox &&
        previousBox.x === currentBox.x &&
        previousBox.y === currentBox.y &&
        previousBox.width === currentBox.width &&
        previousBox.height === currentBox.height
      ) {
        return;
      }
      previousBox = currentBox;
    }
  }

  // ─── Frame ─────────────────────────────────────────────────────────────────

  switchToFrame(frameLocator: FrameLocator): FrameLocator {
    return frameLocator;
  }

  // ─── Window / Tab ──────────────────────────────────────────────────────────

  async switchToNewWindow(action: () => Promise<void>): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      action(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  async closeCurrentWindow(): Promise<void> {
    await this.page.close();
  }

  getAllPages(): Page[] {
    return this.page.context().pages();
  }

  async bringToFront(): Promise<void> {
    await this.page.bringToFront();
  }

  // ─── Alert ─────────────────────────────────────────────────────────────────

  acceptAlert(): void {
    this.page.once('dialog', dialog => { void dialog.accept(); });
  }

  dismissAlert(): void {
    this.page.once('dialog', dialog => { void dialog.dismiss(); });
  }

  async getAlertText(): Promise<string> {
    return new Promise(resolve => {
      this.page.once('dialog', async dialog => {
        resolve(dialog.message());
        await dialog.dismiss();
      });
    });
  }

  // ─── Download ──────────────────────────────────────────────────────────────

  async waitForDownload(action: () => Promise<void>): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      action(),
    ]);
    return download;
  }

  // ─── Screenshot / Attachment ───────────────────────────────────────────────

  async takeScreenshot(name: string): Promise<void> {
    const buffer = await this.page.screenshot({ fullPage: false });
    await allure.attachment(name, buffer, { contentType: 'image/png' });
  }

  async takeElementScreenshot(locator: Locator, name: string): Promise<void> {
    const buffer = await locator.screenshot();
    await allure.attachment(name, buffer, { contentType: 'image/png' });
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async describeLocator(locator: Locator): Promise<string> {
    try {
      const text = await locator.textContent({ timeout: 500 });
      return text?.trim().slice(0, 40) ?? locator.toString();
    } catch {
      return locator.toString();
    }
  }
}
