/**
 * DistrictMap — interactive SVG map of Poland's 41 Sejm electoral districts.
 *
 * Each district is colored by the winning party. Hovering shows a tooltip
 * with district name and seat breakdown. Tight races are highlighted with
 * a dashed border.
 *
 * SVG source: Wikimedia Commons, CC BY-SA 4.0 (author: Lukasb1992)
 */

import { useState, useMemo } from "react";
import type { DistrictSimulationResult } from "../lib/types";
import { PARTY_COLORS } from "./party-colors";
import { PATH_TO_DISTRICT } from "./district-map-data";
import districtPaths from "./district-paths.json";

interface PartyInfo {
  id: string;
  shortName: string;
}

interface DistrictMapProps {
  districts: DistrictSimulationResult[];
  parties: PartyInfo[];
}

/** The SVG layer transform applied to all district paths */
const LAYER_TRANSFORM = "translate(-291.22748,-132.02086)";

export default function DistrictMap({ districts, parties }: DistrictMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);

  const partyNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of parties) {
      map[p.id] = p.shortName;
    }
    return map;
  }, [parties]);

  /** Map district number → simulation result */
  const districtMap = useMemo(() => {
    const map: Record<number, DistrictSimulationResult> = {};
    for (const d of districts) {
      map[d.districtNumber] = d;
    }
    return map;
  }, [districts]);

  /** Get the winning party for a district */
  function getWinnerColor(districtNum: number): string {
    const d = districtMap[districtNum];
    if (!d) return "#e5e7eb";
    const entries = Object.entries(d.seats);
    if (entries.length === 0) return "#e5e7eb";
    const winner = entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best));
    return PARTY_COLORS[winner[0]] ?? "#6b7280";
  }

  /** Check if district has tight races */
  function hasTightRaces(districtNum: number): boolean {
    const d = districtMap[districtNum];
    return d ? d.tightRaces.length > 0 : false;
  }

  const hoveredData = hoveredDistrict ? districtMap[hoveredDistrict] : null;

  return (
    <div className="relative">
      <svg viewBox="-200 -140 1080 1000" className="w-full" style={{ maxHeight: "500px" }}>
        <g transform={LAYER_TRANSFORM}>
          {districtPaths.map((path: { id: string; d: string }) => {
            const districtNum = PATH_TO_DISTRICT[path.id];
            if (!districtNum) return null;
            const isHovered = hoveredDistrict === districtNum;
            const color = getWinnerColor(districtNum);
            const tight = hasTightRaces(districtNum);

            return (
              <path
                key={path.id}
                d={path.d}
                fill={isHovered ? adjustBrightness(color, 1.3) : color}
                stroke={tight ? "#f59e0b" : "#333333"}
                strokeWidth={isHovered ? 2 : tight ? 1.5 : 0.5}
                strokeLinejoin="round"
                strokeDasharray={tight ? "4,2" : undefined}
                style={{ cursor: "pointer", transition: "fill 0.15s" }}
                onMouseEnter={() => {
                  setHoveredDistrict(districtNum);
                }}
                onMouseLeave={() => {
                  setHoveredDistrict(null);
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hoveredData && (
        <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-lg">
          <div className="font-medium">
            #{hoveredData.districtNumber} {hoveredData.districtName}
          </div>
          <div className="text-xs text-gray-500">{hoveredData.districtSize} mandatów</div>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
            {Object.entries(hoveredData.seats)
              .filter(([, s]) => s > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([partyId, seats]) => (
                <span key={partyId}>
                  <span
                    className="mr-0.5 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: PARTY_COLORS[partyId] ?? "#6b7280" }}
                  />
                  {partyNameMap[partyId] ?? partyId} {seats}
                </span>
              ))}
          </div>
          {hoveredData.tightRaces.length > 0 && (
            <div className="mt-1 text-xs text-amber-600">{hoveredData.tightRaces.length} tight race(s)</div>
          )}
        </div>
      )}
    </div>
  );
}

/** Lighten/darken a hex color */
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * factor)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}
