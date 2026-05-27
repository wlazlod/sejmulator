/**
 * Barrel export for PKW historical election data module.
 * Consumed by the simulation engine (S-01).
 */

// Types
export type { ElectionData, ElectionMeta, DistrictResult, DistrictMeta, PartyResult } from "./types";

// Party mapping & distributions
export { partyDefaults } from "./party-mapping";
export type { PartyDefaults, PartyDefault, DistributionSource } from "./party-mapping";

// Election data (static imports — total ~200-600KB, acceptable for MVP)
// These will be populated in Phase 2 after the processing script runs.
import parlamentarne2023 from "./parlamentarne-2023.json";

export const elections = {
  "parlamentarne-2023": parlamentarne2023,
} as const;
