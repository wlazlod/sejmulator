/**
 * Coalitions — predefined coalition combinations with seat sums.
 *
 * Shows which coalitions reach the 231 majority threshold.
 */

import { PARTY_COLORS } from "./party-colors";

const MAJORITY = 231;

interface Coalition {
  name: string;
  parties: string[];
}

const COALITIONS: Coalition[] = [
  { name: "KO + Lewica", parties: ["ko", "lewica"] },
  { name: "KO + PL2050", parties: ["ko", "polska2050"] },
  { name: "KO + Lewica + PL2050", parties: ["ko", "lewica", "polska2050"] },
  { name: "KO + Lewica + PSL", parties: ["ko", "lewica", "psl"] },
  { name: "KO + Lewica + PSL + PL2050", parties: ["ko", "lewica", "psl", "polska2050"] },
  { name: "KO + PSL", parties: ["ko", "psl"] },
  { name: "KO + Lewica + PSL + PL2050 + Razem", parties: ["ko", "lewica", "psl", "polska2050", "razem"] },
  { name: "KO + Lewica + Razem", parties: ["ko", "lewica", "razem"] },
  { name: "KO + Konf", parties: ["ko", "konfederacja"] },
  { name: "PiS + Konf", parties: ["pis", "konfederacja"] },
  { name: "PiS + PSL", parties: ["pis", "psl"] },
  { name: "PiS + Konf + PSL", parties: ["pis", "konfederacja", "psl"] },
  { name: "PiS + Konf + KKP", parties: ["pis", "konfederacja", "kkp"] },
  { name: "Konf + KKP", parties: ["konfederacja", "kkp"] },
];

interface CoalitionsProps {
  seats: Record<string, number>;
}

export default function Coalitions({ seats }: CoalitionsProps) {
  const results = COALITIONS.map((coalition) => {
    const totalSeats = coalition.parties.reduce((sum, partyId) => sum + (seats[partyId] ?? 0), 0);
    const hasMajority = totalSeats >= MAJORITY;
    // Only show coalitions where ALL parties have seats (passed threshold)
    const allPartiesPresent = coalition.parties.every((p) => (seats[p] ?? 0) > 0);
    return { ...coalition, totalSeats, hasMajority, allPartiesPresent };
  })
    .filter((c) => c.allPartiesPresent)
    .sort((a, b) => b.totalSeats - a.totalSeats);

  if (results.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 font-semibold">Możliwe koalicje</h2>
      <div className="space-y-1.5">
        {results.map((coalition) => (
          <div
            key={coalition.name}
            className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
              coalition.hasMajority ? "bg-green-50 font-medium" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-0.5">
                {coalition.parties.map((partyId) => (
                  <span
                    key={partyId}
                    className="inline-block h-3 w-3 rounded-full border border-white"
                    style={{ backgroundColor: PARTY_COLORS[partyId] ?? "#6b7280" }}
                  />
                ))}
              </div>
              <span>{coalition.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={coalition.hasMajority ? "text-green-700" : "text-gray-500"}>{coalition.totalSeats}</span>
              {coalition.hasMajority && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">większość</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">Większość bezwzględna: {MAJORITY} mandatów</p>
    </div>
  );
}
