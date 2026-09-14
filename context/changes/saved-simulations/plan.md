# S-05: Saved simulations — Plan

## Goal

US-02 / FR-015–FR-018: zalogowany użytkownik zapisuje, listuje, otwiera, zmienia nazwę, aktualizuje i usuwa własne symulacje. Anonim nadal liczy i udostępnia bez konta.

## Architecture

- Tabela `saved_simulations` (uuid, `user_id` → `auth.users`, `name`, `parties jsonb`, `other_parties`, `perturbation_pct`, `created_at`, `updated_at`), RLS per operacja `auth.uid() = user_id`.
- `parties` ma ten sam kształt co `shared_simulations.parties` (`SharedPartyInput[]`), więc walidacja reużywa `validateShareRequest`.
- Klient Supabase z cookies (istniejący `createClient`) przenosi JWT użytkownika → RLS izoluje dane; serwis mimo to filtruje `.eq("user_id", user.id)` (defense in depth).
- `updated_at` ustawiane w API przy UPDATE (bez triggera).
- Wynik nie jest przechowywany: po otwarciu zapisu symulacja liczy się ponownie (lazy initial state w `Simulator.tsx`).

## Phase 1: Backend

- [x] Migracja `20260914120000_create_saved_simulations.sql` (zastosowana ręcznie w chmurze 2026-09-14)
- [x] `src/lib/saved-simulation-types.ts` + testy vitest (13 przypadków, R-06)
- [x] `src/lib/services/saved-simulations.ts`
- [x] `src/pages/api/simulations/{index,[id]}.ts` + `_helpers.ts` (401/503/400/404/204)
- [x] `src/middleware.ts`: nowe `PROTECTED_ROUTES`, 401 JSON pod `/api/`

## Phase 2: UI

- [x] `Layout.astro` (`lang="pl"`, tytuł, `Topbar`), `Topbar.astro` po polsku
- [x] `Simulator.tsx`: propsy `user`, `savedSimulation`; `SaveControls.tsx`; `hooks/useSaveSimulation.ts`
- [x] `/simulations` + `SavedSimulationsList.tsx` (Otwórz / Zmień nazwę / Usuń, pusta lista → CTA)
- [x] `/simulations/[id]` (404 gdy brak)
- [x] Usunięcie `dashboard.astro`, `Welcome.astro`; formularze auth po polsku

## Phase 3: Docs

- [x] PRD v3 (Access Control, FR-015–018, US-02, Non-Goals), roadmap S-05, tech-stack `has_auth: true`

## Verification

- `npm run lint && npm test && npm run build` zielone
- Smoke przez `curl` na dev serwerze: anonim `/simulations` → 302, `/api/simulations` → 401; zalogowany: POST 201 → GET 200 → PATCH 200 → DELETE 204 → GET 404; pusty PATCH → 400
- Testy E2E (R-04, R-05) w Fazie 2 certyfikacji: `e2e/access-control.spec.ts`, `e2e/saved-simulations.spec.ts`

## Progress

- Phase 1–3: done (commit SHA uzupełniony poniżej po commicie)
