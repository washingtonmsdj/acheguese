-- Comunicacao Territorial: ranking de distribuicao como SSOT de leitura.
-- A UI nao calcula relevancia/trending; consome rank_score materializado pelo banco.

ALTER TABLE public.communication_publication_distribution
  ADD COLUMN IF NOT EXISTS rank_score integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS rank_reason text NOT NULL DEFAULT 'default';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'communication_publication_distribution_rank_score_check'
  ) THEN
    ALTER TABLE public.communication_publication_distribution
      ADD CONSTRAINT communication_publication_distribution_rank_score_check
      CHECK (rank_score BETWEEN 0 AND 100);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_communication_distribution_location_rank
  ON public.communication_publication_distribution(location_id, target_type, is_active, rank_score DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.communication_distribution_rank_score(
  p_publication_type text,
  p_content_format text,
  p_target_type text,
  p_reliability_score integer DEFAULT 70
)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT greatest(
    0,
    least(
      100,
      public.communication_distribution_relevance_score(p_publication_type, p_content_format, p_target_type)
      + CASE
          WHEN coalesce(p_reliability_score, 70) >= 90 THEN 8
          WHEN coalesce(p_reliability_score, 70) >= 80 THEN 5
          WHEN coalesce(p_reliability_score, 70) >= 70 THEN 0
          WHEN coalesce(p_reliability_score, 70) >= 60 THEN -8
          ELSE -15
        END
    )
  );
$$;

COMMENT ON FUNCTION public.communication_distribution_rank_score(text, text, text, integer)
  IS 'SSOT interno de rank inicial para exibicao territorial de publicacoes de comunicacao.';

CREATE OR REPLACE FUNCTION public.communication_distribution_rank_reason(
  p_publication_type text,
  p_content_format text,
  p_target_type text,
  p_reliability_score integer DEFAULT 70
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT concat_ws(
    ':',
    'territorial',
    coalesce(nullif(p_target_type, ''), 'unknown'),
    coalesce(nullif(p_publication_type, ''), 'unknown'),
    coalesce(nullif(p_content_format, ''), 'unknown'),
    CASE
      WHEN coalesce(p_reliability_score, 70) >= 80 THEN 'trusted_source'
      WHEN coalesce(p_reliability_score, 70) < 60 THEN 'reduced_trust'
      ELSE 'standard_trust'
    END
  );
$$;

COMMENT ON FUNCTION public.communication_distribution_rank_reason(text, text, text, integer)
  IS 'Motivo compacto e auditavel do rank inicial de distribuicao.';

CREATE OR REPLACE FUNCTION public.communication_upsert_default_distribution(p_publication_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_publication public.communication_publications%ROWTYPE;
  v_channel public.communication_channels%ROWTYPE;
  v_target_type text;
  v_relevance_score integer;
  v_rank_score integer;
  v_rank_reason text;
BEGIN
  SELECT * INTO v_publication
  FROM public.communication_publications
  WHERE id = p_publication_id;

  IF NOT FOUND OR v_publication.status <> 'published' THEN
    RETURN;
  END IF;

  SELECT * INTO v_channel
  FROM public.communication_channels
  WHERE id = v_publication.channel_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  FOREACH v_target_type IN ARRAY ARRAY['communication_hub', 'community_tab']
  LOOP
    v_relevance_score := public.communication_distribution_relevance_score(
      v_publication.publication_type,
      v_publication.content_format,
      v_target_type
    );
    v_rank_score := public.communication_distribution_rank_score(
      v_publication.publication_type,
      v_publication.content_format,
      v_target_type,
      v_channel.reliability_score
    );
    v_rank_reason := public.communication_distribution_rank_reason(
      v_publication.publication_type,
      v_publication.content_format,
      v_target_type,
      v_channel.reliability_score
    );

    INSERT INTO public.communication_publication_distribution (
      publication_id,
      channel_id,
      location_id,
      target_type,
      is_active,
      relevance_score,
      rank_score,
      rank_reason
    )
    VALUES (
      v_publication.id,
      v_publication.channel_id,
      v_publication.location_id,
      v_target_type,
      true,
      v_relevance_score,
      v_rank_score,
      v_rank_reason
    )
    ON CONFLICT (publication_id, location_id, target_type)
    DO UPDATE SET
      is_active = true,
      relevance_score = EXCLUDED.relevance_score,
      rank_score = EXCLUDED.rank_score,
      rank_reason = EXCLUDED.rank_reason,
      updated_at = now();
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.communication_distribution_rank_score(text, text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.communication_distribution_rank_score(text, text, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.communication_distribution_rank_score(text, text, text, integer) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.communication_distribution_rank_reason(text, text, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.communication_distribution_rank_reason(text, text, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.communication_distribution_rank_reason(text, text, text, integer) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.communication_upsert_default_distribution(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.communication_upsert_default_distribution(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.communication_upsert_default_distribution(uuid) FROM authenticated;
