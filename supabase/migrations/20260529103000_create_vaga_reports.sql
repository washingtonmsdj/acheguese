-- Create persisted reports for job listings with explicit constraints and RLS.

CREATE TABLE IF NOT EXISTS public.vaga_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  reporter_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vaga_reports
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.vaga_reports
  DROP CONSTRAINT IF EXISTS vaga_reports_reason_check;

ALTER TABLE public.vaga_reports
  ADD CONSTRAINT vaga_reports_reason_check
  CHECK (reason IN (
    'fraud',
    'fake-company',
    'inappropriate',
    'spam',
    'expired',
    'misleading',
    'discrimination',
    'other'
  ));

ALTER TABLE public.vaga_reports
  DROP CONSTRAINT IF EXISTS vaga_reports_status_check;

ALTER TABLE public.vaga_reports
  ADD CONSTRAINT vaga_reports_status_check
  CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'));

ALTER TABLE public.vaga_reports
  DROP CONSTRAINT IF EXISTS vaga_reports_description_length_check;

ALTER TABLE public.vaga_reports
  ADD CONSTRAINT vaga_reports_description_length_check
  CHECK (
    description IS NULL
    OR char_length(trim(description)) BETWEEN 3 AND 1000
  );

ALTER TABLE public.vaga_reports
  DROP CONSTRAINT IF EXISTS vaga_reports_admin_notes_length_check;

ALTER TABLE public.vaga_reports
  ADD CONSTRAINT vaga_reports_admin_notes_length_check
  CHECK (
    admin_notes IS NULL
    OR char_length(trim(admin_notes)) BETWEEN 3 AND 1000
  );

CREATE INDEX IF NOT EXISTS idx_vaga_reports_vaga_id
  ON public.vaga_reports (vaga_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vaga_reports_reporter_profile_id
  ON public.vaga_reports (reporter_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vaga_reports_status
  ON public.vaga_reports (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vaga_reports_unique_pending_reporter
  ON public.vaga_reports (vaga_id, reporter_profile_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS trg_vaga_reports_updated_at ON public.vaga_reports;
CREATE TRIGGER trg_vaga_reports_updated_at
  BEFORE UPDATE ON public.vaga_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.vaga_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vaga_reports_insert_own ON public.vaga_reports;
CREATE POLICY vaga_reports_insert_own
  ON public.vaga_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.vagas v
      WHERE v.id = vaga_id
        AND v.owner_profile_id <> reporter_profile_id
    )
  );

DROP POLICY IF EXISTS vaga_reports_select_own_or_admin ON public.vaga_reports;
CREATE POLICY vaga_reports_select_own_or_admin
  ON public.vaga_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_profile_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    OR coalesce(public.is_admin_user(auth.uid()), false)
    OR coalesce(public.is_admin(auth.uid()), false)
  );

DROP POLICY IF EXISTS vaga_reports_admin_update ON public.vaga_reports;
CREATE POLICY vaga_reports_admin_update
  ON public.vaga_reports
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(public.is_admin_user(auth.uid()), false)
    OR coalesce(public.is_admin(auth.uid()), false)
  )
  WITH CHECK (
    coalesce(public.is_admin_user(auth.uid()), false)
    OR coalesce(public.is_admin(auth.uid()), false)
  );

DROP POLICY IF EXISTS vaga_reports_admin_delete ON public.vaga_reports;
CREATE POLICY vaga_reports_admin_delete
  ON public.vaga_reports
  FOR DELETE
  TO authenticated
  USING (
    coalesce(public.is_admin_user(auth.uid()), false)
    OR coalesce(public.is_admin(auth.uid()), false)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaga_reports TO authenticated;
