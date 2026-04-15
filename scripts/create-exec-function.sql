-- Criar função para executar SQL dinâmico
-- Esta função permite executar DDL statements via RPC

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Dar permissão para service_role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Comentário
COMMENT ON FUNCTION exec_sql IS 'Executa SQL dinâmico - USE COM CUIDADO';
