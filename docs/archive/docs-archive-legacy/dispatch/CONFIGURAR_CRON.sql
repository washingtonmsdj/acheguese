-- Configurar cron job para process_dispatch_timeouts

-- Tentar configurar pg_cron
SELECT cron.schedule(
  'process-dispatch-timeouts',
  '*/10 * * * * *',
  'SELECT process_dispatch_timeouts()'
);

-- Verificar se foi criado
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'process-dispatch-timeouts';
