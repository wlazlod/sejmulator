/**
 * Shared helpers for /api/simulations endpoints.
 */

import type { APIContext } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Resolves the authenticated user and a Supabase client, or an error response. */
export function requireUser(
  context: APIContext,
): { supabase: SupabaseClient; userId: string } | { response: Response } {
  if (!context.locals.user) {
    return { response: json({ error: "Unauthorized" }, 401) };
  }
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return { response: json({ error: "Supabase not configured" }, 503) };
  }
  return { supabase, userId: context.locals.user.id };
}

/** Parsed JSON body, or `undefined` when the body is not valid JSON. */
export async function readJson(context: APIContext): Promise<unknown> {
  try {
    return await context.request.json();
  } catch {
    return undefined;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
