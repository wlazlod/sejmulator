// test-plan: R-03
/**
 * Data integrity tests for PKW election data.
 * Verifies all generated JSON files conform to expected structure and values.
 */

import { describe, it, expect } from "vitest";
import { elections } from "../index";
import type { ElectionData } from "../types";

const PARLIAMENTARY_SEAT_TOTAL = 460;
const DISTRICT_COUNT = 41;

const parliamentaryElections = ["parlamentarne-2023", "parlamentarne-2019", "parlamentarne-2011"] as const;
const presidentialElections = ["prezydenckie-2025", "prezydenckie-2020"] as const;
const allElections = [...parliamentaryElections, ...presidentialElections] as const;

describe("PKW Election Data Integrity", () => {
  describe.each(allElections)("%s", (electionId) => {
    const data = elections[electionId] as unknown as ElectionData;

    it("has exactly 41 districts", () => {
      expect(data.districts).toHaveLength(DISTRICT_COUNT);
    });

    it("has election metadata", () => {
      expect(data.election).toBeDefined();
      expect(data.election.id).toBe(electionId);
      expect(data.election.year).toBeGreaterThan(2000);
      expect(data.election.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("has no NaN, undefined, or negative values", () => {
      for (const district of data.districts) {
        expect(district.totalValidVotes).toBeGreaterThan(0);
        expect(Number.isNaN(district.totalValidVotes)).toBe(false);
        expect(district.district.number).toBeGreaterThanOrEqual(1);
        expect(district.district.number).toBeLessThanOrEqual(41);
        expect(district.district.districtSize).toBeGreaterThan(0);

        for (const result of district.results) {
          expect(result.votes).toBeGreaterThanOrEqual(0);
          expect(Number.isNaN(result.votes)).toBe(false);
          expect(result.percentage).toBeGreaterThanOrEqual(0);
          expect(result.percentage).toBeLessThanOrEqual(100);
          expect(result.partyId).toBeTruthy();
          expect(result.partyName).toBeTruthy();
        }
      }
    });

    it("each district has at least 2 parties/candidates with votes > 0", () => {
      for (const district of data.districts) {
        const withVotes = district.results.filter((r) => r.votes > 0);
        expect(withVotes.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("district numbers are unique and cover 1-41", () => {
      const numbers = data.districts.map((d) => d.district.number).sort((a, b) => a - b);
      expect(numbers).toEqual(Array.from({ length: 41 }, (_, i) => i + 1));
    });

    it("sum of party votes approximately equals totalValidVotes per district", () => {
      for (const district of data.districts) {
        const sumVotes = district.results.reduce((s, r) => s + r.votes, 0);
        // Allow 1% tolerance for rounding
        expect(sumVotes).toBeGreaterThan(district.totalValidVotes * 0.99);
        expect(sumVotes).toBeLessThanOrEqual(district.totalValidVotes * 1.01);
      }
    });
  });

  describe("Parliamentary elections", () => {
    it.each(parliamentaryElections)("%s: district sizes sum to 460", (electionId) => {
      const data = elections[electionId] as unknown as ElectionData;
      const totalSeats = data.districts.reduce((s, d) => s + d.district.districtSize, 0);
      expect(totalSeats).toBe(PARLIAMENTARY_SEAT_TOTAL);
    });
  });
});
