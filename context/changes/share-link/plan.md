# S-03: Share Link — Plan

## Goal

FR-007: Użytkownik może zapisać symulację i otrzymać link do udostępnienia (z TTL).

## Architecture

- Store **simulation inputs only** (parties + percentages + distribution IDs) — ~200 bytes
- Re-run simulation on load (deterministic engine, no need to store results)
- Short ID via `nanoid` (8 chars), e.g. `/s/abc12def`
- TTL: 30 days (Supabase row-level expiry check)
- Graceful degradation: if Supabase is not configured, share button is hidden

## Phase 1: Backend (types + schema + API)

- [ ] Create share types in `src/lib/share-types.ts`
- [ ] Write Supabase migration SQL in `supabase/migrations/`
- [ ] Create `POST /api/share` — save simulation, return short ID
- [ ] Create `GET /api/share/[id]` — load simulation inputs by ID

## Phase 2: Frontend (UI + shared page)

- [ ] Add "Udostępnij" button in `Simulator.tsx` (after simulation)
- [ ] Create `/s/[id]` page that loads shared simulation inputs
- [ ] Copy-to-clipboard feedback

## Phase 3: Tests

- [ ] Unit tests for share types validation
- [ ] Integration test: save + load roundtrip

## Supabase Table Schema

```sql
create table shared_simulations (
  id text primary key,
  parties jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

-- Auto-cleanup via Supabase cron or query filter
create index idx_shared_simulations_expires on shared_simulations(expires_at);
```

## Progress

- Phase 1: done (commit `803217b`)
- Phase 2: done (commit `803217b`)
- Phase 3: done (commit `803217b`)
