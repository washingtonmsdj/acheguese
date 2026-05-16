-- Fix slug normalization for communication territorial domain.
-- The previous implementation used a corrupted accent map (mojibake).
-- This migration replaces it with unaccent-based normalization.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.communication_slugify(input text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT nullif(
    trim(
      both '-'
      FROM regexp_replace(
        regexp_replace(
          lower(unaccent(coalesce(input, ''))),
          '[^a-z0-9]+',
          '-',
          'g'
        ),
        '-{2,}',
        '-',
        'g'
      )
    ),
    ''
  );
$$;
