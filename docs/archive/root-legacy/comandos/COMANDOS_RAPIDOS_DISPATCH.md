# COMANDOS RÁPIDOS - DISPATCH AUTOMÁTICO

## 1. SETUP INICIAL

### Criar Tabela de Auditoria
```bash
# Conectar ao banco e executar
psql -h <host> -U <user> -d <database> -f CREATE_DISPATCH_AUDIT_TABLE.sql
```

### Verificar Estrutura
```bash
psql -h <host> -U <user> -d <database> -f TESTAR_DISPATCH_AUTOMATICO.sql
```

## 2. QUERIES ÚTEIS

### Ver Corridas em Busca
```sql
SELECT 
  id, 
  status, 
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutos_buscando
FROM ride_requests 
WHERE status IN ('searching_driver', 'driver_assigned')
ORDER BY created_at DESC;
```

### Ver Tentativas de Dispatch
```sql
SELECT 
  rda.ride_id,
  rda.attempt_number,
  p.full_name as motorista,
  rda.status,
  rda.offered_at,
  rda.responded_at,
  EXTRACT(EPOCH FROM (rda.responded_at - rda.offered_at)) as tempo_resposta_seg
FROM ride_dispatch_audit rda
JOIN profiles p ON p.id = rda.driver_profile_id
WHERE rda.ride_id = '<UUID-DA-CORRIDA>'
ORDER BY rda.attempt_number;
```

### Ver Motoristas Disponíveis
```sql
SELECT 
  da.profile_id,
  p.full_name,
  da.is_online,
  da.is_available,
  da.current_lat,
  da.current_lng
FROM driver_availability da
JOIN profiles p ON p.id = da.profile_id
WHERE da.is_online = true 
  AND da.is_available = true;
```

### Taxa de Sucesso do Dispatch
```sql
SELECT 
  COUNT(DISTINCT ride_id) as total_corridas,
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) as aceitas,
  COUNT(DISTINCT CASE WHEN status = 'timeout' THEN ride_id END) as timeouts,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) / 
        COUNT(DISTINCT ride_id), 2) as taxa_sucesso_pct,
  AVG(attempt_number) as media_tentativas
FROM ride_dispatch_audit;
```

### Tempo Médio de Aceite
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_medio_seg,
  MIN(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_min_seg,
  MAX(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_max_seg
FROM ride_dispatch_audit
WHERE status = 'accepted';
```

### Corridas Expiradas Hoje
```sql
SELECT 
  rr.id,
  rr.created_at,
  COUNT(rda.id) as tentativas
FROM ride_requests rr
LEFT JOIN ride_dispatch_audit rda ON rda.ride_id = rr.id
WHERE rr.status = 'expired'
  AND rr.created_at > CURRENT_DATE
GROUP BY rr.id, rr.created_at
ORDER BY rr.created_at DESC;
```

## 3. TESTES MANUAIS

### Criar Corrida de Teste (TypeScript)
```typescript
import { RideOperationalService } from '@/modules/mobility/core';

const result = await RideOperationalService.createRide({
  passengerProfileId: '<UUID-PASSAGEIRO>',
  pickupAddressId: '<UUID-ENDERECO-ORIGEM>',
  dropoffAddressId: '<UUID-ENDERECO-DESTINO>',
  pickupLocationId: '<UUID-LOCATION>',
  dropoffLocationId: '<UUID-LOCATION>',
  suggestedPrice: 25.00,
});

console.log('Corrida criada:', result.rideId);
```

### Aceitar Corrida Manualmente (TypeScript)
```typescript
import { RideOperationalService } from '@/modules/mobility/core';

const result = await RideOperationalService.acceptRide(
  '<UUID-CORRIDA>',
  '<UUID-MOTORISTA>'
);

console.log('Resultado:', result);
```

### Buscar Motoristas Elegíveis (TypeScript)
```typescript
import { RideDispatchService } from '@/modules/mobility/core';

const drivers = await RideDispatchService.findEligibleDrivers(
  '<UUID-CORRIDA>',
  -23.550520, // lat origem
  -46.633308, // lng origem
  10 // raio em km
);

console.log(`Encontrados ${drivers.length} motoristas`);
drivers.forEach(d => {
  console.log(`- ${d.profileId}: ${d.distance.toFixed(2)}km`);
});
```

## 4. DEBUGGING

### Ver Logs do Dispatch
```typescript
// No console do navegador
localStorage.setItem('debug', 'AutoDispatch:*');
```

### Verificar Subscription Realtime
```typescript
// No console do navegador
const channel = supabase.channel('test');
channel.subscribe((status) => {
  console.log('Realtime status:', status);
});
```

### Forçar Dispatch Manual
```typescript
import { AutoDispatchService } from '@/modules/mobility/core';

const result = await AutoDispatchService.startDispatch('<UUID-CORRIDA>');
console.log('Resultado:', result);
```

## 5. MONITORAMENTO

### Dashboard SQL (executar periodicamente)
```sql
-- Resumo geral
SELECT 
  'Corridas em busca' as metrica,
  COUNT(*) as valor
FROM ride_requests 
WHERE status IN ('searching_driver', 'driver_assigned')
UNION ALL
SELECT 
  'Motoristas disponíveis' as metrica,
  COUNT(*) as valor
FROM driver_availability 
WHERE is_online = true AND is_available = true
UNION ALL
SELECT 
  'Taxa de sucesso hoje (%)' as metrica,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) / 
        NULLIF(COUNT(DISTINCT ride_id), 0), 2) as valor
FROM ride_dispatch_audit
WHERE created_at > CURRENT_DATE
UNION ALL
SELECT 
  'Tempo médio aceite (seg)' as metrica,
  ROUND(AVG(EXTRACT(EPOCH FROM (responded_at - offered_at))), 2) as valor
FROM ride_dispatch_audit
WHERE status = 'accepted'
  AND created_at > CURRENT_DATE;
```

## 6. TROUBLESHOOTING

### Problema: Motorista não recebe oferta

**Verificar:**
```sql
-- 1. Motorista está online?
SELECT is_online, is_available 
FROM driver_availability 
WHERE profile_id = '<UUID-MOTORISTA>';

-- 2. Motorista tem coordenadas?
SELECT current_lat, current_lng 
FROM driver_availability 
WHERE profile_id = '<UUID-MOTORISTA>';

-- 3. Motorista está dentro do raio?
-- (calcular distância manualmente)
```

**Solução:**
- Garantir `is_online = true`
- Garantir `is_available = true`
- Garantir coordenadas não nulas
- Aumentar raio de busca se necessário

### Problema: Corrida expira imediatamente

**Verificar:**
```sql
-- Há motoristas disponíveis?
SELECT COUNT(*) 
FROM driver_availability 
WHERE is_online = true 
  AND is_available = true;

-- Tentativas de dispatch?
SELECT * 
FROM ride_dispatch_audit 
WHERE ride_id = '<UUID-CORRIDA>';
```

**Solução:**
- Garantir que há motoristas disponíveis
- Verificar raio de busca (pode estar muito pequeno)
- Verificar logs de erro

### Problema: Realtime não funciona

**Verificar:**
```typescript
// 1. Usuário autenticado?
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// 2. RLS permite acesso?
const { data, error } = await supabase
  .from('ride_requests')
  .select('*')
  .eq('id', '<UUID-CORRIDA>')
  .single();
console.log('Data:', data, 'Error:', error);

// 3. Subscription ativa?
const channel = supabase.channel('test');
console.log('Channel:', channel);
```

**Solução:**
- Garantir autenticação
- Verificar RLS policies
- Verificar console do navegador para erros

### Problema: Dois motoristas aceitam mesma corrida

**Isso NÃO deve acontecer!**

**Verificar:**
```sql
-- Ver histórico da corrida
SELECT * FROM ride_state_audit 
WHERE ride_id = '<UUID-CORRIDA>' 
ORDER BY created_at;

-- Ver tentativas de aceite
SELECT * FROM ride_dispatch_audit 
WHERE ride_id = '<UUID-CORRIDA>' 
ORDER BY created_at;
```

**Se acontecer:**
- Reportar bug imediatamente
- Verificar se optimistic locking está funcionando
- Verificar logs de erro

## 7. AJUSTES DE CONFIGURAÇÃO

### Alterar Timeouts
Editar `src/modules/mobility/core/AutoDispatchService.ts`:

```typescript
const CONFIG = {
  OFFER_TIMEOUT_SECONDS: 30,      // ← Alterar aqui
  MAX_RETRY_ATTEMPTS: 5,          // ← Alterar aqui
  TOTAL_TIMEOUT_MINUTES: 10,      // ← Alterar aqui
  SEARCH_RADIUS_KM: 10,           // ← Alterar aqui
};
```

### Rebuild após alteração
```bash
npm run build
# ou
npm run dev
```

## 8. LIMPEZA (DESENVOLVIMENTO)

### Limpar Dados de Teste
```sql
-- CUIDADO: Apenas em desenvolvimento!
DELETE FROM ride_dispatch_audit WHERE created_at > CURRENT_DATE;
DELETE FROM ride_state_audit WHERE created_at > CURRENT_DATE;
DELETE FROM ride_requests WHERE created_at > CURRENT_DATE;
```

### Reset Motoristas
```sql
-- Tornar todos motoristas disponíveis
UPDATE driver_availability 
SET is_available = true 
WHERE is_online = true;
```

## 9. BACKUP

### Backup da Auditoria
```bash
pg_dump -h <host> -U <user> -d <database> \
  -t ride_dispatch_audit \
  -t ride_state_audit \
  > backup_dispatch_audit_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -h <host> -U <user> -d <database> \
  < backup_dispatch_audit_20260406.sql
```

## 10. MÉTRICAS PARA DASHBOARD

### Query para Grafana/Metabase
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hora,
  COUNT(DISTINCT ride_id) as total_corridas,
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) as aceitas,
  AVG(attempt_number) as media_tentativas,
  AVG(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_medio_seg
FROM ride_dispatch_audit
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hora DESC;
```

---

**Dica**: Salve este arquivo como referência rápida durante desenvolvimento e operação.
