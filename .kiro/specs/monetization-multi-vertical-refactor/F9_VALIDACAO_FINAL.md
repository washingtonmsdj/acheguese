# FASE 9 - Validação Final e Go-Live - Plano de Execução

**Status**: 📋 Pronto para Execução  
**Data**: 2026-04-21  
**Responsável**: Kiro / Implementação SSOT  
**Objetivo**: Validar sistema completo e aprovar Go-Live

---

## 1. Visão Geral

### 1.1 Objetivo

Executar validação completa do sistema SSOT antes do Go-Live em produção. Garantir que:

- Todos os fluxos críticos funcionam corretamente
- Reconciliação financeira está correta
- Sistema pode ser revertido em caso de problema
- Equipe está preparada para operação

### 1.2 Critérios de Aprovação

- ✅ 100% dos testes E2E passando
- ✅ Zero divergência financeira crítica
- ✅ Rollback testado e funcional
- ✅ Documentação de operação completa
- ✅ Equipe treinada

---

## 2. Testes End-to-End

### 2.1 Cenário 1: Contratação de Plano

**Objetivo**: Validar fluxo completo de contratação

**Pré-condições**:
- Usuário autenticado
- Sem assinatura ativa
- Stripe configurado

**Passos**:
1. Usuário acessa página de planos
2. Seleciona plano Pro (R$ 49,90/mês)
3. Preenche dados de pagamento
4. Confirma contratação
5. Stripe processa pagamento
6. Webhook `billing-webhook` recebe evento
7. Sistema cria contrato em `user_subscriptions`

**Validações**:
- ✅ Contrato criado com `status_v2 = 'active'`
- ✅ `contract_snapshot` contém catálogo completo
- ✅ `catalog_item_id` referencia item correto
- ✅ `price_cents = 4990`
- ✅ `billing_period = 'monthly'`
- ✅ `stripe_subscription_id` preenchido
- ✅ Entitlements resolvidos corretamente
- ✅ `can_use_short_premium_link = true`

**Query de validação**:
```sql
SELECT 
  id,
  user_id,
  plan_code,
  status_v2,
  price_cents,
  contract_snapshot->>'catalog_item' as snapshot,
  catalog_item_id,
  stripe_subscription_id,
  created_at
FROM user_subscriptions
WHERE user_id = :user_id
AND status_v2 = 'active';
```

**Resultado esperado**: 1 registro com todos os campos preenchidos

---

### 2.2 Cenário 2: Upgrade de Plano

**Objetivo**: Validar mudança de plano (Pro → Delivery)

**Pré-condições**:
- Usuário com plano Pro ativo
- Stripe configurado

**Passos**:
1. Usuário acessa página de upgrade
2. Seleciona plano Delivery (R$ 99,90/mês)
3. Confirma upgrade
4. Stripe atualiza subscription
5. Webhook `billing-webhook` recebe evento
6. Sistema atualiza contrato

**Validações**:
- ✅ `plan_code` atualizado para 'base-delivery'
- ✅ `price_cents` atualizado para 9990
- ✅ Novo `contract_snapshot` criado
- ✅ Snapshot anterior preservado (histórico)
- ✅ `status_v2` permanece 'active'
- ✅ Entitlements atualizados
- ✅ `can_use_motoboy_network = true`

**Query de validação**:
```sql
SELECT 
  plan_code,
  price_cents,
  contract_snapshot,
  updated_at
FROM user_subscriptions
WHERE user_id = :user_id
AND status_v2 = 'active';
```

**Resultado esperado**: plan_code = 'base-delivery', price_cents = 9990

---

### 2.3 Cenário 3: Downgrade de Plano

**Objetivo**: Validar mudança de plano (Delivery → Pro)

**Pré-condições**:
- Usuário com plano Delivery ativo

**Passos**:
1. Usuário acessa página de planos
2. Seleciona plano Pro (downgrade)
3. Confirma downgrade
4. Stripe atualiza subscription
5. Webhook processa evento
6. Sistema atualiza contrato

**Validações**:
- ✅ `plan_code` atualizado para 'base-pro'
- ✅ `price_cents` atualizado para 4990
- ✅ Novo snapshot criado
- ✅ Entitlements reduzidos
- ✅ `can_use_motoboy_network = false`
- ✅ `can_use_short_premium_link = true` (mantido)

---

### 2.4 Cenário 4: Cancelamento de Plano

**Objetivo**: Validar cancelamento de assinatura

**Pré-condições**:
- Usuário com plano ativo

**Passos**:
1. Usuário acessa configurações
2. Solicita cancelamento
3. Confirma cancelamento
4. Stripe cancela subscription
5. Webhook processa evento
6. Sistema atualiza status

**Validações**:
- ✅ `status_v2` atualizado para 'canceled'
- ✅ `canceled_at` preenchido
- ✅ Snapshot preservado (não deletado)
- ✅ Entitlements retornam para free
- ✅ `can_use_short_premium_link = false`
- ✅ Histórico mantido

**Query de validação**:
```sql
SELECT 
  status_v2,
  canceled_at,
  contract_snapshot,
  updated_at
FROM user_subscriptions
WHERE user_id = :user_id;
```

**Resultado esperado**: status_v2 = 'canceled', canceled_at IS NOT NULL

---

### 2.5 Cenário 5: Renovação Automática

**Objetivo**: Validar renovação mensal automática

**Pré-condições**:
- Usuário com plano ativo
- Período de cobrança próximo do fim

**Passos**:
1. Stripe processa renovação automática
2. Invoice é criado
3. Pagamento é processado
4. Webhook `invoice.paid` é recebido
5. Sistema atualiza período

**Validações**:
- ✅ `current_period_start` atualizado
- ✅ `current_period_end` atualizado (+1 mês)
- ✅ `status_v2` permanece 'active'
- ✅ Snapshot não muda (imutável)
- ✅ Transação registrada no ledger

---

### 2.6 Cenário 6: Falha de Pagamento

**Objetivo**: Validar tratamento de falha de pagamento

**Pré-condições**:
- Usuário com plano ativo
- Cartão com saldo insuficiente

**Passos**:
1. Stripe tenta processar pagamento
2. Pagamento falha
3. Webhook `invoice.payment_failed` é recebido
4. Sistema atualiza status

**Validações**:
- ✅ `status_v2` atualizado para 'past_due'
- ✅ Entitlements mantidos (grace period)
- ✅ Transação de falha registrada
- ✅ Usuário notificado (se implementado)

---

### 2.7 Cenário 7: Trial Period

**Objetivo**: Validar período de trial

**Pré-condições**:
- Usuário novo
- Plano com trial de 7 dias

**Passos**:
1. Usuário contrata plano com trial
2. Stripe cria subscription com trial
3. Webhook processa evento
4. Sistema cria contrato

**Validações**:
- ✅ `status_v2 = 'trialing'`
- ✅ `trial_ends_at` preenchido (+7 dias)
- ✅ Entitlements ativos durante trial
- ✅ `can_use_short_premium_link = true`
- ✅ Após trial, status muda para 'active'

---

### 2.8 Cenário 8: Multi-Vertical (Business)

**Objetivo**: Validar assinatura de negócio (scope = 'business')

**Pré-condições**:
- Usuário com negócio cadastrado
- Vertical = gastronomy

**Passos**:
1. Usuário contrata plano para negócio
2. Metadata inclui `business_id`
3. Webhook processa evento
4. Sistema cria contrato

**Validações**:
- ✅ `subscription_scope = 'business'`
- ✅ `business_id` preenchido
- ✅ `entity_family = 'company'`
- ✅ `vertical = 'gastronomy'`
- ✅ Entitlements resolvidos por business_id
- ✅ Índice parcial garante unicidade

---

## 3. Reconciliação Financeira

### 3.1 Objetivo

Garantir que dados internos estão sincronizados com Stripe.

### 3.2 Queries de Reconciliação

#### 3.2.1 Contratos Ativos

```sql
-- Contar contratos ativos no sistema
SELECT 
  COUNT(*) as total_active,
  SUM(price_cents) as total_mrr_cents,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT business_id) as unique_businesses
FROM user_subscriptions
WHERE status_v2 IN ('active', 'trialing');
```

**Comparar com Stripe**:
```bash
# Listar subscriptions ativas no Stripe
stripe subscriptions list --status active --limit 100
```

**Critério de aprovação**: Divergência < 1%

#### 3.2.2 MRR (Monthly Recurring Revenue)

```sql
-- Calcular MRR por plano
SELECT 
  plan_code,
  COUNT(*) as contracts,
  SUM(price_cents) as mrr_cents,
  SUM(price_cents) / 100.0 as mrr_brl
FROM user_subscriptions
WHERE status_v2 IN ('active', 'trialing')
GROUP BY plan_code
ORDER BY mrr_cents DESC;
```

**Resultado esperado**:
- base-free: R$ 0,00
- base-pro: R$ X,XX
- base-delivery: R$ Y,YY

#### 3.2.3 Eventos Processados

```sql
-- Contar eventos processados nas últimas 24h
SELECT 
  event_type,
  COUNT(*) as count,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as success_count,
  SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as error_count
FROM stripe_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;
```

**Critério de aprovação**: Taxa de sucesso > 99%

---

## 4. Teste de Rollback

### 4.1 Objetivo

Validar capacidade de reverter sistema em caso de problema crítico.

### 4.2 Cenário de Rollback

**Situação**: Bug crítico detectado em produção

**Passos**:
1. Identificar problema
2. Desativar `billing-webhook` temporariamente
3. Reativar `stripe-webhook` (legado)
4. Validar que eventos são processados
5. Corrigir problema
6. Reativar `billing-webhook`
7. Desativar `stripe-webhook` novamente

**Tempo máximo**: 5 minutos

### 4.3 Validação de Rollback

```bash
# 1. Desativar billing-webhook no Stripe Dashboard
# 2. Reativar stripe-webhook
# 3. Enviar evento de teste
stripe trigger customer.subscription.updated

# 4. Verificar processamento
SELECT * FROM gastronomy_subscriptions 
WHERE updated_at > NOW() - INTERVAL '1 minute';

# 5. Reverter
# 6. Validar billing-webhook funcionando
```

**Critério de aprovação**: Rollback completo em < 5 minutos

---

## 5. Documentação de Operação

### 5.1 Runbook de Suporte

**Arquivo**: `docs/operations/BILLING_RUNBOOK.md`

**Conteúdo**:

```markdown
# Runbook - Sistema de Billing

## Visão Geral

Sistema SSOT de monetização multi-vertical.

## Componentes

- **Tabela canônica**: `user_subscriptions`
- **Webhook**: `billing-webhook`
- **Services**: `EntitlementResolver`, `CatalogService`

## Operações Comuns

### Verificar Status de Assinatura

```sql
SELECT 
  user_id,
  plan_code,
  status_v2,
  price_cents,
  current_period_end
FROM user_subscriptions
WHERE user_id = :user_id;
```

### Resolver Entitlements

```typescript
const entitlements = await EntitlementResolver.resolve({
  user_id: userId,
  business_id: businessId,
  subscription_scope: 'business'
});
```

### Verificar Eventos Stripe

```sql
SELECT * FROM stripe_webhook_events
WHERE stripe_event_id = :event_id;
```

## Troubleshooting

### Problema: Entitlement Incorreto

**Sintoma**: Usuário não tem acesso a feature paga

**Diagnóstico**:
1. Verificar assinatura ativa
2. Verificar status_v2
3. Verificar contract_snapshot
4. Verificar catalog_item

**Solução**:
- Se assinatura ativa mas entitlement errado: verificar EntitlementResolver
- Se snapshot vazio: reprocessar webhook
- Se catalog_item null: popular catalog_item_id

### Problema: Webhook Não Processado

**Sintoma**: Evento Stripe não refletido no sistema

**Diagnóstico**:
1. Verificar logs de billing-webhook
2. Verificar stripe_webhook_events
3. Verificar assinatura Stripe

**Solução**:
- Reenviar evento manualmente via Stripe Dashboard
- Verificar signature secret
- Verificar idempotência (event_id)
```

---

### 5.2 Disaster Recovery Plan

**Arquivo**: `docs/operations/DISASTER_RECOVERY.md`

**Cenários**:

1. **Perda de Dados**:
   - Backup diário de `user_subscriptions`
   - Restore via Supabase
   - Reprocessar eventos Stripe (últimos 30 dias)

2. **Webhook Indisponível**:
   - Stripe retenta por 3 dias
   - Reprocessar eventos manualmente
   - Reconciliação via API Stripe

3. **Corrupção de Dados**:
   - Identificar contratos afetados
   - Restaurar de backup
   - Validar com Stripe API

---

### 5.3 Monitoring e Alertas

**Métricas a Monitorar**:

1. **Taxa de Sucesso de Webhooks**:
   - Alerta se < 99%
   - Dashboard: Grafana/Datadog

2. **Latência de Processamento**:
   - Alerta se > 5 segundos
   - P95, P99

3. **Divergências Financeiras**:
   - Reconciliação diária
   - Alerta se divergência > 1%

4. **Contratos Ativos**:
   - Monitorar crescimento
   - Alerta se queda > 5%

**Queries de Monitoramento**:

```sql
-- Taxa de sucesso (últimas 24h)
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as success,
  (SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as success_rate
FROM stripe_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Latência média
SELECT 
  AVG(processing_time_ms) as avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_latency_ms
FROM stripe_webhook_events
WHERE created_at > NOW() - INTERVAL '24 hours';
```

---

## 6. Treinamento da Equipe

### 6.1 Sessões de Treinamento

**Público**: Equipe de desenvolvimento e suporte

**Tópicos**:
1. Arquitetura SSOT
2. Fluxo de webhooks
3. Resolução de entitlements
4. Troubleshooting comum
5. Rollback procedures

**Duração**: 2 horas

### 6.2 Materiais de Treinamento

- Apresentação: Arquitetura SSOT
- Vídeo: Fluxo de contratação
- Documento: Troubleshooting guide
- Quiz: Validação de conhecimento

---

## 7. Checklist de Go-Live

### 7.1 Pré-Go-Live

- [ ] Todos os testes E2E passando
- [ ] Reconciliação financeira aprovada
- [ ] Rollback testado e funcional
- [ ] Documentação completa
- [ ] Equipe treinada
- [ ] Monitoramento configurado
- [ ] Alertas configurados
- [ ] Backup configurado

### 7.2 Go-Live

- [ ] Validar billing-webhook ativo
- [ ] Validar stripe-webhook deprecated
- [ ] Monitorar por 24h
- [ ] Reconciliação diária
- [ ] Equipe de suporte em standby

### 7.3 Pós-Go-Live

- [ ] Validar métricas (7 dias)
- [ ] Reconciliação semanal
- [ ] Remover stripe-webhook (30 dias)
- [ ] Arquivar tabelas legadas (30 dias)
- [ ] Retrospectiva do projeto

---

## 8. Critérios de Aprovação Final

### 8.1 Testes

- ✅ 8/8 cenários E2E passando
- ✅ Zero falhas críticas
- ✅ Taxa de sucesso > 99%

### 8.2 Financeiro

- ✅ Divergência < 1% vs Stripe
- ✅ MRR calculado corretamente
- ✅ Transações registradas no ledger

### 8.3 Operacional

- ✅ Rollback < 5 minutos
- ✅ Documentação completa
- ✅ Equipe treinada
- ✅ Monitoramento ativo

### 8.4 Qualidade

- ✅ Zero gambiarras
- ✅ 100% conformidade SSOT
- ✅ Padrão AAA mantido

---

## 9. Aprovação de Go-Live

### 9.1 Stakeholders

- [ ] Tech Lead
- [ ] Product Owner
- [ ] Finance Team
- [ ] Support Team

### 9.2 Assinaturas

```
Tech Lead: _________________ Data: _______
Product Owner: _____________ Data: _______
Finance: ___________________ Data: _______
Support: ___________________ Data: _______
```

---

## 10. Conclusão

### 10.1 Status

**Fase 9 - Validação Final**: 📋 **PRONTO PARA EXECUÇÃO**

### 10.2 Próximos Passos

1. Executar testes E2E (2-3h)
2. Reconciliação financeira (1h)
3. Teste de rollback (30min)
4. Documentação final (1h)
5. Treinamento da equipe (2h)
6. Go-Live

**Tempo total estimado**: 6-7 horas

### 10.3 Go-Live

**Data planejada**: A definir  
**Horário**: Fora do horário de pico  
**Duração**: 1 hora  
**Rollback**: < 5 minutos

---

**Última atualização**: 2026-04-21  
**Status**: 📋 Pronto para Execução  
**Aprovação**: Pendente

