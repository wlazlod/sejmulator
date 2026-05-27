---
project: "Sejmulator"
version: 2
status: draft
created: 2026-05-26
context_type: brownfield
product_type: web-app
target_scale:
  users: medium
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  v2_weeks: 1
  hard_deadline: 2026-07-05
  after_hours_only: true
---

## Vision & Problem Statement

Sondaże w Polsce podają globalny wynik procentowy, ale ordynacja d'Hondta w 41 małych okręgach wyborczych zniekształca przekładanie tego na mandaty. Nie istnieje publicznie dostępne narzędzie, które rzetelnie przelicza sondaż na mandaty z uwzględnieniem geografii poparcia. Dane historyczne z PKW istnieją, ale są zamknięte w surowych plikach. Bez symulacji nie wiadomo, czy 1% różnicy w sondażu zmienia 5 czy 30 mandatów.

To niszowe rozwiązanie — mało kogo interesuje na tyle, żeby zbudować porządne narzędzie. Historyczne rozkłady głosów per okręg + d'Hondt per okręg dają lepszy model niż naiwne przeliczenie globalne, ale wymagają sporej pracy przy przygotowaniu danych i implementacji.

## User & Persona

**Persona główna**: Analityk / dziennikarz polityczny — osoba, która regularnie czyta sondaże i potrzebuje mandatowego przełożenia, nie procentowego. Pojawia się nowy sondaż i chce wiedzieć: „ile mandatów to daje każdej partii?". Dziś albo ręcznie liczy w arkuszu (nikt tego nie robi regularnie), albo przyjmuje naiwne przeliczenie globalne (które kłamie), albo nie ma odpowiedzi.

## Success Criteria

### Primary

- Użytkownik wpisuje wyniki sondażu, wybiera model dystrybucji geograficznej i w < 5 sekund dostaje rozkład mandatów per partia z przedziałem ufności — wynik odpowiada temu, co dałby ręczny d'Hondt per okręg.

### Secondary

- Użytkownik może drill-down do wyniku per okręg i zobaczyć, które mandaty są tight races (w przedziale ufności).

### Guardrails

- Wyniki d'Hondta muszą być matematycznie poprawne (weryfikowalne vs. historyczne dane PKW).
- Share link nie może ujawniać danych innych użytkowników.

## User Stories

### US-01: Użytkownik przeprowadza symulację sondażu

- **Given** użytkownik otworzył stronę i wybrał „Nowy sondaż"
- **When** wpisze wyniki procentowe dla partii, wybierze model dystrybucji geograficznej i kliknie „Oblicz"
- **Then** zobaczy wizualizację podziału mandatów per partia z przedziałem ufności

#### Acceptance Criteria

- Wynik pojawia się w < 5 sekund od kliknięcia
- Suma mandatów = 460 (rozmiar Sejmu)
- Wynik zawiera przedział ufności sygnalizujący tight races
- Widoczny disclaimer „wyniki poglądowe"

## Functional Requirements

- FR-001: Użytkownik może stworzyć nową symulację sondażu z listą partii i ich wynikami procentowymi. Priority: must-have

  > Socrates: Ryzyko interpretacji jako prognoza. Rozwiązanie: dodać disclaimer „wyniki poglądowe, nie prognoza" w UI.

- FR-002: Użytkownik może dodawać i usuwać partie z predefiniowanej listy. Priority: must-have

  > Socrates: Nowa partia nie ma danych historycznych. Rozwiązanie: użytkownik wybiera dystrybucję geograficzną „najbardziej podobnej" istniejącej partii jako proxy.

- FR-003: Użytkownik może wybrać model dystrybucji geograficznej (na podstawie historycznych wyborów). Priority: must-have

  > Socrates: Historyczne dane się dezaktualizują. Rozwiązanie: model jest przybliżeniem; disclaimer + otwarta kwestia aktualizacji danych.

- FR-004: System oblicza podział mandatów per okręg metodą d'Hondta. Priority: must-have

  > Socrates: Brak kontrargumentu; FR stoi jak jest.

- FR-005: Użytkownik może zobaczyć zagregowany wynik mandatów z przedziałem ufności. Priority: must-have

  > Socrates: CI może być za szeroki i bezwartościowy. Rozwiązanie: jeśli CI bezwartościowo szeroki, komunikować wprost (np. „wynik niepewny w N okręgach").

- FR-006: Użytkownik może przejść do szczegółowego widoku podziału mandatów per okręg. Priority: must-have

  > Socrates: 41 okręgów = information overload. Rozwiązanie: wymaga przemyślanego UX — sortowanie/filtrowanie tight races, nie surowa lista.

- FR-007: Użytkownik może zapisać symulację i otrzymać link do udostępnienia (z TTL). Priority: must-have
  > Socrates: Nikt nie będzie share'ować. Rozwiązanie: zachowane — koszt niski (generowanie linka), a feature umożliwia dyskusję nad wynikiem; nawet jeśli usage niskie, nie szkodzi produktowi.

### v2: Warstwa interpretacyjna

- FR-008: System wyświetla "bardzo bliski rezultat" per okręg z marginem (iloraz d'Hondta) dla ostatniego zdobytego i pierwszego niezdobytego mandatu. Priority: must-have

  > Socrates: Counter-argument: "information overload at 460 mandatów". Resolution: zredukowano do margin per-okręg (last won + first lost) zamiast per-mandat.

- FR-009: System wyświetla wizualizację mandatów jako hemicycle (półkole sejmowe) z kropkami per mandat, w stałej kolejności L→P: Razem → Lewica → KO → PL2050 → PSL → PiS → Konf → KKP. Partie bez mandatów ukryte. Priority: must-have

  > Socrates: Counter-argument: "nietrywialna geometria, ryzyko czasowe". Resolution: zostaje — kluczowa wizualizacja, warta inwestycji.

- FR-010: System wyświetla listę możliwych koalicji z predefiniowanego zbioru (11 kombinacji) z liczbą mandatów i informacją czy mają większość (231+). Priority: must-have

  > Socrates: Counter-argument: "predefiniowane koalicje się dezaktualizują". Resolution: zostaje — custom koalicje to non-goal.

- FR-011: Użytkownik może dodać "inne partie" (pole procentowe) — partie startujące w wyborach ale poniżej progu. Ich głosy wchodzą do głosów ważnych ale nie do podziału mandatów (pomniejszają tort). Priority: must-have

  > Socrates: Counter-argument: "podobne do niezdecydowanych". Resolution: zostaje — inne partie to głosy ważne poniżej progu, niezdecydowani to brak głosu. Sondaże rozróżniają.

- FR-012: System przelicza sondażowe procenty na "realne" (normalizacja do 100% bez niezdecydowanych) i pokazuje obie wartości — sondażową i realną. Priority: must-have

  > Socrates: Counter-argument: "trywialne matematycznie". Resolution: zostaje — wartość w UX.

- FR-013: Dla partii bliskich progu (dolna granica CI < 5% lub 8% dla koalicji wyborczej), dolna granica mandatów wynosi 0. Priority: must-have

  > Socrates: Brak kontrargumentu — logicznie poprawne.

- FR-014: Użytkownik może ustawić parametr przedziału ufności (perturbacja %) w polu numerycznym z domyślną wartością (1.5%). Priority: must-have
  > Socrates: Counter-argument: "95% userów nie ruszy". Resolution: pole z domyślną wartością — nie przeszkadza, koszt niski.

## Non-Functional Requirements

- Obliczenie mandatów: odpowiedź widoczna dla użytkownika w < 5 sekund od kliknięcia „Oblicz".
- Mobile-friendly: aplikacja działa w przeglądarce mobilnej i desktopowej bez instalacji.

## Business Logic

Aplikacja przekłada globalny wynik sondażowy na mandaty w Sejmie przez nałożenie wybranej historycznej dystrybucji geograficznej poparcia na wyniki sondażu i uruchomienie metody d'Hondta per okręg — wartość dodana to łatwość podpięcia różnych historycznych dystrybucji jako modeli rozkładu.

**Wejście**: wyniki procentowe per partia (globalnie) + wybór modelu dystrybucji geograficznej (np. „PO — parlamentarne 2023", „Trzaskowski — prezydenckie 2025").

**Reguła**: rozkład globalny → przeskalowanie na rozkład per okręg (proporcjonalnie do wybranego wzorca historycznego) → metoda d'Hondta per okręg → agregacja mandatów + obliczenie przedziału ufności z tight races.

**Wyjście**: mandaty per partia (zagregowane) + przedział ufności + drill-down per okręg ze wskazaniem tight races.

## Access Control

Model: open access — brak autentykacji, brak kont użytkowników. Każdy otwiera stronę, wpisuje dane sondażu, dostaje wynik. Udostępnianie: unikalny URL per wynik symulacji, ważny przez ograniczony czas (TTL). Role: brak — wszyscy użytkownicy są równi, anonimowi.

## Non-Goals

- **Automatyczny import sondaży z mediów** — użytkownik wpisuje dane ręcznie. Automatyzacja to osobny projekt wymagający scrapingu/API.
- **Model predykcyjny / ML** — to kalkulator „co by było gdyby", nie prognoza. Brak własnego modelu predykcyjnego.
- **Historia symulacji per user** — brak kont użytkowników, brak persystentnej historii. Share link z TTL wystarcza.
- **Edycja danych historycznych PKW przez użytkownika** — dane są preloadowane i niemodyfikowalne z poziomu UI.
- **Animacje / transitions** — wyniki wyświetlane statycznie.
- **Custom koalicje** — tylko predefiniowany zbiór 11 kombinacji.
- **Historia sondaży / porównania w czasie** — brak porównywania wyników symulacji.
- **Zmienny próg wyborczy** — zawsze 5% (partia) / 8% (koalicja wyborcza).

## Open Questions

1. **Jak często aktualizować dane historyczne?** — Po każdych wyborach (parlamentarnych, prezydenckich) dane powinny być dodawane. Kto odpowiada za aktualizację i jak jest pakowana? Owner: developer. Block: no (MVP może wystartować z danymi z 2023/2025).
2. **Jak dokładnie obliczać przedział ufności?** — Jaka metodologia? Perturbacja wyników per okręg? Monte Carlo? Heurystyka oparta na marginesie w tight races? Owner: developer. Block: no (MVP może zacząć od prostej heurystyki tight-race i iterować).
3. **Jaki TTL dla share linków?** — 7 dni? 30 dni? Bezterminowo? Owner: developer. Block: no (dowolna sensowna wartość wystarcza na MVP).
