/**
 * Data access for saved simulations (S-05).
 *
 * The Supabase client carries the user's JWT (cookie session), so RLS already
 * restricts rows to `auth.uid() = user_id`. Every query still filters by
 * `user_id` explicitly (defence in depth) so a misconfigured policy cannot leak rows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SavedSimulation,
  SavedSimulationInput,
  SavedSimulationPatch,
  SavedSimulationSummary,
} from "@/lib/saved-simulation-types";

const TABLE = "saved_simulations";
const FULL_COLUMNS = "id, user_id, name, parties, other_parties, perturbation_pct, created_at, updated_at";

/** Raw row as returned by PostgREST (`numeric` columns arrive as strings). */
interface RawRow {
  id: string;
  user_id: string;
  name: string;
  parties: SavedSimulation["parties"];
  other_parties: number | string;
  perturbation_pct: number | string;
  created_at: string;
  updated_at: string;
}

interface SummaryRow {
  id: string;
  name: string;
  updated_at: string;
  parties: { shortName: string }[];
}

function toRecord(row: RawRow): SavedSimulation {
  return {
    ...row,
    other_parties: Number(row.other_parties),
    perturbation_pct: Number(row.perturbation_pct),
  };
}

export async function listSimulations(supabase: SupabaseClient, userId: string): Promise<SavedSimulationSummary[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, name, updated_at, parties")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .overrideTypes<SummaryRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    updated_at: r.updated_at,
    party_count: r.parties.length,
    party_short_names: r.parties.map((p) => p.shortName),
  }));
}

export async function getSimulation(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<SavedSimulation | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(FULL_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle<RawRow>();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toRecord(data);
}

export async function createSimulation(
  supabase: SupabaseClient,
  userId: string,
  input: SavedSimulationInput,
): Promise<SavedSimulation> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      name: input.name.trim(),
      parties: input.parties,
      other_parties: input.otherParties,
      perturbation_pct: input.perturbationPct,
    })
    .select(FULL_COLUMNS)
    .single<RawRow>();
  if (error) throw new Error(error.message);
  return toRecord(data);
}

/** Updates only the provided fields; returns null when the row does not exist (or belongs to someone else). */
export async function updateSimulation(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: SavedSimulationPatch,
): Promise<SavedSimulation | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.parties !== undefined) update.parties = patch.parties;
  if (patch.otherParties !== undefined) update.other_parties = patch.otherParties;
  if (patch.perturbationPct !== undefined) update.perturbation_pct = patch.perturbationPct;

  const { data, error } = await supabase
    .from(TABLE)
    .update(update)
    .eq("user_id", userId)
    .eq("id", id)
    .select(FULL_COLUMNS)
    .maybeSingle<RawRow>();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toRecord(data);
}

/** Returns true when a row was deleted, false when nothing matched. */
export async function deleteSimulation(supabase: SupabaseClient, userId: string, id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .overrideTypes<{ id: string }[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.length > 0;
}
