-- Step 6 of the database: Kyle can edit a client's programme after giving it
-- to them. Removing a workout or an exercise mustn't lose the client's logged
-- sets, so their logs keep everything and simply stop pointing at the part of
-- the plan that was removed. Safe to run twice.
alter table set_logs drop constraint if exists set_logs_workout_exercise_id_fkey;
alter table set_logs add constraint set_logs_workout_exercise_id_fkey
  foreign key (workout_exercise_id) references workout_exercises (id) on delete set null;
alter table workout_sessions drop constraint if exists workout_sessions_workout_id_fkey;
alter table workout_sessions add constraint workout_sessions_workout_id_fkey
  foreign key (workout_id) references workouts (id) on delete set null;
alter table substitutions drop constraint if exists substitutions_workout_exercise_id_fkey;
alter table substitutions add constraint substitutions_workout_exercise_id_fkey
  foreign key (workout_exercise_id) references workout_exercises (id) on delete cascade;
-- The workout's name is kept on each session, so History still says what was
-- done after the workout is renamed or removed from the plan.
alter table workout_sessions add column if not exists workout_name text;
