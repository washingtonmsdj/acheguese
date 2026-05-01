-- MIGRATION: add infrastructure fields for education profiles
-- Stores only positive capabilities/features selected by the school owner.

ALTER TABLE education_profiles
  ADD COLUMN IF NOT EXISTS school_basic_resources JSONB,
  ADD COLUMN IF NOT EXISTS school_accessibility_features JSONB,
  ADD COLUMN IF NOT EXISTS school_equipment_features JSONB,
  ADD COLUMN IF NOT EXISTS school_facility_features JSONB;

COMMENT ON COLUMN education_profiles.school_basic_resources IS
  'Array JSONB de recursos basicos da unidade (water_supply, electricity, sewage, waste_collection).';
COMMENT ON COLUMN education_profiles.school_accessibility_features IS
  'Array JSONB de acessibilidade disponivel na unidade (elevator, ramps, tactile_flooring, etc).';
COMMENT ON COLUMN education_profiles.school_equipment_features IS
  'Array JSONB de equipamentos disponiveis na unidade (computer, projector, internet, etc).';
COMMENT ON COLUMN education_profiles.school_facility_features IS
  'Array JSONB de instalacoes da unidade (library, kitchen, science_lab, pool, etc).';

