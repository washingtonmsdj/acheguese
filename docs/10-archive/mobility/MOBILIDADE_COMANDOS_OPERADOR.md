# MOBILIDADE (MOTOBOY) - COMANDOS PARA OPERADOR

**Objetivo**: Guia prático de comandos para validação e operação  
**Público**: Operadores, DevOps, QA

---

## 🚀 SETUP INICIAL

### 1. Aplicar Migrações
```bash
cd supabase
supabase db push
```

**Verificar sucesso**:
```bash
supabase db diff
# Deve retornar vazio (sem diferenças)
```

### 2. Verificar Schema
```sql
-- Verificar colunas de ride_requests
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ride_requests'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ride_requests';

-- Verificar RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'ride_requests';
```

### 3. Verificar Enum de ride_mode
```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'ride_mode'
);
-- Deve incluir 'motoboy'
```

---

## 🔍 QUERIES DE DIAGNÓSTICO

### Listar Entregas Motoboy
```sql
SELECT
  id,
  status,
  source_type,
  source_id,
  passenger_profile_id,
  driver_profile_id,
  created_at,
  updated_at
FROM ride_requests
WHERE ride_mode = 'motoboy'
ORDER BY created_at DESC
LIMIT 20;
```

### Métricas de SLA
```sql
-- Tempo médio de aceite (em minutos)
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) as avg_accept_time_minutes
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND status IN ('driver_accepted', 'driver_assigned')
  AND created_at > NOW() - INTERVAL '7 days';

-- Taxa de falha
SELECT
  COUNT(CASE WHEN status = 'failed' THEN 1 END)::float / COUNT(*) * 100 as failure_rate_percent
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND created_at > NOW() - INTERVAL '7 days';

-- Taxa de cancelamento
SELECT
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::float / COUNT(*) * 100 as cancellation_rate_percent
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND created_at > NOW() - INTERVAL '7 days';
```

### Entregas por Source Type
```sql
SELECT
  source_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY source_type
ORDER BY total DESC;
```

### Reports de Problemas (NOVO)
```sql
-- Listar reports pendentes
SELECT
  rr.id,
  rr.report_type,
  rr.severity,
  rr.status,
  rr.title,
  rr.reported_at,
  req.id as ride_id,
  req.status as ride_status
FROM ride_reports rr
JOIN ride_requests req ON rr.ride_id = req.id
WHERE rr.status = 'pending'
ORDER BY rr.severity DESC, rr.reported_at DESC
LIMIT 20;

-- Estatísticas de reports
SELECT
  status,
  severity,
  report_type,
  COUNT(*) as total
FROM ride_reports
WHERE reported_at > NOW() - INTERVAL '7 days'
GROUP BY status, severity, report_type
ORDER BY total DESC;

-- Reports críticos não resolvidos
SELECT
  rr.id,
  rr.title,
  rr.description,
  rr.reported_at,
  EXTRACT(EPOCH FROM (NOW() - rr.reported_at)) / 3600 as hours_open
FROM ride_reports rr
WHERE rr.severity = 'critical'
  AND rr.status IN ('pending', 'under_review')
ORDER BY rr.reported_at ASC;
```

### Entregas Ativas (Em Andamento)
```sql
SELECT
  id,
  status,
  source_type,
  passenger_profile_id,
  driver_profile_id,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as age_minutes
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND status IN (
    'requested',
    'searching_driver',
    'driver_assigned',
    'driver_accepted',
    'driver_arriving',
    'pickup_confirmed',
    'in_delivery'
  )
ORDER BY created_at ASC;
```

---

## 🔐 VERIFICAÇÃO DE PERMISSÕES

### Testar Entitlements de Business
```sql
-- Verificar plano de uma empresa
SELECT
  bp.id as business_id,
  bp.name as business_name,
  bs.plan_tier,
  bs.status as subscription_status
FROM business_profiles bp
LEFT JOIN business_subscriptions bs ON bp.id = bs.business_id
WHERE bp.id = 'UUID_DA_EMPRESA';

-- Verificar entitlements
SELECT *
FROM business_entitlements
WHERE business_id = 'UUID_DA_EMPRESA';
```

### Verificar Rollout Territorial
```sql
-- Verificar se motoboy está habilitado em uma localização
SELECT
  l.id,
  l.name,
  l.mobility_enabled,
  l.motoboy_mode_enabled
FROM locations l
WHERE l.id = 'UUID_DA_LOCALIZACAO';
```

---

## 🛠️ OPERAÇÕES ADMIN

### Cancelar Entrega Manualmente
```sql
UPDATE ride_requests
SET
  status = 'cancelled',
  cancelled_by = 'admin',
  cancellation_reason = 'Cancelamento operacional - [MOTIVO]',
  updated_at = NOW()
WHERE id = 'UUID_DA_ENTREGA'
  AND status NOT IN ('delivered', 'failed', 'cancelled');
```

### Reatribuir Motoboy
```sql
-- Remover atribuição atual
UPDATE ride_requests
SET
  driver_profile_id = NULL,
  status = 'searching_driver',
  updated_at = NOW()
WHERE id = 'UUID_DA_ENTREGA'
  AND status IN ('driver_assigned', 'driver_accepted');

-- Sistema irá reprocessar dispatch automaticamente
```

### Forçar Conclusão (Emergência)
```sql
UPDATE ride_requests
SET
  status = 'delivered',
  delivery_confirmed_at = NOW(),
  updated_at = NOW()
WHERE id = 'UUID_DA_ENTREGA'
  AND status IN ('in_delivery', 'pickup_confirmed');
```

### Resolver Report (NOVO)
```sql
-- Marcar report como resolvido
UPDATE ride_reports
SET
  status = 'resolved',
  reviewed_at = NOW(),
  reviewed_by = 'UUID_DO_ADMIN',
  resolution_notes = 'Problema resolvido - [DESCRIÇÃO DA RESOLUÇÃO]',
  updated_at = NOW()
WHERE id = 'UUID_DO_REPORT';

-- Descartar report
UPDATE ride_reports
SET
  status = 'dismissed',
  reviewed_at = NOW(),
  reviewed_by = 'UUID_DO_ADMIN',
  admin_notes = 'Report descartado - [MOTIVO]',
  updated_at = NOW()
WHERE id = 'UUID_DO_REPORT';
```

---

## 📊 AUDITORIA

### Verificar Logs de Autorização
```bash
# Se usando logger com arquivo
grep "MotoboyAuthorizationService" logs/app.log | tail -50

# Se usando Supabase Edge Functions logs
supabase functions logs --tail
```

### Buscar Tentativas Negadas
```sql
-- Se logs estão em tabela audit_logs
SELECT *
FROM audit_logs
WHERE action = 'motoboy_authorization_denied'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Rastrear Entrega Específica
```sql
-- Histórico de mudanças de status
SELECT
  id,
  status,
  driver_profile_id,
  updated_at,
  cancellation_reason
FROM ride_requests
WHERE id = 'UUID_DA_ENTREGA';

-- Se houver tabela de audit trail
SELECT *
FROM ride_status_history
WHERE ride_id = 'UUID_DA_ENTREGA'
ORDER BY created_at ASC;

-- Reports relacionados à entrega (NOVO)
SELECT
  rr.id,
  rr.report_type,
  rr.severity,
  rr.status,
  rr.title,
  rr.description,
  rr.reported_at,
  rr.resolution_notes
FROM ride_reports rr
WHERE rr.ride_id = 'UUID_DA_ENTREGA'
ORDER BY rr.reported_at DESC;
```

---

## 🧪 TESTES MANUAIS

### Criar Entrega de Teste (SQL)
```sql
INSERT INTO ride_requests (
  ride_mode,
  status,
  source_type,
  source_id,
  passenger_profile_id,
  pickup_address_id,
  dropoff_address_id,
  pickup_location_id,
  dropoff_location_id,
  origin_lat,
  origin_lng,
  destination_lat,
  destination_lng,
  recipient_name,
  package_description,
  suggested_price
) VALUES (
  'motoboy',
  'requested',
  'business',
  'UUID_DA_EMPRESA',
  'UUID_DO_PERFIL_PASSAGEIRO',
  'UUID_ENDERECO_COLETA',
  'UUID_ENDERECO_ENTREGA',
  'UUID_LOCALIZACAO_COLETA',
  'UUID_LOCALIZACAO_ENTREGA',
  -23.5505,
  -46.6333,
  -23.5629,
  -46.6544,
  'Cliente Teste',
  'Pacote de teste',
  15.00
);
```

### Simular Aceite de Motoboy
```sql
UPDATE ride_requests
SET
  status = 'driver_accepted',
  driver_profile_id = 'UUID_DO_MOTORISTA',
  updated_at = NOW()
WHERE id = 'UUID_DA_ENTREGA';
```

### Simular Conclusão
```sql
UPDATE ride_requests
SET
  status = 'delivered',
  delivery_confirmed_at = NOW(),
  final_price = 15.00,
  updated_at = NOW()
WHERE id = 'UUID_DA_ENTREGA';
```

---

## 🔧 TROUBLESHOOTING

### Entrega Travada em "searching_driver"
```sql
-- Verificar idade da solicitação
SELECT
  id,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as age_minutes
FROM ride_requests
WHERE status = 'searching_driver'
  AND ride_mode = 'motoboy';

-- Se > 10 minutos, considerar expirar
UPDATE ride_requests
SET
  status = 'expired',
  updated_at = NOW()
WHERE status = 'searching_driver'
  AND ride_mode = 'motoboy'
  AND created_at < NOW() - INTERVAL '10 minutes';
```

### Motoboy Não Recebe Ofertas
```sql
-- Verificar disponibilidade do motorista
SELECT
  dp.id,
  dp.name,
  dd.is_available,
  dd.can_do_delivery,
  dd.is_suspended
FROM driver_profiles dp
JOIN driver_data dd ON dp.id = dd.driver_profile_id
WHERE dp.id = 'UUID_DO_MOTORISTA';

-- Verificar se está online
SELECT *
FROM driver_availability
WHERE driver_profile_id = 'UUID_DO_MOTORISTA'
  AND is_online = true;
```

### Erro de Permissão
```sql
-- Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'ride_requests';

-- Testar como usuário específico
SET ROLE authenticated;
SET request.jwt.claims.sub = 'UUID_DO_USUARIO';

SELECT * FROM ride_requests WHERE id = 'UUID_DA_ENTREGA';

RESET ROLE;
```

---

## 📈 MONITORAMENTO CONTÍNUO

### Query de Saúde Operacional
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'requested') as requested,
  COUNT(*) FILTER (WHERE status = 'searching_driver') as searching,
  COUNT(*) FILTER (WHERE status IN ('driver_assigned', 'driver_accepted')) as assigned,
  COUNT(*) FILTER (WHERE status IN ('pickup_confirmed', 'in_delivery')) as in_progress,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) FILTER (
    WHERE status IN ('driver_accepted', 'delivered')
  ) as avg_completion_minutes
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND created_at > NOW() - INTERVAL '1 hour';
```

### Alertas Sugeridos
```sql
-- Entregas travadas > 15 minutos
SELECT COUNT(*)
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND status = 'searching_driver'
  AND created_at < NOW() - INTERVAL '15 minutes';
-- Se > 0, alertar operação

-- Taxa de falha > 10%
SELECT
  COUNT(CASE WHEN status = 'failed' THEN 1 END)::float / COUNT(*) * 100 as failure_rate
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND created_at > NOW() - INTERVAL '1 hour';
-- Se > 10, alertar operação

-- Reports críticos não resolvidos > 2 horas (NOVO)
SELECT COUNT(*)
FROM ride_reports
WHERE severity = 'critical'
  AND status IN ('pending', 'under_review')
  AND reported_at < NOW() - INTERVAL '2 hours';
-- Se > 0, alertar operação urgente
```

---

## 🔄 ROTINAS DE MANUTENÇÃO

### Limpeza de Entregas Expiradas (Diária)
```sql
UPDATE ride_requests
SET
  status = 'expired',
  updated_at = NOW()
WHERE ride_mode = 'motoboy'
  AND status = 'searching_driver'
  AND created_at < NOW() - INTERVAL '30 minutes';
```

### Backup de Métricas (Semanal)
```sql
-- Criar snapshot de métricas
INSERT INTO mobility_metrics_snapshot (
  period_start,
  period_end,
  total_deliveries,
  delivered_count,
  failed_count,
  cancelled_count,
  avg_accept_time_minutes,
  avg_completion_time_minutes
)
SELECT
  DATE_TRUNC('week', NOW() - INTERVAL '1 week'),
  DATE_TRUNC('week', NOW()),
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'delivered'),
  COUNT(*) FILTER (WHERE status = 'failed'),
  COUNT(*) FILTER (WHERE status = 'cancelled'),
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60) FILTER (
    WHERE status IN ('driver_accepted', 'driver_assigned')
  ),
  AVG(EXTRACT(EPOCH FROM (delivery_confirmed_at - created_at)) / 60) FILTER (
    WHERE status = 'delivered'
  )
FROM ride_requests
WHERE ride_mode = 'motoboy'
  AND created_at >= DATE_TRUNC('week', NOW() - INTERVAL '1 week')
  AND created_at < DATE_TRUNC('week', NOW());
```

---

## 📞 SUPORTE

### Informações para Coleta em Incidentes
```sql
-- Coletar contexto completo de uma entrega
SELECT
  rr.id,
  rr.status,
  rr.source_type,
  rr.source_id,
  rr.created_at,
  rr.updated_at,
  pp.name as passenger_name,
  dp.name as driver_name,
  l_pickup.name as pickup_location,
  l_dropoff.name as dropoff_location
FROM ride_requests rr
LEFT JOIN passenger_profiles pp ON rr.passenger_profile_id = pp.id
LEFT JOIN driver_profiles dp ON rr.driver_profile_id = dp.id
LEFT JOIN locations l_pickup ON rr.pickup_location_id = l_pickup.id
LEFT JOIN locations l_dropoff ON rr.dropoff_location_id = l_dropoff.id
WHERE rr.id = 'UUID_DA_ENTREGA';
```

### Logs para Anexar
```bash
# Logs de aplicação
grep "UUID_DA_ENTREGA" logs/app.log > incident_logs.txt

# Logs de autorização
grep "MotoboyAuthorizationService" logs/app.log | grep "UUID_DO_USUARIO" >> incident_logs.txt

# Logs de erro
grep "ERROR" logs/app.log | grep -A 5 -B 5 "UUID_DA_ENTREGA" >> incident_logs.txt
```

---

**Última atualização**: 2026-04-19  
**Versão**: 1.0  
**Manutenção**: Atualizar conforme novos comandos/queries forem necessários
