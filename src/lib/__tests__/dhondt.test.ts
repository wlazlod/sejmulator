// test-plan: R-01
/**
 * Tests for d'Hondt simulation engine.
 */

import { describe, it, expect } from "vitest";
import { allocateSeats, simulateElection } from "../dhondt";
import type { PartyPollInput } from "../types";
import type { ElectionData } from "../../data/types";
import parlamentarne2023 from "../../data/parlamentarne-2023.json";

describe("allocateSeats", () => {
  it("basic d'Hondt: known example", () => {
    // Classic textbook example: 7 seats, 4 parties
    const votes = { A: 100000, B: 80000, C: 30000, D: 20000 };
    const result = allocateSeats(votes, 7);
    // Expected: A=3, B=3, C=1, D=0
    expect(result.A).toBe(3);
    expect(result.B).toBe(3);
    expect(result.C).toBe(1);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    expect(result.D ?? 0).toBe(0);
  });

  it("single party gets all seats", () => {
    const votes = { A: 100, B: 0 };
    const result = allocateSeats(votes, 5);
    expect(result.A).toBe(5);
  });

  it("threshold filters small parties", () => {
    const votes = { A: 90, B: 10 };
    // B has 10% but threshold is 15%
    const result = allocateSeats(votes, 5, 15);
    expect(result.A).toBe(5);
    expect(result.B).toBeUndefined();
  });

  it("total seats allocated equals input seats", () => {
    const votes = { A: 45, B: 30, C: 15, D: 10 };
    const result = allocateSeats(votes, 10);
    const total = Object.values(result).reduce((s, v) => s + v, 0);
    expect(total).toBe(10);
  });
});

describe("simulateElection", () => {
  it("reproduces 2023 parliamentary results within ±3 seats per party", () => {
    // Use actual 2023 percentages and 2023 geographic distribution
    const nationalPoll: PartyPollInput[] = [
      {
        partyId: "pis",
        partyName: "PiS",
        percentage: 35.38,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "prawo-i-sprawiedliwosc",
      },
      {
        partyId: "ko",
        partyName: "KO",
        percentage: 30.7,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "koalicja-obywatelska-po-n-ipl-zieloni",
      },
      {
        partyId: "td",
        partyName: "Trzecia Droga",
        percentage: 14.4,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "trzecia-droga-polska-2050-szymona-holowni-polskie-stronnictwo-ludowe",
      },
      {
        partyId: "lewica",
        partyName: "Nowa Lewica",
        percentage: 8.61,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "nowa-lewica",
      },
      {
        partyId: "konf",
        partyName: "Konfederacja",
        percentage: 7.16,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "konfederacja-wolnosc-i-niepodleglosc",
      },
    ];

    const datasets: Record<string, ElectionData> = {
      "parlamentarne-2023": parlamentarne2023 as unknown as ElectionData,
    };

    const result = simulateElection(nationalPoll, datasets, 5);

    // Actual 2023 results: PiS 194, KO 157, TD 65, Lewica 26, Konf 18
    expect(result.totalSeats).toBe(460);
    expect(result.seats.pis).toBeGreaterThanOrEqual(191);
    expect(result.seats.pis).toBeLessThanOrEqual(197);
    expect(result.seats.ko).toBeGreaterThanOrEqual(154);
    expect(result.seats.ko).toBeLessThanOrEqual(160);
    expect(result.seats.td).toBeGreaterThanOrEqual(62);
    expect(result.seats.td).toBeLessThanOrEqual(68);
    expect(result.seats.lewica).toBeGreaterThanOrEqual(23);
    expect(result.seats.lewica).toBeLessThanOrEqual(29);
    expect(result.seats.konf).toBeGreaterThanOrEqual(15);
    expect(result.seats.konf).toBeLessThanOrEqual(21);
  });

  it("always produces totalSeats = 460", () => {
    const nationalPoll: PartyPollInput[] = [
      {
        partyId: "a",
        partyName: "Party A",
        percentage: 40,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "prawo-i-sprawiedliwosc",
      },
      {
        partyId: "b",
        partyName: "Party B",
        percentage: 35,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "koalicja-obywatelska-po-n-ipl-zieloni",
      },
      {
        partyId: "c",
        partyName: "Party C",
        percentage: 15,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "trzecia-droga-polska-2050-szymona-holowni-polskie-stronnictwo-ludowe",
      },
      {
        partyId: "d",
        partyName: "Party D",
        percentage: 10,
        distributionElectionId: "parlamentarne-2023",
        distributionPartyId: "nowa-lewica",
      },
    ];

    const datasets: Record<string, ElectionData> = {
      "parlamentarne-2023": parlamentarne2023 as unknown as ElectionData,
    };

    const result = simulateElection(nationalPoll, datasets, 5);
    expect(result.totalSeats).toBe(460);
  });
});
