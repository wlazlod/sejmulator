---
change_id: saved-simulations
title: "Konto użytkownika i biblioteka zapisanych symulacji (Moje symulacje)"
status: done
created: 2026-09-14
updated: 2026-09-14
roadmap_ref: S-05
prd_refs: [US-02, FR-015, FR-016, FR-017, FR-018]
---

## Co się zmienia

Sejmulator pozostaje open access dla symulacji ad hoc i share-linków. Dochodzi opcjonalne konto (Supabase Auth, e-mail + hasło), które daje jedną rzecz: prywatną bibliotekę zapisanych symulacji. Zapisany zasób to zestaw **wejść** (nazwa, partie z dystrybucjami, inne partie, parametr CI), nie wynik — wynik jest deterministyczny i liczony na żądanie, tak jak w share-linku.

Zalogowany użytkownik może: zapisać (C), wylistować i otworzyć (R), zmienić nazwę i zaktualizować wejścia (U), usunąć (D). Widzi wyłącznie własne rekordy.

## Dlaczego teraz

- PRD v1–v2 zakładało brak kont („Historia symulacji per user" jako non-goal). Ten non-goal został uchylony w PRD v3 (2026-09-14): biblioteka wejść jest potrzebna jako zasób CRUD z kontrolą dostępu; nadal bez historii wyników i porównań w czasie.
- Guardrail „share link nie może ujawniać danych innych użytkowników" dostaje realną treść, bo pojawiają się „inni użytkownicy".
- Routes auth ze startera były martwe (Topbar nieużyty, `/dashboard` placeholder); teraz są realną funkcją produktu.

## Zakres

- Migracja `supabase/migrations/20260914120000_create_saved_simulations.sql` (tabela + RLS per operacja, `auth.uid() = user_id`).
- Typy i walidacja: `src/lib/saved-simulation-types.ts` (ręczny type-guard, wzorzec `share-types.ts`).
- Serwis: `src/lib/services/saved-simulations.ts` (list/get/create/update/delete, zawsze z filtrem `user_id`).
- API: `src/pages/api/simulations/index.ts` (GET, POST), `src/pages/api/simulations/[id].ts` (GET, PATCH, DELETE).
- Middleware: `PROTECTED_ROUTES = ["/simulations", "/api/simulations"]`; pod `/api/` → `401` JSON, strony → redirect na `/auth/signin`.
- UI: `Topbar.astro` w `Layout.astro`, `SaveControls.tsx` + `hooks/useSaveSimulation.ts` w `Simulator.tsx`, strony `/simulations` (lista, `SavedSimulationsList.tsx`) i `/simulations/[id]` (tryb edycji), formularze auth po polsku.
- Usunięte resztki startera: `dashboard.astro`, `Welcome.astro`.

## Poza zakresem

- `?next=` po logowaniu, współdzielenie biblioteki, historia wersji, eksport.
