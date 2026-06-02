-- ============================================================================
-- MIGRATION: Hardening de search_path em funcoes SECURITY DEFINER
-- ============================================================================
--
-- Objetivo:
--   Garantir que funcoes SECURITY DEFINER existentes no schema public executem
--   com search_path fixo e previsivel, reduzindo risco de object shadowing.
--
-- Contexto:
--   Historicamente varias migrations criaram funcoes SECURITY DEFINER sem
--   SET search_path explicito. Este hardening aplica a configuracao no catalogo
--   do Postgres para todas as funcoes SECURITY DEFINER publicas existentes.
--
-- ============================================================================

DO $$
DECLARE
  target_function RECORD;
BEGIN
  FOR target_function IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = TRUE
      AND n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.classid = 'pg_proc'::regclass
          AND d.objid = p.oid
          AND d.refclassid = 'pg_extension'::regclass
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      target_function.schema_name,
      target_function.function_name,
      target_function.identity_arguments
    );
  END LOOP;
END $$;

COMMENT ON SCHEMA public IS
  'Schema publico endurecido: funcoes SECURITY DEFINER devem manter search_path explicito public, pg_temp.';
