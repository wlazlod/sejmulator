/**
 * GET    /api/simulations/:id — full record (FR-016).
 * PATCH  /api/simulations/:id — rename and/or update inputs (FR-017).
 * DELETE /api/simulations/:id — remove (FR-018).
 */

import type { APIContext } from "astro";
import { validateSavedSimulationPatch } from "@/lib/saved-simulation-types";
import { deleteSimulation, getSimulation, updateSimulation } from "@/lib/services/saved-simulations";
import { isUuid, json, readJson, requireUser } from "./_helpers";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  const auth = requireUser(context);
  if ("response" in auth) return auth.response;
  const { id } = context.params;
  if (!isUuid(id)) return json({ error: "Not found" }, 404);

  try {
    const record = await getSimulation(auth.supabase, auth.userId, id);
    if (!record) return json({ error: "Not found" }, 404);
    return json(record);
  } catch (err) {
    console.error("Failed to load saved simulation:", err);
    return json({ error: "Failed to load" }, 500);
  }
}

export async function PATCH(context: APIContext): Promise<Response> {
  const auth = requireUser(context);
  if ("response" in auth) return auth.response;
  const { id } = context.params;
  if (!isUuid(id)) return json({ error: "Not found" }, 404);

  const body = await readJson(context);
  if (body === undefined) return json({ error: "Invalid JSON" }, 400);
  if (!validateSavedSimulationPatch(body)) return json({ error: "Invalid request body" }, 400);

  try {
    const record = await updateSimulation(auth.supabase, auth.userId, id, body);
    if (!record) return json({ error: "Not found" }, 404);
    return json(record);
  } catch (err) {
    console.error("Failed to update saved simulation:", err);
    return json({ error: "Failed to update" }, 500);
  }
}

export async function DELETE(context: APIContext): Promise<Response> {
  const auth = requireUser(context);
  if ("response" in auth) return auth.response;
  const { id } = context.params;
  if (!isUuid(id)) return json({ error: "Not found" }, 404);

  try {
    const deleted = await deleteSimulation(auth.supabase, auth.userId, id);
    if (!deleted) return json({ error: "Not found" }, 404);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Failed to delete saved simulation:", err);
    return json({ error: "Failed to delete" }, 500);
  }
}
