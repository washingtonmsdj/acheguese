-- ============================================================================
-- MIGRATION: Add check-in support to event participants
-- Data: 2026-05-14
-- ============================================================================

ALTER TABLE public.event_participants
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_event_participants_checked_in_at
ON public.event_participants(checked_in_at)
WHERE checked_in_at IS NOT NULL;

COMMENT ON COLUMN public.event_participants.checked_in_at IS 'Timestamp oficial de check-in no evento';
