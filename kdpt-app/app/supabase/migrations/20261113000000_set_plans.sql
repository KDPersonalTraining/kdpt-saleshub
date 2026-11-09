-- Step 8 of the database: each set of an exercise can be planned on its own:
-- warm-ups, a different rep range per set (a pyramid), drop sets, and
-- as-many-as-possible sets. Null means every set is the same.
-- [{"kind":"warmup","reps":[10,10]},{"kind":"working","reps":[8,10]},...]
-- Safe to run twice.
alter table workout_exercises add column if not exists set_plan jsonb;
