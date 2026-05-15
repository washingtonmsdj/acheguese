-- ============================================================================
-- MIGRATION: Harden event check-in with participant token + strict RLS
-- Data: 2026-05-14
-- ============================================================================

ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS checkin_code UUID DEFAULT gen_random_uuid();

UPDATE public.event_participants
SET checkin_code = gen_random_uuid()
WHERE checkin_code IS NULL;

ALTER TABLE public.event_participants
ALTER COLUMN checkin_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_checkin_code
ON public.event_participants(checkin_code);

COMMENT ON COLUMN public.event_participants.checkin_code IS 'Código secreto de check-in por participação';

-- RLS hardening: remove broad access and allow only owner or event organizer.
DROP POLICY IF EXISTS "Participants viewable" ON public.event_participants;
DROP POLICY IF EXISTS "Users manage own participation" ON public.event_participants;

CREATE POLICY "Event participants select own_or_organizer"
ON public.event_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = event_participants.profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.profiles op
      ON op.id = e.organizer_profile_id
    WHERE e.id = event_participants.event_id
      AND op.user_id = auth.uid()
  )
);

CREATE POLICY "Event participants insert own_profile"
ON public.event_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = event_participants.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Event participants delete own_profile"
ON public.event_participants
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = event_participants.profile_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Event participants update own_or_organizer"
ON public.event_participants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = event_participants.profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.profiles op
      ON op.id = e.organizer_profile_id
    WHERE e.id = event_participants.event_id
      AND op.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = event_participants.profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.events e
    JOIN public.profiles op
      ON op.id = e.organizer_profile_id
    WHERE e.id = event_participants.event_id
      AND op.user_id = auth.uid()
  )
);
