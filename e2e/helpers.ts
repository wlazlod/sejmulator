/**
 * Shared helpers for Playwright specs.
 */

import type { Page } from "@playwright/test";

/**
 * Navigates and waits until every React island on the page has hydrated.
 * Astro keeps the `ssr` attribute on <astro-island> until hydration finishes;
 * interacting earlier can be lost (controlled inputs reset on hydration).
 */
export async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll("astro-island[ssr]").length === 0);
}
