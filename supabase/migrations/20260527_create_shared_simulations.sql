-- S-03: Share link feature
-- Stores simulation inputs (parties + percentages + distributions)
-- so shared simulations can be re-run deterministically.

create table if not exists shared_simulations (
  id text primary key,
  parties jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

-- Index for efficient cleanup of expired rows
create index if not exists idx_shared_simulations_expires
  on shared_simulations(expires_at);

-- RLS: allow anonymous read/insert, no update/delete
alter table shared_simulations enable row level security;

create policy "Anyone can read shared simulations"
  on shared_simulations for select
  using (expires_at > now());

create policy "Anyone can create shared simulations"
  on shared_simulations for insert
  with check (true);
