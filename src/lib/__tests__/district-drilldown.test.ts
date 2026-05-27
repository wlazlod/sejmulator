/**
 * Tests for district drilldown: sort/filter logic and map data integrity.
 */

import { describe, it, expect } from "vitest";
import { PATH_TO_DISTRICT, DISTRICT_TO_PATH } from "../../components/district-map-data";
import type { DistrictSimulationResult } from "../../lib/types";

describe("district-map-data", () => {
  it("PATH_TO_DISTRICT has exactly 41 entries", () => {
    expect(Object.keys(PATH_TO_DISTRICT)).toHaveLength(41);
  });

  it("maps to all district numbers 1-41", () => {
    const nums = new Set(Object.values(PATH_TO_DISTRICT));
    expect(nums.size).toBe(41);
    for (let i = 1; i <= 41; i++) {
      expect(nums.has(i)).toBe(true);
    }
  });

  it("DISTRICT_TO_PATH is the exact inverse of PATH_TO_DISTRICT", () => {
    for (const [pathId, districtNum] of Object.entries(PATH_TO_DISTRICT)) {
      expect(DISTRICT_TO_PATH[districtNum]).toBe(pathId);
    }
    expect(Object.keys(DISTRICT_TO_PATH)).toHaveLength(41);
  });
});

describe("district sort/filter logic", () => {
  const mockDistricts: DistrictSimulationResult[] = [
    {
      districtNumber: 19,
      districtName: "Warszawa",
      districtSize: 20,
      seats: { ko: 12, pis: 6, lewica: 2 },
      tightRaces: [],
    },
    {
      districtNumber: 1,
      districtName: "Legnica",
      districtSize: 12,
      seats: { pis: 5, ko: 4, polska2050: 2, lewica: 1 },
      tightRaces: [{ currentHolder: "pis", challenger: "ko", margin: 0.023 }],
    },
    {
      districtNumber: 24,
      districtName: "Białystok",
      districtSize: 14,
      seats: { pis: 8, ko: 4, konfederacja: 2 },
      tightRaces: [
        { currentHolder: "pis", challenger: "ko", margin: 0.015 },
        { currentHolder: "konfederacja", challenger: "polska2050", margin: 0.031 },
      ],
    },
  ];

  it("sorts by district number ascending", () => {
    const sorted = [...mockDistricts].sort((a, b) => a.districtNumber - b.districtNumber);
    expect(sorted.map((d) => d.districtNumber)).toEqual([1, 19, 24]);
  });

  it("sorts by name (Polish locale)", () => {
    const sorted = [...mockDistricts].sort((a, b) => a.districtName.localeCompare(b.districtName, "pl"));
    expect(sorted.map((d) => d.districtName)).toEqual(["Białystok", "Legnica", "Warszawa"]);
  });

  it("sorts by seat count descending", () => {
    const sorted = [...mockDistricts].sort((a, b) => b.districtSize - a.districtSize);
    expect(sorted.map((d) => d.districtSize)).toEqual([20, 14, 12]);
  });

  it("sorts by tight race count descending", () => {
    const sorted = [...mockDistricts].sort((a, b) => b.tightRaces.length - a.tightRaces.length);
    expect(sorted.map((d) => d.districtNumber)).toEqual([24, 1, 19]);
  });

  it("filters to only districts with tight races", () => {
    const filtered = mockDistricts.filter((d) => d.tightRaces.length > 0);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((d) => d.districtNumber)).toEqual([1, 24]);
  });
});
