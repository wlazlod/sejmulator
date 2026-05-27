/**
 * Hemicycle — SVG semicircular parliament visualization.
 *
 * 460 seats arranged in concentric semicircular arcs (like the Sejm chamber).
 * Fixed left-to-right political order: Razem → Lewica → KO → PL2050 → PSL → PiS → Konf → KKP.
 * Coloring goes column-wise (by angle) from left to right across all rows,
 * matching the Wikipedia-style Polish Sejm diagram.
 */

import { useMemo } from "react";
import { PARTY_COLORS } from "./party-colors";

/** Fixed political order from left to right */
const PARTY_ORDER = ["razem", "lewica", "ko", "polska2050", "psl", "pis", "konfederacja", "kkp"];

interface HemicycleProps {
  seats: Record<string, number>;
}

interface SeatDot {
  x: number;
  y: number;
  angle: number;
  partyId: string;
}

export default function Hemicycle({ seats }: HemicycleProps) {
  const seatPositions = useMemo(() => {
    const totalSeats = Object.values(seats).reduce((s, v) => s + v, 0);
    if (totalSeats === 0) return [];

    // --- Geometry: 10 semicircular rows with center gap ---
    const numRows = 10;
    const innerRadius = 30;
    const outerRadius = 95;
    const edgePadding = 0.05; // angular padding at edges (radians)
    const centerGap = 0.08; // angular gap at center (majority threshold)

    // Seats per row proportional to radius (arc length)
    const radii = Array.from(
      { length: numRows },
      (_, i) => innerRadius + (outerRadius - innerRadius) * (i / (numRows - 1)),
    );
    const totalArc = radii.reduce((s, r) => s + r, 0);
    const rawSeatsPerRow = radii.map((r) => Math.round((r / totalArc) * totalSeats));

    // Adjust to exact total
    let assigned = rawSeatsPerRow.reduce((s, v) => s + v, 0);
    rawSeatsPerRow[rawSeatsPerRow.length - 1] += totalSeats - assigned;

    // Generate all dot positions with their angle
    // Each row is split into left half and right half with a gap at π/2
    const dots: { x: number; y: number; angle: number }[] = [];
    for (let row = 0; row < numRows; row++) {
      const seatsInRow = rawSeatsPerRow[row];
      const radius = radii[row];

      // Split seats: left half and right half
      const leftSeats = Math.ceil(seatsInRow / 2);
      const rightSeats = seatsInRow - leftSeats;

      // Left sector: angle from π-edgePadding down to π/2+centerGap
      const leftStart = Math.PI - edgePadding;
      const leftEnd = Math.PI / 2 + centerGap;
      for (let col = 0; col < leftSeats; col++) {
        const angle =
          leftSeats > 1 ? leftStart - (col / (leftSeats - 1)) * (leftStart - leftEnd) : (leftStart + leftEnd) / 2;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 - radius * Math.sin(angle);
        dots.push({ x, y, angle });
      }

      // Right sector: angle from π/2-centerGap down to edgePadding
      const rightStart = Math.PI / 2 - centerGap;
      const rightEnd = edgePadding;
      for (let col = 0; col < rightSeats; col++) {
        const angle =
          rightSeats > 1
            ? rightStart - (col / (rightSeats - 1)) * (rightStart - rightEnd)
            : (rightStart + rightEnd) / 2;
        const x = 100 + radius * Math.cos(angle);
        const y = 100 - radius * Math.sin(angle);
        dots.push({ x, y, angle });
      }
    }

    // Sort all dots by angle descending (π→0 = left→right)
    dots.sort((a, b) => b.angle - a.angle);

    // Build ordered party list (L→R)
    const orderedParties: string[] = [];
    for (const partyId of PARTY_ORDER) {
      const count = seats[partyId] ?? 0;
      for (let i = 0; i < count; i++) orderedParties.push(partyId);
    }
    // Any extra parties not in PARTY_ORDER
    for (const [partyId, count] of Object.entries(seats)) {
      if (!PARTY_ORDER.includes(partyId) && count > 0) {
        for (let i = 0; i < count; i++) orderedParties.push(partyId);
      }
    }

    // Assign parties to sorted dot positions
    const result: SeatDot[] = dots.map((dot, i) => ({
      ...dot,
      partyId: orderedParties[i] ?? "unknown",
    }));

    return result;
  }, [seats]);

  if (seatPositions.length === 0) return null;

  const partiesWithSeats = PARTY_ORDER.filter((id) => (seats[id] ?? 0) > 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-2 text-center font-semibold">Sejm RP — 460 mandatów</h2>

      <svg viewBox="0 0 200 110" className="mx-auto w-full max-w-lg" role="img" aria-label="Wizualizacja Sejmu">
        {seatPositions.map((seat, i) => (
          <circle key={i} cx={seat.x} cy={seat.y} r={1.6} fill={PARTY_COLORS[seat.partyId] ?? "#6b7280"} />
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
