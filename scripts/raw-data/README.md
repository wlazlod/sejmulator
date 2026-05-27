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
