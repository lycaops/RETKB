-- =====================================================================
-- Retailer Incentive Statement App - Initial Schema
-- Supabase PostgreSQL Migration (Postgres 15+)
--
-- RUN ORDER:
--   1. Extensions
--   2. ALL TABLES (branches, zones, profiles, retailer_incentives)
--   3. Indexes
--   4. Helper function is_admin()  — defined AFTER profiles exists
--   5. All RLS policies
--   6. Triggers & RPC
--   7. Seed: branches, zones
--   8. Seed: admin profile (replace the UUID placeholder)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 2a. Branches
-- ---------------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2b. Zones (Zones belong to a Branch)
-- ---------------------------------------------------------------------
create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  branch_id uuid not null references public.branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (name, branch_id)
);

-- ---------------------------------------------------------------------
-- 2c. Profiles (one-to-one with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'viewer' check (role in ('admin','branch_user','zone_user','viewer')),
  branch_id uuid references public.branches(id) on delete set null,
  zone_id uuid references public.zones(id) on delete set null,
  is_disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2d. Retailer Incentives (main data table)
--     Snake_case Postgres columns map back to display names in the
--     JS column normalizer (src/lib/AppContext.jsx).
-- ---------------------------------------------------------------------
create table if not exists public.retailer_incentives (
  id uuid primary key default gen_random_uuid(),

  -- Identity / period columns
  retailer_id text not null,
  accmgrid text,
  hotspotid text,
  month text not null,
  payment_mood text,
  incentive_group text check (incentive_group in ('NOR_RET','SPL_RET')),

  -- Activation & topup counts
  total_noofactivations numeric,
  total_topup_less_6_portin numeric,
  total_topup_great_6_portin numeric,
  total_topup_less_6 numeric,
  total_topup_great_6 numeric,
  blocked_noofactivations numeric,
  total_portout numeric,

  -- Core commissions
  bundle1_comm numeric,
  quality_bonus_m_1 numeric,
  volume_bonus_m_1 numeric,
  portout_deduction numeric,
  portin_comm numeric,
  onboarding_comm numeric,
  nonhp_comm numeric,
  gara_comm numeric,
  usage_clawback numeric,
  usage_refund numeric,
  t3ren_bonus numeric,
  total_comm numeric,

  -- Reconciliation
  opening_balance numeric,
  total_paid_sbt_bt_vou numeric,

  -- Activation performance
  new_act_cnt numeric,
  new_act_renewal_cnt numeric,
  new_activations numeric,
  portin_act_cnt numeric,
  portin_act_renewal_cnt numeric,
  port_in numeric,
  total_bundle_act numeric,
  bundle_act_not_eligible numeric,
  usage_percentage numeric,

  -- Tier bonuses / renewals
  t1_bonus numeric,
  t2_bonus numeric,
  t1_renewal numeric,
  t2_renewal numeric,

  -- Additional metrics
  fake_port_out_pct numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------
create index if not exists ri_retailer_idx on public.retailer_incentives(retailer_id);
create index if not exists ri_month_idx    on public.retailer_incentives(month);
create index if not exists ri_accmgrid_idx on public.retailer_incentives(accmgrid);
create index if not exists ri_hotspotid_idx on public.retailer_incentives(hotspotid);
create index if not exists ri_group_idx    on public.retailer_incentives(incentive_group);

-- ---------------------------------------------------------------------
-- 4. Helper: is_admin(auth_uid) — defined AFTER the profiles table
--    so the body can resolve the relation at DDL time. Language is
--    plpgsql so the plan is deferred at call time (belt & suspenders).
-- ---------------------------------------------------------------------
create or replace function public.is_admin(p_uid uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result boolean;
begin
  select exists (
    select 1 from public.profiles
     where id = p_uid and role = 'admin' and is_disabled = false
  ) into result;
  return result;
end;
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. RLS — branches
-- ---------------------------------------------------------------------
alter table public.branches enable row level security;

drop policy if exists "branches: read by authenticated" on public.branches;
create policy "branches: read by authenticated"
  on public.branches for select
  to authenticated
  using (true);

drop policy if exists "branches: write by admin" on public.branches;
create policy "branches: write by admin"
  on public.branches for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. RLS — zones
-- ---------------------------------------------------------------------
alter table public.zones enable row level security;

drop policy if exists "zones: read by authenticated" on public.zones;
create policy "zones: read by authenticated"
  on public.zones for select
  to authenticated
  using (true);

drop policy if exists "zones: write by admin" on public.zones;
create policy "zones: write by admin"
  on public.zones for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. RLS — profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles: admin full access" on public.profiles;
create policy "profiles: admin full access"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "profiles: self read" on public.profiles;
create policy "profiles: self read"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles: self update basic" on public.profiles;
create policy "profiles: self update basic"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and branch_id is not distinct from (select branch_id from public.profiles where id = auth.uid())
    and zone_id is not distinct from (select zone_id from public.profiles where id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 5. RLS — retailer_incentives
-- ---------------------------------------------------------------------
alter table public.retailer_incentives enable row level security;

drop policy if exists "ri: admin full access" on public.retailer_incentives;
create policy "ri: admin full access"
  on public.retailer_incentives for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "ri: branch scoped read" on public.retailer_incentives;
create policy "ri: branch scoped read"
  on public.retailer_incentives for select
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid() and not is_disabled) = 'branch_user'
    and
    (
      accmgrid = (select b.name from public.branches b
                   join public.profiles p on p.branch_id = b.id
                  where p.id = auth.uid())
      or
      accmgrid = (select b.code from public.branches b
                   join public.profiles p on p.branch_id = b.id
                  where p.id = auth.uid())
    )
  );

drop policy if exists "ri: zone scoped read" on public.retailer_incentives;
create policy "ri: zone scoped read"
  on public.retailer_incentives for select
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid() and not is_disabled) = 'zone_user'
    and
    (
      hotspotid = (select z.name from public.zones z
                    join public.profiles p on p.zone_id = z.id
                   where p.id = auth.uid())
      or
      hotspotid = (select z.code from public.zones z
                    join public.profiles p on p.zone_id = z.id
                   where p.id = auth.uid())
    )
  );

drop policy if exists "ri: viewer read all" on public.retailer_incentives;
create policy "ri: viewer read all"
  on public.retailer_incentives for select
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid() and not is_disabled) = 'viewer'
  );

-- ---------------------------------------------------------------------
-- 6. Trigger: auto-create profile row when a new auth.user signs up
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    'viewer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 7. RPC: create_app_profile (admin-only)
--    Callable by admin to create/overwrite a profiles row for an
--    existing auth user with role/branch/zone assignment.
-- ---------------------------------------------------------------------
create or replace function public.create_app_profile(
  p_auth_uid uuid,
  p_role text default 'viewer',
  p_branch_id uuid default null,
  p_zone_id uuid default null,
  p_full_name text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.profiles;
begin
  if not public.is_admin() then
    raise exception 'admin_only';
  end if;

  if p_role not in ('admin','branch_user','zone_user','viewer') then
    raise exception 'invalid_role';
  end if;

  insert into public.profiles (id, email, full_name, role, branch_id, zone_id)
  select p_auth_uid, email, coalesce(p_full_name, full_name), p_role, p_branch_id, p_zone_id
    from auth.users where id = p_auth_uid
  on conflict (id) do update
    set role        = excluded.role,
        branch_id   = excluded.branch_id,
        zone_id     = excluded.zone_id,
        full_name   = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at  = now()
  returning * into rec;

  return rec;
end;
$$;

grant execute on function public.create_app_profile(uuid, text, uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 8a. Seed — Branches (8 branches)
-- ---------------------------------------------------------------------
insert into public.branches (name, code) values
  ('LMIT-HS-BARI',    'BARI'),
  ('LMIT-HS-BOLOGNA', 'BOL'),
  ('LMIT-HS-MILAN',   'MIL'),
  ('LMIT-HS-NAPLES',  'NAP'),
  ('LMIT-HS-PADOVA',  'PAD'),
  ('LMIT-HS-PALERMO', 'PAL'),
  ('LMIT-HS-ROME',    'ROM'),
  ('LMIT-HS-TORINO',  'TOR')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 8b. Seed — Zones (29 zones, mapped to branches)
--     NOTE: zones use Italian-language spellings "Milano", "Napoli",
--     "Roma", "Torinoo" — preserved exactly as requested, and mapped
--     to the matching English branch-name above.
--     "Torinoo" (double 'o') is intentional per the input list.
-- ---------------------------------------------------------------------
insert into public.zones (name, code, branch_id)
select 'HS BARI ZONE 1',   'BARI-Z1', id from public.branches where name = 'LMIT-HS-BARI' union all
select 'HS BARI ZONE 2',   'BARI-Z2', id from public.branches where name = 'LMIT-HS-BARI' union all
select 'HS BARI ZONE 3',   'BARI-Z3', id from public.branches where name = 'LMIT-HS-BARI'

union all select 'HS BOLOGNA ZONE 1', 'BOL-Z1', id from public.branches where name = 'LMIT-HS-BOLOGNA'
union all select 'HS BOLOGNA ZONE 2', 'BOL-Z2', id from public.branches where name = 'LMIT-HS-BOLOGNA'
union all select 'HS BOLOGNA ZONE 3', 'BOL-Z3', id from public.branches where name = 'LMIT-HS-BOLOGNA'

union all select 'HS MILANO ZONE 1', 'MIL-Z1', id from public.branches where name = 'LMIT-HS-MILAN'
union all select 'HS MILANO ZONE 2', 'MIL-Z2', id from public.branches where name = 'LMIT-HS-MILAN'
union all select 'HS MILANO ZONE 3', 'MIL-Z3', id from public.branches where name = 'LMIT-HS-MILAN'
union all select 'HS MILANO ZONE 4', 'MIL-Z4', id from public.branches where name = 'LMIT-HS-MILAN'

union all select 'HS NAPOLI ZONE 1', 'NAP-Z1', id from public.branches where name = 'LMIT-HS-NAPLES'
union all select 'HS NAPOLI ZONE 2', 'NAP-Z2', id from public.branches where name = 'LMIT-HS-NAPLES'
union all select 'HS NAPOLI ZONE 3', 'NAP-Z3', id from public.branches where name = 'LMIT-HS-NAPLES'
union all select 'HS NAPOLI ZONE 4', 'NAP-Z4', id from public.branches where name = 'LMIT-HS-NAPLES'
union all select 'HS NAPOLI ZONE 5', 'NAP-Z5', id from public.branches where name = 'LMIT-HS-NAPLES'
union all select 'HS NAPOLI ZONE 6', 'NAP-Z6', id from public.branches where name = 'LMIT-HS-NAPLES'
union all select 'HS NAPOLI ZONE 7', 'NAP-Z7', id from public.branches where name = 'LMIT-HS-NAPLES'

union all select 'HS PADOVA ZONE 1', 'PAD-Z1', id from public.branches where name = 'LMIT-HS-PADOVA'
union all select 'HS PADOVA ZONE 2', 'PAD-Z2', id from public.branches where name = 'LMIT-HS-PADOVA'

union all select 'HS PALERMO ZONE 1', 'PAL-Z1', id from public.branches where name = 'LMIT-HS-PALERMO'
union all select 'HS PALERMO ZONE 2', 'PAL-Z2', id from public.branches where name = 'LMIT-HS-PALERMO'
union all select 'HS PALERMO ZONE 3', 'PAL-Z3', id from public.branches where name = 'LMIT-HS-PALERMO'

union all select 'HS ROMA ZONE 1', 'ROM-Z1', id from public.branches where name = 'LMIT-HS-ROME'
union all select 'HS ROMA ZONE 2', 'ROM-Z2', id from public.branches where name = 'LMIT-HS-ROME'
union all select 'HS ROMA ZONE 3', 'ROM-Z3', id from public.branches where name = 'LMIT-HS-ROME'
union all select 'HS ROMA ZONE 4', 'ROM-Z4', id from public.branches where name = 'LMIT-HS-ROME'
union all select 'HS ROMA ZONE 5', 'ROM-Z5', id from public.branches where name = 'LMIT-HS-ROME'

union all select 'HS TORINOO ZONE 1', 'TOR-Z1', id from public.branches where name = 'LMIT-HS-TORINO'
union all select 'HS TORINOO ZONE 2', 'TOR-Z2', id from public.branches where name = 'LMIT-HS-TORINO'
union all select 'HS TORINOO ZONE 3', 'TOR-Z3', id from public.branches where name = 'LMIT-HS-TORINO';

-- ---------------------------------------------------------------------
-- 8c. Admin profile bootstrap (ONE-TIME STEP AFTER AUTH USER EXISTS)
--
-- First, in Supabase Dashboard: Authentication → Users → Add user
--   Email: e.g. admin@retailerapp.local
--   Auto-confirm: YES
--   Password: (your choice — keep it strong)
--
-- Copy the User UID (looks like a1b2c3d4-1234-5678-9abc-def012345678)
-- and paste it below, then run ONLY the select statement (not the
-- commented insert). Or use the RPC which is safer because it reads
-- the email & id directly from auth.users:
--
--   select public.create_app_profile(
--     p_auth_uid  := '<ADMIN_AUTH_UUID>'::uuid,
--     p_role      := 'admin',
--     p_branch_id := null,
--     p_zone_id   := null,
--     p_full_name := 'Application Admin'
--   );
--
-- The commented insert below is the equivalent low-level version:
--
--   insert into public.profiles (id, email, full_name, role, is_disabled)
--   values (
--     '<ADMIN_AUTH_UUID>'::uuid,
--     'admin@retailerapp.local',
--     'Application Admin',
--     'admin',
--     false
--   ) on conflict (id) do update
--     set role = 'admin', is_disabled = false, updated_at = now();
-- ---------------------------------------------------------------------
