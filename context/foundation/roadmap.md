---
project: "Sejmulator"
version: 1
status: draft
created: 2026-05-27
updated: 2026-05-27
prd_version: 1
main_goal: speed
top_blocker: skills
---

# Roadmap: Sejmulator

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

Sondaże w Polsce podają globalny wynik procentowy, ale ordynacja d'Hondta w 41 okręgach zniekształca przekładanie tego na mandaty. Sejmulator przelicza sondaż na mandaty z uwzględnieniem historycznej geografii poparcia — wartość dodana to nałożenie wybranego wzorca historycznego (np. parlamentarne 2023) na wynik sondażu i uruchomienie d'Hondta per okręg. Nie istnieje publicznie dostępne narzędzie, które robi to rzetelnie.

## North star

**S-01: Użytkownik przeprowadza pełną symulację sondażu i widzi mandaty per partia z przedziałem ufności** — to najmniejszy end-to-end flow, który udowadnia, że produkt działa (czyli: pojedyncza, w pełni działająca ścieżka od wejścia do wyniku, której sukces waliduje główną hipotezę produktu). Jeśli to nie działa, reszta nie ma sensu.

## At a glance

| ID   | Change ID           | Outcome (user can …)                                                            | Prerequisites | PRD refs                                      | Status   |
| ---- | ------------------- | ------------------------------------------------------------------------------- | ------------- | --------------------------------------------- | -------- |
| F-01 | pkw-historical-data | (foundation) dane historyczne PKW per okręg przygotowane i dostępne w aplikacji | —             | FR-003, FR-004                                | ready    |
| F-02 | deploy-skeleton     | (foundation) aplikacja deployowalna na Cloudflare Pages z CI                    | —             | NFR-02                                        | ready    |
| S-01 | core-simulation     | użytkownik wpisuje sondaż, wybiera model geograficzny i widzi mandaty z CI      | F-01, F-02    | US-01, FR-001, FR-002, FR-003, FR-004, FR-005 | proposed |
| S-02 | district-drilldown  | użytkownik przechodzi do widoku per okręg z tight races                         | S-01          | FR-006                                        | proposed |
| S-03 | share-link          | użytkownik zapisuje symulację i udostępnia link z TTL                           | S-01          | FR-007                                        | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme     | Chain                             | Note                                                                                                 |
| ------ | --------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| A      | Symulacja | `F-01` → `S-01` → `S-02` / `S-03` | Główna ścieżka wartości — dane PKW → core simulation → rozszerzenia. Faworyzowana przez cel `speed`. |
| B      | Deploy    | `F-02`                            | Infrastruktura deploymentu; równoległa z F-01, dołącza do Stream A przy S-01.                        |

## Baseline

What's already in place in the codebase as of 2026-05-27 (auto-researched + user-confirmed). Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Astro 6 + React 19 + Tailwind v4, file-based routing, src/pages/, astro.config.mjs
- **Backend / API:** partial — 3 auth API routes (Astro file-based); brak ogólnego backendu, ale PRD nie wymaga dedykowanego serwera (open access, obliczenia client-side)
- **Data:** partial — Supabase client (src/lib/supabase.ts) skonfigurowany; brak schematów, migracji, seeded data
- **Auth:** partial — auth routes istnieją w starterze, ale PRD wymaga open access (brak autentykacji); auth routes nie będą używane
- **Deploy / infra:** partial — .github/workflows/ci.yml present; brak wrangler.toml / Cloudflare Pages deploy config
- **Observability:** absent — brak logging/monitoring; PRD nie wymaga (speed goal, niszowy produkt)

## Foundations

### F-01: Dane historyczne PKW per okręg

- **Outcome:** (foundation) historyczne wyniki wyborów (parlamentarne 2023, prezydenckie 2025) per 41 okręgów przetworzone do formatu konsumowanego przez silnik symulacji.
- **Change ID:** pkw-historical-data
- **PRD refs:** FR-003, FR-004
- **Unlocks:** S-01 (silnik symulacji potrzebuje danych geograficznych do przeskalowania)
- **Prerequisites:** —
- **Parallel with:** F-02
- **Blockers:** —
- **Unknowns:**
  - Jaki format źródłowy mają dane PKW i ile pracy wymaga ich przetworzenie? — Owner: developer. Block: no (dane są publiczne, format CSV/XLS).
- **Risk:** To największy nakład pracy wśród foundations i źródło ryzyka `skills` — jeśli przygotowanie danych zajmie dłużej niż oczekiwano, opóźni north star.
- **Status:** ready

### F-02: Deploy skeleton

- **Outcome:** (foundation) aplikacja deployuje się automatycznie na Cloudflare Pages po merge do main; wrangler.toml + adapter skonfigurowane.
- **Change ID:** deploy-skeleton
- **PRD refs:** NFR-02 (mobile-friendly, przeglądarka)
- **Unlocks:** S-01, S-02, S-03 (każdy slice wymaga deploymentu żeby był dostępny)
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Niskie — Cloudflare adapter jest w starterze, wymaga tylko konfiguracji. Jeśli coś nie działa, fallback na Vercel jest trywialny.
- **Status:** ready

## Slices

### S-01: Pełna symulacja sondażu

- **Outcome:** użytkownik wpisuje wyniki procentowe dla partii, wybiera model dystrybucji geograficznej i w < 5 sekund widzi podział mandatów per partia z przedziałem ufności.
- **Change ID:** core-simulation
- **PRD refs:** US-01, FR-001, FR-002, FR-003, FR-004, FR-005
- **Prerequisites:** F-01 (dane PKW), F-02 (deploy)
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Jak dokładnie obliczać przedział ufności? Monte Carlo vs. heurystyka tight-race? — Owner: developer. Block: no (MVP startuje od prostej heurystyki, iteracja później).
- **Risk:** Najszerszy slice (5 FRów), ale stanowi jedną spójną ścieżkę użytkownika. Ryzyko skills: algorytm d'Hondta per okręg + przeskalowanie geograficzne to core logic wymagająca poprawności matematycznej. Mitygacja: weryfikacja vs. znane wyniki historyczne.
- **Status:** proposed

### S-02: Widok per okręg (drill-down)

- **Outcome:** użytkownik może przejść z zagregowanego wyniku do szczegółowego widoku per okręg, z oznaczeniem tight races (mandaty w przedziale ufności).
- **Change ID:** district-drilldown
- **PRD refs:** FR-006
- **Prerequisites:** S-01 (wymaga działającej symulacji z wynikami per okręg)
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:**
  - 41 okręgów = information overload; jaki UX (sortowanie, filtrowanie, mapa)? — Owner: developer. Block: no (PRD sugeruje sortowanie/filtrowanie tight races).
- **Risk:** UX challenge — wyświetlenie 41 okręgów bez information overload. Mitygacja: PRD daje wskazówkę (filtrowanie tight races, nie surowa lista).
- **Status:** proposed

### S-03: Zapisz i udostępnij (share link)

- **Outcome:** użytkownik może zapisać wynik symulacji i otrzymać link do udostępnienia, ważny przez określony czas (TTL).
- **Change ID:** share-link
- **PRD refs:** FR-007
- **Prerequisites:** S-01 (wymaga symulacji do zapisania)
- **Parallel with:** S-02
- **Blockers:** —
- **Unknowns:**
  - Jaki TTL dla share linków? — Owner: developer. Block: no (dowolna sensowna wartość na MVP).
- **Risk:** Niskie — Supabase client już skonfigurowany; wymaga schematu tabeli + insert/select. Guardrail z PRD: link nie może ujawniać danych innych użytkowników (ale brak auth = brak "innych użytkowników" w tradycyjnym sensie).
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID           | Suggested issue title                         | Ready for `/10x-plan` | Notes                               |
| ---------- | ------------------- | --------------------------------------------- | --------------------- | ----------------------------------- |
| F-01       | pkw-historical-data | Przygotuj dane historyczne PKW per 41 okręgów | yes                   | Run `/10x-plan pkw-historical-data` |
| F-02       | deploy-skeleton     | Skonfiguruj deploy na Cloudflare Pages        | yes                   | Run `/10x-plan deploy-skeleton`     |
| S-01       | core-simulation     | Zbuduj pełną symulację sondaż → mandaty       | no                    | Czeka na F-01 i F-02                |
| S-02       | district-drilldown  | Dodaj drill-down per okręg z tight races      | no                    | Czeka na S-01                       |
| S-03       | share-link          | Dodaj share link z TTL                        | no                    | Czeka na S-01                       |

## Open Roadmap Questions

1. **Jak często aktualizować dane historyczne?** — Po każdych wyborach dane powinny być dodawane. Kto odpowiada za aktualizację i jak jest pakowana? Owner: developer. Block: roadmap-wide (ale nie na MVP — startujemy z 2023/2025).
2. **Jak dokładnie obliczać przedział ufności?** — Monte Carlo? Perturbacja? Heurystyka tight-race? Owner: developer. Block: S-01 (ale non-blocking — MVP startuje od prostej heurystyki).
3. **Jaki TTL dla share linków?** — 7 dni? 30 dni? Bezterminowo? Owner: developer. Block: S-03 (non-blocking — dowolna sensowna wartość).

## Parked

- **Automatyczny import sondaży z mediów** — Why parked: PRD §Non-Goals. Wymaga scrapingu/API, osobny projekt.
- **Model predykcyjny / ML** — Why parked: PRD §Non-Goals. To kalkulator "co by było gdyby", nie prognoza.
- **Historia symulacji per user** — Why parked: PRD §Non-Goals. Brak kont użytkowników.
- **Edycja danych historycznych PKW przez użytkownika** — Why parked: PRD §Non-Goals. Dane preloadowane i niemodyfikowalne.

## Done
