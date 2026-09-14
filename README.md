# Sejmulator

[![CI](https://github.com/wlazlod/sejmulator/actions/workflows/ci.yml/badge.svg)](https://github.com/wlazlod/sejmulator/actions/workflows/ci.yml)

**Symulator podziału mandatów w Sejmie.** Wpisujesz wyniki sondażu, wybierasz historyczną dystrybucję geograficzną poparcia (PKW 2011/2019/2020/2023/2025) i dostajesz podział 460 mandatów metodą d'Hondta liczoną osobno w każdym z 41 okręgów, z przedziałem ufności, hemicycle, listą koalicji i drill-downem po okręgach.

Sondaże w Polsce podają globalny wynik procentowy, ale ordynacja d'Hondta w 41 małych okręgach zniekształca przełożenie procentów na mandaty. Bez symulacji nie wiadomo, czy 1 punkt procentowy różnicy w sondażu zmienia 5 czy 30 mandatów. Sejmulator nakłada wybrany historyczny wzorzec rozkładu poparcia na wynik sondażu i uruchamia d'Hondta per okręg. Dla kogo: analityk lub dziennikarz polityczny, który czyta sondaże i potrzebuje mandatowego, nie procentowego, przełożenia.

Symulacja i share-link są otwarte dla każdego. Opcjonalne konto daje prywatną bibliotekę zapisanych symulacji („Moje symulacje").

**Wersja produkcyjna:** <https://sejmulator.daniel-wlazlo.workers.dev>

<!-- Screenshoty (docs/screenshots/): 02-home-logged-in.png, 03-feature-1-save-form.png, 04-feature-2-results.png -->

## Stack

- [Astro 6](https://astro.build/) w trybie SSR (`output: "server"`), adapter [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [React 19](https://react.dev/) tylko dla interaktywnych wysp (`Simulator`, `SavedSimulationsList`, formularze)
- [Tailwind CSS 4](https://tailwindcss.com/), komponenty [shadcn/ui](https://ui.shadcn.com/) (`src/components/ui/`)
- [Supabase](https://supabase.com/): Auth (e-mail + hasło) i Postgres z RLS
- [Cloudflare Workers](https://workers.cloudflare.com/): hosting, auto-deploy z `main`
- Testy: [vitest](https://vitest.dev/) (logika) i [Playwright](https://playwright.dev/) (przepływy użytkownika)

## Uruchomienie lokalne

Wymagania: Node.js 22.14 (`.nvmrc`), npm.

```bash
git clone https://github.com/wlazlod/sejmulator.git
cd sejmulator
nvm use          # 22.14.0
npm ci
```

Zmienne środowiskowe (nazwy, nie wartości, są w `.env.example`):

| Zmienna        | Do czego                                                |
| -------------- | ------------------------------------------------------- |
| `SUPABASE_URL` | URL projektu Supabase (Settings → API)                  |
| `SUPABASE_KEY` | klucz publikowalny / `anon` projektu Supabase           |
| `E2E_EMAIL`    | (tylko testy E2E) e-mail potwierdzonego konta testowego |
| `E2E_PASSWORD` | (tylko testy E2E) hasło konta testowego                 |

Node (`astro dev`, vitest, Playwright) czyta `.env`; Cloudflare local dev czyta `.dev.vars`. Oba pliki są gitignorowane; najprościej trzymać w nich te same cztery linie.

Baza: użyj projektu Supabase w chmurze albo lokalnego (`npx supabase start`, wymaga Dockera). Schemat jest w `supabase/migrations/`; zastosuj go przez `npx supabase db push` (po `npx supabase link`) albo wklej pliki SQL w Supabase SQL Editor. Obie tabele (`shared_simulations`, `saved_simulations`) mają włączone RLS.

```bash
npm run dev      # http://localhost:4321
```

## Skrypty

| Skrypt                              | Co robi                                                               |
| ----------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                       | dev server Astro                                                      |
| `npm run build`                     | build produkcyjny (SSR, Cloudflare)                                   |
| `npm run preview`                   | podgląd builda                                                        |
| `npm run lint`                      | ESLint z regułami type-checked + prettier                             |
| `npm run lint:fix`                  | jak wyżej, z auto-naprawą                                             |
| `npm run format`                    | Prettier                                                              |
| `npm test`                          | testy jednostkowe (vitest, `src/**/__tests__/*.test.ts`)              |
| `npm run test:watch`                | vitest w trybie watch                                                 |
| `npm run test:e2e`                  | testy Playwright (`e2e/*.spec.ts`), sam startuje dev server           |
| `npm run test:e2e:ui`               | Playwright w trybie UI                                                |
| `npm run prepare-data`              | regeneruje `src/data/*.json` z surowych CSV PKW (`scripts/raw-data/`) |
| `npx tsx scripts/fetch-pkw-2011.ts` | pobiera wyniki Sejm 2011 ze strony PKW do CSV (proxy PJN dla Rozwój+) |

## Testy

- **Jednostkowe** (`npm test`): silnik d'Hondta i próg (weryfikacja vs wyniki PKW 2023), przedziały ufności, normalizacja niezdecydowanych, integralność danych PKW, walidacja payloadów API, logika drill-downu. Vitest zbiera tylko `src/**/*.test.ts` (`vitest.config.ts`).
- **E2E** (`npm run test:e2e`): Playwright, tylko chromium (`npx playwright install chromium` przy pierwszym uruchomieniu). Trzy specyfikacje:
  - `e2e/simulation.spec.ts`: główny przepływ sondaż → mandaty → hemicycle → koalicje → okręgi (bez Supabase),
  - `e2e/access-control.spec.ts`: anonim nie ma dostępu do biblioteki (redirect, 401),
  - `e2e/saved-simulations.spec.ts`: właściciel zapisuje, listuje, zmienia nazwę, otwiera i usuwa własną symulację; **skipuje się bez `E2E_EMAIL` / `E2E_PASSWORD`**. Konto testowe musi istnieć i być potwierdzone (Supabase → Authentication → Users → Add user, „Auto Confirm User").
- Który test adresuje które ryzyko: `context/foundation/test-plan.md` (rejestr ryzyk R-01…R-08). Każdy plik testowy zaczyna się od komentarza `// test-plan: R-0X`.

## Deploy

Produkcja to Cloudflare Worker `sejmulator` (`wrangler.jsonc`) podpięty do repozytorium przez integrację Git: każdy push na `main` buduje (`npm run build`) i deployuje (`npx wrangler deploy`). Sekrety `SUPABASE_URL` i `SUPABASE_KEY` żyją w Cloudflare → Workers → Settings → Variables and Secrets. Rollback = `git revert` + push. Szczegóły: `context/foundation/infrastructure.md`.

CI (GitHub Actions, `.github/workflows/ci.yml`) uruchamia na każdym pushu i PR do `main` dwa joby: `ci` (lint, vitest, build) i `e2e` (Playwright). Sekrety repo: `SUPABASE_URL`, `SUPABASE_KEY`, `E2E_EMAIL`, `E2E_PASSWORD`. CI nie deployuje.

## Struktura repozytorium

```
context/
├── foundation/        # prd.md (v3), roadmap.md, tech-stack.md, test-plan.md, infrastructure.md
└── changes/<id>/      # change.md + plan.md per zmiana (S-01…S-05), z SHA commitów
e2e/                   # Playwright (*.spec.ts)
scripts/               # prepare-pkw-data.ts, fetch-pkw-2011.ts + raw-data/ (surowe CSV PKW)
src/
├── components/        # Simulator.tsx, Hemicycle.tsx, Coalitions.tsx, DistrictDrilldown.tsx, SaveControls.tsx, …
├── data/              # parlamentarne-2011/2019/2023.json, prezydenckie-2020/2025.json, party-mapping.ts
├── lib/               # dhondt.ts, confidence.ts, normalization.ts, share-types.ts, saved-simulation-types.ts
│   ├── services/      # saved-simulations.ts (dostęp do danych)
│   └── __tests__/     # vitest
├── pages/             # index, s/[id], simulations/, auth/, api/{share,simulations,auth}
└── middleware.ts      # sesja Supabase + ochrona tras
supabase/migrations/   # schemat + RLS
```

Projekt powstał w workflow kursu 10xDevs: `/10x-shape` → `/10x-plan` → `/10x-implement` (skille w `.ai/skills/` i `.opencode/skills/`), a dokumenty w `context/` są wejściem i wyjściem tych skilli. `AGENTS.md` i `CLAUDE.md` to instrukcje dla agentów kodujących.

## Certyfikacja 10xDevs: mapowanie wymogów

| Wymóg 10xBuilder                     | Gdzie w repo                                                                                                                                                                                                                                                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autentykacja i kontrola dostępu      | Supabase Auth (`src/pages/auth/*`, `src/pages/api/auth/*`); `src/middleware.ts` chroni `/simulations` (redirect) i `/api/simulations` (401 JSON); RLS `auth.uid() = user_id` w `supabase/migrations/20260914120000_create_saved_simulations.sql`; zalogowany widzi wyłącznie własne symulacje (PRD v3 §Access Control) |
| CRUD                                 | zasób `saved_simulations`: `src/pages/api/simulations/index.ts` (GET lista, POST), `src/pages/api/simulations/[id].ts` (GET, PATCH rename/aktualizacja wejść, DELETE); UI `src/pages/simulations/index.astro` + `SavedSimulationsList.tsx`, `src/pages/simulations/[id].astro` + `SaveControls.tsx`                    |
| Logika biznesowa                     | `src/lib/dhondt.ts` (d'Hondt per okręg, próg 5%/8% ogólnokrajowo), `src/lib/confidence.ts` (CI przez perturbację, FR-013), `src/lib/normalization.ts` (niezdecydowani, inne partie), `Coalitions.tsx`, `Hemicycle.tsx`, `DistrictDrilldown.tsx`                                                                        |
| Dokumenty kontekstowe                | `context/foundation/prd.md` (v3), `roadmap.md`, `tech-stack.md`, `test-plan.md`, `infrastructure.md`; `context/changes/<id>/` (change + plan + SHA)                                                                                                                                                                    |
| Testy adresujące ryzyko z test-planu | `context/foundation/test-plan.md` (rejestr R-01…R-08 → testy); vitest w `src/**/__tests__` (R-01, R-02, R-03, R-06, R-07); Playwright: `e2e/simulation.spec.ts` adresuje **R-05** (regresja US-01), `e2e/access-control.spec.ts` i `e2e/saved-simulations.spec.ts` adresują **R-04** (izolacja danych użytkowników)    |
| CI                                   | `.github/workflows/ci.yml`: lint + vitest + build + e2e na każdym pushu                                                                                                                                                                                                                                                |
| Publiczny URL                        | <https://sejmulator.daniel-wlazlo.workers.dev>                                                                                                                                                                                                                                                                         |

## Licencja

MIT
