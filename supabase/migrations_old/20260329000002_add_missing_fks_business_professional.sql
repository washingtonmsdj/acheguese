-- ============================================================================
-- Adicionar FKs ausentes em business_data e professional_data
-- 
-- Problema: location_id foi criado sem REFERENCES, então PostgREST
-- não consegue fazer JOIN automático via !location_id
-- ============================================================================

-- business_data.location_id → locations(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'business_data_location_id_fkey'
  ) THEN
    ALTER TABLE business_data
      ADD CONSTRAINT business_data_location_id_fkey
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- professional_data.location_id → locations(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'professional_data_location_id_fkey'
  ) THEN
    ALTER TABLE professional_data
      ADD CONSTRAINT professional_data_location_id_fkey
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
END $$;
