/**
 * POST /api/share — Save a simulation and return a share link.
 */

import type { APIContext } from "astro";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase";
import { validateShareRequest } from "@/lib/share-types";

export async function POST(context: APIContext): Promise<Response> {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!validateShareRequest(body)) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = nanoid(8);
  const { error } = await supabase.from("shared_simulations").insert({
    id,
    parties: body.parties,
  });

  if (error) {
    console.error("Failed to save shared simulation:", error);
    return new Response(JSON.stringify({ error: "Failed to save" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(`/s/${id}`, context.url.origin).toString();

  return new Response(JSON.stringify({ id, url }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
