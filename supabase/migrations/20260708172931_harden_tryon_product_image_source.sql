-- Fecha SSRF/callback abuse no fluxo Virtual Try-On.
-- A UI grava imagens em storage public/tryon/<user_id>/inputs/*. A tabela nao
-- deve aceitar URL arbitraria, porque tryon-generate faz fetch server-side dessa
-- URL antes de enviar a imagem ao provider de IA.

ALTER TABLE public.tryon_generations
  DROP CONSTRAINT IF EXISTS tryon_generations_product_image_url_storage_source_chk;

ALTER TABLE public.tryon_generations
  ADD CONSTRAINT tryon_generations_product_image_url_storage_source_chk
  CHECK (
    product_image_url ~ (
      '^https://[^/?#]+/storage/v1/object/public/tryon/' ||
      user_id::text ||
      '/inputs/[^?#]+$'
    )
  )
  NOT VALID;

COMMENT ON CONSTRAINT tryon_generations_product_image_url_storage_source_chk
  ON public.tryon_generations
  IS 'Novos registros de Try-On devem apontar para imagem do bucket tryon no prefixo inputs do proprio user_id; a Edge Function tambem valida a origem Supabase do projeto.';
