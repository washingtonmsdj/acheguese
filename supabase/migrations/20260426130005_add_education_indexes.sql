-- ============================================================================
-- MIGRATION: Adicionar indices de performance para Education
-- ============================================================================

-- education_profiles: indice para busca por status e data de publicacao
CREATE INDEX IF NOT EXISTS idx_education_profiles_status_published 
  ON education_profiles(status, published_at) 
  WHERE status = 'published';

-- education_profiles: indice para busca por niche_key
CREATE INDEX IF NOT EXISTS idx_education_profiles_niche 
  ON education_profiles(niche_key) 
  WHERE status = 'published';

-- education_leads: indice composto para dashboard
CREATE INDEX IF NOT EXISTS idx_education_leads_dashboard 
  ON education_leads(education_profile_id, status, created_at DESC);

-- education_leads: indice para busca por status especifico
CREATE INDEX IF NOT EXISTS idx_education_leads_status_new 
  ON education_leads(education_profile_id, created_at DESC) 
  WHERE status = 'new';

-- education_lead_events: indice para auditoria
CREATE INDEX IF NOT EXISTS idx_education_lead_events_audit 
  ON education_lead_events(lead_id, created_at DESC);

-- education_events: indice cronologico global para timeline/listagens
CREATE INDEX IF NOT EXISTS idx_education_events_timeline
  ON education_events(starts_at DESC);
