/**
 * Poll normalization utilities.
 *
 * Handles two separate mechanics:
 * 1. "Niezdecydowani" — people who don't vote. Normalizes poll %s to 100% of actual voters.
 * 2. "Inne partie" — parties that run but won't cross threshold. They consume share of
 *    valid votes (affecting effective threshold) but don't enter d'Hondt allocation.
 */

export interface NormalizationInput {
  /** Party poll percentages (sondażowe) — these are what the user enters */
  partyPercentages: { partyId: string; percentage: number }[];
  /** Percentage of respondents who are undecided / won't vote (0-100) */
  undecided: number;
  /** Percentage attributed to "other parties" below threshold (0-100) */
  otherParties: number;
}

export interface NormalizationResult {
  /** Real percentages normalized to 100% of actual voters (without undecided) */
  realPercentages: { partyId: string; sondazPct: number; realPct: number }[];
  /** The effective total of decided voters (100 - undecided) */
  effectiveTotal: number;
  /** "Inne partie" real percentage (also normalized) */
  otherPartiesReal: number;
}

/**
 * Normalize poll percentages:
 * - Remove undecided from the denominator (przelicz na 100% bez niezdecydowanych)
 * - Keep "inne partie" in the effective total (they consume valid vote share)
 *
 * Example: PiS 30%, KO 30%, undecided 20%, inne 5%
 * → effectiveTotal = 80% (100 - 20)
 * → realPct PiS = 30/80*100 = 37.5%
 * → realPct KO = 30/80*100 = 37.5%
 * → otherPartiesReal = 5/80*100 = 6.25%
 */
export function normalizePolls(input: NormalizationInput): NormalizationResult {
  const effectiveTotal = 100 - input.undecided;

  if (effectiveTotal <= 0) {
    // Edge case: 100% undecided — return zeros
    return {
      realPercentages: input.partyPercentages.map((p) => ({
        partyId: p.partyId,
        sondazPct: p.percentage,
        realPct: 0,
      })),
      effectiveTotal: 0,
      otherPartiesReal: 0,
    };
  }

  const realPercentages = input.partyPercentages.map((p) => ({
    partyId: p.partyId,
    sondazPct: p.percentage,
    realPct: (p.percentage / effectiveTotal) * 100,
  }));

  const otherPartiesReal = (input.otherParties / effectiveTotal) * 100;

  return { realPercentages, effectiveTotal, otherPartiesReal };
}
