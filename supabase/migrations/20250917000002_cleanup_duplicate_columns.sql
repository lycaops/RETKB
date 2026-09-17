-- =====================================================================
-- Incremental migration: Remove duplicate columns / fix incentive_group
-- Applies on top of 20250916000001. Safe for tables already containing
-- data because all operations are ALTER / DROP COLUMN / DROP&RECREATE.
--
-- ORDERING NOTE: Policies that reference branch/zone/branch_id/zone_id
-- must be dropped FIRST (before those columns), then we drop the
-- columns, then recreate policies referencing accmgrid/hotspotid.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- STEP 0. Drop RLS policies on retailer_incentives BEFORE dropping any
--         columns they reference.
-- ---------------------------------------------------------------------
drop policy if exists "ri: admin full access"    on public.retailer_incentives;
drop policy if exists "ri: branch scoped read"   on public.retailer_incentives;
drop policy if exists "ri: zone scoped read"     on public.retailer_incentives;
drop policy if exists "ri: viewer read all"      on public.retailer_incentives;

-- ---------------------------------------------------------------------
-- STEP 1. Drop duplicate "scheme" column (keep incentive_group only)
-- ---------------------------------------------------------------------
alter table if exists public.retailer_incentives
  drop column if exists scheme;

-- ---------------------------------------------------------------------
-- STEP 2. Fix incentive_group CHECK constraint to use raw dataset values
-- ---------------------------------------------------------------------
do $$
declare
  cname text;
begin
  select conname into cname
    from pg_constraint
   where conrelid = 'public.retailer_incentives'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%incentive_group%';
  if cname is not null then
    execute format('alter table public.retailer_incentives drop constraint %I', cname);
  end if;
end $$;

alter table public.retailer_incentives
  add constraint retailer_incentives_incentive_group_check
  check (incentive_group in ('NOR_RET','SPL_RET'));

-- ---------------------------------------------------------------------
-- STEP 3. Drop obsolete indexes that reference columns about to go
-- ---------------------------------------------------------------------
drop index if exists public.ri_branch_idx;
drop index if exists public.ri_zone_idx;
drop index if exists public.ri_scope_text_idx;

-- ---------------------------------------------------------------------
-- STEP 4. Drop duplicate scope columns (branch, zone, branch_id, zone_id)
--         Policies are already gone so no cascade is needed.
-- ---------------------------------------------------------------------
alter table if exists public.retailer_incentives
  drop column if exists branch,
  drop column if exists zone,
  drop column if exists branch_id,
  drop column if exists zone_id;

-- ---------------------------------------------------------------------
-- STEP 5. Create indexes on accmgrid / hotspotid (now scope columns)
-- ---------------------------------------------------------------------
create index if not exists ri_accmgrid_idx
  on public.retailer_incentives(accmgrid);

create index if not exists ri_hotspotid_idx
  on public.retailer_incentives(hotspotid);

-- ---------------------------------------------------------------------
-- STEP 6. Re-create RLS policies on retailer_incentives.
--    branch_user scope -> accmgrid matches branch name or code.
--    zone_user   scope -> hotspotid matches zone  name or code.
-- ---------------------------------------------------------------------
alter table public.retailer_incentives enable row level security;

-- 6a. Admin full access
create policy "ri: admin full access"
  on public.retailer_incentives for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6b. Branch scoped read (uses accmgrid)
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

-- 6c. Zone scoped read (uses hotspotid)
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

-- 6d. Viewer read all
create policy "ri: viewer read all"
  on public.retailer_incentives for select
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid() and not is_disabled) = 'viewer'
  );

commit;
