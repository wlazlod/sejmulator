# PKW Historical Data Preparation — Implementation Plan

## Overview

Przygotowanie historycznych danych wyborczych PKW (parlamentarne 2023 + 2019, prezydenckie 2025 + 2020) dla 41 okręgów wyborczych jako statycznych plików JSON w `src/data/`. Dane będą konsumowane client-side przez silnik symulacji (S-01). Skrypt przetwarzający w `scripts/` zapewnia powtarzalność, a testy spójności weryfikują integralność danych.

## Current State Analysis

- Codebase to świeży scaffold Astro + React — brak jakichkolwiek danych domenowych
- Brak `src/data/`, brak typów związanych z wyborami, brak skryptów przetwarzających
- Supabase client istnieje ale nie będzie użyty do danych historycznych (decyzja: static JSON)
- Brak dependencies do parsowania danych (np. Papa Parse, xlsx)

## Desired End State

Po zakończeniu tego planu:

- `src/data/` zawiera 4 pliki JSON (po jednym per wybory) ze strukturyzowanymi danymi per okręg per partia
- `src/data/party-mapping.ts` definiuje mapowanie nazw partii między wyborami
- `src/data/types.ts` eksportuje typy TypeScript dla danych wyborczych
- `src/data/index.ts` eksportuje wszystko jako moduł
- `scripts/prepare-pkw-data.ts` przetwarza surowe dane PKW → docelowe JSONy (powtarzalnie)
- Testy spójności weryfikują: sumy głosów, rozmiary okręgów, brak NaN/undefined

### Key Discoveries:

- Dane PKW są publiczne na `wybory.gov.pl` w formacie CSV/XLSX per okręg
- 41 okręgów parlamentarnych ma stałe numery (1-41) i przypisane rozmiary (liczba mandatów per okręg)
- Partie zmieniają nazwy między wyborami — potrzebny plik mapowania
- Dane prezydenckie mają inną strukturę (2 kandydatów w II turze vs. listy w parlamentarnych) — ale potrzebujemy I tury per okręg
- Łączny rozmiar danych: ~4 wybory × 41 okręgów × ~8-15 partii × kilka pól = szacunkowo 50-150KB per plik

## What We're NOT Doing

- Implementacja silnika d'Hondta (to S-01)
- UI do wyboru modelu (to S-01)
- Automatyczny scraping/import z PKW (to Non-Goal w PRD)
- Obsługa wyborów samorządowych/europarlamentarnych
- Przechowywanie w Supabase

## Implementation Approach

Trzy fazy: (1) zdefiniuj typy i kontrakt danych, (2) napisz skrypt przetwarzający surowe dane do JSONów, (3) dodaj testy spójności i wyeksportuj jako moduł. Surowe dane PKW zostaną pobrane ręcznie i umieszczone w `scripts/raw-data/` (gitignored lub committed — do decyzji implementatora). Skrypt jest idempotentny: uruchomienie go ponownie nadpisuje pliki wynikowe.

## Phase 1: Types & Data Schema

### Overview

Zdefiniowanie typów TypeScript, struktury JSON i pliku mapowania partii. To jest kontrakt, którego reszta planu (i downstream S-01) będzie konsumować.

### Changes Required:

#### 1. Typy danych wyborczych

**File**: `src/data/types.ts`

**Intent**: Zdefiniować typy opisujące dane wyborów per okręg: struktura okręgu, wynik partii, metadane wyborów. Te typy będą kontraktem dla skryptu przetwarzającego i dla silnika symulacji.

**Contract**: Eksportowane typy: `ElectionData` (top-level per wybory), `DistrictResult` (wynik per okręg), `PartyResult` (głosy partii w okręgu), `DistrictMeta` (numer, nazwa, rozmiar/liczba mandatów). Pole `districtSize` (liczba mandatów w okręgu) jest kluczowe — potrzebne do d'Hondta.

#### 2. Mapowanie partii między wyborami

**File**: `src/data/party-mapping.ts`

**Intent**: Zdefiniować mapowanie nazw/ID partii między różnymi wyborami (np. "PO" w 2019 → "KO" w 2023). UI pozwoli użytkownikowi zmienić podstawianą dystrybucję, ale domyślne mapowanie powinno być sensowne.

**Contract**: Eksportowany obiekt `partyMapping` — klucz: kanoniczny ID partii (używany w UI), wartość: obiekt z kluczami per election ID i wartościami = nazwa w danych tych wyborów. Plus typ `PartyMapping`.

#### 3. Przykładowa struktura JSON

**File**: `src/data/parlamentarne-2023.json` (inicjalnie pusty/placeholder)

**Intent**: Ustalić docelową strukturę pliku JSON na przykładzie. Implementator wypełni po Phase 2.

**Contract**: Plik JSON zgodny z typem `ElectionData` — pole `election` (metadane), pole `districts` (tablica 41 elementów typu `DistrictResult`).

### Success Criteria:

#### Automated Verification:

- TypeScript kompiluje się bez błędów: `npx tsc --noEmit`
- Typy są eksportowane poprawnie z `src/data/index.ts`

#### Manual Verification:

- Typy pokrywają wszystkie pola potrzebne do symulacji d'Hondta (głosy, rozmiar okręgu, ID partii)
- Mapowanie partii pokrywa główne partie (PiS, KO/PO, Lewica, PSL/TD, Konfederacja)

---

## Phase 2: Processing Script

### Overview

Skrypt TypeScript parsujący surowe dane PKW (CSV/XLSX) i generujący docelowe pliki JSON w `src/data/`.

### Changes Required:

#### 1. Skrypt przetwarzający

**File**: `scripts/prepare-pkw-data.ts`

**Intent**: Skrypt uruchamiany przez `npx tsx scripts/prepare-pkw-data.ts`, który czyta surowe pliki z `scripts/raw-data/`, parsuje je i zapisuje wynikowe JSONy do `src/data/`. Idempotentny — nadpisuje istniejące pliki.

**Contract**: Wejście: pliki CSV/XLSX w `scripts/raw-data/<election-id>/`. Wyjście: pliki JSON w `src/data/<election-id>.json` zgodne z typem `ElectionData`. Loguje postęp na stdout. Exit code 0 = sukces, 1 = błąd parsowania.

#### 2. Zależności do parsowania

**File**: `package.json`

**Intent**: Dodać dev dependency do parsowania CSV (np. `papaparse` + `@types/papaparse`) lub XLSX (`xlsx`). Wybór zależy od formatu danych PKW — CSV preferowany (prostszy).

**Contract**: `devDependencies` += parser CSV/XLSX. Plus `tsx` do uruchamiania skryptu TS jeśli jeszcze nie ma.

#### 3. Surowe dane PKW

**File**: `scripts/raw-data/` (directory)

**Intent**: Miejsce na pobrane ręcznie surowe dane z PKW. Każdy podkatalog = jedno wybory (np. `parlamentarne-2023/`, `prezydenckie-2025/`).

**Contract**: Gitignored (surowe dane są duże i binarne) LUB committed jeśli są małe CSVki. Decyzja implementatora po zobaczeniu rozmiaru.

#### 4. Docelowe pliki JSON

**Files**: `src/data/parlamentarne-2023.json`, `src/data/parlamentarne-2019.json`, `src/data/prezydenckie-2025.json`, `src/data/prezydenckie-2020.json`

**Intent**: Wygenerowane przez skrypt, gotowe do importu w aplikacji.

**Contract**: Zgodne z `ElectionData`. Committed do repo (statyczne assety aplikacji).

### Success Criteria:

#### Automated Verification:

- Skrypt uruchamia się bez błędów: `npx tsx scripts/prepare-pkw-data.ts`
- Wygenerowane JSONy przechodzą walidację typów (Phase 3 test)
- `npx tsc --noEmit` nadal przechodzi

#### Manual Verification:

- Wygenerowane pliki zawierają dane dla wszystkich 41 okręgów
- Spot-check: porównanie losowego okręgu z danymi na stronie PKW

---

## Phase 3: Data Validation & Module Export

### Overview

Testy spójności danych + eksport modułowy z `src/data/index.ts` gotowy do konsumpcji przez S-01.

### Changes Required:

#### 1. Testy spójności

**File**: `src/data/__tests__/data-integrity.test.ts` (lub `tests/data-integrity.test.ts`)

**Intent**: Testy weryfikujące integralność wygenerowanych danych: poprawne sumy, rozmiary, brak wartości null/NaN.

**Contract**: Asercje per plik JSON:

- Każdy plik ma dokładnie 41 okręgów
- Suma `districtSize` per plik = 460 (Sejm) dla parlamentarnych, odpowiedni rozmiar dla prezydenckich
- Każdy okręg ma ≥ 2 partie z głosami > 0
- Brak NaN, undefined, ujemnych wartości
- Każda partia w mapowaniu ma odpowiadający wpis w co najmniej jednym pliku wyborczym

#### 2. Moduł eksportowy

**File**: `src/data/index.ts`

**Intent**: Barrel export — importy typów, danych i mapowania w jednym miejscu.

**Contract**: Eksportuje: wszystkie typy z `types.ts`, `partyMapping` z `party-mapping.ts`, lazy-loadowane dane per wybory (lub static import jeśli bundle-size pozwala).

#### 3. npm script

**File**: `package.json`

**Intent**: Dodać script `"prepare-data"` uruchamiający przetwarzanie.

**Contract**: `"prepare-data": "tsx scripts/prepare-pkw-data.ts"`

### Success Criteria:

#### Automated Verification:

- Testy spójności przechodzą: `npx vitest run src/data/__tests__/data-integrity.test.ts`
- TypeScript kompiluje: `npx tsc --noEmit`
- Lint przechodzi: `npm run lint`

#### Manual Verification:

- Import `import { partyMapping } from '@/data'` działa w dowolnym komponencie
- Dane są dostępne client-side (sprawdzenie w dev tools / konsoli przeglądarki)

---

## Testing Strategy

### Unit Tests:

- Spójność struktury JSON (41 okręgów, prawidłowe sumy, brak NaN)
- Mapowanie partii — każda kanoniczny ID ma wpis w ≥ 1 wyborach
- Rozmiary okręgów sumują się do 460 (parlamentarne)

### Integration Tests:

- Import modułu `src/data` w komponencie React — brak błędów runtime

### Manual Testing Steps:

1. Uruchomić `npm run prepare-data` i sprawdzić output
2. Otworzyć losowy plik JSON i porównać z danymi PKW online
3. Uruchomić `npm run dev` i sprawdzić w konsoli przeglądarki czy dane się ładują

## Performance Considerations

- 4 pliki JSON × ~50-150KB = max ~600KB total. Przy static import Vite/Astro tree-shakes nieużywane. Jeśli za duże — przejście na dynamic import (lazy per wybory). Na MVP: static import powinien wystarczyć.

## References

- PKW dane: https://wybory.gov.pl
- Roadmap ref: `context/foundation/roadmap.md` → F-01
- Downstream: S-01 (core-simulation) konsumuje te dane

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Types & Data Schema

#### Automated

- [x] 1.1 TypeScript kompiluje się bez błędów (`npx tsc --noEmit`) — 65185fb
- [x] 1.2 Typy eksportowane poprawnie z `src/data/index.ts` — 65185fb

#### Manual

- [x] 1.3 Typy pokrywają wszystkie pola potrzebne do d'Hondta — 65185fb
- [x] 1.4 Mapowanie partii pokrywa główne partie — 65185fb

### Phase 2: Processing Script

#### Automated

- [ ] 2.1 Skrypt uruchamia się bez błędów (`npx tsx scripts/prepare-pkw-data.ts`)
- [ ] 2.2 Wygenerowane JSONy przechodzą walidację typów
- [ ] 2.3 `npx tsc --noEmit` przechodzi

#### Manual

- [ ] 2.4 Wygenerowane pliki zawierają dane dla 41 okręgów
- [ ] 2.5 Spot-check: losowy okręg vs dane PKW online

### Phase 3: Data Validation & Module Export

#### Automated

- [ ] 3.1 Testy spójności przechodzą (`npx vitest run`)
- [ ] 3.2 TypeScript kompiluje (`npx tsc --noEmit`)
- [ ] 3.3 Lint przechodzi (`npm run lint`)

#### Manual

- [ ] 3.4 Import `from '@/data'` działa w komponencie
- [ ] 3.5 Dane dostępne client-side (dev tools)
