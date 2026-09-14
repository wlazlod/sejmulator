/**
 * "Zapisz symulację" / "Zapisz zmiany" controls shown next to the share button (S-05).
 *
 * - anonymous: link to sign-in
 * - signed in, create mode: inline name field → POST /api/simulations
 * - signed in, edit mode: "Zapisz zmiany" → PATCH /api/simulations/:id
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SavedSimulationInput } from "@/lib/saved-simulation-types";
import { SAVED_SIMULATION_NAME_MAX } from "@/lib/saved-simulation-types";
import { useSaveSimulation } from "./hooks/useSaveSimulation";

export interface SaveControlsProps {
  user: { email: string } | null;
  /** When set, the simulator edits this saved record */
  savedId: string | null;
  /** Name in edit mode (edited in the page header) */
  name: string;
  /** Simulation inputs without the name */
  getInputs: () => Omit<SavedSimulationInput, "name">;
}

const primaryButton =
  "rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 bg-blue-600 hover:bg-blue-700";

export default function SaveControls({ user, savedId, name, getInputs }: SaveControlsProps) {
  const { status, error, create, update } = useSaveSimulation();
  const [open, setOpen] = useState(false);
  const [draftName, setDraftName] = useState("");

  if (!user) {
    return (
      <span className="text-sm text-gray-500">
        <a href="/auth/signin" className="text-blue-600 hover:underline">
          Zaloguj się
        </a>
        , aby zapisać symulację
      </span>
    );
  }

  if (savedId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            void update(savedId, { name, ...getInputs() });
          }}
          disabled={status === "saving" || name.trim().length === 0}
          className={cn(primaryButton)}
        >
          {status === "saving" ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
        {status === "saved" && (
          <span className="text-sm text-green-700" role="status">
            Zapisano.{" "}
            <a href="/simulations" className="text-blue-600 hover:underline">
              Moje symulacje
            </a>
          </span>
        )}
        {status === "error" && (
          <span className="text-sm text-red-600" role="alert">
            Nie udało się zapisać: {error}
          </span>
        )}
      </div>
    );
  }

  if (status === "saved") {
    return (
      <span className="text-sm text-green-700" role="status">
        Zapisano.{" "}
        <a href="/simulations" className="text-blue-600 hover:underline">
          Moje symulacje
        </a>
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={cn(primaryButton)}
      >
        Zapisz symulację
      </button>
    );
  }

  const canSave = draftName.trim().length > 0 && status !== "saving";

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        void create({ name: draftName.trim(), ...getInputs() });
      }}
    >
      <input
        type="text"
        aria-label="Nazwa symulacji"
        placeholder="Nazwa symulacji"
        value={draftName}
        maxLength={SAVED_SIMULATION_NAME_MAX}
        onChange={(e) => {
          setDraftName(e.target.value);
        }}
        className="w-48 rounded border px-2 py-1.5 text-sm"
      />
      <button type="submit" disabled={!canSave} className={cn(primaryButton)}>
        {status === "saving" ? "Zapisywanie..." : "Zapisz"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
        }}
        className="text-sm text-gray-500 hover:underline"
      >
        Anuluj
      </button>
      {status === "error" && (
        <span className="text-sm text-red-600" role="alert">
          Nie udało się zapisać: {error}
        </span>
      )}
    </form>
  );
}
