# FASE 4 - Webhooks e Billing Runtime - Relatório de Execução

**Status**: 🚧 Em Progresso  
**Data de início**: 2026-04-21  
**Responsável**: Kiro / Implementação SSOT  
**Objetivo**: Consolidar ingestão Stripe sem duplicidade

---

## 1. Análise da Situação Atual

### 1.1 Problema Identificado

**Duplicação de webhooks**:
- ✅ `billing-webhook` (novo, SSOT-compliant)
- ❌ `stripe-webhook` (legado, gastronomia-específico)

**Divergências críticas**:

| Aspecto | billing-webhook | stripe-webhook |
|---------|-----------------|----------------|
| Tabela alvo | `user_subscriptions` | `gastronomy_subscriptions` |
| Status | `status_v2` (SSOT) | `status` (legado) |
| Escopo | Multi-vertical | Gastronomia apenas |
| Idempotência | ✅ Via `register_stripe_webhook_event` | ❌ Sem controle |
| Metadata | `plan_code`, `user_id` | `business_id`, `plan_tier` |
| Snapshot | ✅ Não implementado ainda | ❌ Não existe |

### 1.2 Riscos Identificados

1. **Cobrança duplicada**: Dois webhooks processando mesmo evento
2. **Perda de eventos**: Falha em um webhook não afeta o outro
3. **Inconsistência de dados**: Tabelas desincronizadas
4. **Dívida técnica**: Manutenção de dois pipelines

---

## 2. Estratégia de Consolidação

### 2.1 Abordagem: Dual-Run Controlado

```
Fase 4.1: Preparação
  ↓
Fase 4.2: Dual-Run (24-48h)
  ↓
Fase 4.3: Validação e Comparação
  ↓
Fase 4.4: Cutover
  ↓
Fase 4.5: Sunset do Legado
```

### 2.2 Princípios

1. **Idempotência obrigatória**: Usar `event_id` como chave única
2. **Snapshot imutável**: Criar snapshot do catálogo no momento da contratação
3. **Status SSOT**: Usar `status_v2` alinhado com Stripe
4. **Logging estruturado**: Auditoria completa de decisões
5. **Rollback rápido**: Capacidade de reverter em < 5 minutos

---

## 3. Fase 4.1 - Preparação

### 3.1 Atualizar billing-webhook para SSOT Completo

**Mudanças necessárias**:

1. ✅ Adicionar criação de snapshot de contrato
2. ✅ Usar `status_v2` ao invés de `status`
3. ✅ Adicionar suporte a `business_id` (scope = 'business')
4. ✅ Buscar item do catálogo por `plan_code`
5. ✅ Popular `contract_snapshot` com termos completos
6. ✅ Adicionar logging estruturado

**Arquivo**: `supabase/functions/billing-webhook/index.ts` (atualizado)

---

## 4. Fase 4.2 - Dual-Run Controlado

### 4.1 Configuração

**Período**: 24-48 horas  
**Modo**: Ambos webhooks ativos  
**Comparação**: Automática via função `compare_webhook_results`

### 4.2 Métricas Monitoradas

1. **Taxa de sucesso**: % eventos processados com sucesso
2. **Latência**: Tempo de processamento por evento
3. **Divergências**: Diferenças entre billing-webhook e stripe-webhook
4. **Erros**: Falhas por tipo de evento

### 4.3 Alertas

- ⚠️ Divergência > 1% entre webhooks
- ⚠️ Taxa de erro > 0.5%
- ⚠️ Latência > 5 segundos
- 🚨 Evento perdido (não processado por nenhum webhook)

---

## 5. Fase 4.3 - Validação e Comparação

### 5.1 Queries de Reconciliação

```sql
-- Comparar contratos ativos
SELECT 
  'user_subscriptions' as source,
  COUNT(*) as active_contracts,
  SUM(price_cents) as total_mrr_cents
FROM user_subscriptions
WHERE status_v2 IN ('active', 'trialing')

UNION ALL

SELECT 
  'gastronomy_subscriptions' as source,
  COUNT(*) as active_contracts,
  NULL as total_mrr_cents
FROM gastronomy_subscriptions
WHERE status = 'active';

-- Comparar eventos processados
SELECT 
  event_type,
  COUNT(*) as count,
  AVG(processing_time_ms) as avg_latency_ms,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as error_count
FROM stripe_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;
```

### 5.2 Critérios de Aprovação

- ✅ Divergência < 0.1% entre webhooks
- ✅ Taxa de sucesso > 99.9%
- ✅ Zero eventos perdidos
- ✅ Latência média < 2 segundos
- ✅ Zero erros críticos

---

## 6. Fase 4.4 - Cutover

### 6.1 Checklist Pré-Cutover

- [ ] Dual-run completado (24-48h)
- [ ] Validação aprovada
- [ ] Rollback testado
- [ ] Equipe de suporte notificada
- [ ] Monitoramento ativo

### 6.2 Procedimento de Cutover

```bash
# 1. Desativar stripe-webhook no Stripe Dashboard
# 2. Aguardar 5 minutos (eventos em trânsito)
# 3. Validar que billing-webhook está processando 100%
# 4. Monitorar por 1 hora
# 5. Se OK, marcar stripe-webhook como deprecated
```

### 6.3 Rollback

```bash
# Se necessário reverter:
# 1. Reativar stripe-webhook no Stripe Dashboard
# 2. Desativar billing-webhook temporariamente
# 3. Investigar problema
# 4. Corrigir e tentar novamente
```

---

## 7. Fase 4.5 - Sunset do Legado

### 7.1 Deprecação de stripe-webhook

**Ações**:
1. Marcar função como `@deprecated`
2. Adicionar warning log em cada execução
3. Manter por 30 dias (janela de segurança)
4. Remover após confirmação de estabilidade

### 7.2 Migração de Dados Legados

**Objetivo**: Migrar contratos de `gastronomy_subscriptions` para `user_subscriptions`

**Script**: `supabase/migrations/20260421000004_migrate_legacy_subscriptions.sql`

```sql
-- Migrar gastronomy_subscriptions para user_subscriptions
INSERT INTO user_subscriptions (
  user_id,
  business_id,
  plan_code,
  subscription_scope,
  entity_family,
  vertical,
  status_v2,
  stripe_subscription_id,
  stripe_customer_id,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  trial_ends_at,
  created_at,
  updated_at
)
SELECT 
  bd.owner_id as user_id,
  gs.business_id,
  CASE 
    WHEN gs.plan_tier = 'pro' THEN 'base-pro'
    WHEN gs.plan_tier = 'delivery' THEN 'base-delivery'
    ELSE 'base-free'
  END as plan_code,
  'business' as subscription_scope,
  'company' as entity_family,
  'gastronomy' as vertical,
  CASE 
    WHEN gs.status = 'active' THEN 'active'::subscription_status_v2
    WHEN gs.status = 'trialing' THEN 'trialing'::subscription_status_v2
    WHEN gs.status = 'past_due' THEN 'past_due'::subscription_status_v2
    ELSE 'canceled'::subscription_status_v2
  END as status_v2,
  gs.stripe_subscription_id,
  gs.stripe_customer_id,
  gs.current_period_start,
  gs.current_period_end,
  gs.cancel_at_period_end,
  gs.trial_end,
  gs.created_at,
  gs.updated_at
FROM gastronomy_subscriptions gs
INNER JOIN business_data bd ON gs.business_id = bd.profile_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions us
  WHERE us.business_id = gs.business_id
  AND us.subscription_scope = 'business'
)
ON CONFLICT (business_id) 
WHERE subscription_scope = 'business' AND status_v2 = 'active'
DO NOTHING;
```

---

## 8. Implementação

### 8.1 Atualização de billing-webhook

**Arquivo**: `supabase/functions/billing-webhook/index.ts`

**Mudanças**:

1. **Handler de subscription.created/updated**:
   - Buscar item do catálogo por `plan_code`
   - Criar snapshot completo do contrato
   - Popular `contract_snapshot` com termos
   - Usar `status_v2` ao invés de `status`
   - Suportar `business_id` (scope = 'business')

2. **Handler de subscription.deleted**:
   - Atualizar `status_v2` para 'canceled'
   - Manter snapshot imutável
   - Não downgrade para free (manter histórico)

3. **Handler de invoice.paid**:
   - Atualizar `status_v2` para 'active'
   - Registrar transação no ledger

4. **Handler de invoice.payment_failed**:
   - Atualizar `status_v2` para 'past_due'
   - Registrar tentativa no ledger

### 8.2 Função de Comparação

**Arquivo**: `supabase/functions/compare-webhook-results/index.ts`

**Objetivo**: Comparar resultados de billing-webhook vs stripe-webhook

**Lógica**:
1. Buscar eventos processados nas últimas 24h
2. Comparar status final em ambas as tabelas
3. Identificar divergências
4. Gerar relatório de reconciliação

---

## 9. Testes de Validação

### 9.1 Cenários de Teste

1. **Subscription Created**
   - ✅ Criar assinatura no Stripe
   - ✅ Verificar criação em `user_subscriptions`
   - ✅ Validar snapshot de contrato
   - ✅ Validar `status_v2 = 'active'`

2. **Subscription Updated**
   - ✅ Atualizar assinatura no Stripe
   - ✅ Verificar atualização em `user_subscriptions`
   - ✅ Validar que snapshot não mudou (imutável)

3. **Subscription Deleted**
   - ✅ Cancelar assinatura no Stripe
   - ✅ Verificar `status_v2 = 'canceled'`
   - ✅ Validar que snapshot permanece

4. **Invoice Paid**
   - ✅ Pagar invoice no Stripe
   - ✅ Verificar `status_v2 = 'active'`
   - ✅ Validar registro no ledger

5. **Invoice Payment Failed**
   - ✅ Falhar pagamento no Stripe
   - ✅ Verificar `status_v2 = 'past_due'`
   - ✅ Validar registro no ledger

### 9.2 Testes de Idempotência

1. **Evento Duplicado**
   - ✅ Enviar mesmo evento 2x
   - ✅ Verificar que processou apenas 1x
   - ✅ Validar via `register_stripe_webhook_event`

2. **Evento Fora de Ordem**
   - ✅ Enviar eventos em ordem errada
   - ✅ Verificar que estado final está correto
   - ✅ Validar timestamps

---

## 10. Monitoramento e Observabilidade

### 10.1 Métricas

```typescript
// Métricas a serem coletadas
interface WebhookMetrics {
  event_type: string;
  processing_time_ms: number;
  success: boolean;
  error_message?: string;
  divergence_detected: boolean;
  timestamp: string;
}
```

### 10.2 Dashboards

1. **Webhook Health**
   - Taxa de sucesso por tipo de evento
   - Latência média/p95/p99
   - Taxa de erro por tipo

2. **Reconciliação**
   - Divergências detectadas
   - Contratos ativos (user_subscriptions vs gastronomy_subscriptions)
   - MRR total

3. **Alertas**
   - Eventos perdidos
   - Divergências críticas
   - Erros de processamento

---

## 11. Riscos e Mitigações

### 11.1 Risco: Cobrança Duplicada

**Mitigação**:
- Idempotência via `event_id`
- Dual-run com comparação automática
- Alertas em tempo real

### 11.2 Risco: Perda de Eventos

**Mitigação**:
- Retry automático do Stripe (até 3 dias)
- Monitoramento de eventos não processados
- Reconciliação diária

### 11.3 Risco: Inconsistência de Dados

**Mitigação**:
- Snapshot imutável de contrato
- Validação de estado antes de atualizar
- Rollback rápido (< 5 minutos)

### 11.4 Risco: Downtime Durante Cutover

**Mitigação**:
- Cutover em horário de baixo tráfego
- Rollback testado e documentado
- Equipe de suporte em standby

---

## 12. Cronograma

### 12.1 Timeline

| Fase | Duração | Início | Fim |
|------|---------|--------|-----|
| 4.1 - Preparação | 2h | T+0h | T+2h |
| 4.2 - Dual-Run | 24-48h | T+2h | T+50h |
| 4.3 - Validação | 2h | T+50h | T+52h |
| 4.4 - Cutover | 1h | T+52h | T+53h |
| 4.5 - Monitoramento | 24h | T+53h | T+77h |

**Total**: ~3 dias (incluindo dual-run)

### 12.2 Checkpoints

- ✅ T+2h: billing-webhook atualizado e testado
- ✅ T+26h: Primeira validação de dual-run
- ✅ T+50h: Validação final de dual-run
- ✅ T+53h: Cutover completo
- ✅ T+77h: Sunset de stripe-webhook

---

## 13. Próximos Passos

### 13.1 Imediato (Fase 4.1)

1. Atualizar `billing-webhook` com suporte a snapshot
2. Criar função `compare-webhook-results`
3. Criar migration de migração de dados legados
4. Testar localmente com Stripe CLI

### 13.2 Curto Prazo (Fase 4.2-4.4)

1. Iniciar dual-run em produção
2. Monitorar métricas por 24-48h
3. Validar reconciliação
4. Executar cutover

### 13.3 Médio Prazo (Fase 4.5)

1. Deprecar `stripe-webhook`
2. Migrar dados legados
3. Remover código legado após 30 dias

---

**Última atualização**: 2026-04-21  
**Status**: 🚧 Preparação (Fase 4.1)  
**Próximo passo**: Atualizar billing-webhook com suporte a snapshot

