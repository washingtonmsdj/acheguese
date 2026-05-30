-- Harden classified_reports with explicit schema, constraints and RLS.

CREATE TABLE IF NOT EXISTS public.classified_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES public.classifieds(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.classified_reports
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.classified_reports
  DROP CONSTRAINT IF EXISTS classified_reports_reason_check;

ALTER TABLE public.classified_reports
  ADD CONSTRAINT classified_reports_reason_check
  CHECK (reason IN (
    'fraud',
    'fake',
    'inappropriate',
    'spam',
    'duplicate',
    'wrong-category',
    'sold',
    'other'
  ));

ALTER TABLE public.classified_reports
  DROP CONSTRAINT IF EXISTS classified_reports_status_check;

ALTER TABLE public.classified_reports
  ADD CONSTRAINT classified_reports_status_check
  CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'));

CREATE INDEX IF NOT EXISTS idx_classified_reports_classified_id
  ON public.classified_reports (classified_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classified_reports_reporter_id
  ON public.classified_reports (reporter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classified_reports_status
  ON public.classified_reports (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_classified_reports_unique_pending_reporter
  ON public.classified_reports (classified_id, reporter_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS trg_classified_reports_updated_at ON public.classified_reports;
CREATE TRIGGER trg_classified_reports_updated_at
  BEFORE UPDATE ON public.classified_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.classified_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS classified_reports_insert_own ON public.classified_reports;
CREATE POLICY classified_reports_insert_own
  ON public.classified_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.classifieds c
      WHERE c.id = classified_id
    )
  );

DROP POLICY IF EXISTS classified_reports_select_own_or_admin ON public.classified_reports;
CREATE POLICY classified_reports_select_own_or_admin
  ON public.classified_reports
  FOR SELECT
  TO authenticated
  USING (
    reporter_id IN (
      SELECT p.id
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
    OR coalesce(public.is_admin_user(auth.uid()), false)
    OR coalesce(public.is_admin(auth.uid()), false)
  );

DROP POLICY IF EXISTS classified_reports_admin_update ON public.classified_reports;
CREATE POLICY classified_reports_admin_update
  ON public.classified_reports
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

DROP POLICY IF EXISTS classified_reports_admin_delete ON public.classified_reports;
CREATE POLICY classified_reports_admin_delete
  ON public.classified_reports
  FOR DELETE
  TO authenticated
  USING (
    coalesce(public.is_admin_user(auth.uid()), false)
    OR coalesce(public.is_admin(auth.uid()), false)
  );
