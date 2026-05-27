---
project: "Sejmulator"
context_type: greenfield
created: 2026-05-26
updated: 2026-05-26
product_type: web-app
target_scale:
  users: medium
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-07-05
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "model dostępu"
      decision: "open access, brak autentykacji + share link z TTL"
    - topic: "nowe partie bez danych historycznych"
      decision: "użytkownik wybiera dystrybucję geograficzną najbardziej podobnej istniejącej partii jako proxy"
    - topic: "dezaktualizacja danych historycznych"
      decision: "model jest przybliżeniem; disclaimer w UI + otwarta kwestia aktualizacji"
    - topic: "szerokość przedziału ufności"
      decision: "jeśli CI bezwartościowo szeroki — komunikować wprost (np. 'wynik niepewny w N okręgach')"
  frs_drafted: 7
  quality_check_status: accepted
---

## Wizja i problem

Sondaże w Polsce podają globalny wynik procentowy, ale ordynacja d'Hondta w 41 małych okręgach wyborczych zniekształca przekładanie tego na mandaty. Nie istnieje publicznie dostępne narzędzie, które rzetelnie przelicza sondaż na mandaty z uwzględnieniem geografii poparcia. Dane historyczne z PKW istnieją, ale są zamknięte w surowych plikach. Bez symulacji nie wiadomo, czy 1% różnicy w sondażu zmienia 5 czy 30 mandatów.

To niszowe rozwiązanie — mało kogo interesuje na tyle, żeby zbudować porządne narzędzie. Historyczne rozkłady głosów per okręg + d'Hondt per okręg dają lepszy model niż naiwne przeliczenie globalne, ale wymagają sporej pracy przy przygotowaniu danych i implementacji.

## Użytkownik i persona

**Persona główna**: Analityk / dziennikarz polityczny — osoba, która regularnie czyta sondaże i potrzebuje mandatowego przełożenia, nie procentowego. Pojawia się nowy sondaż i chce wiedzieć: „ile mandatów to daje każdej partii?". Dziś albo ręcznie liczy w arkuszu (nikt tego nie robi regularnie), albo przyjmuje naiwne przeliczenie globalne (które kłamie), albo nie ma odpowiedzi.

## Kontrola dostępu

Model: open access — brak autentykacji, brak kont użytkowników. Każdy otwiera stronę, wpisuje dane sondażu, dostaje wynik. Udostępnianie: unikalny URL per wynik symulacji, ważny przez ograniczony czas (TTL). Role: brak — wszyscy użytkownicy są równi, anonimowi.

## Kryteria sukcesu

### Główne

- Użytkownik wpisuje wyniki sondażu, wybiera model dystrybucji geograficznej i w < 5 sekund dostaje rozkład mandatów per partia z przedziałem ufności — wynik odpowiada temu, co dałby ręczny d'Hondt per okręg.

### Drugorzędne

- Użytkownik może drill-down do wyniku per okręg i zobaczyć, które mandaty są tight races (w przedział ufności).

### Guardrails

- Wyniki d'Hondta muszą być matematycznie poprawne (weryfikowalne vs. historyczne dane PKW).
- Share link nie może ujawniać danych innych użytkowników.

## Wymagania funkcjonalne

- FR-001: Użytkownik może stworzyć nową symulację sondażu z listą partii i ich wynikami procentowymi. Priorytet: must-have

  > Socrates: Ryzyko interpretacji jako prognoza. Rozwiązanie: dodać disclaimer „wyniki poglądowe, nie prognoza" w UI.

- FR-002: Użytkownik może dodawać i usuwać partie z predefiniowanej listy. Priorytet: must-have

  > Socrates: Nowa partia nie ma danych historycznych. Rozwiązanie: użytkownik wybiera dystrybucję geograficzną „najbardziej podobnej" istniejącej partii jako proxy.

- FR-003: Użytkownik może wybrać model dystrybucji geograficznej (na podstawie historycznych wyborów). Priorytet: must-have

  > Socrates: Historyczne dane się dezaktualizują. Rozwiązanie: model jest przybliżeniem; disclaimer + otwarta kwestia aktualizacji danych.

- FR-004: System oblicza podział mandatów per okręg metodą d'Hondta. Priorytet: must-have

  > Socrates: Brak kontrargumentu; FR stoi jak jest.

- FR-005: Użytkownik może zobaczyć zagregowany wynik mandatów z przedziałem ufności. Priorytet: must-have

  > Socrates: CI może być za szeroki i bezwartościowy. Rozwiązanie: jeśli CI bezwartościowo szeroki, komunikować wprost (np. „wynik niepewny w N okręgach").

- FR-006: Użytkownik może przejść do szczegółowego widoku podziału mandatów per okręg. Priorytet: must-have

  > Socrates: 41 okręgów = information overload. Rozwiązanie: wymaga przemyślanego UX — sortowanie/filtrowanie tight races, nie surowa lista.

- FR-007: Użytkownik może zapisać symulację i otrzymać link do udostępnienia (z TTL). Priorytet: must-have
  > Socrates: Nikt nie będzie share'ować. Rozwiązanie: zachowane — koszt niski (generowanie linka), a feature umożliwia dyskusję nad wynikiem; nawet jeśli usage niskie, nie szkodzi produktowi.

## User Stories

### US-01: Użytkownik przeprowadza symulację sondażu

- **Given** użytkownik otworzył stronę i wybrał „Nowy sondaż"
- **When** wpisze wyniki procentowe dla partii, wybierze model dystrybucji geograficznej i kliknie „Oblicz"
- **Then** zobaczy wizualizację podziału mandatów per partia z przedziałem ufności

#### Kryteria akceptacji

- Wynik pojawia się w < 5 sekund od kliknięcia
- Suma mandatów = 460 (rozmiar Sejmu)
- Wynik zawiera przedział ufności sygnalizujący tight races
- Widoczny disclaimer „wyniki poglądowe"

## Logika biznesowa

Aplikacja przekłada globalny wynik sondażowy na mandaty w Sejmie przez nałożenie wybranej historycznej dystrybucji geograficznej poparcia na wyniki sondażu i uruchomienie metody d'Hondta per okręg — wartość dodana to łatwość podpięcia różnych historycznych dystrybucji jako modeli rozkładu.

**Wejście**: wyniki procentowe per partia (globalnie) + wybór modelu dystrybucji geograficznej (np. „PO — parlamentarne 2023", „Trzaskowski — prezydenckie 2025").

**Reguła**: rozkład globalny → przeskalowanie na rozkład per okręg (proporcjonalnie do wybranego wzorca historycznego) → metoda d'Hondta per okręg → agregacja mandatów + obliczenie przedziału ufności z tight races.

**Wyjście**: mandaty per partia (zagregowane) + przedział ufności + drill-down per okręg ze wskazaniem tight races.

## Wymagania niefunkcjonalne

- Obliczenie mandatów: odpowiedź widoczna dla użytkownika w < 5 sekund od kliknięcia „Oblicz".
- Mobile-friendly: aplikacja działa w przeglądarce mobilnej i desktopowej bez instalacji.

## Non-Goals

- **Automatyczny import sondaży z mediów** — użytkownik wpisuje dane ręcznie. Automatyzacja to osobny projekt wymagający scrapingu/API.
- **Model predykcyjny / ML** — to kalkulator „co by było gdyby", nie prognoza. Brak własnego modelu predykcyjnego.
- **Historia symulacji per user** — brak kont użytkowników, brak persystentnej historii. Share link z TTL wystarcza.
- **Edycja danych historycznych PKW przez użytkownika** — dane są preloadowane i niemodyfikowalne z poziomu UI.

## Quality cross-check

Wszystkie elementy present — brak luk.
