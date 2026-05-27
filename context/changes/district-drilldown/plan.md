# S-02: District Drilldown — Plan

## Goal

FR-006: Użytkownik może przejść do szczegółowego widoku podziału mandatów per okręg.
41 okręgów = information overload → sortowanie/filtrowanie tight races + mapa.

## Phase 1: District list + filter/sort

- [ ] Extract `PARTY_COLORS` to `src/components/party-colors.ts`
- [ ] Create `src/components/DistrictDrilldown.tsx`:
  - Collapsible section below SimulationResults
  - Sort by: district number, name, seats, tight race count
  - Filter: "Tylko tight races"
  - District cards: number + name + stacked bar + tight race badges
- [ ] Wire into `Simulator.tsx`, pass `result.result.districts` + `parties`

## Phase 2: SVG Map visualization

- [ ] Download Wikipedia SVG (CC BY-SA 4.0), clean Inkscape metadata
- [ ] Build path-to-district-number mapping (41 entries, manual visual inspection)
- [ ] Create `src/components/DistrictMap.tsx`:
  - Inline SVG colored by winning party per district
  - Hover tooltip: district name, seat breakdown
  - Highlight tight races
- [ ] Add "Lista / Mapa" toggle in DistrictDrilldown

## Phase 3: Tests

- [ ] Unit tests for sort/filter logic (vitest)

## Data source

`SimulationResult.districts: DistrictSimulationResult[]` — already computed by engine, just not rendered.

## Progress

- Phase 1: pending
- Phase 2: pending
- Phase 3: pending
