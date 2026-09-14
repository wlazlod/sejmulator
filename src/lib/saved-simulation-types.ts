/**
 * Types and validation for saved simulations (S-05, FR-015–FR-018).
 *
 * A saved simulation stores the *inputs* (parties, other parties, CI parameter)
 * under a user-chosen name. Results are deterministic and re-computed on load,
 * the same principle as share links.
 */

import type { SharedPartyInput } from "./share-types";
import { validateShareRequest } from "./share-types";

export const SAVED_SIMULATION_NAME_MAX = 80;

/** Row shape of the `saved_simulations` table */
export interface SavedSimulation {
  id: string;
  user_id: string;
  name: string;
  parties: SharedPartyInput[];
  other_parties: number;
  perturbation_pct: number;
  created_at: string;
  updated_at: string;
}

/** Compact row for the library list (GET /api/simulations) */
export interface SavedSimulationSummary {
  id: string;
  name: string;
  updated_at: string;
  party_count: number;
  /** Short names of parties, for display in the list */
  party_short_names: string[];
}

/** POST /api/simulations body */
export interface SavedSimulationInput {
  name: string;
  parties: SharedPartyInput[];
  otherParties: number;
  perturbationPct: number;
}

/** PATCH /api/simulations/:id body — at least one field required */
export type SavedSimulationPatch = Partial<SavedSimulationInput>;

function isValidName(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= SAVED_SIMULATION_NAME_MAX;
}

function isValidOtherParties(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isValidPerturbation(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 10;
}

/** Validates a full create payload */
export function validateSavedSimulationInput(body: unknown): body is SavedSimulationInput {
  if (!body || typeof body !== "object") return false;
  const obj = body as Record<string, unknown>;
  if (!isValidName(obj.name)) return false;
  if (!validateShareRequest({ parties: obj.parties })) return false;
  if (!isValidOtherParties(obj.otherParties)) return false;
  if (!isValidPerturbation(obj.perturbationPct)) return false;
  return true;
}

/** Validates a partial update payload: every present field must be valid, and at least one must be present */
export function validateSavedSimulationPatch(body: unknown): body is SavedSimulationPatch {
  if (!body || typeof body !== "object") return false;
  const obj = body as Record<string, unknown>;
  const keys = ["name", "parties", "otherParties", "perturbationPct"] as const;
  const present = keys.filter((k) => obj[k] !== undefined);
  if (present.length === 0) return false;

  if (obj.name !== undefined && !isValidName(obj.name)) return false;
  if (obj.parties !== undefined && !validateShareRequest({ parties: obj.parties })) return false;
  if (obj.otherParties !== undefined && !isValidOtherParties(obj.otherParties)) return false;
  if (obj.perturbationPct !== undefined && !isValidPerturbation(obj.perturbationPct)) return false;
  return true;
}
