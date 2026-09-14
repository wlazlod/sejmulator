// test-plan: R-04
/**
 * Anonymous access to the saved-simulations library must be refused.
 * Pages redirect to sign-in, API answers 401 JSON. Runs without secrets.
 */

import { test, expect } from "@playwright/test";

const SAMPLE_INPUT = {
  name: "e2e-anon",
  parties: [
    {
      id: "pis",
      displayName: "Prawo i Sprawiedliwość",
      shortName: "PiS",
      percentage: 30,
      distributionId: "parlamentarne-2023:prawo-i-sprawiedliwosc",
    },
  ],
  otherParties: 0,
  perturbationPct: 1.5,
};

test.describe("R-04: anonim nie ma dostępu do biblioteki", () => {
  test("R-04: /simulations przekierowuje na logowanie", async ({ page }) => {
    await page.goto("/simulations");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("R-04: GET /api/simulations → 401 JSON", async ({ request }) => {
    const res = await request.get("/api/simulations");
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test("R-04: POST /api/simulations → 401", async ({ request }) => {
    const res = await request.post("/api/simulations", { data: SAMPLE_INPUT });
    expect(res.status()).toBe(401);
  });

  test("R-04: DELETE /api/simulations/:id → 401", async ({ request }) => {
    const res = await request.delete("/api/simulations/00000000-0000-0000-0000-000000000000", {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);
  });

  test("R-04: anonim widzi zachętę do logowania zamiast przycisku zapisu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Oblicz mandaty" }).click();
    await expect(page.getByRole("heading", { name: /Wynik: 460 mandatów/ })).toBeVisible();
    await expect(page.getByText("Zaloguj się, aby zapisać symulację")).toBeVisible();
    await expect(page.getByRole("button", { name: "Zapisz symulację" })).toHaveCount(0);
  });
});
