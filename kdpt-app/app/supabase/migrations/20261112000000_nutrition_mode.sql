-- Step 7 of the database: how many numbers each client sees in Fuel, set by
-- Kyle: everything, protein only, or none. Safe to run twice.
alter table nutrition_settings add column if not exists mode text not null default 'full';
alter table nutrition_settings drop constraint if exists nutrition_settings_mode_kind;
alter table nutrition_settings add constraint nutrition_settings_mode_kind check (mode in ('full', 'protein', 'simple'));
