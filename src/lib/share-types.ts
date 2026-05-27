/**
 * Types for the share link feature (S-03).
 *
 * We store only the simulation inputs (parties + percentages + distribution IDs),
 * not the results — the simulation is deterministic and re-run on load.
 */

/** A single party entry as stored in the shared simulation */
export interface SharedPartyInput {
  /** Party ID (e.g. "pis", "ko") */
  id: string;
  /** Display name */
  displayName: string;
  /** Short name */
  shortName: string;
  /** Poll percentage (0-100) */
  percentage: number;
  /** Distribution ID (e.g. "parlamentarne-2023:prawo-i-sprawiedliwosc") */
  distributionId: string;
}

/** The payload stored in Supabase */
export interface SharedSimulation {
  /** Short unique ID (nanoid, 8 chars) */
  id: string;
  /** Party inputs */
  parties: SharedPartyInput[];
  /** When the share was created */
  created_at: string;
  /** When the share expires */
  expires_at: string;
}

/** POST /api/share request body */
export interface ShareRequest {
  parties: SharedPartyInput[];
}

/** POST /api/share response */
export interface ShareResponse {
  id: string;
  url: string;
}

/** Validates a ShareRequest payload */
export function validateShareRequest(body: unknown): body is ShareRequest {
  if (!body || typeof body !== "object") return false;
  const obj = body as Record<string, unknown>;
  if (!Array.isArray(obj.parties)) return false;
  if (obj.parties.length === 0 || obj.parties.length > 20) return false;

  for (const p of obj.parties) {
    if (!p || typeof p !== "object") return false;
    const party = p as Record<string, unknown>;
    if (typeof party.id !== "string" || party.id.length === 0) return false;
    if (typeof party.displayName !== "string") return false;
    if (typeof party.shortName !== "string") return false;
    if (typeof party.percentage !== "number" || party.percentage < 0 || party.percentage > 100) return false;
    if (typeof party.distributionId !== "string" || !party.distributionId.includes(":")) return false;
  }

  return true;
}
