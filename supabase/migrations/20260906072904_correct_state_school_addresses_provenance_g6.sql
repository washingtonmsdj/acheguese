-- G6 Education truthfulness: correct two state-school address numbers that
-- were parsed from official "S/N (xxxxx)" identifiers as if they were street
-- numbers. Promote official Bahia school registry provenance at the same time.

DO $$
DECLARE
  v_carlos_count integer;
  v_dionisio_count integer;
BEGIN
  SELECT count(*)
    INTO v_carlos_count
  FROM public.business_data bd
  JOIN public.addresses a ON a.id = bd.address_id
  WHERE bd.metadata->>'inep' = '29191084'
    AND bd.business_name = 'Colegio Estadual Professor Carlos Sant Anna Tempo Integral'
    AND a.street = 'Rua Alto dos Coqueiros'
    AND a.number = '372';

  SELECT count(*)
    INTO v_dionisio_count
  FROM public.business_data bd
  JOIN public.addresses a ON a.id = bd.address_id
  WHERE bd.metadata->>'inep' = '29192617'
    AND bd.business_name = 'Colegio Estadual General Dionisio Cerqueira Tempo Integral'
    AND a.street = 'Rua do Futuro Alto Santa Cruz'
    AND a.number = '475';

  IF v_carlos_count <> 1 OR v_dionisio_count <> 1 THEN
    RAISE EXCEPTION
      'state_school_address_guard_failed carlos=% dionisio=% expected=1/1',
      v_carlos_count,
      v_dionisio_count;
  END IF;

  UPDATE public.addresses a
  SET
    number = CASE bd.metadata->>'inep'
      WHEN '29191084' THEN 'S/N'
      WHEN '29192617' THEN 'S/N'
      ELSE a.number
    END,
    postal_code = CASE bd.metadata->>'inep'
      WHEN '29191084' THEN '41905586'
      WHEN '29192617' THEN '41925490'
      ELSE a.postal_code
    END,
    metadata = COALESCE(a.metadata, '{}'::jsonb) || jsonb_build_object(
      'address_source_kind', 'official_state',
      'address_source_url',
        CASE bd.metadata->>'inep'
          WHEN '29191084' THEN 'https://sigeduc.educacao.ba.gov.br/sigeduc/public/transparencia/pages/ensino/escolas.jsf'
          WHEN '29192617' THEN 'https://www.ba.gov.br/car/sites/site-car/files/2026-01/EDITAL%20DA%20CHAMADA%20PU%CC%81BLICA%20CENTRALIZADA%20N.%2001%202026%20-%20Aquisic%CC%A7a%CC%83o%20de%20Ge%CC%82neros%20Alimenti%CC%81cios%20da%20Agricultura%20Familiar%20e%20do%20Empreendedor%20Familiar%20Rural%20-%20Publicado%20dia%2029.01.2026.pdf'
        END,
      'address_source_reviewed_at', now()::text
    ),
    updated_at = now()
  FROM public.business_data bd
  WHERE bd.address_id = a.id
    AND bd.metadata->>'inep' IN ('29191084', '29192617');

  UPDATE public.business_data bd
  SET
    business_address = CASE bd.metadata->>'inep'
      WHEN '29191084' THEN 'Rua Alto dos Coqueiros, s/n, Nordeste de Amaralina'
      WHEN '29192617' THEN 'Rua do Futuro Alto Santa Cruz, s/n, Santa Cruz'
      ELSE bd.business_address
    END,
    address = CASE bd.metadata->>'inep'
      WHEN '29191084' THEN 'Rua Alto dos Coqueiros, s/n, Nordeste de Amaralina'
      WHEN '29192617' THEN 'Rua do Futuro Alto Santa Cruz, s/n, Santa Cruz'
      ELSE bd.address
    END,
    metadata = COALESCE(bd.metadata, '{}'::jsonb) || jsonb_build_object(
      'address_source_kind', 'official_state',
      'address_source_reviewed_at', now()::text
    ),
    updated_at = now()
  WHERE bd.metadata->>'inep' IN ('29191084', '29192617');

  UPDATE public.education_profiles ep
  SET
    school_source_url =
      CASE bd.metadata->>'inep'
        WHEN '29191084' THEN 'https://sigeduc.educacao.ba.gov.br/sigeduc/public/transparencia/pages/ensino/escolas.jsf'
        WHEN '29192617' THEN 'https://www.ba.gov.br/car/sites/site-car/files/2026-01/EDITAL%20DA%20CHAMADA%20PU%CC%81BLICA%20CENTRALIZADA%20N.%2001%202026%20-%20Aquisic%CC%A7a%CC%83o%20de%20Ge%CC%82neros%20Alimenti%CC%81cios%20da%20Agricultura%20Familiar%20e%20do%20Empreendedor%20Familiar%20Rural%20-%20Publicado%20dia%2029.01.2026.pdf'
        ELSE ep.school_source_url
      END,
    school_source_updated_at = now(),
    updated_at = now()
  FROM public.business_data bd
  WHERE ep.business_id = bd.profile_id
    AND bd.metadata->>'inep' IN ('29191084', '29192617');
END $$;
