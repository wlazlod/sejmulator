/**
 * GET  /api/simulations — list the current user's saved simulations (FR-016).
 * POST /api/simulations — save a new simulation under a name (FR-015).
 */

import type { APIContext } from "astro";
import { validateSavedSimulationInput } from "@/lib/saved-simulation-types";
import { createSimulation, listSimulations } from "@/lib/services/saved-simulations";
import { json, readJson, requireUser } from "./_helpers";

export const prerender = false;

export async function GET(context: APIContext): Promise<Response> {
  const auth = requireUser(context);
  if ("response" in auth) return auth.response;

  try {
    const items = await listSimulations(auth.supabase, auth.userId);
    return json(items);
  } catch (err) {
    console.error("Failed to list saved simulations:", err);
    return json({ error: "Failed to list" }, 500);
  }
}

export async function POST(context: APIContext): Promise<Response> {
  const auth = requireUser(context);
  if ("response" in auth) return auth.response;

  const body = await readJson(context);
  if (body === undefined) return json({ error: "Invalid JSON" }, 400);
  if (!validateSavedSimulationInput(body)) return json({ error: "Invalid request body" }, 400);

  try {
    const record = await createSimulation(auth.supabase, auth.userId, body);
    return json(record, 201);
  } catch (err) {
    console.error("Failed to create saved simulation:", err);
    return json({ error: "Failed to save" }, 500);
  }
}
