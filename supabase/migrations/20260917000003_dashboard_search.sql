-- Dashboard search support: keep month/filter work in Postgres and cap results at 1,000.
create index if not exists ri_month_retailer_idx
  on public.retailer_incentives(month, retailer_id);

create or replace function public.get_incentive_months()
returns table(month text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct ri.month
  from public.retailer_incentives ri
  where ri.month is not null
  order by ri.month desc;
$$;

create or replace function public.get_incentive_filter_options(p_month text)
returns table(accmgrid text, hotspotid text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct ri.accmgrid, ri.hotspotid
  from public.retailer_incentives ri
  where ri.month = p_month
  order by ri.accmgrid, ri.hotspotid;
$$;

create or replace function public.search_incentive_records(
  p_month text,
  p_retailer_id text default null,
  p_accmgrid text default null,
  p_hotspotid text default null,
  p_limit integer default 1000
)
returns setof public.retailer_incentives
language sql
stable
security invoker
set search_path = public
as $$
  select ri.*
  from public.retailer_incentives ri
  where ri.month = p_month
    and (nullif(trim(p_retailer_id), '') is null
      or ri.retailer_id ilike '%' || trim(p_retailer_id) || '%')
    and (nullif(trim(p_accmgrid), '') is null or ri.accmgrid = trim(p_accmgrid))
    and (nullif(trim(p_hotspotid), '') is null or ri.hotspotid = trim(p_hotspotid))
  order by ri.retailer_id, ri.id
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000);
$$;
