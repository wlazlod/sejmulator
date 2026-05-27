---
project: "Sejmulator"
context_type: brownfield
created: 2026-05-27
updated: 2026-05-27
product_type: web-app
target_scale:
  users: medium
  qps: low
  data_volume: small
timeline_budget:
  delivery_weeks: 1
  hard_deadline: 2026-07-05
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  frs_drafted: 7
  quality_check_status: accepted
---

# Shape Notes v2: Warstwa interpretacyjna + UX improvements

> Brownfield change to existing Sejmulator MVP (all v1 slices done: F-01, F-02, S-01, S-02, S-03).

## Current System

Sejmulator — web app (Astro + React + TS + Supabase + Cloudflare Pages) symulująca podział 460 mandatów w Sejmie metodą d'Hondta w 41 okręgach. Obecny flow: input sondażu → wybór dystrybucji geograficznej → oblicz mandaty z przedziałem ufności → drilldown per okręg (lista + mapa SVG) → share link z TTL.

Stack: Astro 6, React 19, Tailwind v4, Vitest, Cloudflare Pages, Supabase (share links only).

## Vision & Problem Statement

Surowe wyniki symulacji (mandaty per partia + CI) nie dają pełnego kontekstu politycznego. Użytkownik musi sam liczyć koalicje, nie widzi jak niezdecydowani i drobne partie wpływają na próg, a "tight races" nie jest intuicyjne po polsku. Brak wizualizacji sejmowej (hemicycle) sprawia że wynik jest tabelką, nie doświadczeniem.

**Cel:** Dodać warstwę interpretacyjną — wizualizacja sejmowa, koalicje, wpływ niezdecydowanych/drobnych partii na próg, konfigurowalny CI — żeby wynik był czytelny politycznie.

## User & Persona

Bez zmian — ten sam użytkownik (polityczny geek, dziennikarz, komentator) korzysta z tych samych flows. Open access.

## Access Control

Bez zmian — open access, brak autentykacji.

## Success Criteria

### Primary

Użytkownik przeprowadza symulację i widzi: (1) hemicycle z 460 kropkami w kolejności L→P, (2) listę koalicji z informacją o większości, (3) realne% po uwzględnieniu niezdecydowanych, (4) dolną granicę 0 mandatów dla partii bliskich progu.

### Secondary

Konfigurowalny parametr CI pozwala zaawansowanym użytkownikom eksperymentować z precyzją.

### Guardrails

- Istniejący flow (input → oblicz → wyniki → drilldown → share) działa bez regresji.
- Share links z v1 nadal się ładują i działają poprawnie.
- Performance: symulacja nadal < 5s.

## Functional Requirements

- FR-008: System wyświetla "bardzo bliski rezultat" per okręg z marginem (iloraz d'Hondta) dla ostatniego zdobytego i pierwszego niezdobytego mandatu. Priority: must-have. Change: modified

  > Socrates: Counter-argument: "information overload at 460 mandatów". Resolution: zredukowano do margin per-okręg (last won + first lost) zamiast per-mandat.

- FR-009: System wyświetla wizualizację mandatów jako hemicycle (półkole sejmowe) z kropkami per mandat, w stałej kolejności L→P: Razem → Lewica → KO → PL2050 → PSL → PiS → Konf → KKP. Partie bez mandatów ukryte. Priority: must-have. Change: new

  > Socrates: Counter-argument: "nietrywialna geometria, ryzyko czasowe". Resolution: zostaje — kluczowa wizualizacja, warta inwestycji.

- FR-010: System wyświetla listę możliwych koalicji z predefiniowanego zbioru (11 kombinacji) z liczbą mandatów i informacją czy mają większość (231+). Priority: must-have. Change: new

  > Socrates: Counter-argument: "predefiniowane koalicje się dezaktualizują". Resolution: zostaje — custom koalicje to non-goal, predefiniowane wystarczą na MVP.

- FR-011: Użytkownik może dodać "inne partie" (pole procentowe) — partie które startują w wyborach ale nie przekraczają progu. Ich głosy wchodzą do głosów ważnych ale nie do podziału mandatów (pomniejszają tort). Priority: must-have. Change: new

  > Socrates: Counter-argument: "podobne do niezdecydowanych". Resolution: zostaje — inne partie to głosy ważne (poniżej progu), niezdecydowani to brak głosu. Sondaże rozróżniają te kategorie.

- FR-012: System przelicza sondażowe procenty na "realne" (normalizacja do 100% bez niezdecydowanych) i pokazuje obie wartości. Priority: must-have. Change: new

  > Socrates: Counter-argument: "matematycznie trywialne". Resolution: zostaje — wartość jest w UX (użytkownik widzi wpływ niezdecydowanych na realny wynik).

- FR-013: Dla partii bliskich progu (dolna granica CI < 5% lub 8% dla koalicji wyborczej), dolna granica mandatów wynosi 0. Priority: must-have. Change: modified

  > Socrates: Counter-argument: brak — logicznie poprawne, jeśli CI sięga poniżej progu to partia może nie wejść do Sejmu.

- FR-014: Użytkownik może ustawić parametr przedziału ufności (perturbacja %) w polu numerycznym z domyślną wartością (np. 1.5%). Priority: must-have. Change: modified
  > Socrates: Counter-argument: "95% userów nigdy nie ruszy". Resolution: pole z domyślną wartością — nie przeszkadza, nie kosztuje dużo.

## Business Logic

Reguła domeny (d'Hondt × 41 okręgów) bez zmian. Nowa logika:

1. **Normalizacja:** sondaż% → realne% = sondaż% / (100% - niezdecydowani%). "Inne partie" pozostają w torcie ale poniżej progu — nie wchodzą do d'Hondta.
2. **Próg z CI:** jeśli (realne% - CI) < próg (5% partia / 8% koalicja wyborcza) → mandaty_min = 0.
3. **Koalicje:** prosta suma mandatów partii z predefiniowanego zbioru 11 kombinacji. Wynik: łączne mandaty, czy ≥ 231.
4. **Margin per okręg:** po alokacji d'Hondta, dla każdego okręgu oblicz iloraz d'Hondta ostatniego zdobytego mandatu vs pierwszy niezdobyty.

## Constraints & Preserved Behavior

- Istniejący flow (input → oblicz → drilldown → share) bez regresji.
- Share links z v1 (format JSON w Supabase) nadal muszą się ładować.
- Silnik d'Hondt per okręg — algorytm bez zmian, tylko dodane obliczenia wokół niego.
- Mapa SVG, DistrictDrilldown — bez zmian (oprócz rename tight races → bliski rezultat).

## Non-Functional Requirements

- Performance: symulacja (w tym CI z nowym parametrem) < 5s.
- Responsywność: hemicycle czytelne na mobile (min 320px viewport).

## Non-Goals

- Bez animacji/transitions — statyczne wyświetlenie.
- Bez custom koalicji — tylko predefiniowane 11.
- Bez historii sondaży — nie porównujemy wyników w czasie.
- Bez zmiennego progu wyborczego — zawsze 5%/8%.

## Quality cross-check

All 6 elements present. Status: accepted.
