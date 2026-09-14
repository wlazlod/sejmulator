-- S-05: Saved simulations (per-user library of simulation inputs)
create table if not exists saved_simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  parties jsonb not null,            -- SharedPartyInput[]; ten sam kształt co shared_simulations.parties
  other_parties numeric not null default 0 check (other_parties >= 0 and other_parties <= 100),
  perturbation_pct numeric not null default 1.5 check (perturbation_pct > 0 and perturbation_pct <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_saved_simulations_user
  on saved_simulations(user_id, updated_at desc);

alter table saved_simulations enable row level security;

create policy "owner can select" on saved_simulations
  for select to authenticated using (auth.uid() = user_id);
create policy "owner can insert" on saved_simulations
  for insert to authenticated with check (auth.uid() = user_id);
create policy "owner can update" on saved_simulations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner can delete" on saved_simulations
  for delete to authenticated using (auth.uid() = user_id);
