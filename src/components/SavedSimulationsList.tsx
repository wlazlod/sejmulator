/**
 * "Moje symulacje" library list (S-05): open, rename inline, delete.
 * Receives server-fetched rows as props; mutations go through /api/simulations.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SavedSimulationSummary } from "@/lib/saved-simulation-types";
import { SAVED_SIMULATION_NAME_MAX } from "@/lib/saved-simulation-types";

interface Props {
  items: SavedSimulationSummary[];
}

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

export default function SavedSimulationsList({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="mb-3 text-gray-600">Nie masz jeszcze zapisanych symulacji.</p>
        <a
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Policz i zapisz pierwszą symulację
        </a>
      </div>
    );
  }

  const startRename = (item: SavedSimulationSummary) => {
    setEditingId(item.id);
    setDraftName(item.name);
    setError(null);
  };

  const submitRename = async (id: string) => {
    const name = draftName.trim();
    if (!name) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/simulations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as { name: string; updated_at: string };
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, name: updated.name, updated_at: updated.updated_at } : it)),
      );
      setEditingId(null);
    } catch (err) {
      setError(`Nie udało się zmienić nazwy (${err instanceof Error ? err.message : "błąd"}).`);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: SavedSimulationSummary) => {
    if (!window.confirm(`Usunąć symulację „${item.name}”?`)) return;
    setBusyId(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/simulations/${item.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (err) {
      setError(`Nie udało się usunąć (${err instanceof Error ? err.message : "błąd"}).`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {items.map((item) => {
          const busy = busyId === item.id;
          const editing = editingId === item.id;
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-3 p-3" data-testid="saved-simulation-row">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <form
                    className="flex flex-wrap items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submitRename(item.id);
                    }}
                  >
                    <input
                      type="text"
                      aria-label="Nowa nazwa"
                      value={draftName}
                      maxLength={SAVED_SIMULATION_NAME_MAX}
                      autoFocus
                      onChange={(e) => {
                        setDraftName(e.target.value);
                      }}
                      className="w-56 rounded border px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busy || draftName.trim().length === 0}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Zapisz
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                      }}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Anuluj
                    </button>
                  </form>
                ) : (
                  <a href={`/simulations/${item.id}`} className="font-medium text-gray-900 hover:text-blue-700">
                    {item.name}
                  </a>
                )}
                <p className="mt-0.5 text-xs text-gray-500">
                  {dateFormat.format(new Date(item.updated_at))} · {item.party_short_names.join(", ")}
                </p>
              </div>
              <div className={cn("flex items-center gap-3 text-sm", busy && "opacity-50")}>
                <a href={`/simulations/${item.id}`} className="text-blue-600 hover:underline">
                  Otwórz
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    startRename(item);
                  }}
                  className="text-gray-700 hover:underline"
                >
                  Zmień nazwę
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void remove(item);
                  }}
                  className="text-red-600 hover:underline"
                >
                  Usuń
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
