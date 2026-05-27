/**
 * Sejmulator - main simulation app (React island).
 *
 * Handles: party input form, simulation execution, results display.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { partyDefaults } from "../data/party-mapping";
import type { PartyDefault } from "../data/party-mapping";
import { elections } from "../data/index";
import type { PartyPollInput } from "../lib/types";
import type { ElectionData } from "../data/types";
import { simulateWithConfidence } from "../lib/confidence";
import type { SimulationWithCI } from "../lib/confidence";
import type { SharedPartyInput } from "../lib/share-types";
import DistrictDrilldown from "./DistrictDrilldown";
import Hemicycle from "./Hemicycle";

interface PartyRow {
  id: string;
  displayName: string;
  shortName: string;
  percentage: number;
  distributionId: string; // "electionId:partyId"
}

function parseDistributionId(id: string): { electionId: string; partyId: string } {
  const colonIdx = id.indexOf(":");
  return {
    electionId: id.slice(0, colonIdx),
    partyId: id.slice(colonIdx + 1),
  };
}

function getDefaultParties(): PartyRow[] {
  // Default set: PiS, KO, TD/PL2050, Lewica, Konfederacja
  const defaults: { id: string; pct: number }[] = [
    { id: "pis", pct: 30 },
    { id: "ko", pct: 30 },
    { id: "polska2050", pct: 12 },
    { id: "lewica", pct: 8 },
    { id: "konfederacja", pct: 12 },
  ];

  return defaults.map(({ id, pct }) => {
    const def = partyDefaults[id];
    return {
      id,
      displayName: def.displayName,
      shortName: def.shortName,
      percentage: pct,
      distributionId: def.defaultDistribution,
    };
  });
}

import { PARTY_COLORS } from "./party-colors";

interface SimulatorProps {
  sharedParties?: SharedPartyInput[] | null;
}

export default function Simulator({ sharedParties }: SimulatorProps) {
  const [parties, setParties] = useState<PartyRow[]>(() => {
    if (sharedParties && sharedParties.length > 0) {
      return sharedParties.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        shortName: p.shortName,
        percentage: p.percentage,
        distributionId: p.distributionId,
      }));
    }
    return getDefaultParties();
  });
  const [result, setResult] = useState<SimulationWithCI | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const electionDatasets = useMemo(() => {
    return elections as unknown as Record<string, ElectionData>;
  }, []);

  const handleSimulate = useCallback(() => {
    const poll: PartyPollInput[] = parties
      .filter((p) => p.percentage > 0)
      .map((p) => {
        const { electionId, partyId } = parseDistributionId(p.distributionId);
        return {
          partyId: p.id,
          partyName: p.shortName,
          percentage: p.percentage,
          distributionElectionId: electionId,
          distributionPartyId: partyId,
        };
      });

    const simResult = simulateWithConfidence(poll, electionDatasets, 5);
    setResult(simResult);
  }, [parties, electionDatasets]);

  const updatePercentage = useCallback((id: string, value: number) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, percentage: value } : p)));
  }, []);

  const updateDistribution = useCallback((id: string, distributionId: string) => {
    setParties((prev) => prev.map((p) => (p.id === id ? { ...p, distributionId } : p)));
  }, []);

  const removeParty = useCallback((id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addParty = useCallback((id: string) => {
    const def = partyDefaults[id] as PartyDefault | undefined;
    if (!def) return;
    setParties((prev) => [
      ...prev,
      {
        id,
        displayName: def.displayName,
        shortName: def.shortName,
        percentage: 5,
        distributionId: def.defaultDistribution,
      },
    ]);
  }, []);

  const handleShare = useCallback(async () => {
    if (!result) return;
    setSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parties }),
      });
      if (!res.ok) throw new Error("Share failed");
      const data = (await res.json()) as { url: string };
      setShareUrl(data.url);
    } catch {
      alert("Nie udało się utworzyć linku.");
    } finally {
      setSharing(false);
    }
  }, [result, parties]);

  const copyShareUrl = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
  }, [shareUrl]);

  // Auto-simulate when loaded from a shared link
  useEffect(() => {
    if (sharedParties && sharedParties.length > 0) {
      handleSimulate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableToAdd = Object.keys(partyDefaults).filter((id) => !parties.some((p) => p.id === id));

  const totalPercentage = parties.reduce((s, p) => s + p.percentage, 0);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Sejmulator</h1>
      <p className="mb-6 text-sm text-gray-600">
        Symulacja podziału mandatów w Sejmie metodą d&apos;Hondta na podstawie sondażu i historycznej geografii
        poparcia.
      </p>

      {/* Poll Input */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Wyniki sondażu</h2>
        <div className="space-y-3">
          {parties.map((party) => (
            <PartyInput
              key={party.id}
              party={party}
              onPercentageChange={updatePercentage}
              onDistributionChange={updateDistribution}
              onRemove={removeParty}
            />
          ))}
        </div>

        {availableToAdd.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500">Dodaj:</span>
            {availableToAdd.map((id) => (
              <button
                key={id}
                onClick={() => {
                  addParty(id);
                }}
                className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
              >
                + {partyDefaults[id].shortName}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className={`text-sm ${totalPercentage > 100 ? "font-bold text-red-600" : "text-gray-500"}`}>
            Suma: {totalPercentage.toFixed(1)}%
          </span>
          <button
            onClick={handleSimulate}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Oblicz mandaty
          </button>
        </div>
      </div>

      {/* Results */}
      {result && <SimulationResults result={result} parties={parties} />}

      {/* Hemicycle */}
      {result && (
        <div className="mt-4">
          <Hemicycle seats={result.result.seats} />
        </div>
      )}

      {/* Share */}
      {result && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {sharing ? "Udostępnianie..." : "Udostępnij"}
          </button>
          {shareUrl && (
            <div className="flex items-center gap-2 rounded border bg-gray-50 px-3 py-1.5 text-sm">
              <span className="max-w-[200px] truncate sm:max-w-none">{shareUrl}</span>
              <button onClick={copyShareUrl} className="text-blue-600 hover:text-blue-800" title="Kopiuj">
                Kopiuj
              </button>
            </div>
          )}
        </div>
      )}

      {/* District Drilldown */}
      {result && (
        <DistrictDrilldown
          districts={result.result.districts}
          parties={parties.map((p) => ({ id: p.id, shortName: p.shortName }))}
        />
      )}

      {/* Disclaimer */}
      <p className="mt-4 text-center text-xs text-gray-400">
        Wyniki poglądowe — symulacja, nie prognoza. Dane historyczne z PKW.
      </p>
    </div>
  );
}

function PartyInput({
  party,
  onPercentageChange,
  onDistributionChange,
  onRemove,
}: {
  party: PartyRow;
  onPercentageChange: (id: string, v: number) => void;
  onDistributionChange: (id: string, dist: string) => void;
  onRemove: (id: string) => void;
}) {
  const def = partyDefaults[party.id];
  const allDistributions = [def.defaultDistribution, ...def.alternativeDistributions];

  return (
    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
      <div
        className="h-3 w-3 flex-shrink-0 rounded-full"
        style={{ backgroundColor: PARTY_COLORS[party.id] ?? "#6b7280" }}
      />
      <span className="w-16 flex-shrink-0 text-sm font-medium sm:w-20">{party.shortName}</span>
      <input
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={party.percentage}
        onChange={(e) => {
          onPercentageChange(party.id, parseFloat(e.target.value) || 0);
        }}
        className="w-16 rounded border px-2 py-1 text-right text-sm"
      />
      <span className="text-sm text-gray-400">%</span>
      <select
        value={party.distributionId}
        onChange={(e) => {
          onDistributionChange(party.id, e.target.value);
        }}
        className="min-w-0 flex-1 rounded border px-2 py-1 text-xs text-gray-600"
      >
        {allDistributions.map((dist) => (
          <option key={dist} value={dist}>
            {formatDistributionLabel(dist)}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          onRemove(party.id);
        }}
        className="text-lg leading-none text-gray-400 hover:text-red-500"
        title="Usuń"
      >
        ×
      </button>
    </div>
  );
}

function formatDistributionLabel(dist: string): string {
  const { electionId, partyId } = parseDistributionId(dist);
  const electionLabel = electionId.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase());
  const partyLabel = partyId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 30);
  return `${partyLabel} (${electionLabel})`;
}

function SimulationResults({ result, parties }: { result: SimulationWithCI; parties: PartyRow[] }) {
  const { result: sim, confidence } = result;
  const sortedSeats = Object.entries(sim.seats).sort((a, b) => b[1] - a[1]);
  const maxSeats = sortedSeats[0]?.[1] ?? 1;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-1 font-semibold">Wynik: {sim.totalSeats} mandatów</h2>
      {sim.tightRaces.length > 0 && (
        <p className="mb-3 text-xs text-amber-600">{sim.tightRaces.length} mandat(ów) z bardzo bliskim rezultatem</p>
      )}

      <div className="space-y-2">
        {sortedSeats.map(([partyId, seats]) => {
          const party = parties.find((p) => p.id === partyId);
          const color = PARTY_COLORS[partyId] ?? "#6b7280";
          const barWidth = (seats / maxSeats) * 100;
          const ci = confidence[partyId];
          const hasRange = ci.min !== ci.max;

          return (
            <div key={partyId} className="flex items-center gap-2">
              <span className="w-16 flex-shrink-0 text-right text-sm font-medium sm:w-20">
                {party?.shortName ?? partyId}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-gray-100">
                <div className="h-full rounded" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold">
                  {seats}
                  {hasRange && (
                    <span className="ml-1 font-normal text-gray-500">
                      ({ci.min}–{ci.max})
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Majority line */}
      <div className="mt-3 border-t pt-3 text-sm text-gray-600">
        <p>
          Większość bezwzględna: 231 mandatów.{" "}
          {sortedSeats[0] && sortedSeats[0][1] >= 231
            ? `${parties.find((p) => p.id === sortedSeats[0][0])?.shortName ?? sortedSeats[0][0]} ma samodzielną większość.`
            : "Żadna partia nie ma samodzielnej większości."}
        </p>
      </div>
    </div>
  );
}
