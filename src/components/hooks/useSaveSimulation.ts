/**
 * Client-side calls to /api/simulations (S-05).
 */

import { useCallback, useState } from "react";
import type { SavedSimulation, SavedSimulationInput, SavedSimulationPatch } from "@/lib/saved-simulation-types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export function useSaveSimulation() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedSimulation | null>(null);

  const run = useCallback(async (request: () => Promise<Response>) => {
    setStatus("saving");
    setError(null);
    try {
      const res = await request();
      if (!res.ok) throw new Error(await parseError(res));
      const record = (await res.json()) as SavedSimulation;
      setSaved(record);
      setStatus("saved");
      return record;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
      setStatus("error");
      return null;
    }
  }, []);

  const create = useCallback(
    (input: SavedSimulationInput) =>
      run(() =>
        fetch("/api/simulations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
      ),
    [run],
  );

  const update = useCallback(
    (id: string, patch: SavedSimulationPatch) =>
      run(() =>
        fetch(`/api/simulations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }),
      ),
    [run],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, saved, create, update, reset };
}
