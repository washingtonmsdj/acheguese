-- Tabela de denúncias de classificados
CREATE TABLE IF NOT EXISTS classified_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classified_id UUID NOT NULL REFERENCES classifieds(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('fraud', 'fake', 'inappropriate', 'spam', 'duplicate', 'wrong-category', 'sold', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_classified_reports_classified_id ON classified_reports(classified_id);
CREATE INDEX IF NOT EXISTS idx_classified_reports_reporter_id ON classified_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_classified_reports_status ON classified_reports(status);
CREATE INDEX IF NOT EXISTS idx_classified_reports_created_at ON classified_reports(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_classified_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_classified_reports_updated_at
  BEFORE UPDATE ON classified_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_classified_reports_updated_at();

-- RLS Policies
ALTER TABLE classified_reports ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode criar denúncia
CREATE POLICY "Authenticated users can create reports"
  ON classified_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários anônimos também podem denunciar (sem reporter_id)
CREATE POLICY "Anonymous users can create reports"
  ON classified_reports
  FOR INSERT
  TO anon
  WITH CHECK (reporter_id IS NULL);

-- Usuários podem ver suas próprias denúncias
CREATE POLICY "Users can view their own reports"
  ON classified_reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Admins podem ver todas as denúncias
CREATE POLICY "Admins can view all reports"
  ON classified_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderator')
      AND user_roles.is_active = true
    )
  );

-- Admins podem atualizar denúncias
CREATE POLICY "Admins can update reports"
  ON classified_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'moderator')
      AND user_roles.is_active = true
    )
  );

-- Comentário na tabela
COMMENT ON TABLE classified_reports IS 'Denúncias de classificados suspeitos ou inadequados';
COMMENT ON COLUMN classified_reports.reason IS 'Motivo da denúncia: fraud, fake, inappropriate, spam, duplicate, wrong-category, sold, other';
COMMENT ON COLUMN classified_reports.status IS 'Status da denúncia: pending, reviewed, resolved, dismissed';
