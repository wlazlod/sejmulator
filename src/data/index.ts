/**
 * Barrel export for PKW historical election data module.
 * Consumed by the simulation engine (S-01).
 */

// Types
export type { ElectionData, ElectionMeta, DistrictResult, DistrictMeta, PartyResult } from "./types";

// Party mapping & distributions
export { partyDefaults } from "./party-mapping";
export type { PartyDefaults, PartyDefault, DistributionSource } from "./party-mapping";

// Election data (static imports — total ~400KB, acceptable for MVP)
import parlamentarne2023 from "./parlamentarne-2023.json";
import parlamentarne2019 from "./parlamentarne-2019.json";
import parlamentarne2011 from "./parlamentarne-2011.json";
import prezydenckie2025 from "./prezydenckie-2025.json";
import prezydenckie2020 from "./prezydenckie-2020.json";

export const elections = {
  "parlamentarne-2023": parlamentarne2023,
  "parlamentarne-2019": parlamentarne2019,
  "parlamentarne-2011": parlamentarne2011,
  "prezydenckie-2025": prezydenckie2025,
  "prezydenckie-2020": prezydenckie2020,
} as const;
