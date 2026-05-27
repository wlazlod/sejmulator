# Implementation Plan: core-simulation (S-01)

## Overview

Pełna ścieżka użytkownika: wpisz sondaż → wybierz model geograficzny → oblicz → zobacz mandaty per partia.

## Phase 1: D'Hondt Engine

### Overview

Czysty silnik obliczeniowy (pure functions, zero UI). Wejście: głosy per partia per okręg + rozmiar okręgu + próg. Wyjście: mandaty per partia.

### Changes Required:

#### 1. Silnik d'Hondta

**File**: `src/lib/dhondt.ts`

**Intent**: Implementacja metody d'Hondta — pure function: (votes per party, seats) → seat allocation. Plus geographic scaling: (national poll %, distribution model, districts) → votes per party per district.

**Contract**:

- `allocateSeats(votes: Map<string, number>, seats: number, threshold?: number): Map<string, number>` — core d'Hondt
- `scaleToDistricts(nationalPoll: PartyPollInput[], distributionModel: ElectionData): DistrictVotes[]` — przeskalowanie sondażu na okręgi
- `simulateElection(nationalPoll: PartyPollInput[], distributionModel: ElectionData, threshold?: number): SimulationResult` — orchestrator

#### 2. Typy symulacji

**File**: `src/lib/types.ts`

**Intent**: Typy wejścia/wyjścia silnika symulacji.

**Contract**: `PartyPollInput` (partyId, percentage, distributionSource), `DistrictVotes`, `SimulationResult` (seats per party, per district, tight races).

### Success Criteria:

#### Automated:

- [ ] 1.1 Unit testy silnika d'Hondta przechodzą (znane wyniki historyczne)
- [ ] 1.2 `npx tsc --noEmit` przechodzi
- [ ] 1.3 Symulacja z danymi parlamentarnymi 2023 odtwarza faktyczny wynik (±2 mandaty na partię)

#### Manual:

- [ ] 1.4 Silnik zwraca sumę mandatów = 460 dla każdego inputu

---

## Phase 2: Poll Input UI

### Overview

Komponent React: formularz z listą partii, suwakami/inputami procentowymi, wyborem modelu dystrybucji.

### Changes Required:

#### 1. Strona symulacji

**File**: `src/pages/index.astro`

**Intent**: Landing page = formularz symulacji. Astro page z React island.

#### 2. Komponent formularza

**File**: `src/components/SimulationForm.tsx`

**Intent**: Lista partii z inputami procentowymi (0-100, suma nie musi = 100 bo partie < próg). Dropdown/radio na model dystrybucji. Przycisk "Oblicz".

**Contract**: Props: `onSimulate(input: PartyPollInput[])`. State: party list, percentages, distribution model per party.

#### 3. Komponent wyników

**File**: `src/components/SimulationResults.tsx`

**Intent**: Wizualizacja mandatów per partia — bar chart lub tabela z kolorami partii. Disclaimer "wyniki poglądowe".

**Contract**: Props: `result: SimulationResult`. Renderuje mandaty, tight races indicator, sumę = 460.

### Success Criteria:

#### Automated:

- [ ] 2.1 `npx tsc --noEmit` przechodzi
- [ ] 2.2 `npm run build` przechodzi
- [ ] 2.3 Lint przechodzi

#### Manual:

- [ ] 2.4 Użytkownik może wpisać sondaż i zobaczyć wynik mandatów
- [ ] 2.5 Wynik pojawia się w < 5 sekund
- [ ] 2.6 Suma mandatów = 460

---

## Phase 3: Integration & Polish

### Overview

Połączenie silnika z UI, edge cases, tight races / confidence interval.

### Changes Required:

#### 1. Confidence interval / tight races

**File**: `src/lib/dhondt.ts` (rozszerzenie)

**Intent**: Prosty heurystyczny CI: perturbacja ±1-2% per okręg, przeliczenie, raportowanie mandatów zmieniających przynależność.

#### 2. Party management

**File**: `src/components/SimulationForm.tsx` (rozszerzenie)

**Intent**: Dodawanie/usuwanie partii, default party list z partyDefaults. FR-002.

#### 3. Responsive design

**Intent**: Mobile-friendly layout. NFR-02.

### Success Criteria:

#### Automated:

- [ ] 3.1 Wszystkie testy przechodzą
- [ ] 3.2 Build przechodzi
- [ ] 3.3 Lint przechodzi

#### Manual:

- [ ] 3.4 Tight races widoczne w wynikach
- [ ] 3.5 Działa na mobile (responsive)
- [ ] 3.6 Disclaimer "wyniki poglądowe" widoczny

---

## References

- PRD: US-01, FR-001 through FR-005
- Data: `src/data/` (from F-01)
- Roadmap: S-01

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands.

### Phase 1: D'Hondt Engine

#### Automated

- [ ] 1.1 Unit testy silnika d'Hondta przechodzą
- [ ] 1.2 `npx tsc --noEmit` przechodzi
- [ ] 1.3 Symulacja odtwarza wynik parlamentarnych 2023 (±2 mandaty)

#### Manual

- [ ] 1.4 Suma mandatów = 460

### Phase 2: Poll Input UI

#### Automated

- [ ] 2.1 `npx tsc --noEmit` przechodzi
- [ ] 2.2 `npm run build` przechodzi
- [ ] 2.3 Lint przechodzi

#### Manual

- [ ] 2.4 Użytkownik może wpisać sondaż i zobaczyć mandaty
- [ ] 2.5 Wynik w < 5s
- [ ] 2.6 Suma mandatów = 460

### Phase 3: Integration & Polish

#### Automated

- [ ] 3.1 Testy przechodzą
- [ ] 3.2 Build przechodzi
- [ ] 3.3 Lint przechodzi

#### Manual

- [ ] 3.4 Tight races widoczne
- [ ] 3.5 Mobile-friendly
- [ ] 3.6 Disclaimer widoczny
