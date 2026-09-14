---
project: "Sejmulator"
version: 1
status: active
created: 2026-09-14
updated: 2026-09-14
prd_version: 3
---

# Infrastructure: Sejmulator

## Środowiska

| Środowisko | Runtime                                                                                      | Jak                                                    | Uwagi                                                                  |
| ---------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| local      | `astro dev` (Node 22.14, bez adaptera: `adapter` ustawiany tylko przy `NODE_ENV=production`) | `npm run dev` → `http://localhost:4321`                | Middleware działa tak samo jak na prod; Supabase w chmurze lub lokalny |
| prod       | Cloudflare Worker `sejmulator` (`@astrojs/cloudflare`, `wrangler.jsonc`, `nodejs_compat`)    | auto-deploy z `main` przez integrację Git w Cloudflare | URL: `https://sejmulator.daniel-wlazlo.workers.dev`                    |

Nie ma środowiska staging. Podgląd builda lokalnie: `npm run build && npm run preview`.

## Zmienne i sekrety

| Nazwa                          | Gdzie żyje                                                                                                                                                            | Kto czyta                                                                                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_KEY` | lokalnie `.env` (Node/vitest/Playwright) i `.dev.vars` (wrangler); prod: Cloudflare → Worker → Settings → Variables and Secrets (typ Secret); CI: sekrety repo GitHub | `src/lib/supabase.ts` przez `astro:env/server` (schemat w `astro.config.mjs`, `access: "secret"`, opcjonalne → brak = klient `null`, funkcje konta wyłączone, baner „Uwaga") |
| `E2E_EMAIL`, `E2E_PASSWORD`    | lokalnie `.env`; CI: sekrety repo GitHub                                                                                                                              | tylko `e2e/saved-simulations.spec.ts` (skip, gdy brak)                                                                                                                       |

Zasady: wartości nigdy w plikach śledzonych przez git; `.env`, `.dev.vars` są w `.gitignore`; `SUPABASE_KEY` to klucz publikowalny (anon), więc dostęp do danych zależy wyłącznie od RLS.

## Supabase

- Projekt w chmurze, Auth e-mail + hasło z włączonym potwierdzeniem e-mail (konto testowe utworzone ręcznie z „Auto Confirm User").
- Migracje w `supabase/migrations/` (format `YYYYMMDDHHmmss_opis.sql`), stosowane przez `npx supabase db push` po `npx supabase link`, albo ręcznie w SQL Editor. Migracja `20260914120000_create_saved_simulations.sql` została zastosowana ręcznie 2026-09-14; przy następnym `db push` wykonać `npx supabase migration repair --status applied 20260914120000`.
- Tabele i RLS:
  - `shared_simulations` (share-link, S-03): anonimowy `select` tylko dla `expires_at > now()`, anonimowy `insert`, brak update/delete. TTL 30 dni egzekwowany przez politykę, **bez cron-cleanup** (znane ograniczenie, test-plan R-08).
  - `saved_simulations` (biblioteka, S-05): cztery polityki per operacja dla roli `authenticated`, wszystkie z `auth.uid() = user_id`; `on delete cascade` z `auth.users`.
- Sesja: cookies przez `@supabase/ssr`; `src/middleware.ts` woła `auth.getUser()` na każdym żądaniu i wystawia `Astro.locals.user`.

## CI

`.github/workflows/ci.yml`, trigger: push i PR na `main`.

| Job                 | Kroki                                                                                                                             | Blokuje                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `ci`                | `npm ci`, `astro sync`, `npm run lint`, `npm test`, `npm run build` (z `SUPABASE_*`)                                              | merge/deploy z czerwonym lintem, testami lub buildem |
| `e2e` (`needs: ci`) | `playwright install --with-deps chromium`, `npm run test:e2e` z czterema sekretami; artefakt `playwright-report` (`if: always()`) | regresje przepływów użytkownika i kontroli dostępu   |

CI nie deployuje: deploy robi Cloudflare niezależnie od wyniku CI (ograniczenie: czerwone CI nie zatrzymuje deployu; mitygacja: bramki lokalne przed pushem, `git revert` przy regresji).

## Deploy i rollback

- Push na `main` → Cloudflare buduje `npm run build` i wykonuje `npx wrangler deploy`. Nazwa workera `sejmulator` jest powiązana z istniejącym deployem: nie zmieniać `wrangler.jsonc` bez aktualizacji w dashboardzie.
- Rollback: `git revert <sha>` + push (nowy deploy), albo Cloudflare → Deployments → Rollback do poprzedniej wersji.
- Weryfikacja po deployu: `curl -s -o /dev/null -w "%{http_code}" https://sejmulator.daniel-wlazlo.workers.dev/auth/signin` → `200`; ręcznie: Oblicz mandaty → Udostępnij → link działa; login → zapis → lista.

## Observability

- Cloudflare Workers: `observability.enabled: true` w `wrangler.jsonc` → logi żądań i `console.error` z API (`/api/share`, `/api/simulations`) widoczne w dashboardzie Workers → Logs.
- Supabase: logi Auth i Postgres w dashboardzie projektu.
- Brak zewnętrznego monitoringu, alertów i metryk produktowych (świadomie: niszowy produkt, `main_goal: speed`).

## Znane ograniczenia i ryzyka

1. Brak cleanupu wygasłych share-linków (tabela rośnie; polityka RLS ukrywa wygasłe wiersze). Plan: `pg_cron` albo Supabase Edge Function, gdy tabela przekroczy sensowny rozmiar.
2. Deploy nie czeka na CI (patrz wyżej).
3. Jeden klucz Supabase (anon) dla wszystkiego; bezpieczeństwo danych = poprawność RLS. Testy R-04 sprawdzają to od strony HTTP, nie ma testu polityk SQL wprost.
4. Reset hasła i zmiana e-maila nie mają UI (Supabase obsługuje je, ale nie ma stron w aplikacji).
5. Dane PKW są statyczne (`src/data/*.json`, ~400 KB w bundle klienta); aktualizacja po każdych wyborach wymaga `npm run prepare-data` i commita.
