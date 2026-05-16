BEGIN;

CREATE OR REPLACE FUNCTION public._normalize_legacy_event_text(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized text;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;

  normalized := replace(input_text, chr(65533), '?');

  -- Common UTF-8 mojibake artifacts.
  normalized := replace(normalized, 'Ã', 'Á');
  normalized := replace(normalized, 'Ã€', 'À');
  normalized := replace(normalized, 'Ã‚', 'Â');
  normalized := replace(normalized, 'Ãƒ', 'Ã');
  normalized := replace(normalized, 'Ã‡', 'Ç');
  normalized := replace(normalized, 'Ã‰', 'É');
  normalized := replace(normalized, 'ÃŠ', 'Ê');
  normalized := replace(normalized, 'Ã', 'Í');
  normalized := replace(normalized, 'Ã“', 'Ó');
  normalized := replace(normalized, 'Ã”', 'Ô');
  normalized := replace(normalized, 'Ã•', 'Õ');
  normalized := replace(normalized, 'Ãš', 'Ú');
  normalized := replace(normalized, 'Ã¡', 'á');
  normalized := replace(normalized, 'Ã ', 'à');
  normalized := replace(normalized, 'Ã¢', 'â');
  normalized := replace(normalized, 'Ã£', 'ã');
  normalized := replace(normalized, 'Ã§', 'ç');
  normalized := replace(normalized, 'Ã©', 'é');
  normalized := replace(normalized, 'Ãª', 'ê');
  normalized := replace(normalized, 'Ã­', 'í');
  normalized := replace(normalized, 'Ã³', 'ó');
  normalized := replace(normalized, 'Ã´', 'ô');
  normalized := replace(normalized, 'Ãµ', 'õ');
  normalized := replace(normalized, 'Ãº', 'ú');

  -- Legacy placeholders where diacritics were replaced with '?'.
  normalized := replace(normalized, 'Pr?tico', 'Prático');
  normalized := replace(normalized, 'pr?tico', 'prático');
  normalized := replace(normalized, 'Voc?', 'Você');
  normalized := replace(normalized, 'voc?', 'você');
  normalized := replace(normalized, 'Inscri??o', 'Inscrição');
  normalized := replace(normalized, 'inscri??o', 'inscrição');
  normalized := replace(normalized, 'Descri??o', 'Descrição');
  normalized := replace(normalized, 'descri??o', 'descrição');
  normalized := replace(normalized, 'Informa??es', 'Informações');
  normalized := replace(normalized, 'informa??es', 'informações');
  normalized := replace(normalized, 'Programa??o', 'Programação');
  normalized := replace(normalized, 'programa??o', 'programação');
  normalized := replace(normalized, 'Notifica??o', 'Notificação');
  normalized := replace(normalized, 'notifica??o', 'notificação');
  normalized := replace(normalized, 'Notifica??es', 'Notificações');
  normalized := replace(normalized, 'notifica??es', 'notificações');
  normalized := replace(normalized, 'Hor?rio', 'Horário');
  normalized := replace(normalized, 'hor?rio', 'horário');
  normalized := replace(normalized, 'Hor?rios', 'Horários');
  normalized := replace(normalized, 'hor?rios', 'horários');
  normalized := replace(normalized, 'D?vida', 'Dúvida');
  normalized := replace(normalized, 'd?vida', 'dúvida');
  normalized := replace(normalized, 'D?vidas', 'Dúvidas');
  normalized := replace(normalized, 'd?vidas', 'dúvidas');
  normalized := replace(normalized, 'Dispon?vel', 'Disponível');
  normalized := replace(normalized, 'dispon?vel', 'disponível');
  normalized := replace(normalized, 'Dispon?veis', 'Disponíveis');
  normalized := replace(normalized, 'dispon?veis', 'disponíveis');
  normalized := replace(normalized, 'Neg?cio', 'Negócio');
  normalized := replace(normalized, 'neg?cio', 'negócio');
  normalized := replace(normalized, 'Neg?cios', 'Negócios');
  normalized := replace(normalized, 'neg?cios', 'negócios');
  normalized := replace(normalized, 'M?sica', 'Música');
  normalized := replace(normalized, 'm?sica', 'música');
  normalized := replace(normalized, 'H?brido', 'Híbrido');
  normalized := replace(normalized, 'h?brido', 'híbrido');
  normalized := replace(normalized, 'P?blico', 'Público');
  normalized := replace(normalized, 'p?blico', 'público');
  normalized := replace(normalized, 'P?blica', 'Pública');
  normalized := replace(normalized, 'p?blica', 'pública');
  normalized := replace(normalized, 'Audit?rio', 'Auditório');
  normalized := replace(normalized, 'audit?rio', 'auditório');
  normalized := replace(normalized, 'Comunit?rio', 'Comunitário');
  normalized := replace(normalized, 'comunit?rio', 'comunitário');

  RETURN normalized;
END;
$$;

WITH normalized AS (
  SELECT
    id,
    public._normalize_legacy_event_text(title) AS title,
    public._normalize_legacy_event_text(description) AS description,
    public._normalize_legacy_event_text(location) AS location
  FROM public.events
)
UPDATE public.events e
SET
  title = n.title,
  description = n.description,
  location = n.location
FROM normalized n
WHERE e.id = n.id
  AND (
    e.title IS DISTINCT FROM n.title
    OR e.description IS DISTINCT FROM n.description
    OR e.location IS DISTINCT FROM n.location
  );

DROP FUNCTION public._normalize_legacy_event_text(text);

COMMIT;
