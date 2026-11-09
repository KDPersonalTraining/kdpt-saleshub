-- Step 5 of the database: cardio. Some exercises are logged as a distance and
-- a time (a run, a row, a ride) instead of weight and reps. Safe to run twice.
alter table exercises add column if not exists measure text not null default 'reps';
alter table exercises drop constraint if exists exercises_measure_kind;
alter table exercises add constraint exercises_measure_kind check (measure in ('reps', 'distance'));
alter table set_logs add column if not exists distance_m numeric(9,1) check (distance_m >= 0);
alter table set_logs add column if not exists duration_s integer check (duration_s > 0);
