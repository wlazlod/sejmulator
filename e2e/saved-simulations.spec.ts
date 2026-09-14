// test-plan: R-04
/**
 * US-02 end to end for the owner: sign in → save → list → rename → delete.
 * Requires a confirmed test account (E2E_EMAIL / E2E_PASSWORD) and Supabase.
 */

import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.skip(!EMAIL || !PASSWORD, "wymaga konta testowego i Supabase");

async function signIn(page: Page): Promise<void> {
  await page.goto("/auth/signin");
  await page.getByLabel("E-mail").fill(EMAIL ?? "");
  await page.getByLabel("Hasło", { exact: true }).fill(PASSWORD ?? "");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Moje symulacje" })).toBeVisible();
}

test.describe("US-02: biblioteka zapisanych symulacji", () => {
  test.afterEach(async ({ page }) => {
    // Cleanup: remove any e2e-* records left behind if the test failed mid-way.
    const res = await page.request.get("/api/simulations");
    if (!res.ok()) return;
    const items = (await res.json()) as { id: string; name: string }[];
    for (const item of items.filter((it) => it.name.startsWith("e2e-"))) {
      await page.request.delete(`/api/simulations/${item.id}`, { headers: { "Content-Type": "application/json" } });
    }
  });

  test("R-04: właściciel zapisuje, widzi, zmienia nazwę i usuwa własną symulację", async ({ page }) => {
    const name = `e2e-${Date.now()}`;
    await signIn(page);

    // save
    await page.getByRole("button", { name: "Oblicz mandaty" }).click();
    await expect(page.getByRole("heading", { name: /Wynik: 460 mandatów/ })).toBeVisible();
    await page.getByRole("button", { name: "Zapisz symulację" }).click();
    await page.getByLabel("Nazwa symulacji").fill(name);
    await page.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(page.getByText("Zapisano.")).toBeVisible();

    // list
    await page.goto("/simulations");
    const row = page.getByTestId("saved-simulation-row").filter({ hasText: name });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("link", { name })).toBeVisible();

    // rename
    await row.getByRole("button", { name: "Zmień nazwę" }).click();
    // While editing, the row shows the input instead of the name text — locate the form on the page
    await page.getByLabel("Nowa nazwa").fill(`${name}-v2`);
    await page.getByRole("button", { name: "Zapisz", exact: true }).click();
    const renamed = page.getByTestId("saved-simulation-row").filter({ hasText: `${name}-v2` });
    await expect(renamed.getByRole("link", { name: `${name}-v2` })).toBeVisible();

    // open (edit mode auto-simulates)
    await renamed.getByRole("link", { name: "Otwórz" }).click();
    await expect(page).toHaveURL(/\/simulations\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: /Wynik: 460 mandatów/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zapisz zmiany" })).toBeVisible();

    // delete
    await page.goto("/simulations");
    page.once("dialog", (dialog) => void dialog.accept());
    await renamed.getByRole("button", { name: "Usuń" }).click();
    await expect(page.getByTestId("saved-simulation-row").filter({ hasText: `${name}-v2` })).toHaveCount(0);
  });

  test("R-04: cudzy / nieistniejący rekord daje 404, nie dane", async ({ page }) => {
    await signIn(page);
    const res = await page.request.get("/api/simulations/00000000-0000-0000-0000-000000000000");
    expect(res.status()).toBe(404);
    const pageRes = await page.goto("/simulations/00000000-0000-0000-0000-000000000000");
    expect(pageRes?.status()).toBe(404);
  });
});
