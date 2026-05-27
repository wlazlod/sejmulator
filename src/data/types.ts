/**
 * Types for PKW historical election data.
 * Used by the simulation engine (S-01) to scale national poll results
 * onto per-district geographic distributions via d'Hondt method.
 */

/** Metadata about a specific election */
export interface ElectionMeta {
  /** Unique identifier, e.g. "parlamentarne-2023" */
  id: string;
  /** Human-readable name, e.g. "Parlamentarne 2023" */
  name: string;
  /** Type of election */
  type: "parlamentarne" | "prezydenckie";
  /** Year of the election */
  year: number;
  /** Date of the election (YYYY-MM-DD) */
  date: string;
}

/** Vote result for a single party in a single district */
export interface PartyResult {
  /** Party ID as it appears in this election's data */
  partyId: string;
  /** Human-readable party name */
  partyName: string;
  /** Number of valid votes received */
  votes: number;
  /** Percentage of valid votes in this district */
  percentage: number;
}

/** Metadata about a single electoral district */
export interface DistrictMeta {
  /** District number (1-41 for parliamentary) */
  number: number;
  /** District name / city */
  name: string;
  /** Number of seats allocated to this district */
  districtSize: number;
}

/** Full results for a single district */
export interface DistrictResult {
  /** District metadata */
  district: DistrictMeta;
  /** Results per party in this district */
  results: PartyResult[];
  /** Total valid votes cast in this district */
  totalValidVotes: number;
}

/** Top-level structure for one election's data file */
export interface ElectionData {
  /** Election metadata */
  election: ElectionMeta;
  /** Results per district */
  districts: DistrictResult[];
}
