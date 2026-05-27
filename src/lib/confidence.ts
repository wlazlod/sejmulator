/**
 * Confidence interval calculation via perturbation.
 *
 * Simple heuristic: perturb each party's percentage by ±1% in each district,
 * re-run d'Hondt, report range of seat outcomes.
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

  return { result, confidence };
}
