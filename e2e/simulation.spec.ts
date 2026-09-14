// test-plan: R-05
/**
 * US-01 end to end: poll input → seats → hemicycle → coalitions → districts.
 * Runs without Supabase (anonymous, no persistence).
 */

import { test, expect } from "@playwright/test";

test.describe("US-01: symulacja sondażu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Sejmulator" })).toBeVisible();
  });

  test("R-05: sondaż → 460 mandatów, hemicycle, koalicje, okręgi", async ({ page }) => {
    await page.getByLabel("Wynik KO", { exact: true }).fill("35");
    await page.getByRole("button", { name: "Oblicz mandaty" }).click();

    await expect(page.getByRole("heading", { name: /Wynik: 460 mandatów/ })).toBeVisible();
    await expect(page.getByRole("img", { name: "Wizualizacja Sejmu" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Możliwe koalicje" })).toBeVisible();

    // District drill-down is collapsed by default (FR-006: avoid information overload)
    await page.getByRole("button", { name: /Pokaż okręgi/ }).click();
    await expect(page.getByRole("heading", { name: "Okręgi wyborcze" })).toBeVisible();

    const koSeats = Number(await page.getByTestId("seats-ko").getAttribute("data-seats"));
    expect(koSeats).toBeGreaterThan(0);
  });

  test("R-05: usunięcie i ponowne dodanie partii nadal daje 460 mandatów", async ({ page }) => {
    await page.getByRole("button", { name: "Usuń Lewica" }).click();
    await expect(page.getByLabel("Wynik Lewica", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "+ Lewica" }).click();
    await expect(page.getByLabel("Wynik Lewica", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Oblicz mandaty" }).click();
    await expect(page.getByRole("heading", { name: /Wynik: 460 mandatów/ })).toBeVisible();
  });

  test("R-05: suma > 100% jest sygnalizowana na czerwono", async ({ page }) => {
    await page.getByLabel("Wynik PiS", { exact: true }).fill("60");
    await page.getByLabel("Wynik KO", { exact: true }).fill("50");
    await expect(page.getByText(/Suma:/)).toHaveClass(/text-red-600/);
  });
});
