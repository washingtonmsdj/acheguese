BEGIN;

-- SSOT territorial: impede duplicidade de distritos oficiais do IBGE no mesmo banco.
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_district_ibge_unique
  ON public.locations ((metadata->>'ibge_district_id'))
  WHERE type::text = 'district'
    AND metadata ? 'ibge_district_id';

CREATE INDEX IF NOT EXISTS idx_locations_district_city_ibge
  ON public.locations ((metadata->>'ibge_municipio_id'))
  WHERE type::text = 'district'
    AND metadata ? 'ibge_municipio_id';

COMMENT ON INDEX idx_locations_district_ibge_unique IS
  'Garante unicidade de district oficial por ibge_district_id (SSOT nacional).';

COMMENT ON INDEX idx_locations_district_city_ibge IS
  'Acelera consultas por município IBGE na hierarquia de distritos.';

COMMIT;
