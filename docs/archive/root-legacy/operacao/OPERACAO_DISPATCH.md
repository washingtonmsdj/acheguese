# OPERAÇÃO DO DISPATCH AUTOMÁTICO

## ARQUITETURA

### Componentes

1. **Trigger SQL** (`trigger_start_dispatch`)
   - Dispara automaticamente quando corrida entra em `searching_driver`
   - Atribui primeiro motorista elegível
   - Execução: <1 segundo
   - Localização: PostgreSQL

2. **Edge Function** (`process-timeouts`)
   - Processa timeouts e retry
   - Execução: A cada 10 segundos
   - Localização: Supabase Edge Functions
   - URL: `https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts`

3. **Cron Externo**
   - Chama Edge Function a cada 10s
   - Opções: cron-job.org, EasyCron, GitHub Actions, Vercel Cron

## COMO SOBE

### 1. Deploy da Edge Function

```bash
# Via Supabase CLI
supabase functions deploy process-timeouts

# Verificar
curl https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts
```

### 2. Configurar Cron Externo

**Opção A - cron-job.org** (Recomendado):
1. Criar conta em https://cron-job.org
2. Criar novo cron job:
   - URL: `https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts`
   - Método: GET
   - Intervalo: A cada 10 segundos
   - Timeout: 30 segundos
3. Ativar

**Opção B - GitHub Actions**:
```yaml
# .github/workflows/dispatch-timeout.yml
name: Process Dispatch Timeouts
on:
  schedule:
    - cron: '* * * * *'  # A cada minuto (GitHub não suporta <1min)
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          for i in {1..6}; do
            curl -X GET https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts
            sleep 10
          done
```

**Opção C - Vercel Cron**:
```typescript
// api/cron/process-timeouts.ts
export const config = {
  runtime: 'edge',
}

export default async function handler() {
  const response = await fetch(
    'https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts'
  )
  return response
}

// vercel.json
{
  "crons": [{
    "path": "/api/cron/process-timeouts",
    "schedule": "*/10 * * * * *"
  }]
}
```

### 3. Validar

```bash
# Testar Edge Function
curl https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts

# Verificar logs
supabase functions logs process-timeouts

# Verificar auditoria
psql -c "SELECT * FROM ride_dispatch_audit WHERE status = 'timeout' ORDER BY created_at DESC LIMIT 10;"
```

## COMO MONITORA

### 1. Logs da Edge Function

```bash
# Via CLI
supabase functions logs process-timeouts --tail

# Via Dashboard
https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/functions/process-timeouts/logs
```

### 2. Métricas SQL

```sql
-- Taxa de sucesso (última hora)
SELECT 
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) * 100.0 / 
  NULLIF(COUNT(DISTINCT ride_id), 0) as taxa_sucesso_pct,
  AVG(attempt_number) FILTER (WHERE status = 'accepted') as avg_attempts
FROM ride_dispatch_audit
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Timeouts processados (última hora)
SELECT 
  COUNT(*) as total_timeouts,
  COUNT(DISTINCT ride_id) as rides_afetadas
FROM ride_dispatch_audit
WHERE status = 'timeout'
  AND created_at > NOW() - INTERVAL '1 hour';

-- Corridas expiradas (última hora)
SELECT 
  COUNT(*) as total_expiradas,
  COUNT(CASE WHEN rsa.reason LIKE '%Max attempts%' THEN 1 END) as por_max_attempts,
  COUNT(CASE WHEN rsa.reason LIKE '%Total timeout%' THEN 1 END) as por_timeout_total,
  COUNT(CASE WHEN rsa.reason LIKE '%No%drivers%' THEN 1 END) as por_sem_motoristas
FROM ride_requests rr
JOIN ride_state_audit rsa ON rsa.ride_id = rr.id
WHERE rr.status = 'expired'
  AND rr.created_at > NOW() - INTERVAL '1 hour'
  AND rsa.to_state = 'expired';
```

### 3. Alertas

**Configurar alertas para**:
- Edge Function com erro (>5% de falha)
- Nenhum timeout processado em 5 minutos
- Taxa de expiração >20%
- Tempo de execução >5 segundos

## COMO REINICIA

### Edge Function

```bash
# Redeploy
supabase functions deploy process-timeouts

# Verificar status
curl https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts
```

### Cron Externo

- **cron-job.org**: Pausar e reativar job
- **GitHub Actions**: Re-run workflow
- **Vercel Cron**: Redeploy aplicação

### Trigger SQL

```sql
-- Desabilitar
DROP TRIGGER IF EXISTS trigger_start_dispatch ON ride_requests;

-- Reabilitar
CREATE TRIGGER trigger_start_dispatch
  AFTER INSERT OR UPDATE OF status
  ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_start_dispatch();
```

## COMO DETECTAR FALHA

### 1. Edge Function Não Responde

**Sintoma**: Timeouts não são processados

**Verificação**:
```bash
curl -I https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts
# Deve retornar 200 OK
```

**Solução**: Redeploy da Edge Function

### 2. Cron Não Executa

**Sintoma**: Nenhum timeout processado em 5+ minutos

**Verificação**:
```sql
SELECT MAX(updated_at) as ultimo_timeout
FROM ride_dispatch_audit
WHERE status = 'timeout';
-- Se > 5 minutos atrás, cron não está executando
```

**Solução**: Verificar configuração do cron externo

### 3. Trigger Não Dispara

**Sintoma**: Corridas ficam em `searching_driver` sem atribuição

**Verificação**:
```sql
SELECT COUNT(*) as corridas_travadas
FROM ride_requests
WHERE status = 'searching_driver'
  AND created_at < NOW() - INTERVAL '1 minute';
-- Se > 0, trigger pode não estar disparando
```

**Solução**: Verificar trigger e recriar se necessário

### 4. Motoristas Não Elegíveis

**Sintoma**: Corridas expiram imediatamente

**Verificação**:
```sql
SELECT COUNT(*) as motoristas_disponiveis
FROM driver_availability da
JOIN profiles p ON p.id = da.profile_id
WHERE da.is_online = true
  AND da.is_available = true
  AND p.profile_type = 'driver'
  AND p.is_active = true;
-- Se 0, nenhum motorista disponível
```

**Solução**: Verificar critérios de elegibilidade

## HEALTH CHECK

### Script de Verificação

```bash
#!/bin/bash
# health-check-dispatch.sh

echo "=== HEALTH CHECK - DISPATCH ==="

# 1. Edge Function
echo "1. Edge Function..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts)
if [ $STATUS -eq 200 ]; then
  echo "   OK: Edge Function respondendo"
else
  echo "   ERRO: Edge Function não responde (HTTP $STATUS)"
fi

# 2. Trigger
echo "2. Trigger..."
TRIGGER=$(psql -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'trigger_start_dispatch';")
if [ $TRIGGER -eq 1 ]; then
  echo "   OK: Trigger ativo"
else
  echo "   ERRO: Trigger não encontrado"
fi

# 3. Timeouts recentes
echo "3. Timeouts recentes..."
LAST_TIMEOUT=$(psql -t -c "SELECT EXTRACT(EPOCH FROM (NOW() - MAX(updated_at)))/60 FROM ride_dispatch_audit WHERE status = 'timeout';")
if [ $(echo "$LAST_TIMEOUT < 10" | bc) -eq 1 ]; then
  echo "   OK: Timeout processado há $LAST_TIMEOUT minutos"
else
  echo "   AVISO: Último timeout há $LAST_TIMEOUT minutos"
fi

# 4. Motoristas disponíveis
echo "4. Motoristas disponíveis..."
DRIVERS=$(psql -t -c "SELECT COUNT(*) FROM driver_availability WHERE is_online = true AND is_available = true;")
echo "   $DRIVERS motoristas disponíveis"

echo ""
echo "=== FIM ==="
```

## ROLLBACK

### Desabilitar Dispatch

```sql
-- 1. Desabilitar trigger
DROP TRIGGER IF EXISTS trigger_start_dispatch ON ride_requests;

-- 2. Pausar cron externo (via interface do serviço)

-- 3. Corridas em andamento continuam normais
-- 4. Novas corridas não terão dispatch automático
```

### Reabilitar Dispatch

```sql
-- 1. Recriar trigger
CREATE TRIGGER trigger_start_dispatch
  AFTER INSERT OR UPDATE OF status
  ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_start_dispatch();

-- 2. Reativar cron externo

-- 3. Redeploy Edge Function se necessário
```

---

**Última atualização**: 06/04/2026  
**Responsável**: Sistema  
**Status**: Operacional
