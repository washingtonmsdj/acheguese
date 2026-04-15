# CONFIGURAR CRON EXTERNO - DISPATCH AUTOMÁTICO

**Data**: 07/04/2026, 03:06  
**Status**: Edge Function deployada ✅  
**Próximo passo**: Configurar cron externo

---

## EDGE FUNCTION DEPLOYADA

✅ **URL**: `https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts`

✅ **Teste realizado**: 
```json
{
  "success": true,
  "processed": 1,
  "results": [
    {
      "ride_id": "b28594d4-c3bf-4f7e-8a39-de22a65ac16a",
      "action": "expired",
      "details": "No more drivers"
    }
  ],
  "timestamp": "2026-04-07T03:06:34.713Z"
}
```

✅ **Autenticação**: Requer header `apikey` com anon key

---

## OPÇÃO 1: CRON-JOB.ORG (Recomendado)

### Vantagens
- Interface simples
- Suporta intervalos de 10 segundos
- Gratuito até 50 jobs
- Logs e histórico de execução
- Alertas por email

### Configuração

1. **Criar conta**: https://cron-job.org/en/signup/

2. **Criar novo job**:
   - Título: `Dispatch Timeout Processor`
   - URL: `https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts`
   - Método: `GET`
   - Intervalo: `Every 10 seconds` (*/10 * * * * *)
   - Timeout: `30 seconds`

3. **Adicionar headers**:
   - `apikey`: `[SUA_ANON_KEY]` (obtenha em Settings > API > Project API keys)

4. **Ativar job**

5. **Validar**: Verificar logs após 1 minuto

### Tempo estimado: 5 minutos

---

## OPÇÃO 2: EASYCRON

### Vantagens
- Suporta intervalos de 1 segundo
- API para gerenciamento
- Logs detalhados

### Configuração

1. **Criar conta**: https://www.easycron.com/user/register

2. **Criar cron job**:
   - URL: `https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts`
   - Cron Expression: `*/10 * * * * *` (a cada 10 segundos)
   - HTTP Method: `GET`
   - HTTP Headers: `apikey: [VITE_SUPABASE_PUBLISHABLE_KEY do .env]`

3. **Ativar**

### Tempo estimado: 5 minutos

---

## OPÇÃO 3: GITHUB ACTIONS (Backup)

### Vantagens
- Gratuito
- Integrado ao repositório
- Versionado

### Limitações
- Mínimo: 1 minuto (não 10 segundos)
- Solução: Executar 6x em loop dentro do job

### Configuração

Criar arquivo `.github/workflows/dispatch-timeout.yml`:

```yaml
name: Process Dispatch Timeouts

on:
  schedule:
    - cron: '* * * * *'  # A cada minuto
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process timeouts (6x em 1 minuto)
        run: |
          for i in {1..6}; do
            curl -X GET \
              -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
              https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts
            if [ $i -lt 6 ]; then
              sleep 10
            fi
          done
```

**Configurar secret**:
1. GitHub > Settings > Secrets > New repository secret
2. Nome: `SUPABASE_ANON_KEY`
3. Valor: `[VITE_SUPABASE_PUBLISHABLE_KEY do .env]`

### Tempo estimado: 10 minutos

---

## OPÇÃO 4: VERCEL CRON

### Vantagens
- Integrado ao Vercel
- Suporta intervalos curtos
- Logs integrados

### Limitações
- Requer deploy no Vercel
- Plano Pro para <1 minuto

### Configuração

1. **Criar API route** (`api/cron/process-timeouts.ts`):

```typescript
export const config = {
  runtime: 'edge',
}

export default async function handler() {
  const response = await fetch(
    'https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts',
    {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY!
      }
    }
  )
  return response
}
```

2. **Configurar vercel.json**:

```json
{
  "crons": [{
    "path": "/api/cron/process-timeouts",
    "schedule": "*/10 * * * * *"
  }]
}
```

3. **Deploy**: `vercel --prod`

### Tempo estimado: 15 minutos

---

## RECOMENDAÇÃO

**Para produção imediata**: OPÇÃO 1 (cron-job.org)
- Mais rápido de configurar
- Suporta 10 segundos nativamente
- Interface amigável

**Para longo prazo**: OPÇÃO 3 (GitHub Actions) + OPÇÃO 1 (backup)
- GitHub Actions como principal
- cron-job.org como fallback
- Redundância garantida

---

## VALIDAÇÃO PÓS-CONFIGURAÇÃO

### 1. Verificar execução

```bash
# Aguardar 1 minuto após ativar cron
# Verificar logs da Edge Function
supabase functions logs process-timeouts --tail
```

### 2. Verificar auditoria

```sql
SELECT 
  COUNT(*) as timeouts_processados,
  MAX(created_at) as ultimo_timeout
FROM ride_dispatch_audit
WHERE status = 'timeout'
  AND created_at > NOW() - INTERVAL '5 minutes';
```

Deve retornar timeouts recentes (< 5 minutos).

### 3. Testar timeout real

```sql
-- Criar corrida de teste
INSERT INTO ride_requests (
  passenger_profile_id,
  origin_lat,
  origin_lng,
  destination_lat,
  destination_lng,
  status
) VALUES (
  'b374bdab-cd76-43b2-bb3c-eb844d096acb',
  -12.975,
  -38.476,
  -12.980,
  -38.480,
  'searching_driver'
);

-- Aguardar 30 segundos
-- Verificar se timeout foi processado
SELECT * FROM ride_dispatch_audit 
WHERE ride_id = (SELECT id FROM ride_requests ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at DESC;
```

---

## PRÓXIMOS PASSOS

1. ✅ Edge Function deployada
2. ⏳ Configurar cron externo (5 min)
3. ⏳ Validar execução (2 min)
4. ⏳ Monitorar primeiras 24h

**Tempo total restante**: 7 minutos

---

**Última atualização**: 07/04/2026, 03:06  
**Status**: Edge Function OK, aguardando cron
