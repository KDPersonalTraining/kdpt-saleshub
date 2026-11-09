-- Step 7 of the database: how many numbers each client sees in Fuel, set by
-- Kyle: everything, protein only, or none. Safe to run twice.
alter table nutrition_settings add column if not exists mode text not null default 'full';
alter table nutrition_settings drop constraint if exists nutrition_settings_mode_kind;
alter table nutrition_settings add constraint nutrition_settings_mode_kind check (mode in ('full', 'protein', 'simple'));

-- Community: members see each other's first names on posts and comments, and
-- nothing else about each other.
create or replace function public.community_names() returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.preferred_name, ''), split_part(p.full_name, ' ', 1))
  from profiles p
  where p.org_id = app.my_org() and p.archived_at is null
$$;
revoke all on function public.community_names() from public;
grant execute on function public.community_names() to authenticated;
