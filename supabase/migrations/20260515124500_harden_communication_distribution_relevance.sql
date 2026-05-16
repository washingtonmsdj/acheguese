-- Comunicacao Territorial: SSOT de relevancia e hardening da distribuicao.
-- A regra de score fica no banco para evitar divergencia entre UI, services e RPCs.

CREATE OR REPLACE FUNCTION public.communication_distribution_relevance_score(
  p_publication_type text,
  p_content_format text,
  p_target_type text
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT greatest(
    0,
    least(
      100,
      50
      + CASE p_publication_type
          WHEN 'public_utility' THEN 20
          WHEN 'report' THEN 15
          WHEN 'coverage' THEN 12
          WHEN 'news' THEN 10
          WHEN 'event' THEN 8
          WHEN 'job' THEN 6
          ELSE 0
        END
      + CASE p_content_format
          WHEN 'article' THEN 5
          WHEN 'update' THEN 0
          ELSE 0
        END
      + CASE p_target_type
          WHEN 'community_tab' THEN 5
          WHEN 'communication_hub' THEN 0
          WHEN 'contextual_feed' THEN -5
          ELSE 0
        END
    )
  );
$$;

COMMENT ON FUNCTION public.communication_distribution_relevance_score(text, text, text)
  IS 'SSOT de score inicial para distribuicao de publicacoes de Comunicacao Territorial.';

CREATE OR REPLACE FUNCTION public.communication_upsert_default_distribution(p_publication_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_publication public.communication_publications%ROWTYPE;
  v_target_type text;
BEGIN
  SELECT * INTO v_publication
  FROM public.communication_publications
  WHERE id = p_publication_id;

  IF NOT FOUND OR v_publication.status <> 'published' THEN
    RETURN;
  END IF;

  FOREACH v_target_type IN ARRAY ARRAY['communication_hub', 'community_tab']
  LOOP
    INSERT INTO public.communication_publication_distribution (
      publication_id,
      channel_id,
      location_id,
      target_type,
      is_active,
      relevance_score
    )
    VALUES (
      v_publication.id,
      v_publication.channel_id,
      v_publication.location_id,
      v_target_type,
      true,
      public.communication_distribution_relevance_score(
        v_publication.publication_type,
        v_publication.content_format,
        v_target_type
      )
    )
    ON CONFLICT (publication_id, location_id, target_type)
    DO UPDATE SET
      is_active = true,
      relevance_score = EXCLUDED.relevance_score,
      updated_at = now();
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.communication_upsert_default_distribution(uuid)
  IS 'Funcao interna chamada pela RPC de publicacao para materializar destinos territoriais padrao.';

REVOKE EXECUTE ON FUNCTION public.communication_upsert_default_distribution(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.communication_upsert_default_distribution(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.communication_upsert_default_distribution(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.communication_distribution_relevance_score(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.communication_distribution_relevance_score(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.communication_distribution_relevance_score(text, text, text) FROM authenticated;
