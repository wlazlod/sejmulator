/**
 * Confidence interval calculation via perturbation.
 *
 * Heuristic: perturb each party's percentage by ±perturbationPct,
 * re-run d'Hondt, report range of seat outcomes.
 * FR-013: if perturbation drops a party below threshold → that run gives 0 seats → min=0.
 */

import type { ElectionData } from "../data/types";
import type { PartyPollInput, SimulationResult } from "./types";
import { simulateElection } from "./dhondt";

export interface ConfidenceInterval {
  /** Seat count from base simulation */
  base: number;
  /** Minimum seats across perturbations */
  min: number;
  /** Maximum seats across perturbations */
  max: number;
}

export interface SimulationWithCI {
  result: SimulationResult;
  confidence: Record<string, ConfidenceInterval>;
}

/**
 * Run simulation with confidence intervals.
 * Perturbs each party ±perturbationPct and reports seat ranges.
 *
 * FR-013: If a party's real percentage minus perturbation < threshold,
 * the min is forced to 0 (party might not enter Sejm at all).
 */
export function simulateWithConfidence(
  nationalPoll: PartyPollInput[],
  electionDatasets: Record<string, ElectionData>,
  threshold = 5,
  perturbationPct = 1.5,
): SimulationWithCI {
  // Base simulation
  const result = simulateElection(nationalPoll, electionDatasets, threshold);

  // Track min/max per party
  const mins: Record<string, number> = {};
  const maxs: Record<string, number> = {};

  for (const [partyId, seats] of Object.entries(result.seats)) {
    mins[partyId] = seats;
    maxs[partyId] = seats;
  }

  // FR-013: Check if any party's lower CI bound falls below threshold
  // If so, their min seats should be 0 (they might not enter Sejm)
  for (const party of nationalPoll) {
    if (party.percentage - perturbationPct < threshold) {
      mins[party.partyId] = 0;
    }
  }

  // Perturb each party up and down
  for (let i = 0; i < nationalPoll.length; i++) {
    for (const delta of [-perturbationPct, perturbationPct]) {
      const perturbed = nationalPoll.map((p, j) => ({
        ...p,
        percentage: j === i ? Math.max(0, p.percentage + delta) : p.percentage,
      }));

      const pertResult = simulateElection(perturbed, electionDatasets, threshold);

      for (const [partyId, seats] of Object.entries(pertResult.seats)) {
        mins[partyId] = Math.min(mins[partyId] ?? seats, seats);
        maxs[partyId] = Math.max(maxs[partyId] ?? seats, seats);
      }
    }
  }

  // Build confidence intervals
  const confidence: Record<string, ConfidenceInterval> = {};
  for (const [partyId, seats] of Object.entries(result.seats)) {
    confidence[partyId] = {
      base: seats,
      min: mins[partyId] ?? seats,
      max: maxs[partyId] ?? seats,
    };
  }

  // Case 3: parties below threshold but within CI range (could pass with +perturbation)
  // Include them with base=0 if they got seats in any perturbation run
  for (const party of nationalPoll) {
    if (confidence[party.partyId]) continue; // already in results
    if (party.percentage < threshold && party.percentage + perturbationPct >= threshold) {
      confidence[party.partyId] = {
        base: 0,
        min: 0,
        max: maxs[party.partyId] ?? 0,
      };
    }
  }

  return { result, confidence };
}
