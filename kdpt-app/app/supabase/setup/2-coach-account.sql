-- Run once, after the schema (step 1) and after adding yourself as a user in
-- Supabase → Authentication → Users → Add user (kyle.kdpt@gmail.com).
-- Creates the KDPT organisation and makes that user the head coach.
-- Safe to run twice.

insert into organisations (name, slug)
values ('KD Personal Training', 'kdpt')
on conflict (slug) do nothing;

insert into profiles (id, org_id, role, full_name, preferred_name)
select u.id, o.id, 'coach', 'Kyle', 'Kyle'
from auth.users u
cross join organisations o
where lower(u.email) = 'kyle.kdpt@gmail.com' and o.slug = 'kdpt'
on conflict (id) do update set role = 'coach', org_id = excluded.org_id;

-- Should show one row: your email, role coach.
select u.email, p.role, p.full_name
from profiles p join auth.users u on u.id = p.id
where p.role = 'coach';
