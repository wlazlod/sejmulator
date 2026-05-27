/**
 * Types for the simulation engine.
 */

/** User input: a party in the poll */
export interface PartyPollInput {
  partyId: string;
  partyName: string;
  /** National poll percentage (0-100) */
  percentage: number;
  /** Which election dataset to use as geographic distribution source */
  distributionElectionId: string;
  /** Which partyId within that election dataset to use as distribution source */
  distributionPartyId: string;
}

/** Votes per party in a single district (intermediate calculation) */
export interface DistrictVotes {
  districtNumber: number;
  districtSize: number;
  votes: Map<string, number>;
}

/** Result for a single district */
export interface DistrictSimulationResult {
  districtNumber: number;
  districtName: string;
  districtSize: number;
  seats: Record<string, number>;
  tightRaces: TightRace[];
}

/** A seat that could flip with small vote changes */
export interface TightRace {
  /** Party that currently holds the seat */
  currentHolder: string;
  /** Party that would take the seat with perturbation */
  challenger: string;
  /** How close (ratio of quotients, 1.0 = tied) */
  margin: number;
}

/** Full simulation result */
export interface SimulationResult {
  /** Aggregated seats per party (national total) */
  seats: Record<string, number>;
  /** Per-district breakdown */
  districts: DistrictSimulationResult[];
  /** Total tight races across all districts */
  tightRaces: TightRace[];
  /** Total seats (should always be 460) */
  totalSeats: number;
}
