---
project: "Sejmulator"
version: 1
status: active
created: 2026-09-14
updated: 2026-09-14
prd_version: 3
---

# Test plan: Sejmulator

> Rejestr ryzyk i mapowanie ryzyko → test. Każdy plik testowy zaczyna się od komentarza `// test-plan: R-0X`, a nazwy przypadków w nowych plikach mają prefiks `R-0X:`. Nowe ryzyko = nowy wiersz tutaj **przed** napisaniem testu.

## 1. Cel i zakres

Testujemy to, co może dać użytkownikowi błędną odpowiedź (podział mandatów, przedział ufności, dane PKW) albo ujawnić cudze dane (biblioteka zapisanych symulacji), oraz główny przepływ użytkownika przez prawdziwą przeglądarkę. Nie testujemy wyglądu (brak testów wizualnych/snapshotowych), wydajności pod obciążeniem (brak load testów) ani mobilnego viewportu.

## 2. Stack testowy

| Warstwa               | Narzędzie             | Pliki                                                           | Uruchomienie              |
| --------------------- | --------------------- | --------------------------------------------------------------- | ------------------------- |
| Logika i dane         | vitest 4              | `src/**/__tests__/*.test.ts` (zakres z `vitest.config.ts`)      | `npm test`                |
| Przepływy użytkownika | Playwright (chromium) | `e2e/*.spec.ts` (`playwright.config.ts`, dev server na `:4321`) | `npm run test:e2e`        |
| Bramka                | GitHub Actions        | `.github/workflows/ci.yml` (joby `ci` i `e2e`)                  | każdy push / PR na `main` |

Sufiksy są rozłączne: vitest zbiera tylko `*.test.ts` pod `src/`, Playwright tylko `*.spec.ts` pod `e2e/`.

## 3. Rejestr ryzyk

| ID   | Ryzyko                                                                                                                                                    | Skutek                                                                               | Prawdopodobieństwo                               | Jak adresujemy                                                                                                                                           | Testy                                                                                                                                                                                        | Status   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| R-01 | Błędny podział mandatów: d'Hondt per okręg, próg 5%/8% liczony ogólnokrajowo, suma ≠ 460                                                                  | Produkt daje złą odpowiedź na jedyne pytanie, które zadaje użytkownik                | średnie (ręczna implementacja algorytmu)         | Silnik zamrożony; weryfikacja vs oficjalne wyniki PKW 2023 (±3 mandaty per partia); inwariant sumy 460                                                   | `src/lib/__tests__/dhondt.test.ts`                                                                                                                                                           | covered  |
| R-02 | Przedział ufności nie sygnalizuje tight races; dolna granica < 0 lub > 0 dla partii przy progu (FR-013); normalizacja niezdecydowanych zmienia proporcje  | Fałszywe poczucie pewności wyniku; partia „na progu" pokazana jako pewna             | średnie                                          | Perturbacja ±pp z inwariantami `min ≤ base ≤ max`, `min = 0` przy progu, przypadek 4 (partia wykluczona); normalizacja zachowuje proporcje               | `src/lib/__tests__/confidence.test.ts`, `src/lib/__tests__/normalization.test.ts`                                                                                                            | covered  |
| R-03 | Uszkodzone lub niespójne dane PKW (brak okręgu, NaN, ujemne, suma głosów ≠ ważne, brak partii)                                                            | Cicha degradacja rozkładu geograficznego; symulacja „działa", ale na złych danych    | niskie (dane generowane skryptem), wysoki skutek | Testy integralności dla każdego pliku `src/data/*.json`: 41 okręgów, metadane, brak NaN, suma głosów ≈ ważne                                             | `src/data/__tests__/data-integrity.test.ts`                                                                                                                                                  | covered  |
| R-04 | Wyciek danych między użytkownikami: użytkownik widzi/modyfikuje cudze zapisane symulacje albo anonim dostaje się do `/simulations` lub `/api/simulations` | Naruszenie guardraila PRD; utrata zaufania                                           | niskie (RLS + middleware), wysoki skutek         | Trzy warstwy: RLS per operacja `auth.uid() = user_id`, filtr `user_id` w serwisie, middleware (401 JSON dla API, redirect dla stron); cudzy rekord → 404 | `e2e/access-control.spec.ts` (anonim: redirect, 401 na GET/POST/DELETE, brak przycisku zapisu), `e2e/saved-simulations.spec.ts` (właściciel: pełny cykl na własnym rekordzie, obcy id → 404) | covered  |
| R-05 | Regresja głównego przepływu US-01: sondaż → mandaty → hemicycle → koalicje → okręgi                                                                       | Użytkownik nie może wykonać podstawowego zadania mimo zielonych testów jednostkowych | średnie (React island, wiele komponentów)        | Test przez prawdziwą przeglądarkę na selektorach semantycznych; dodawanie/usuwanie partii; walidacja sumy > 100%                                         | `e2e/simulation.spec.ts`                                                                                                                                                                     | covered  |
| R-06 | Zły payload do API (share, saved simulations) zapisany do bazy: puste partie, nazwa > 80, `perturbationPct = 0`, patch bez pól                            | Uszkodzone rekordy, błędy przy otwieraniu, dziury w CHECK-ach                        | średnie (ręczne type-guardy)                     | Walidacja na granicy API (`validateShareRequest`, `validateSavedSimulationInput/Patch`) + CHECK-i w tabeli                                               | `src/lib/__tests__/share-types.test.ts`, `src/lib/__tests__/saved-simulation-types.test.ts`                                                                                                  | covered  |
| R-07 | Niepoprawny drill-down per okręg: sortowanie, filtr tight races, mapa SVG niezgodna z numeracją okręgów                                                   | Analityk wyciąga wnioski z niewłaściwego okręgu                                      | niskie                                           | Testy logiki sortowania/filtrowania i bijekcji ścieżka SVG ↔ numer okręgu                                                                                | `src/lib/__tests__/district-drilldown.test.ts`                                                                                                                                               | covered  |
| R-08 | Brak cleanupu wygasłych share-linków (rosnąca tabela); brak testów mobile viewport                                                                        | Koszt storage; regresje układu na telefonie niezauważone                             | niskie                                           | Świadomie nieadresowane: TTL egzekwowany przez politykę RLS `expires_at > now()`, tabela mała; mobile sprawdzany ręcznie                                 | —                                                                                                                                                                                            | accepted |

## 4. Mapowanie odwrotne: plik testu → ryzyka

| Plik                                               | Ryzyka                   | Liczba przypadków                       |
| -------------------------------------------------- | ------------------------ | --------------------------------------- |
| `src/lib/__tests__/dhondt.test.ts`                 | R-01                     | 6                                       |
| `src/lib/__tests__/confidence.test.ts`             | R-02                     | 5                                       |
| `src/lib/__tests__/normalization.test.ts`          | R-02                     | 5                                       |
| `src/data/__tests__/data-integrity.test.ts`        | R-03                     | 6 per zbiór wyborów                     |
| `src/lib/__tests__/share-types.test.ts`            | R-06                     | 12                                      |
| `src/lib/__tests__/saved-simulation-types.test.ts` | R-06                     | 13                                      |
| `src/lib/__tests__/district-drilldown.test.ts`     | R-07                     | 8                                       |
| `e2e/simulation.spec.ts`                           | R-05                     | 3                                       |
| `e2e/access-control.spec.ts`                       | R-04                     | 5                                       |
| `e2e/saved-simulations.spec.ts`                    | R-04 (właściciel), US-02 | 2 (skip bez `E2E_EMAIL`/`E2E_PASSWORD`) |

## 5. Bramki

Przed merge do `main` musi być zielone:

1. `npm run lint` (ESLint z regułami type-checked, prettier),
2. `npm test` (vitest, wszystkie pliki z sekcji 4),
3. `npm run build` (Astro SSR, adapter Cloudflare),
4. `npm run test:e2e` (job `e2e` w CI, `needs: ci`).

Co się skipuje i kiedy:

- `e2e/saved-simulations.spec.ts` skipuje się, gdy brak `E2E_EMAIL` / `E2E_PASSWORD` (lokalnie z `.env`, w CI z sekretów repo). Pozostałe specyfikacje E2E nie wymagają sekretów i uruchamiają się zawsze.
- Dev server w E2E potrzebuje `SUPABASE_URL` / `SUPABASE_KEY`, żeby middleware mógł odczytać sesję; bez nich testy anonimowe nadal przechodzą (klient Supabase = `null` → użytkownik anonimowy).

Raport Playwright (`playwright-report/`) jest wgrywany jako artefakt joba `e2e` przy każdym przebiegu.
