# S-04: Interpretation Layer — Plan

## Goal

FR-008–FR-014: Warstwa interpretacyjna nad wynikami symulacji — hemicycle, koalicje, próg, niezdecydowani, konfigurowalny CI.

## Phase 1: Engine changes (FR-011, FR-012, FR-013, FR-014)

- [ ] Create `src/lib/normalization.ts` — `normalizePolls(parties, undecided, otherParties)` → realPercentages
- [ ] Modify `src/lib/confidence.ts` — próg+CI logic: if perturbation puts party < 5% → min = 0
- [ ] Wire `perturbationPct` as user-facing param (already accepted, needs plumbing)
- [ ] "Inne partie" — add as virtual party below threshold (d'Hondt threshold filter handles naturally)
- [ ] Unit tests for normalization + próg edge cases

## Phase 2: Tight races → "Bardzo bliski rezultat" (FR-008)

- [ ] Add `lastWonQuotient` / `firstLostQuotient` to `TightRace` type
- [ ] Update `detectTightRaces` to store both quotients + human-readable margin
- [ ] Rename "tight races" → "bardzo bliski rezultat" in all UI strings
- [ ] Show margin info (last won vs first lost) in DistrictDrilldown

## Phase 3: Hemicycle visualization (FR-009)

- [ ] Create `src/components/Hemicycle.tsx` — SVG semicircle with 460 dots
- [ ] Algorithm: concentric arcs, fixed L→P order (Razem→Lewica→KO→PL2050→PSL→PiS→Konf→KKP)
- [ ] Color by PARTY_COLORS, skip parties with 0 mandates
- [ ] Responsive SVG viewport (min 320px mobile)
- [ ] Place between SimulationResults and Share button

## Phase 4: Coalitions + UI integration (FR-010 + wiring)

- [ ] Create `src/components/Coalitions.tsx` — 11 predefined coalitions, sum seats, mark ≥231
- [ ] Add `undecided` / `otherParties` / `perturbationPct` state to Simulator.tsx
- [ ] Show "realne %" alongside sondażowe in input section
- [ ] Ensure PARTY_COLORS has entries for razem + kkp
- [ ] Build + test pass

## Coalitions definition

```ts
const COALITIONS = [
  { name: "KO + Lewica", parties: ["ko", "lewica"] },
  { name: "KO + Lewica + PSL", parties: ["ko", "lewica", "psl"] },
  { name: "KO + Lewica + PSL + PL2050", parties: ["ko", "lewica", "psl", "polska2050"] },
  { name: "KO + PSL", parties: ["ko", "psl"] },
  { name: "KO + Lewica + PSL + PL2050 + Razem", parties: ["ko", "lewica", "psl", "polska2050", "razem"] },
  { name: "KO + Lewica + Razem", parties: ["ko", "lewica", "razem"] },
  { name: "KO + Konf", parties: ["ko", "konfederacja"] },
  { name: "PiS + PSL", parties: ["pis", "psl"] },
  { name: "PiS + Konf + PSL", parties: ["pis", "konfederacja", "psl"] },
  { name: "PiS + Konf + KKP", parties: ["pis", "konfederacja", "kkp"] },
  { name: "Konf + KKP", parties: ["konfederacja", "kkp"] },
];
```

## Hemicycle order (L→P)

razem → lewica → ko → polska2050 → psl → pis → konfederacja → kkp

## Progress

- Phase 1: pending
- Phase 2: pending
- Phase 3: pending
- Phase 4: pending
