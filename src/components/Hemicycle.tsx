/**
 * Hemicycle — SVG semicircular parliament visualization.
 *
 * 460 seats arranged in concentric semicircular arcs (like the Sejm chamber).
 * Fixed left-to-right political order: Razem → Lewica → KO → PL2050 → PSL → PiS → Konf → KKP.
 * Parties with 0 mandates are skipped (no gaps).
 */

import { useMemo } from "react";
import { PARTY_COLORS } from "./party-colors";

/** Fixed political order from left to right */
const PARTY_ORDER = ["razem", "lewica", "ko", "polska2050", "psl", "pis", "konfederacja", "kkp"];

interface HemicycleProps {
  /** Seats per party from simulation result */
  seats: Record<string, number>;
}

interface SeatPosition {
  x: number;
  y: number;
  partyId: string;
}

/**
 * Generate seat positions in concentric semicircular rows.
 * Outer rows have more seats, inner rows fewer.
 */
function generateSeatPositions(totalSeats: number): { row: number; col: number; total: number }[] {
  // Determine row sizes — outer rows are bigger
  // For 460 seats, ~10 rows works well
  const numRows = 10;
  const innerRadius = 4;
  const outerRadius = 10;

  // Calculate seats per row proportionally to arc length (proportional to radius)
  const radii = Array.from(
    { length: numRows },
    (_, i) => innerRadius + (outerRadius - innerRadius) * (i / (numRows - 1)),
  );
  const totalArc = radii.reduce((s, r) => s + r, 0);
  const rawSeatsPerRow = radii.map((r) => Math.round((r / totalArc) * totalSeats));

  // Adjust to exactly totalSeats
  let assigned = rawSeatsPerRow.reduce((s, v) => s + v, 0);
  const diff = totalSeats - assigned;
  // Add/remove from the largest row
  rawSeatsPerRow[rawSeatsPerRow.length - 1] += diff;
  assigned = totalSeats;

  // Generate positions
  const positions: { row: number; col: number; total: number }[] = [];
  for (let row = 0; row < numRows; row++) {
    const seatsInRow = rawSeatsPerRow[row];
    for (let col = 0; col < seatsInRow; col++) {
      positions.push({ row, col, total: seatsInRow });
    }
  }

  return positions;
}

/**
 * Convert row/col to x,y coordinates on a semicircle.
 */
function positionToXY(row: number, col: number, totalInRow: number, numRows: number): { x: number; y: number } {
  const innerRadius = 35;
  const outerRadius = 95;
  const radius = innerRadius + (outerRadius - innerRadius) * (row / (numRows - 1));

  // Angle: distribute across semicircle (π radians) with padding
  const padding = 0.08; // Small padding at edges
  const angleRange = Math.PI - 2 * padding;
  const angle = padding + (totalInRow > 1 ? (col / (totalInRow - 1)) * angleRange : angleRange / 2);

  // Convert to cartesian (flip so leftmost = π, rightmost = 0)
  const x = 100 - radius * Math.cos(angle);
  const y = 100 - radius * Math.sin(angle);

  return { x, y };
}

export default function Hemicycle({ seats }: HemicycleProps) {
  const seatPositions = useMemo(() => {
    const totalSeats = Object.values(seats).reduce((s, v) => s + v, 0);
    if (totalSeats === 0) return [];

    // Build ordered seat list (by political order, skip parties with 0)
    const orderedSeats: string[] = [];
    for (const partyId of PARTY_ORDER) {
      const count = seats[partyId] ?? 0;
      for (let i = 0; i < count; i++) {
        orderedSeats.push(partyId);
      }
    }
    // Add any parties not in PARTY_ORDER at the end
    for (const [partyId, count] of Object.entries(seats)) {
      if (!PARTY_ORDER.includes(partyId) && count > 0) {
        for (let i = 0; i < count; i++) {
          orderedSeats.push(partyId);
        }
      }
    }

    // Generate geometric positions
    const positions = generateSeatPositions(orderedSeats.length);
    const numRows = 10;

    // Map seats to positions
    const result: SeatPosition[] = [];
    for (let i = 0; i < orderedSeats.length; i++) {
      const pos = positions[i];
      if (!pos) continue;
      const { x, y } = positionToXY(pos.row, pos.col, pos.total, numRows);
      result.push({ x, y, partyId: orderedSeats[i] });
    }

    return result;
  }, [seats]);

  if (seatPositions.length === 0) return null;

  // Build legend from parties that have seats
  const partiesWithSeats = PARTY_ORDER.filter((id) => (seats[id] ?? 0) > 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-center font-semibold">Sejm RP — 460 mandatów</h2>

      <svg viewBox="0 0 200 110" className="mx-auto w-full max-w-lg" role="img" aria-label="Wizualizacja Sejmu">
        {seatPositions.map((seat, i) => (
          <circle key={i} cx={seat.x} cy={seat.y} r={1.4} fill={PARTY_COLORS[seat.partyId] ?? "#6b7280"} />
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-600">
        {partiesWithSeats.map((id) => (
          <span key={id} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: PARTY_COLORS[id] ?? "#6b7280" }}
            />
            {id === "konfederacja" ? "Konf" : id === "polska2050" ? "PL2050" : id.charAt(0).toUpperCase() + id.slice(1)}{" "}
            ({seats[id]})
          </span>
        ))}
      </div>
    </div>
  );
}
