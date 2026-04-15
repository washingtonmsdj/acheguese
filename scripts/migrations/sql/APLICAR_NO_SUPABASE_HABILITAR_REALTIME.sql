-- GATE 2: Habilitar Realtime na tabela driver_locations
-- 
-- PROBLEMA: Realtime não está habilitado, subscription não recebe eventos
-- SOLUÇÃO: Adicionar tabela à publicação supabase_realtime

-- Habilitar Realtime para driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;

-- Verificar se foi adicionado
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'driver_locations';
