// test-plan: R-03
/**
 * Every distribution referenced by partyDefaults must exist in the loaded election data.
 * Catches typos in "electionId:partyId" strings (e.g. the PJN 2011 proxy for Rozwój+).
 */

import { describe, it, expect } from "vitest";
import { elections } from "../index";
import { partyDefaults } from "../party-mapping";
import type { ElectionData } from "../types";

const datasets = elections as unknown as Record<string, ElectionData>;

function partyExists(electionId: string, partyId: string): boolean {
  const data = datasets[electionId] as ElectionData | undefined;
  if (!data) return false;
  return data.districts.some((d) => d.results.some((r) => r.partyId === partyId));
}

const cases = Object.entries(partyDefaults).flatMap(([key, def]) =>
  [def.defaultDistribution, ...def.alternativeDistributions].map((dist) => [key, dist] as const),
);

describe("partyDefaults distributions", () => {
  it.each(cases)("R-03: %s → %s points to an existing election and party", (_key, dist) => {
    const idx = dist.indexOf(":");
    expect(idx).toBeGreaterThan(0);
    const electionId = dist.slice(0, idx);
    const partyId = dist.slice(idx + 1);
    expect(Object.keys(datasets), `unknown election in ${dist}`).toContain(electionId);
    expect(partyExists(electionId, partyId), `party ${partyId} not found in ${electionId}`).toBe(true);
  });

  it("R-03: Rozwój+ defaults to PJN 2011 and offers Trzecia Droga 2023 as an alternative", () => {
    expect(partyDefaults.rozwojplus.defaultDistribution).toBe("parlamentarne-2011:polska-jest-najwazniejsza");
    expect(partyDefaults.rozwojplus.alternativeDistributions).toContain(
      "parlamentarne-2023:trzecia-droga-polska-2050-szymona-holowni-polskie-stronnictwo-ludowe",
    );
  });
});
