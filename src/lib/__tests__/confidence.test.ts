// test-plan: R-02
/**
 * Tests for confidence intervals (perturbation heuristic) and threshold behaviour (FR-013).
 */

import { describe, it, expect } from "vitest";
import { simulateWithConfidence } from "../confidence";
import type { PartyPollInput } from "../types";
import type { ElectionData } from "../../data/types";
import parlamentarne2023 from "../../data/parlamentarne-2023.json";

const datasets = { "parlamentarne-2023": parlamentarne2023 as unknown as ElectionData };

function party(partyId: string, percentage: number, distributionPartyId: string): PartyPollInput {
  return { partyId, partyName: partyId, percentage, distributionElectionId: "parlamentarne-2023", distributionPartyId };
}

const basePoll: PartyPollInput[] = [
  party("pis", 33, "prawo-i-sprawiedliwosc"),
  party("ko", 31, "koalicja-obywatelska-po-n-ipl-zieloni"),
  party("td", 12, "trzecia-droga-polska-2050-szymona-holowni-polskie-stronnictwo-ludowe"),
  party("lewica", 9, "nowa-lewica"),
  party("konf", 8, "konfederacja-wolnosc-i-niepodleglosc"),
];

describe("simulateWithConfidence", () => {
  it("R-02: base result always sums to 460 and min <= base <= max for every party", () => {
    const { result, confidence } = simulateWithConfidence(basePoll, datasets, 5, 1.5);
    expect(result.totalSeats).toBe(460);
    for (const [partyId, ci] of Object.entries(confidence)) {
      expect(ci.min, partyId).toBeLessThanOrEqual(ci.base);
      expect(ci.base, partyId).toBeLessThanOrEqual(ci.max);
      expect(ci.min, partyId).toBeGreaterThanOrEqual(0);
    }
  });

  it("R-02 / FR-013: party within perturbation of the 5% threshold gets lower bound 0", () => {
    const poll = [...basePoll, party("razem", 5.5, "nowa-lewica")];
    const { confidence } = simulateWithConfidence(poll, datasets, 5, 1.5);
    expect(confidence.razem).toBeDefined();
    expect(confidence.razem.min).toBe(0);
  });

  it("R-02: party just below threshold but within +perturbation is reported with base 0 and max > 0", () => {
    const poll = [...basePoll, party("razem", 4.2, "nowa-lewica")];
    const { confidence } = simulateWithConfidence(poll, datasets, 5, 1.5);
    expect(confidence.razem.base).toBe(0);
    expect(confidence.razem.max).toBeGreaterThan(0);
  });

  it("R-02: party far below threshold (case 4) is excluded entirely", () => {
    const poll = [...basePoll, party("razem", 2, "nowa-lewica")];
    const { result, confidence } = simulateWithConfidence(poll, datasets, 5, 1.5);
    expect(confidence.razem).toBeUndefined();
    expect(result.seats.razem).toBeUndefined();
    expect(result.totalSeats).toBe(460);
  });

  it("R-02: wider perturbation never narrows the interval", () => {
    const narrow = simulateWithConfidence(basePoll, datasets, 5, 1).confidence;
    const wide = simulateWithConfidence(basePoll, datasets, 5, 3).confidence;
    for (const [partyId, ci] of Object.entries(narrow)) {
      expect(wide[partyId].max, partyId).toBeGreaterThanOrEqual(ci.max);
      expect(wide[partyId].min, partyId).toBeLessThanOrEqual(ci.min);
    }
  });
});
