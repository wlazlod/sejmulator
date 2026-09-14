---
change_id: rozwoj-plus
title: "Partia Rozwój+ z dystrybucją PJN 2011 jako proxy"
status: done
created: 2026-09-14
updated: 2026-09-14
roadmap_ref: S-06
prd_refs: [FR-002, FR-003, FR-009, FR-010]
---

## Powód

W lipcu 2026 z PiS wyodrębnił się klub Rozwój Plus (Mateusz Morawiecki, ok. 30–40 posłów). Sondaże podają go osobno, a symulator nie miał tej partii. FR-002 mówi wprost: nowa partia bez historii wyborczej używa dystrybucji geograficznej najbardziej podobnej partii jako proxy.

## Decyzja o proxy

Domyślna dystrybucja: **Polska Jest Najważniejsza, wybory parlamentarne 2011** (`parlamentarne-2011:polska-jest-najwazniejsza`). Ten sam mechanizm polityczny (umiarkowany odłam PiS), więc geografia poparcia jest najbliższym dostępnym analogiem. Alternatywy do wyboru w UI: Trzecia Droga 2023 (wymagana przez właściciela), PiS 2023, Nawrocki 2025.

Wariant fallback (gdyby dane 2011 były niedostępne): domyślnie PiS 2023 z alternatywami Trzecia Droga 2023 i Nawrocki 2025. **Nie był potrzebny**: dane 2011 pobrano za pierwszym podejściem.

## Źródło danych 2011

PKW nie udostępnia CSV z wynikami list po okręgach dla 2011. Strona `https://wybory2011.pkw.gov.pl/wyn/pl/000000.html` zawiera tabelę „Wyniki głosowania w okręgach wyborczych według komitetów wyborczych" (41 okręgów × 11 komitetów, głosy bezwzględne), więc wystarcza jedno żądanie zamiast 41 stron per okręg (`/wsw/pl/sjm-N.html` mają tylko procenty). Skrypt `scripts/fetch-pkw-2011.ts` pobiera stronę, parsuje tabelę i zapisuje CSV w kształcie eksportu PKW 2019/2023, który czyta bez zmian `processParlamentarne` w `scripts/prepare-pkw-data.ts`. Sanity check w skrypcie: PJN 2,19% (oczekiwane 2,0–2,4), PO 39,18%, PiS 29,89% w skali kraju.

## Zakres zmian

- `scripts/fetch-pkw-2011.ts`, `scripts/raw-data/parlamentarne-2011/*.csv`, `scripts/raw-data/README.md`
- `scripts/prepare-pkw-data.ts` (`ELECTIONS` + lista przetwarzanych), `src/data/parlamentarne-2011.json`, `src/data/index.ts`
- `src/data/party-mapping.ts`: klucz `rozwojplus` („Rozwój Plus", „Rozwój+"); nie jest w domyślnym zestawie partii (pojawia się w rzędzie „Dodaj:"), więc share-linki i test E2E US-01 są nienaruszone
- `src/components/party-colors.ts` (`#0ea5e9`), `Hemicycle.tsx` (kolejność: … PSL → Rozwój+ → PiS …), `Coalitions.tsx` (+4 kombinacje: PiS + Rozwój+, PiS + Rozwój+ + Konf, KO + PL2050 + PSL + Rozwój+, KO + Lewica + PL2050 + PSL + Rozwój+)
- Testy: `src/data/__tests__/party-mapping.test.ts` (każda dystrybucja z `partyDefaults` istnieje w danych; R-03), `data-integrity.test.ts` obejmuje 2011
- Docs: PRD FR-009, roadmap S-06, test-plan R-03, README

## Poza zakresem

Silnik (`dhondt.ts`, `confidence.ts`, `normalization.ts`) nietknięty. Mandaty per okręg dla 2011 są nakładane z dzisiejszych `DISTRICT_SIZES` (tak jak dla 2019).
