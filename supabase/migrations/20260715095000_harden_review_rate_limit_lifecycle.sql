-- Keep the fixed-size review command limiter aligned with Profile lifecycle.

ALTER TABLE private.review_command_rate_limits
  DROP CONSTRAINT IF EXISTS review_command_rate_limits_actor_profile_id_fkey;

ALTER TABLE private.review_command_rate_limits
  ADD CONSTRAINT review_command_rate_limits_actor_profile_id_fkey
  FOREIGN KEY (actor_profile_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE
  NOT VALID;

ALTER TABLE private.review_command_rate_limits
  VALIDATE CONSTRAINT review_command_rate_limits_actor_profile_id_fkey;

COMMENT ON CONSTRAINT review_command_rate_limits_actor_profile_id_fkey
  ON private.review_command_rate_limits IS
  'Deletes per-profile review rate windows when the canonical Profile is removed.';
