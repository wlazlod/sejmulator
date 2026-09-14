---
project: "Sejmulator"
version: 3
status: active
created: 2026-05-26
updated: 2026-09-14
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
- Zapisane symulacje są widoczne i modyfikowalne wyłącznie dla ich właściciela (RLS + filtr `user_id` w API).

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

### US-02: Użytkownik zarządza biblioteką symulacji

- **Given** użytkownik jest zalogowany i policzył symulację
- **When** kliknie „Zapisz symulację", poda nazwę i zapisze
- **Then** symulacja pojawi się na liście „Moje symulacje", skąd może ją otworzyć, zmienić nazwę, zaktualizować wejścia i usunąć

#### Acceptance Criteria

- Zapis wymaga zalogowania; anonim widzi zamiast przycisku tekst „Zaloguj się, aby zapisać symulację"
- Zapisywane są wejścia (partie z dystrybucjami, inne partie, parametr CI), nie wynik; po otwarciu symulacja liczy się ponownie i daje identyczny wynik
- Lista pokazuje tylko symulacje zalogowanego użytkownika, posortowane od ostatnio zmienionej
- Zmiana nazwy i usunięcie działają bez przeładowania strony; usunięcie wymaga potwierdzenia
- Próba dostępu do cudzej symulacji (strona lub API) kończy się `404`; dostęp anonimowy do `/simulations` → redirect na logowanie, do `/api/simulations` → `401`

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

- FR-009: System wyświetla wizualizację mandatów jako hemicycle (półkole sejmowe) z kropkami per mandat, w stałej kolejności L→P: Razem → Lewica → KO → PL2050 → PSL → Rozwój+ → PiS → Konf → KKP (Rozwój+ dodany 2026-09-14 jako centroprawica na lewo od PiS). Partie bez mandatów ukryte. Priority: must-have

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

### v3: Konto i biblioteka symulacji (S-05)

- FR-015: Zalogowany użytkownik może zapisać bieżącą symulację pod nazwą (1–80 znaków). Zapisywane są wejścia: partie z procentami i dystrybucjami, „inne partie", parametr CI. Priority: must-have

  > Socrates: Counter-argument: "share link już to robi". Resolution: share link jest anonimowy i wygasa po 30 dniach; biblioteka jest prywatna, nazwana i trwała — to inny przypadek użycia (własny warsztat, nie publikacja).

- FR-016: Zalogowany użytkownik widzi listę swoich zapisanych symulacji (nazwa, data zmiany, partie) i może otworzyć każdą z nich; po otwarciu symulacja liczy się automatycznie. Priority: must-have

  > Socrates: Counter-argument: "lista bez wyników jest mało czytelna". Resolution: pokazujemy skróty partii; wynik jest deterministyczny i liczy się w < 1 s po otwarciu, więc przechowywanie go byłoby duplikacją.

- FR-017: Zalogowany użytkownik może zmienić nazwę zapisanej symulacji (z listy) oraz zaktualizować jej wejścia (z widoku edycji, przycisk „Zapisz zmiany"). Priority: must-have

  > Socrates: Counter-argument: "wersjonowanie byłoby bezpieczniejsze". Resolution: nadpisanie w miejscu; historia wersji pozostaje non-goal.

- FR-018: Zalogowany użytkownik może usunąć zapisaną symulację po potwierdzeniu. Priority: must-have
  > Socrates: Brak kontrargumentu; usunięcie jest nieodwracalne, stąd potwierdzenie.

## Non-Functional Requirements

- Obliczenie mandatów: odpowiedź widoczna dla użytkownika w < 5 sekund od kliknięcia „Oblicz".
- Mobile-friendly: aplikacja działa w przeglądarce mobilnej i desktopowej bez instalacji.

## Business Logic

Aplikacja przekłada globalny wynik sondażowy na mandaty w Sejmie przez nałożenie wybranej historycznej dystrybucji geograficznej poparcia na wyniki sondażu i uruchomienie metody d'Hondta per okręg — wartość dodana to łatwość podpięcia różnych historycznych dystrybucji jako modeli rozkładu.

**Wejście**: wyniki procentowe per partia (globalnie) + wybór modelu dystrybucji geograficznej (np. „PO — parlamentarne 2023", „Trzaskowski — prezydenckie 2025").

**Reguła**: rozkład globalny → przeskalowanie na rozkład per okręg (proporcjonalnie do wybranego wzorca historycznego) → metoda d'Hondta per okręg → agregacja mandatów + obliczenie przedziału ufności z tight races.

**Wyjście**: mandaty per partia (zagregowane) + przedział ufności + drill-down per okręg ze wskazaniem tight races.

## Access Control

Model: **open access z opcjonalnym kontem**.

- Symulacja ad hoc i share-link (`/`, `/s/:id`, `POST /api/share`) pozostają otwarte dla każdego, bez logowania. To jest natura produktu: wpisujesz sondaż, dostajesz mandaty.
- Konto (Supabase Auth, e-mail + hasło) daje dokładnie jedną rzecz: **bibliotekę zapisanych symulacji** („Moje symulacje"). Zasobem przypisanym do użytkownika są zapisane symulacje: użytkownik loguje się do systemu i widzi wyłącznie własne zapisane symulacje; anonim liczy i udostępnia, zalogowany dodatkowo zapisuje i zarządza.
- Role: **anonim** (liczy, udostępnia) i **zalogowany właściciel** (dodatkowo: zapisuje, listuje, otwiera, zmienia nazwę, aktualizuje, usuwa własne symulacje). Nie ma roli administratora ani współdzielenia biblioteki.
- Egzekwowanie: `src/middleware.ts` chroni `/simulations` (redirect na `/auth/signin`) i `/api/simulations` (`401` JSON); tabela `saved_simulations` ma RLS per operacja z warunkiem `auth.uid() = user_id`; serwis dodatkowo filtruje po `user_id`. Cudzy rekord zwraca `404`, nie `403`, żeby nie ujawniać istnienia.
- Udostępnianie: nadal unikalny URL per symulacja z TTL 30 dni, anonimowy; share-link nie jest powiązany z kontem.

## Non-Goals

- **Automatyczny import sondaży z mediów** — użytkownik wpisuje dane ręcznie. Automatyzacja to osobny projekt wymagający scrapingu/API.
- **Model predykcyjny / ML** — to kalkulator „co by było gdyby", nie prognoza. Brak własnego modelu predykcyjnego.
- **Historia wyników i porównania w czasie** — Uchylone częściowo w v3 (2026-09-14): pierwotny non-goal „Historia symulacji per user" (v1–v2: brak kont, share link z TTL wystarcza) został uchylony, bo biblioteka wejść symulacji jest potrzebna jako zasób CRUD z kontrolą dostępu; nadal bez historii wyników i bez porównań w czasie.
- **Edycja danych historycznych PKW przez użytkownika** — dane są preloadowane i niemodyfikowalne z poziomu UI.
- **Animacje / transitions** — wyniki wyświetlane statycznie.
- **Custom koalicje** — tylko predefiniowany zbiór 11 kombinacji.
- **Historia sondaży / porównania w czasie** — brak porównywania wyników symulacji.
- **Zmienny próg wyborczy** — zawsze 5% (partia) / 8% (koalicja wyborcza).

## Open Questions

1. **Jak często aktualizować dane historyczne?** — Po każdych wyborach (parlamentarnych, prezydenckich) dane powinny być dodawane. Kto odpowiada za aktualizację i jak jest pakowana? Owner: developer. Block: no (MVP może wystartować z danymi z 2023/2025).
2. **Jak dokładnie obliczać przedział ufności?** — Jaka metodologia? Perturbacja wyników per okręg? Monte Carlo? Heurystyka oparta na marginesie w tight races? Owner: developer. Block: no (MVP może zacząć od prostej heurystyki tight-race i iterować).
3. **Jaki TTL dla share linków?** — 7 dni? 30 dni? Bezterminowo? Owner: developer. Block: no (dowolna sensowna wartość wystarcza na MVP).
