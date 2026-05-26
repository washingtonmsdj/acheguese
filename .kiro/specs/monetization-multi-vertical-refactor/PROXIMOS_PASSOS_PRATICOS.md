# 🚀 Próximos Passos Práticos - Sistema SSOT em Produção

**Data**: 2026-04-21  
**Status do Projeto**: ✅ 100% CONCLUÍDO  
**Próxima Etapa**: Go-Live e Monitoramento

---

## 📋 Checklist de Go-Live

### 1. Pré-Requisitos (Validar Antes de Deploy)

#### 1.1 Migrations Aplicadas
```bash
# Verificar se todas as 5 migrations foram aplicadas
cd supabase
supabase db remote status

# Resultado esperado:
# ✅ 20260421000001_evolve_user_subscriptions_ssot.sql
# ✅ 20260421000002_create_catalog_ssot.sql
# ✅ 20260421000003_seed_initial_catalog.sql
# ✅ 20260421000004_migrate_legacy_subscriptions.sql
# ✅ 20260421000005_mark_legacy_tables_readonly.sql
```

**Se alguma migration não foi aplicada**:
```bash
# Aplicar migrations pendentes
supabase db push
```

#### 1.2 Webhook Stripe Configurado
```bash
# 1. Acessar Stripe Dashboard
# https://dashboard.stripe.com/webhooks

# 2. Verificar endpoint billing-webhook
# URL: https://[seu-projeto].supabase.co/functions/v1/billing-webhook
# Eventos: customer.subscription.*, invoice.paid, invoice.payment_failed

# 3. Copiar Webhook Secret
# Adicionar em Supabase Secrets:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 1.3 Variáveis de Ambiente
```bash
# Verificar no Supabase Dashboard > Settings > Secrets
OK STRIPE_SECRET_KEY=[configurado em secret manager]
OK STRIPE_WEBHOOK_SECRET=[configurado em secret manager]
OK SUPABASE_URL=[configurado em secret manager]
OK SUPABASE_SERVICE_ROLE_KEY=[configurado em secret manager]
```

#### 1.4 Catálogo Seedado
```sql
-- Verificar se catálogo foi seedado
SELECT 
  cv.version_name,
  cv.status,
  COUNT(ci.id) as items_count
FROM commercial_catalog_version cv
LEFT JOIN catalog_item ci ON ci.catalog_version_id = cv.id
WHERE cv.version_name = 'v1.0.0'
GROUP BY cv.id, cv.version_name, cv.status;

-- Resultado esperado:
-- v1.0.0 | published | 3
```

**Se catálogo não foi seedado**:
```bash
# Aplicar migration de seed
supabase db push
```

---

## 2. Testes E2E (Executar em Staging)

### 2.1 Teste 1: Contratação de Plano Pro

**Objetivo**: Validar fluxo completo de contratação

**Passos**:
1. Criar usuário de teste
2. Acessar página de planos
3. Selecionar plano Pro (R$ 49,90/mês)
4. Usar cartão de teste Stripe: `4242 4242 4242 4242`
5. Confirmar contratação

**Validação**:
```sql
-- Verificar contrato criado
SELECT 
  id,
  user_id,
  plan_code,
  status_v2,
  price_cents,
  contract_snapshot->>'catalog_item' IS NOT NULL as has_snapshot,
  stripe_subscription_id
FROM user_subscriptions
WHERE user_id = '[user_id_teste]'
AND status_v2 = 'active';

-- Resultado esperado:
-- plan_code = 'base-pro'
-- status_v2 = 'active'
-- price_cents = 4990
-- has_snapshot = true
-- stripe_subscription_id IS NOT NULL
```

**Validar entitlements**:
```typescript
// No frontend, verificar:
const { can } = useEntitlements({ user_id: userId });
console.log(can('can_use_short_premium_link')); // true
console.log(can('can_use_motoboy_network')); // false
```

### 2.2 Teste 2: Upgrade Pro → Delivery

**Passos**:
1. Com usuário Pro ativo
2. Acessar página de upgrade
3. Selecionar plano Delivery (R$ 99,90/mês)
4. Confirmar upgrade

**Validação**:
```sql
-- Verificar upgrade
SELECT 
  plan_code,
  price_cents,
  contract_snapshot->>'updated_at' IS NOT NULL as snapshot_updated
FROM user_subscriptions
WHERE user_id = '[user_id_teste]';

-- Resultado esperado:
-- plan_code = 'base-delivery'
-- price_cents = 9990
-- snapshot_updated = true
```

### 2.3 Teste 3: Cancelamento

**Passos**:
1. Com usuário ativo
2. Acessar configurações
3. Cancelar assinatura
4. Confirmar cancelamento

**Validação**:
```sql
-- Verificar cancelamento
SELECT 
  status_v2,
  canceled_at IS NOT NULL as is_canceled,
  contract_snapshot IS NOT NULL as snapshot_preserved
FROM user_subscriptions
WHERE user_id = '[user_id_teste]';

-- Resultado esperado:
-- status_v2 = 'canceled'
-- is_canceled = true
-- snapshot_preserved = true (histórico mantido)
```

---

## 3. Monitoramento (Primeiras 24h)

### 3.1 Métricas Críticas

**Dashboard Supabase > Logs**:

```sql
-- 1. Taxa de sucesso de webhooks (últimas 24h)
SELECT 
  COUNT(*) as total_events,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
  (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as success_rate
FROM stripe_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Alerta se success_rate < 99%
```

```sql
-- 2. Contratos ativos
SELECT 
  COUNT(*) as total_active,
  SUM(price_cents) / 100.0 as mrr_brl
FROM user_subscriptions
WHERE status_v2 IN ('active', 'trialing');

-- Monitorar crescimento
```

```sql
-- 3. Eventos não processados
SELECT 
  stripe_event_id,
  event_type,
  error_message,
  created_at
FROM stripe_webhook_events
WHERE success = false
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Investigar se houver erros
```

### 3.2 Logs de Aplicação

**Supabase > Edge Functions > billing-webhook > Logs**:

```bash
# Buscar por erros
[billing-webhook] Error

# Buscar por warnings
[billing-webhook] Warning

# Validar processamento
[billing-webhook] Subscription .* processed successfully
```

### 3.3 Alertas Recomendados

**Configurar no Supabase ou Datadog**:

1. **Taxa de sucesso < 99%**
   - Severidade: CRÍTICO
   - Ação: Investigar imediatamente

2. **Latência > 5 segundos**
   - Severidade: WARNING
   - Ação: Otimizar queries

3. **Contratos ativos caindo > 5%**
   - Severidade: CRÍTICO
   - Ação: Verificar cancelamentos

---

## 4. Reconciliação Financeira (Diária)

### 4.1 Script de Reconciliação

```sql
-- Comparar contratos ativos com Stripe
WITH internal_data AS (
  SELECT 
    COUNT(*) as internal_active,
    SUM(price_cents) as internal_mrr_cents
  FROM user_subscriptions
  WHERE status_v2 IN ('active', 'trialing')
)
SELECT 
  internal_active,
  internal_mrr_cents / 100.0 as internal_mrr_brl,
  -- Comparar com dados do Stripe (manual)
  -- stripe_active_count,
  -- stripe_mrr_brl,
  -- ABS(internal_active - stripe_active_count) as divergence
FROM internal_data;
```

**Comparar com Stripe**:
```bash
# Listar subscriptions ativas
stripe subscriptions list --status active --limit 100 | jq '.data | length'

# Calcular MRR
stripe subscriptions list --status active --limit 100 | \
  jq '[.data[].items.data[].price.unit_amount] | add'
```

**Critério de aprovação**: Divergência < 1%

---

## 5. Rollback Plan (Se Necessário)

### 5.1 Cenário: Bug Crítico Detectado

**Sintomas**:
- Taxa de sucesso < 90%
- Contratos não sendo criados
- Entitlements incorretos

**Ação Imediata** (< 5 minutos):

```bash
# 1. Desativar billing-webhook no Stripe Dashboard
# https://dashboard.stripe.com/webhooks
# Clicar em billing-webhook > Disable

# 2. Reativar stripe-webhook (legado)
# Clicar em stripe-webhook > Enable

# 3. Validar que eventos são processados
# Enviar evento de teste
stripe trigger customer.subscription.updated

# 4. Verificar processamento em gastronomy_subscriptions
```

```sql
-- Verificar se legado está funcionando
SELECT * FROM gastronomy_subscriptions 
WHERE updated_at > NOW() - INTERVAL '5 minutes';
```

**Após Correção**:
```bash
# 1. Corrigir bug em billing-webhook
# 2. Deploy da correção
# 3. Reativar billing-webhook
# 4. Desativar stripe-webhook novamente
# 5. Monitorar por 1 hora
```

---

## 6. Remoção de Código Legado (30 dias)

### 6.1 Cronograma

| Data | Ação |
|------|------|
| 2026-04-21 | ✅ Deprecação marcada |
| 2026-04-28 | Primeira revisão (7 dias) |
| 2026-05-05 | Segunda revisão (14 dias) |
| 2026-05-12 | Terceira revisão (21 dias) |
| 2026-05-21 | **Remoção final** (30 dias) |

### 6.2 Critérios para Remoção

**Validar antes de remover**:

```sql
-- 1. Zero eventos em stripe-webhook (7 dias)
SELECT COUNT(*) FROM stripe_webhook_events
WHERE webhook_source = 'stripe-webhook'
AND created_at > NOW() - INTERVAL '7 days';
-- Resultado esperado: 0

-- 2. Zero writes bloqueados em tabelas legadas (7 dias)
SELECT COUNT(*) FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND relname IN ('gastronomy_subscriptions', 'business_subscriptions')
AND n_tup_ins + n_tup_upd > 0;
-- Resultado esperado: 0

-- 3. Todos os contratos migrados
SELECT COUNT(*) FROM user_subscriptions
WHERE catalog_item_id IS NULL
AND status_v2 IN ('active', 'trialing');
-- Resultado esperado: 0
```

### 6.3 Remoção Final (2026-05-21)

```bash
# 1. Remover stripe-webhook
rm -rf supabase/functions/stripe-webhook

# 2. Remover edge functions legadas
rm -rf supabase/functions/gastronomy-*

# 3. Arquivar tabelas legadas
```

```sql
-- Renomear tabelas para _archived
ALTER TABLE gastronomy_subscriptions 
  RENAME TO _archived_gastronomy_subscriptions;

ALTER TABLE business_subscriptions 
  RENAME TO _archived_business_subscriptions;

-- Remover triggers
DROP TRIGGER IF EXISTS prevent_gastronomy_subscriptions_writes 
  ON _archived_gastronomy_subscriptions;

DROP TRIGGER IF EXISTS prevent_business_subscriptions_writes 
  ON _archived_business_subscriptions;
```

---

## 7. Documentação para Equipe

### 7.1 Guia Rápido para Desenvolvedores

**Arquivo**: `docs/BILLING_QUICK_START.md`

```markdown
# Guia Rápido - Sistema de Billing SSOT

## Como Verificar Entitlements

```typescript
// ✅ CORRETO
import { useEntitlements } from '@/core/billing/hooks/useEntitlements';

const { can, isLoading } = useEntitlements({ 
  user_id: userId,
  business_id: businessId 
});

if (can('can_use_short_premium_link')) {
  // Feature habilitada
}
```

## Como Buscar Catálogo

```typescript
// ✅ CORRETO
import { useCatalog } from '@/core/billing/hooks/useCatalog';

const { catalog, isLoading } = useCatalog({
  entity_family: 'company',
  vertical: 'gastronomy'
});
```

## ❌ NÃO FAZER

```typescript
// ❌ ERRADO: Não calcular entitlement localmente
const canUse = planTier === 'pro';

// ❌ ERRADO: Não acessar tabelas diretamente
const { data } = await supabase
  .from('gastronomy_subscriptions')
  .select('*');

// ❌ ERRADO: Não usar PLANS hardcoded
const PLANS = { free: { price: 0 }, pro: { price: 4990 } };
```
```

### 7.2 Troubleshooting Guide

**Arquivo**: `docs/BILLING_TROUBLESHOOTING.md`

```markdown
# Troubleshooting - Sistema de Billing

## Problema: Usuário não tem acesso a feature paga

**Diagnóstico**:
1. Verificar assinatura ativa
2. Verificar entitlements resolvidos
3. Verificar contract_snapshot

**Solução**:
```sql
-- 1. Verificar assinatura
SELECT * FROM user_subscriptions WHERE user_id = '[user_id]';

-- 2. Se snapshot vazio, reprocessar webhook
-- Reenviar evento via Stripe Dashboard
```

## Problema: Webhook não processado

**Diagnóstico**:
1. Verificar logs de billing-webhook
2. Verificar signature secret
3. Verificar idempotência

**Solução**:
- Reenviar evento manualmente via Stripe Dashboard
- Verificar STRIPE_WEBHOOK_SECRET no Supabase
```

---

## 8. Próximas Funcionalidades (Roadmap)

### 8.1 Curto Prazo (1-3 meses)

1. **Addons Transacionais**
   - Permitir compra de features avulsas
   - Ex: Pacote de 100 SMS, 1000 emails

2. **Pacotes Verticais**
   - Combos específicos por vertical
   - Ex: Gastronomy Premium Pack

3. **Promoções e Cupons**
   - Descontos temporários
   - Cupons de primeira compra

### 8.2 Médio Prazo (3-6 meses)

1. **Multi-Moeda**
   - Suporte a USD, EUR
   - Pricing regional

2. **Billing Analytics**
   - Dashboard de MRR
   - Churn rate
   - LTV por vertical

3. **Self-Service Admin**
   - Interface para gestão de catálogo
   - Análise de impacto visual

### 8.3 Longo Prazo (6-12 meses)

1. **Marketplace de Addons**
   - Terceiros podem vender addons
   - Revenue share

2. **Enterprise Plans**
   - Contratos customizados
   - Pricing negociado

3. **Compliance Internacional**
   - GDPR, LGPD
   - Tax compliance

---

## 9. Checklist Final

### Antes de Go-Live

- [ ] Migrations aplicadas (5/5)
- [ ] Webhook Stripe configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Catálogo seedado (3 planos)
- [ ] Testes E2E executados (3/3)
- [ ] Monitoramento configurado
- [ ] Alertas configurados
- [ ] Rollback plan documentado
- [ ] Equipe treinada

### Após Go-Live (24h)

- [ ] Taxa de sucesso > 99%
- [ ] Zero erros críticos
- [ ] Reconciliação financeira OK
- [ ] Contratos sendo criados corretamente
- [ ] Entitlements resolvidos corretamente

### Após 7 dias

- [ ] Reconciliação semanal OK
- [ ] Zero eventos em stripe-webhook
- [ ] Zero writes bloqueados em tabelas legadas
- [ ] Métricas estáveis

### Após 30 dias

- [ ] Remover stripe-webhook
- [ ] Arquivar tabelas legadas
- [ ] Remover edge functions legadas
- [ ] Retrospectiva do projeto

---

## 10. Contatos e Suporte

### Equipe Técnica

- **Tech Lead**: [nome]
- **Backend**: [nome]
- **Frontend**: [nome]
- **DevOps**: [nome]

### Escalação

1. **Nível 1**: Suporte técnico (issues não críticos)
2. **Nível 2**: Tech Lead (bugs críticos)
3. **Nível 3**: CTO (sistema down)

### Canais

- **Slack**: #billing-support
- **PagerDuty**: billing-critical
- **Email**: tech@empresa.com

---

## ✅ Conclusão

O sistema SSOT está **100% pronto** para produção. Siga este guia para:

1. ✅ Validar pré-requisitos
2. ✅ Executar testes E2E
3. ✅ Monitorar primeiras 24h
4. ✅ Reconciliar financeiramente
5. ✅ Remover legado após 30 dias

**Boa sorte com o Go-Live! 🚀**

---

**Última atualização**: 2026-04-21  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para Produção
