# S-02: District Drilldown — Plan

## Goal

FR-006: Użytkownik może przejść do szczegółowego widoku podziału mandatów per okręg.
41 okręgów = information overload → sortowanie/filtrowanie tight races + mapa.

## Phase 1: District list + filter/sort

- [x] Extract `PARTY_COLORS` to `src/components/party-colors.ts`
- [x] Create `src/components/DistrictDrilldown.tsx`:
  - Collapsible section below SimulationResults
  - Sort by: district number, name, seats, tight race count
  - Filter: "Tylko tight races"
  - District cards: number + name + stacked bar + tight race badges
- [x] Wire into `Simulator.tsx`, pass `result.result.districts` + `parties`

## Phase 2: SVG Map visualization

- [x] Download Wikipedia SVG (CC BY-SA 4.0), extract paths to JSON
- [x] Build path-to-district-number mapping (41 entries, centroid matching)
- [x] Create `src/components/DistrictMap.tsx`:
  - Inline SVG colored by winning party per district
  - Hover tooltip: district name, seat breakdown
  - Highlight tight races (dashed amber border)
- [x] Add "Mapa / Lista" toggle + party color legend in DistrictDrilldown

## Phase 3: Tests

- [x] Unit tests for map data integrity + sort/filter logic (8 tests)

## Data source

`SimulationResult.districts: DistrictSimulationResult[]` — already computed by engine, just not rendered.

## Progress

- Phase 1: done (commit `5a318ca`)
- Phase 2: done (commit `34ae008`)
- Phase 3: done (commit pending)

## Known issues

- District-to-path mapping was built via automated centroid matching. Some districts
  in dense areas (Silesia cluster: 27-32) may be swapped. Visual inspection needed
  after running the app — corrections go in `district-map-data.ts`.
