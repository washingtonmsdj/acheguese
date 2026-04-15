-- Criar função exec_sql para executar SQL dinâmico via RPC

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Permitir acesso via service_role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

COMMENT ON FUNCTION exec_sql IS 'Executa SQL dinâmico via RPC - apenas para service_role';

SELECT 'Função exec_sql criada com sucesso' AS status;
