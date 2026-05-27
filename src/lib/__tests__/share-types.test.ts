/**
 * Tests for share-types validation.
 */

import { describe, it, expect } from "vitest";
import { validateShareRequest } from "../share-types";

const validParty = {
  id: "pis",
  displayName: "Prawo i Sprawiedliwość",
  shortName: "PiS",
  percentage: 30,
  distributionId: "parlamentarne-2023:prawo-i-sprawiedliwosc",
};

describe("validateShareRequest", () => {
  it("accepts a valid request", () => {
    expect(validateShareRequest({ parties: [validParty] })).toBe(true);
  });

  it("accepts multiple parties", () => {
    const req = {
      parties: [
        validParty,
        { ...validParty, id: "ko", shortName: "KO", distributionId: "parlamentarne-2023:koalicja-obywatelska" },
      ],
    };
    expect(validateShareRequest(req)).toBe(true);
  });

  it("rejects null/undefined", () => {
    expect(validateShareRequest(null)).toBe(false);
    expect(validateShareRequest(undefined)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(validateShareRequest("string")).toBe(false);
    expect(validateShareRequest(42)).toBe(false);
  });

  it("rejects missing parties array", () => {
    expect(validateShareRequest({})).toBe(false);
    expect(validateShareRequest({ parties: "not-array" })).toBe(false);
  });

  it("rejects empty parties array", () => {
    expect(validateShareRequest({ parties: [] })).toBe(false);
  });

  it("rejects more than 20 parties", () => {
    const parties = Array.from({ length: 21 }, (_, i) => ({ ...validParty, id: `p${i}` }));
    expect(validateShareRequest({ parties })).toBe(false);
  });

  it("rejects party with missing id", () => {
    expect(validateShareRequest({ parties: [{ ...validParty, id: "" }] })).toBe(false);
  });

  it("rejects party with non-string displayName", () => {
    expect(validateShareRequest({ parties: [{ ...validParty, displayName: 123 }] })).toBe(false);
  });

  it("rejects percentage out of range", () => {
    expect(validateShareRequest({ parties: [{ ...validParty, percentage: -1 }] })).toBe(false);
    expect(validateShareRequest({ parties: [{ ...validParty, percentage: 101 }] })).toBe(false);
  });

  it("rejects distributionId without colon", () => {
    expect(validateShareRequest({ parties: [{ ...validParty, distributionId: "nocolon" }] })).toBe(false);
  });

  it("rejects party that is not an object", () => {
    expect(validateShareRequest({ parties: [null] })).toBe(false);
    expect(validateShareRequest({ parties: ["string"] })).toBe(false);
  });
});
