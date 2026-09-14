// test-plan: R-02
/**
 * Tests for poll normalization.
 */

import { describe, it, expect } from "vitest";
import { normalizePolls } from "../normalization";

describe("normalizePolls", () => {
  it("normalizes with undecided voters", () => {
    const result = normalizePolls({
      partyPercentages: [
        { partyId: "pis", percentage: 30 },
        { partyId: "ko", percentage: 30 },
      ],
      undecided: 20,
      otherParties: 0,
    });

    expect(result.effectiveTotal).toBe(80);
    expect(result.realPercentages[0].realPct).toBeCloseTo(37.5);
    expect(result.realPercentages[1].realPct).toBeCloseTo(37.5);
  });

  it("normalizes with other parties", () => {
    const result = normalizePolls({
      partyPercentages: [
        { partyId: "pis", percentage: 30 },
        { partyId: "ko", percentage: 30 },
      ],
      undecided: 20,
      otherParties: 5,
    });

    expect(result.effectiveTotal).toBe(80);
    expect(result.otherPartiesReal).toBeCloseTo(6.25);
    // Parties still normalize the same way
    expect(result.realPercentages[0].realPct).toBeCloseTo(37.5);
  });

  it("preserves sondaz percentages in output", () => {
    const result = normalizePolls({
      partyPercentages: [{ partyId: "pis", percentage: 30 }],
      undecided: 10,
      otherParties: 0,
    });

    expect(result.realPercentages[0].sondazPct).toBe(30);
    expect(result.realPercentages[0].realPct).toBeCloseTo(33.33, 1);
  });

  it("handles zero undecided (no change)", () => {
    const result = normalizePolls({
      partyPercentages: [{ partyId: "pis", percentage: 50 }],
      undecided: 0,
      otherParties: 0,
    });

    expect(result.realPercentages[0].realPct).toBe(50);
    expect(result.effectiveTotal).toBe(100);
  });

  it("handles 100% undecided edge case", () => {
    const result = normalizePolls({
      partyPercentages: [{ partyId: "pis", percentage: 30 }],
      undecided: 100,
      otherParties: 0,
    });

    expect(result.realPercentages[0].realPct).toBe(0);
    expect(result.effectiveTotal).toBe(0);
  });
});
