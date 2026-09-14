# Raw PKW Data

This directory holds raw election data files downloaded from PKW.
The processing script (`scripts/prepare-pkw-data.ts`) reads from here.

## Data Sources

### Parlamentarne 2023

- URL: https://sejmsenat2023.pkw.gov.pl/sejmsenat2023/data/csv/wyniki_gl_na_listy_po_okregach_sejm_csv.zip
- Place unzipped CSV in: `parlamentarne-2023/`

### Parlamentarne 2019

- URL: https://sejmsenat2019.pkw.gov.pl/sejmsenat2019/data/csv/wyniki_gl_na_listy_po_okregach_sejm_csv.zip
- Place unzipped CSV in: `parlamentarne-2019/`

### Parlamentarne 2011

- Brak eksportu CSV na stronie PKW; dane pochodzą ze strony HTML
  https://wybory2011.pkw.gov.pl/wyn/pl/000000.html (tabela „Wyniki głosowania w okręgach
  wyborczych według komitetów wyborczych", 41 okręgów × 11 komitetów).
- Pobranie i konwersja do CSV w kształcie eksportu PKW: `npx tsx scripts/fetch-pkw-2011.ts`
  → `parlamentarne-2011/wyniki_gl_na_listy_po_okregach_sejm_2011.csv`
- Głosy ważne per okręg = suma głosów na wszystkie listy (w wyborach do Sejmu tożsame).
- Okręgi w 2011 mają te same granice i numerację co dziś; liczba mandatów per okręg jest
  nakładana z `DISTRICT_SIZES` (dzisiejsza), tak jak dla 2019.
- Zastosowanie: dystrybucja Polska Jest Najważniejsza (2,19%) jako proxy geograficzne dla
  partii Rozwój Plus (umiarkowany odłam PiS), zob. `context/changes/rozwoj-plus/`.

### Prezydenckie 2025

- URL: https://prezydent20250518.pkw.gov.pl/prezydent20250518/data/csv/wyniki_gl_na_kand_po_okregach_csv.zip
- Place unzipped CSV in: `prezydenckie-2025/`

### Prezydenckie 2020

- URL: https://prezydent20200628.pkw.gov.pl/prezydent20200628/data/csv/wyniki_gl_na_kand_po_okregach_csv.zip
- Place unzipped CSV in: `prezydenckie-2020/`

## Instructions

1. Download each ZIP from the URLs above
2. Unzip into the corresponding subdirectory
3. Run `npm run prepare-data`
