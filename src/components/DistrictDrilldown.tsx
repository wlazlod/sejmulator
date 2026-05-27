/**
 * DistrictDrilldown — per-district seat breakdown with sort/filter and map view.
 *
 * Renders below SimulationResults. Shows 41 districts via a list or an
 * interactive SVG map of Poland. Supports sorting, filtering by tight races.
 */

import { useState, useMemo } from "react";
import type { DistrictSimulationResult } from "../lib/types";
import { PARTY_COLORS } from "./party-colors";
import DistrictMap from "./DistrictMap";

type SortKey = "number" | "name" | "seats" | "tightRaces";
type ViewMode = "map" | "list";

interface PartyInfo {
  id: string;
  shortName: string;
}

interface DistrictDrilldownProps {
  districts: DistrictSimulationResult[];
  parties: PartyInfo[];
}

export default function DistrictDrilldown({ districts, parties }: DistrictDrilldownProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [filterTightRaces, setFilterTightRaces] = useState(false);

  const totalTightRaces = useMemo(() => districts.reduce((sum, d) => sum + d.tightRaces.length, 0), [districts]);

  const filtered = useMemo(() => {
    let result = [...districts];
    if (filterTightRaces) {
      result = result.filter((d) => d.tightRaces.length > 0);
    }
    result.sort((a, b) => {
      switch (sortKey) {
        case "number":
          return a.districtNumber - b.districtNumber;
        case "name":
          return a.districtName.localeCompare(b.districtName, "pl");
        case "seats":
          return b.districtSize - a.districtSize;
        case "tightRaces":
          return b.tightRaces.length - a.tightRaces.length;
      }
    });
    return result;
  }, [districts, sortKey, filterTightRaces]);

  const partyNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of parties) {
      map[p.id] = p.shortName;
    }
    return map;
  }, [parties]);

  if (!expanded) {
    return (
      <div className="mt-4">
        <button
          onClick={() => {
            setExpanded(true);
          }}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Pokaż okręgi ({districts.length} okręgów
          {totalTightRaces > 0 && `, ${totalTightRaces} bardzo bliskich rezultatów`})
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Okręgi wyborcze</h2>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded border border-gray-200">
            <button
              onClick={() => {
                setViewMode("map");
              }}
              className={`px-2.5 py-1 text-xs ${viewMode === "map" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Mapa
            </button>
            <button
              onClick={() => {
                setViewMode("list");
              }}
              className={`px-2.5 py-1 text-xs ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => {
              setExpanded(false);
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Zwiń
          </button>
        </div>
      </div>

      {/* Map view */}
      {viewMode === "map" && <DistrictMap districts={districts} parties={parties} />}

      {/* List view */}
      {viewMode === "list" && (
        <>
          {/* Controls */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Sortuj:</label>
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value as SortKey);
                }}
                className="rounded border px-2 py-1 text-xs"
              >
                <option value="number">Nr okręgu</option>
                <option value="name">Nazwa</option>
                <option value="seats">Liczba mandatów</option>
                <option value="tightRaces">Bliski rezultat</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={filterTightRaces}
                onChange={(e) => {
                  setFilterTightRaces(e.target.checked);
                }}
                className="rounded"
              />
              Tylko bliskie rezultaty
            </label>
          </div>

          {/* District list */}
          <div className="space-y-2">
            {filtered.map((district) => (
              <DistrictCard key={district.districtNumber} district={district} partyNameMap={partyNameMap} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">Brak okręgów spełniających kryteria.</p>
          )}
        </>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t pt-2 text-xs text-gray-500">
        {parties.map((p) => (
          <span key={p.id} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: PARTY_COLORS[p.id] ?? "#6b7280" }}
            />
            {p.shortName}
          </span>
        ))}
      </div>
    </div>
  );
}

function DistrictCard({
  district,
  partyNameMap,
}: {
  district: DistrictSimulationResult;
  partyNameMap: Record<string, string>;
}) {
  const seatEntries = Object.entries(district.seats)
    .filter(([, seats]) => seats > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded border border-gray-100 p-2.5">
      {/* Header row */}
      <div className="mb-1.5 flex items-baseline justify-between">
        <div className="text-sm">
          <span className="font-medium text-gray-500">#{district.districtNumber}</span>{" "}
          <span className="font-medium">{district.districtName}</span>
          <span className="ml-1.5 text-xs text-gray-400">({district.districtSize} mandatów)</span>
        </div>
        {district.tightRaces.length > 0 && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
            {district.tightRaces.length} bliski
          </span>
        )}
      </div>

      {/* Stacked bar */}
      <div className="mb-1 flex h-5 overflow-hidden rounded bg-gray-100">
        {seatEntries.map(([partyId, seats]) => {
          const width = (seats / district.districtSize) * 100;
          const color = PARTY_COLORS[partyId] ?? "#6b7280";
          return (
            <div
              key={partyId}
              className="flex items-center justify-center text-[10px] font-bold text-white"
              style={{ width: `${width}%`, backgroundColor: color }}
              title={`${partyNameMap[partyId] ?? partyId}: ${seats}`}
            >
              {seats >= 2 ? seats : ""}
            </div>
          );
        })}
      </div>

      {/* Seat breakdown text */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
        {seatEntries.map(([partyId, seats]) => (
          <span key={partyId}>
            <span
              className="mr-0.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: PARTY_COLORS[partyId] ?? "#6b7280" }}
            />
            {partyNameMap[partyId] ?? partyId} {seats}
          </span>
        ))}
      </div>

      {/* Bardzo bliski rezultat */}
      {district.tightRaces.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {district.tightRaces.map((tr, i) => (
            <div key={i} className="text-xs text-amber-600">
              <span className="font-medium">{partyNameMap[tr.currentHolder] ?? tr.currentHolder}</span> zdobywa ostatni
              mandat przed <span className="font-medium">{partyNameMap[tr.challenger] ?? tr.challenger}</span>
              <span className="ml-1 text-amber-400">
                (iloraz: {tr.lastWonQuotient.toFixed(0)} vs {tr.firstLostQuotient.toFixed(0)}, margines{" "}
                {((tr.margin - 1) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
