BEGIN;

CREATE OR REPLACE FUNCTION public._legacy_mojibake_latin1(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT convert_from(convert_to(input_text, 'UTF8'), 'LATIN1')
$function$;

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

  -- Normalize double-encoded artifacts to single-encoded artifacts first.
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));
  normalized := replace(normalized, public._legacy_mojibake_latin1(public._legacy_mojibake_latin1('?')), public._legacy_mojibake_latin1('?'));

  -- Normalize single-encoded artifacts to valid UTF-8.
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');
  normalized := replace(normalized, public._legacy_mojibake_latin1('?'), '?');

  -- Legacy placeholders where diacritics were replaced with '?'.
  normalized := replace(normalized, 'Pr?tico', 'Pr?tico');
  normalized := replace(normalized, 'pr?tico', 'pr?tico');
  normalized := replace(normalized, 'Voc?', 'Voc?');
  normalized := replace(normalized, 'voc?', 'voc?');
  normalized := replace(normalized, 'Inscri??o', 'Inscri??o');
  normalized := replace(normalized, 'inscri??o', 'inscri??o');
  normalized := replace(normalized, 'Descri??o', 'Descri??o');
  normalized := replace(normalized, 'descri??o', 'descri??o');
  normalized := replace(normalized, 'Informa??es', 'Informa??es');
  normalized := replace(normalized, 'informa??es', 'informa??es');
  normalized := replace(normalized, 'Programa??o', 'Programa??o');
  normalized := replace(normalized, 'programa??o', 'programa??o');
  normalized := replace(normalized, 'Notifica??o', 'Notifica??o');
  normalized := replace(normalized, 'notifica??o', 'notifica??o');
  normalized := replace(normalized, 'Notifica??es', 'Notifica??es');
  normalized := replace(normalized, 'notifica??es', 'notifica??es');
  normalized := replace(normalized, 'Hor?rio', 'Hor?rio');
  normalized := replace(normalized, 'hor?rio', 'hor?rio');
  normalized := replace(normalized, 'Hor?rios', 'Hor?rios');
  normalized := replace(normalized, 'hor?rios', 'hor?rios');
  normalized := replace(normalized, 'D?vida', 'D?vida');
  normalized := replace(normalized, 'd?vida', 'd?vida');
  normalized := replace(normalized, 'D?vidas', 'D?vidas');
  normalized := replace(normalized, 'd?vidas', 'd?vidas');
  normalized := replace(normalized, 'Dispon?vel', 'Dispon?vel');
  normalized := replace(normalized, 'dispon?vel', 'dispon?vel');
  normalized := replace(normalized, 'Dispon?veis', 'Dispon?veis');
  normalized := replace(normalized, 'dispon?veis', 'dispon?veis');
  normalized := replace(normalized, 'Neg?cio', 'Neg?cio');
  normalized := replace(normalized, 'neg?cio', 'neg?cio');
  normalized := replace(normalized, 'Neg?cios', 'Neg?cios');
  normalized := replace(normalized, 'neg?cios', 'neg?cios');
  normalized := replace(normalized, 'M?sica', 'M?sica');
  normalized := replace(normalized, 'm?sica', 'm?sica');
  normalized := replace(normalized, 'H?brido', 'H?brido');
  normalized := replace(normalized, 'h?brido', 'h?brido');
  normalized := replace(normalized, 'P?blico', 'P?blico');
  normalized := replace(normalized, 'p?blico', 'p?blico');
  normalized := replace(normalized, 'P?blica', 'P?blica');
  normalized := replace(normalized, 'p?blica', 'p?blica');
  normalized := replace(normalized, 'Audit?rio', 'Audit?rio');
  normalized := replace(normalized, 'audit?rio', 'audit?rio');
  normalized := replace(normalized, 'Comunit?rio', 'Comunit?rio');
  normalized := replace(normalized, 'comunit?rio', 'comunit?rio');

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
DROP FUNCTION public._legacy_mojibake_latin1(text);

COMMIT;