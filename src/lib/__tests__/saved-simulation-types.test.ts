// test-plan: R-06
/**
 * Tests for saved-simulation validation (S-05).
 */

import { describe, it, expect } from "vitest";
import { validateSavedSimulationInput, validateSavedSimulationPatch } from "../saved-simulation-types";

const validParty = {
  id: "pis",
  displayName: "Prawo i Sprawiedliwość",
  shortName: "PiS",
  percentage: 30,
  distributionId: "parlamentarne-2023:prawo-i-sprawiedliwosc",
};

const validInput = {
  name: "Sondaż wrzesień",
  parties: [validParty],
  otherParties: 2,
  perturbationPct: 1.5,
};

describe("validateSavedSimulationInput", () => {
  it("R-06: accepts a valid input", () => {
    expect(validateSavedSimulationInput(validInput)).toBe(true);
  });

  it("R-06: rejects missing name", () => {
    const { name: _name, ...rest } = validInput;
    expect(validateSavedSimulationInput(rest)).toBe(false);
  });

  it("R-06: rejects blank name", () => {
    expect(validateSavedSimulationInput({ ...validInput, name: "   " })).toBe(false);
  });

  it("R-06: rejects name longer than 80 chars", () => {
    expect(validateSavedSimulationInput({ ...validInput, name: "x".repeat(81) })).toBe(false);
    expect(validateSavedSimulationInput({ ...validInput, name: "x".repeat(80) })).toBe(true);
  });

  it("R-06: rejects perturbationPct = 0 and > 10", () => {
    expect(validateSavedSimulationInput({ ...validInput, perturbationPct: 0 })).toBe(false);
    expect(validateSavedSimulationInput({ ...validInput, perturbationPct: 10.5 })).toBe(false);
  });

  it("R-06: rejects otherParties outside 0–100", () => {
    expect(validateSavedSimulationInput({ ...validInput, otherParties: -1 })).toBe(false);
    expect(validateSavedSimulationInput({ ...validInput, otherParties: 101 })).toBe(false);
  });

  it("R-06: rejects empty parties", () => {
    expect(validateSavedSimulationInput({ ...validInput, parties: [] })).toBe(false);
  });

  it("R-06: rejects malformed party entries", () => {
    expect(validateSavedSimulationInput({ ...validInput, parties: [{ ...validParty, percentage: 120 }] })).toBe(false);
  });

  it("R-06: rejects null and non-objects", () => {
    expect(validateSavedSimulationInput(null)).toBe(false);
    expect(validateSavedSimulationInput("x")).toBe(false);
  });
});

describe("validateSavedSimulationPatch", () => {
  it("R-06: rejects patch without any field", () => {
    expect(validateSavedSimulationPatch({})).toBe(false);
    expect(validateSavedSimulationPatch({ unrelated: 1 })).toBe(false);
  });

  it("R-06: accepts rename-only patch", () => {
    expect(validateSavedSimulationPatch({ name: "Nowa nazwa" })).toBe(true);
  });

  it("R-06: accepts inputs-only patch", () => {
    expect(validateSavedSimulationPatch({ parties: [validParty], otherParties: 0, perturbationPct: 2 })).toBe(true);
  });

  it("R-06: rejects patch with an invalid present field", () => {
    expect(validateSavedSimulationPatch({ name: "" })).toBe(false);
    expect(validateSavedSimulationPatch({ name: "ok", perturbationPct: 0 })).toBe(false);
    expect(validateSavedSimulationPatch({ parties: [] })).toBe(false);
  });
});
