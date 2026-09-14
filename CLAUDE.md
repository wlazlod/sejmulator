# Rules for AI

This file provides guidance to AI Agent when working with code in this repository.

## Commands

- `npm run dev` — start dev server (Cloudflare workerd runtime)
- `npm run build` — production build (SSR via `@astrojs/cloudflare`)
- `npm run preview` — preview production build
- `npm run lint` — ESLint with type-checked rules
- `npm run lint:fix` — auto-fix lint issues
- `npm run format` — Prettier (includes prettier-plugin-astro + prettier-plugin-tailwindcss)
- `npm test` — vitest unit tests (`src/**/*.test.ts`)
- `npm run test:e2e` — Playwright E2E (`e2e/*.spec.ts`, chromium, starts the dev server itself)

Pre-commit hooks: husky + lint-staged runs `eslint --fix` on `*.{ts,tsx,astro}` and `prettier --write` on `*.{json,css,md}`.

## Architecture

**Astro 6 SSR app** with React 19 islands, Tailwind 4, Supabase auth, and shadcn/ui components. Deployed to Cloudflare Workers.

### Rendering mode

Full server-side rendering (`output: "server"` in astro.config.mjs). All pages are server-rendered by default. API routes must export `const prerender = false`.

### Auth flow

- `src/lib/supabase.ts` — creates a Supabase SSR client using `@supabase/ssr` with cookie-based sessions. Uses `astro:env/server` for `SUPABASE_URL` and `SUPABASE_KEY` (server-only secrets declared in astro.config.mjs `env.schema`).
- `src/middleware.ts` — runs on every request, resolves the current user, attaches to `context.locals.user`. `PROTECTED_ROUTES = ["/simulations", "/api/simulations"]`: under `/api/` an anonymous request gets `401` JSON `{ error: "Unauthorized" }`; pages redirect to `/auth/signin`.
- API endpoints: `src/pages/api/auth/{signin,signup,signout}.ts`
- Auth pages: `src/pages/auth/{signin,signup,confirm-email}.astro` (UI in Polish)
- `Topbar.astro` (in `Layout.astro`) shows e-mail + "Moje symulacje" + "Wyloguj" or sign-in/sign-up links.

### Saved simulations (S-05)

Open access stays for ad-hoc simulation and share links. A signed-in user additionally owns a private library of saved simulation _inputs_ (not results — results are deterministic and recomputed on load).

- Table `saved_simulations` (`supabase/migrations/20260914120000_create_saved_simulations.sql`), RLS per operation with `auth.uid() = user_id`.
- Types + manual validation: `src/lib/saved-simulation-types.ts` (same type-guard pattern as `share-types.ts`; no zod dependency).
- Data access: `src/lib/services/saved-simulations.ts` — always filters `user_id` in addition to RLS. Pages and API share this service.
- API: `src/pages/api/simulations/index.ts` (GET list, POST create) and `src/pages/api/simulations/[id].ts` (GET, PATCH, DELETE). A foreign or missing record is `404`, never `403`.
- UI: `SaveControls.tsx` + `hooks/useSaveSimulation.ts` inside `Simulator.tsx` (props `user`, `savedSimulation`); `src/pages/simulations/index.astro` + `SavedSimulationsList.tsx`; `src/pages/simulations/[id].astro` (edit mode).

### Key conventions

- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).
- **Astro components** for static content/layout; **React components** only when interactivity is needed.
- **Tailwind class merging**: use the `cn()` helper from `@/lib/utils` (clsx + tailwind-merge) for conditional/merged class names. Do not concatenate class strings manually.
- **shadcn/ui**: components live in `src/components/ui/`, "new-york" style variant. Install new ones with `npx shadcn@latest add [name]`.
- **API routes**: use uppercase `GET`, `POST`, `PATCH`, `DELETE` exports and `export const prerender = false`; validate input with a manual type-guard (`validateShareRequest`, `validateSavedSimulationInput`) — zod is not a dependency.
- **Supabase migrations**: `supabase/migrations/` using naming format `YYYYMMDDHHmmss_short_description.sql`. Always enable RLS on new tables with granular per-operation, per-role policies.
- **React**: no Next.js directives ("use client" etc.). Extract hooks to `src/components/hooks/`.
- **Services/helpers** go in `src/lib/` (or `src/lib/services/` for extracted business logic).
- **Shared types** (entities, DTOs) go in `src/types.ts`.

### Testing

- **vitest** for logic and data: `src/**/__tests__/*.test.ts` (scope fixed in `vitest.config.ts`). Use it for engine, validation, data integrity.
- **Playwright** for user flows through the browser: `e2e/*.spec.ts` (`playwright.config.ts`, chromium only, `.env` loaded for `E2E_*`). Use it for anything that crosses page ↔ API ↔ middleware.
- Suffixes are disjoint on purpose: never name a Playwright file `*.test.ts`.
- Every test file starts with `// test-plan: R-0X` and new test names carry the `R-0X:` prefix. A new risk is a new row in `context/foundation/test-plan.md` **before** the test is written; the reverse map in that file must list every test file.
- The engine (`src/lib/{dhondt,confidence,normalization}.ts`) is verified against PKW 2023; do not change it without updating `dhondt.test.ts` expectations and the test plan.

### Environment

- Node.js v22.14.0 (see `.nvmrc`)
- Env vars: `SUPABASE_URL`, `SUPABASE_KEY` (copy `.env.example` to `.env` for Node, or `.dev.vars` for Cloudflare local dev)
- Local Supabase: `npx supabase start` (requires Docker)
- Cloudflare local dev: secrets go in `.dev.vars` (gitignored)
- Deploy: automatic from `main` via the Cloudflare Git integration (Worker `sejmulator`, `wrangler.jsonc`); do not rename the worker or add a deploy step to CI. Details: `context/foundation/infrastructure.md`.

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) runs two jobs on every push and PR to `main`: `ci` (lint, vitest, build) and `e2e` (Playwright, `needs: ci`, uploads `playwright-report`). Repository secrets: `SUPABASE_URL`, `SUPABASE_KEY` (build + dev server), `E2E_EMAIL`, `E2E_PASSWORD` (signed-in E2E; without them that spec skips).
