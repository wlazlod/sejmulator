# PKW Historical Data Preparation — Plan Brief

> Full plan: `context/changes/pkw-historical-data/plan.md`

## What & Why

Przygotowanie historycznych danych wyborczych PKW (4 wybory × 41 okręgów) jako statycznych JSON-ów w repo. Bez tych danych silnik symulacji (S-01, north star) nie ma czym operować — nie można przeskalować globalnego wyniku sondażu na geografię poparcia.

## Starting Point

Codebase to świeży scaffold Astro + React bez jakichkolwiek danych domenowych. Brak `src/data/`, brak typów wyborczych, brak skryptów przetwarzających. Supabase client istnieje ale nie będzie użyty.

## Desired End State

`src/data/` eksportuje 4 pliki JSON (parlamentarne 2023/2019, prezydenckie 2025/2020) z wynikami per okręg per partia, typy TS, mapowanie partii między wyborami, i barrel export. Skrypt w `scripts/` pozwala powtarzalnie regenerować dane z surowych plików PKW.

## Key Decisions Made

| Decision         | Choice                                             | Why (1 sentence)                                                             |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Zakres wyborów   | 4: parlamentarne 2023+2019, prezydenckie 2025+2020 | Pokrywa dwa typy wyborów × 2 edycje — wystarczająca perspektywa historyczna. |
| Storage          | Statyczny JSON w `src/data/`                       | Zero latencji, zero dependencies runtime, obliczenia client-side.            |
| Struktura plików | Jeden plik per wybory                              | Prosty import, ~50-150KB per plik to akceptowalne.                           |
| Przetwarzanie    | Skrypt TS w `scripts/`                             | Powtarzalny, type-safe, łatwa aktualizacja po nowych wyborach.               |
| Mapowanie partii | Stała lista + plik mapowania                       | Jawne, debugowalne; UI pozwala zmienić podstawianą dystrybucję.              |
| Weryfikacja      | Testy spójności (sumy, rozmiary, brak NaN)         | Łapie błędy parsowania bez wymagania działającego silnika d'Hondta.          |

## Scope

**In scope:**

- Typy TS dla danych wyborczych
- Skrypt przetwarzający surowe dane PKW → JSON
- 4 pliki JSON z danymi per okręg
- Plik mapowania partii między wyborami
- Testy spójności danych
- Barrel export z `src/data/`

**Out of scope:**

- Silnik d'Hondta (S-01)
- UI wyboru modelu (S-01)
- Automatyczny scraping PKW (Non-Goal)
- Dane samorządowe/europarlamentarne

## Architecture / Approach

```
scripts/raw-data/   ← surowe CSV/XLSX z PKW (ręcznie pobrane)
       ↓
scripts/prepare-pkw-data.ts  ← parsowanie + transformacja
       ↓
src/data/*.json     ← statyczne dane per wybory
src/data/types.ts   ← typy kontraktowe
src/data/party-mapping.ts  ← mapowanie nazw partii
src/data/index.ts   ← barrel export → konsumowany przez S-01
```

## Phases at a Glance

| Phase                  | What it delivers                            | Key risk                                                |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------- |
| 1. Types & Data Schema | Typy TS + struktura JSON + mapowanie partii | Niepełne pokrycie pól potrzebnych do d'Hondta           |
| 2. Processing Script   | Skrypt + wygenerowane 4 JSONy               | Format danych PKW może być nieoczekiwany                |
| 3. Validation & Export | Testy spójności + moduł eksportowy          | Dane prezydenckie mają inną strukturę niż parlamentarne |

**Prerequisites:** Dostęp do danych PKW (publiczne, wybory.gov.pl)
**Estimated effort:** ~2-3 sesje (1 sesja per fazę)

## Open Risks & Assumptions

- Format danych PKW może wymagać dodatkowego parsowania (nieznany dokładny format do pobrania)
- Wybory prezydenckie mają inną strukturę (I tura wielu kandydatów, nie listy partyjne) — wymaga adaptacji typów
- Partie-koalicje mogą mieć różną granularność w danych PKW vs to co chcemy pokazać w UI

## Success Criteria (Summary)

- Skrypt `npm run prepare-data` generuje 4 pliki JSON bez błędów
- Testy spójności przechodzą (41 okręgów, suma mandatów = 460, brak NaN)
- Import `from '@/data'` dostępny w dowolnym komponencie — gotowy dla S-01
