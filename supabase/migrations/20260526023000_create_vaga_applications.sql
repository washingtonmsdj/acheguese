-- Create canonical job applications for internal vacancy applications.
-- Keeps candidate data protected by RLS and keeps vagas.application_count in sync.

CREATE TABLE IF NOT EXISTS public.vaga_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  candidato_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'viewed', 'shortlisted', 'rejected', 'hired')),
  mensagem TEXT,
  curriculo_url TEXT,
  resposta_empresa TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vaga_applications_unique_candidate UNIQUE (vaga_id, candidato_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_vaga_applications_vaga
  ON public.vaga_applications(vaga_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vaga_applications_candidate
  ON public.vaga_applications(candidato_profile_id, created_at DESC);

DROP TRIGGER IF EXISTS update_vaga_applications_updated_at ON public.vaga_applications;
CREATE TRIGGER update_vaga_applications_updated_at
  BEFORE UPDATE ON public.vaga_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_vaga_application_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_vaga_id UUID;
BEGIN
  target_vaga_id := COALESCE(NEW.vaga_id, OLD.vaga_id);

  UPDATE public.vagas
  SET application_count = (
    SELECT (count(*))::INTEGER
    FROM public.vaga_applications
    WHERE vaga_id = target_vaga_id
  )
  WHERE id = target_vaga_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_vaga_application_count_after_insert ON public.vaga_applications;
CREATE TRIGGER sync_vaga_application_count_after_insert
  AFTER INSERT ON public.vaga_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vaga_application_count();

DROP TRIGGER IF EXISTS sync_vaga_application_count_after_delete ON public.vaga_applications;
CREATE TRIGGER sync_vaga_application_count_after_delete
  AFTER DELETE ON public.vaga_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vaga_application_count();

CREATE OR REPLACE FUNCTION public.prevent_vaga_application_identity_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.vaga_id <> OLD.vaga_id OR NEW.candidato_profile_id <> OLD.candidato_profile_id THEN
    RAISE EXCEPTION 'Application identity fields cannot be changed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_vaga_application_identity_update ON public.vaga_applications;
CREATE TRIGGER prevent_vaga_application_identity_update
  BEFORE UPDATE ON public.vaga_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_vaga_application_identity_update();

CREATE OR REPLACE FUNCTION public.increment_vaga_view_count(vaga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vagas
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = increment_vaga_view_count.vaga_id
    AND status::TEXT = 'published';
END;
$$;

ALTER TABLE public.vaga_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vaga_applications_select" ON public.vaga_applications;
CREATE POLICY "vaga_applications_select"
  ON public.vaga_applications
  FOR SELECT
  USING (
    public.is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = candidato_profile_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.vagas v
      JOIN public.profiles owner_profile ON owner_profile.id = v.owner_profile_id
      WHERE v.id = vaga_id
        AND owner_profile.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vaga_applications_insert" ON public.vaga_applications;
CREATE POLICY "vaga_applications_insert"
  ON public.vaga_applications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = candidato_profile_id
        AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.vagas v
      WHERE v.id = vaga_id
        AND v.status::TEXT = 'published'
        AND v.owner_profile_id <> candidato_profile_id
    )
  );

DROP POLICY IF EXISTS "vaga_applications_update" ON public.vaga_applications;
CREATE POLICY "vaga_applications_update"
  ON public.vaga_applications
  FOR UPDATE
  USING (
    public.is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.vagas v
      JOIN public.profiles owner_profile ON owner_profile.id = v.owner_profile_id
      WHERE v.id = vaga_id
        AND owner_profile.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin_user(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.vagas v
      JOIN public.profiles owner_profile ON owner_profile.id = v.owner_profile_id
      WHERE v.id = vaga_id
        AND owner_profile.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "vaga_applications_delete_admin" ON public.vaga_applications;
CREATE POLICY "vaga_applications_delete_admin"
  ON public.vaga_applications
  FOR DELETE
  USING (public.is_admin_user(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaga_applications TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_vaga_view_count(UUID) TO anon, authenticated;

COMMENT ON TABLE public.vaga_applications IS
  'Canonical internal applications for public job vacancies.';

COMMENT ON COLUMN public.vaga_applications.candidato_profile_id IS
  'Candidate profile id owned by the authenticated user.';
