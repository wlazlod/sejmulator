/**
 * D'Hondt method simulation engine.
 *
 * Pure functions: no side effects, no I/O.
 * Core algorithm: https://en.wikipedia.org/wiki/D%27Hondt_method
 */

import type { ElectionData } from "../data/types";
import type { PartyPollInput, DistrictVotes, DistrictSimulationResult, SimulationResult, TightRace } from "./types";

/**
 * Core d'Hondt seat allocation.
 * Given votes per party and number of seats, returns seats per party.
 */
export function allocateSeats(
  votes: Record<string, number>,
  seats: number,
  threshold?: number,
): Record<string, number> {
  const totalVotes = Object.values(votes).reduce((s, v) => s + v, 0);
  const thresholdFraction = (threshold ?? 0) / 100;

  // Filter parties below threshold
  const eligibleParties = Object.entries(votes).filter(([, v]) => v / totalVotes >= thresholdFraction);

  // Initialize seat counts
  const seatAllocation: Record<string, number> = {};
  for (const [party] of eligibleParties) {
    seatAllocation[party] = 0;
  }

  // D'Hondt: assign seats one by one to highest quotient
  for (let i = 0; i < seats; i++) {
    let maxQuotient = -1;
    let winner = "";

    for (const [party, v] of eligibleParties) {
      const quotient = v / (seatAllocation[party] + 1);
      if (quotient > maxQuotient) {
        maxQuotient = quotient;
        winner = party;
      }
    }

    if (winner) {
      seatAllocation[winner]++;
    }
  }

  return seatAllocation;
}

/**
 * Scale national poll percentages to per-district votes using a historical distribution model.
 *
 * Algorithm:
 * For each party, calculate geographic distribution weights from the historical data,
 * then apply those weights to the national percentage to get estimated votes per district.
 */
export function scaleToDistricts(
  nationalPoll: PartyPollInput[],
  electionDatasets: Record<string, ElectionData>,
): DistrictVotes[] {
  // We need to produce votes for 41 districts
  const districts: DistrictVotes[] = [];

  // Get district info from any dataset (all have same 41 districts)
  const referenceData = Object.values(electionDatasets)[0];
  if (!referenceData) return [];

  for (const district of referenceData.districts) {
    const districtVotes = new Map<string, number>();

    for (const party of nationalPoll) {
      // Get the distribution model for this party
      const sourceData = electionDatasets[party.distributionElectionId];
      if (!sourceData) {
        // Fallback: uniform distribution
        districtVotes.set(party.partyId, party.percentage * 1000);
        continue;
      }

      // Find the source party's results in this dataset
      const sourceDistrict = sourceData.districts.find((d) => d.district.number === district.district.number);
      if (!sourceDistrict) {
        districtVotes.set(party.partyId, party.percentage * 1000);
        continue;
      }

      const sourcePartyResult = sourceDistrict.results.find((r) => r.partyId === party.distributionPartyId);

      // Calculate the weight: what fraction of this party's total votes came from this district?
      const totalSourceVotes = sourceData.districts.reduce((sum, d) => {
        const r = d.results.find((r) => r.partyId === party.distributionPartyId);
        return sum + (r?.votes ?? 0);
      }, 0);

      const districtSourceVotes = sourcePartyResult?.votes ?? 0;
      const weight = totalSourceVotes > 0 ? districtSourceVotes / totalSourceVotes : 1 / 41;

      // Scale: party's national share * weight * base multiplier for vote magnitude
      // Use 100000 as base to get reasonable vote numbers for d'Hondt
      const estimatedVotes = Math.round(party.percentage * weight * 100000);
      districtVotes.set(party.partyId, estimatedVotes);
    }

    districts.push({
      districtNumber: district.district.number,
      districtSize: district.district.districtSize,
      votes: districtVotes,
    });
  }

  return districts;
}

/**
 * Detect tight races in a district: seats where the margin between last winner
 * and first loser is very small.
 */
function detectTightRaces(
  votes: Record<string, number>,
  seats: number,
  seatAllocation: Record<string, number>,
): TightRace[] {
  const tightRaces: TightRace[] = [];
  const TIGHT_THRESHOLD = 1.05; // Within 5% of flipping

  // Calculate all quotients for the "last seat" scenario
  // The last allocated seat's quotient vs the highest non-winning quotient
  const quotients: Array<{ party: string; quotient: number; seatIndex: number }> = [];

  for (const [party, v] of Object.entries(votes)) {
    const partySeatCount = seatAllocation[party] ?? 0;
    // The quotient that won the last seat for this party
    if (partySeatCount > 0) {
      quotients.push({
        party,
        quotient: v / partySeatCount, // quotient at which last seat was won
        seatIndex: partySeatCount,
      });
    }
    // The quotient that would win the next seat
    quotients.push({
      party,
      quotient: v / (partySeatCount + 1),
      seatIndex: partySeatCount + 1,
    });
  }

  // Sort by quotient descending
  quotients.sort((a, b) => b.quotient - a.quotient);

  // The seat boundary is at position `seats` (0-indexed)
  // Quotients[seats-1] is the last winner, quotients[seats] is the first loser
  if (quotients.length > seats) {
    const lastWinner = quotients[seats - 1];
    const firstLoser = quotients[seats];

    if (lastWinner && firstLoser && firstLoser.quotient > 0) {
      const margin = lastWinner.quotient / firstLoser.quotient;
      if (margin < TIGHT_THRESHOLD) {
        tightRaces.push({
          currentHolder: lastWinner.party,
          challenger: firstLoser.party,
          margin,
        });
      }
    }
  }

  return tightRaces;
}

/**
 * Run full simulation: national poll → geographic scaling → d'Hondt per district → aggregate.
 */
export function simulateElection(
  nationalPoll: PartyPollInput[],
  electionDatasets: Record<string, ElectionData>,
  threshold = 5,
): SimulationResult {
  // Step 1: Scale to districts
  const districtVotes = scaleToDistricts(nationalPoll, electionDatasets);

  // Step 2: Run d'Hondt per district
  const districtResults: DistrictSimulationResult[] = [];
  const aggregatedSeats: Record<string, number> = {};
  const allTightRaces: TightRace[] = [];

  // Get district names from reference data
  const referenceData = Object.values(electionDatasets)[0];

  for (const dv of districtVotes) {
    const votesObj: Record<string, number> = {};
    for (const [party, votes] of dv.votes) {
      votesObj[party] = votes;
    }

    const seats = allocateSeats(votesObj, dv.districtSize, threshold);
    const tightRaces = detectTightRaces(votesObj, dv.districtSize, seats);

    // Find district name
    const districtInfo = referenceData?.districts.find((d) => d.district.number === dv.districtNumber);

    districtResults.push({
      districtNumber: dv.districtNumber,
      districtName: districtInfo?.district.name ?? `Okręg ${dv.districtNumber}`,
      districtSize: dv.districtSize,
      seats,
      tightRaces,
    });

    // Aggregate
    for (const [party, seatCount] of Object.entries(seats)) {
      aggregatedSeats[party] = (aggregatedSeats[party] ?? 0) + seatCount;
    }
    allTightRaces.push(...tightRaces);
  }

  const totalSeats = Object.values(aggregatedSeats).reduce((s, v) => s + v, 0);

  return {
    seats: aggregatedSeats,
    districts: districtResults,
    tightRaces: allTightRaces,
    totalSeats,
  };
}
