# 📊 FASE 3.0 — Análise do Sistema de Billing

> **Data**: 2026-04-18  
> **Status**: ✅ ANÁLISE COMPLETA  
> **Tempo**: 30 minutos

---

## 🎯 OBJETIVO

Analisar o sistema atual de billing e subscriptions para identificar o que existe, o que falta e o que precisa ser implementado.

---

## ✅ O QUE JÁ EXISTE

### 1. Tabelas de Planos (2 tabelas)

#### `billing_plans`
**Arquivo**: `20260416100000_create_billing_plans.sql`

**Estrutura**:
- `id` - UUID
- `code` - Código único (free, pro, delivery)
- `name` - Nome do plano
- `description` - Descrição
- `price_cents` - Preço em centavos
- `price_display` - Preço formatado
- `currency` - Moeda (BRL)
- `billing_period` - Período (monthly, yearly)
- `features` - Array de features (JSONB)
- `entitlements` - Permissões e limites (JSONB)
- `is_active` - Se está ativo
- `is_featured` - Se é destaque
- `display_order` - Ordem de exibição

**Planos Cadastrados**:
1. **Free** - R$ 0,00
   - Página básica
   - 20 itens no cardápio
   - 5 imagens
   - 3 categorias

2. **Pro** - R$ 49,90 (Featured)
   - Tudo do Free
   - Página premium
   - Link curto (/p/:slug)
   - QR Code personalizado
   - Cardápio avançado
   - Imagens ilimitadas
   - Promoções
   - Analytics básico

3. **Delivery** - R$ 99,90
   - Tudo do Pro
   - Pedidos internos
   - Painel de pedidos
   - Rede de motoboys
   - Rastreamento
   - Analytics avançado

**RLS**: ✅ Configurado
- Leitura pública de planos ativos
- Admin (service_role) pode tudo

---

#### `subscription_plans`
**Arquivo**: `20260416100001_create_subscription_plans.sql`

**Estrutura**: Similar a `billing_plans`
- Mesmos campos
- Mesmos planos
- Mesmas features

**⚠️ PROBLEMA**: **DUPLICAÇÃO**
- Duas tabelas com o mesmo propósito
- Mesmos dados
- Mesma estrutura
- Violação de SSOT (Single Source of Truth)

**Decisão**: Usar apenas `billing_plans` e deprecar `subscription_plans`

---

### 2. Tabela de Assinaturas de Empresas

#### `business_subscriptions`
**Arquivo**: `20260413100000_create_business_subscriptions.sql`

**Estrutura**:
- `id` - UUID
- `business_id` - Referência para business_data
- `plan_tier` - Plano atual (free, pro, delivery)
- `status` - Status (active, canceled, past_due, trialing)
- `current_period_start` - Início do período
- `current_period_end` - Fim do período
- `cancel_at_period_end` - Se cancela no fim
- `trial_end` - Fim do trial
- `stripe_subscription_id` - ID no Stripe
- `stripe_customer_id` - ID do cliente no Stripe

**RLS**: ✅ Configurado
- Empresas veem suas próprias assinaturas
- Sistema (service_role) pode gerenciar

**⚠️ PROBLEMA**: Apenas para empresas (business_data)
- Não há tabela para assinaturas de usuários individuais
- Não há tabela para assinaturas de profissionais
- Não há tabela para assinaturas de motoristas

---

## ❌ O QUE FALTA

### 1. Integração com Stripe
- [ ] SDK do Stripe configurado
- [ ] Produtos criados no Stripe
- [ ] Preços criados no Stripe
- [ ] Checkout configurado
- [ ] Webhooks configurados
- [ ] Sincronização automática

### 2. Tabela de Assinaturas de Usuários
- [ ] `user_subscriptions` não existe nas migrations atuais
- [ ] Necessária para assinaturas de perfis pessoais
- [ ] Necessária para profissionais
- [ ] Necessária para motoristas

### 3. Webhooks do Stripe
- [ ] Endpoint para receber eventos
- [ ] Processamento de eventos
- [ ] Atualização de status
- [ ] Notificações

### 4. Portal do Cliente
- [ ] Gerenciar métodos de pagamento
- [ ] Ver histórico de faturas
- [ ] Atualizar assinatura
- [ ] Cancelar assinatura

### 5. Services e Hooks
- [ ] `BillingService` - Gerenciar billing
- [ ] `SubscriptionService` - Gerenciar assinaturas
- [ ] `useBilling` hook
- [ ] `useSubscription` hook

### 6. Edge Functions
- [ ] `billing-create-checkout` - Criar sessão de checkout
- [ ] `billing-create-portal` - Criar sessão do portal
- [ ] `billing-webhook` - Processar webhooks
- [ ] `billing-sync-subscription` - Sincronizar assinatura

### 7. UI
- [ ] Página de pricing
- [ ] Página de checkout
- [ ] Página de gerenciamento de assinatura
- [ ] Componentes de planos
- [ ] Componentes de pagamento

---

## 🔍 ANÁLISE DE GAPS

### Gap 1: Duplicação de Tabelas
**Problema**: `billing_plans` e `subscription_plans` são idênticas

**Solução**: 
- Usar apenas `billing_plans`
- Criar view `subscription_plans` apontando para `billing_plans` (compatibilidade)
- Ou deletar `subscription_plans` completamente

**Prioridade**: 🟡 Média

---

### Gap 2: Falta de `user_subscriptions`
**Problema**: Não há tabela para assinaturas de usuários

**Solução**: 
- Criar `user_subscriptions` similar a `business_subscriptions`
- Campos: user_id, plan_code, status, stripe_subscription_id, etc.

**Prioridade**: 🔴 Alta

---

### Gap 3: Sem Integração com Stripe
**Problema**: Tabelas existem mas não há integração real

**Solução**:
- Configurar Stripe SDK
- Criar produtos e preços no Stripe
- Implementar checkout
- Implementar webhooks

**Prioridade**: 🔴 Crítica

---

### Gap 4: Sem Webhooks
**Problema**: Não há como sincronizar eventos do Stripe

**Solução**:
- Criar edge function `billing-webhook`
- Processar eventos: subscription.created, subscription.updated, subscription.deleted, invoice.paid, invoice.payment_failed
- Atualizar banco de dados
- Notificar usuários

**Prioridade**: 🔴 Crítica

---

### Gap 5: Sem Portal do Cliente
**Problema**: Usuários não podem gerenciar suas assinaturas

**Solução**:
- Usar Stripe Customer Portal
- Criar edge function para gerar sessão do portal
- Adicionar link na UI

**Prioridade**: 🟡 Média

---

### Gap 6: Sem Services
**Problema**: Não há camada de serviço para billing

**Solução**:
- Criar `BillingService`
- Criar `SubscriptionService`
- Criar hooks

**Prioridade**: 🔴 Alta

---

## 📋 PLANO DE AÇÃO

### Etapa 3.1 - Corrigir Duplicação (30 min)
1. Decidir qual tabela manter
2. Criar view de compatibilidade se necessário
3. Atualizar código para usar tabela única

### Etapa 3.2 - Criar `user_subscriptions` (30 min)
1. Criar migration
2. Adicionar RLS policies
3. Adicionar índices
4. Testar

### Etapa 3.3 - Integração com Stripe (2h)
1. Configurar Stripe SDK
2. Criar produtos no Stripe (via script ou manual)
3. Criar preços no Stripe
4. Implementar checkout
5. Testar checkout

### Etapa 3.4 - Webhooks (1.5h)
1. Criar edge function `billing-webhook`
2. Validar assinatura do webhook
3. Processar eventos
4. Atualizar banco
5. Testar com Stripe CLI

### Etapa 3.5 - Services e Hooks (1h)
1. Criar `BillingService`
2. Criar `SubscriptionService`
3. Criar `useBilling` hook
4. Criar `useSubscription` hook

### Etapa 3.6 - Portal do Cliente (30 min)
1. Criar edge function `billing-create-portal`
2. Adicionar link na UI
3. Testar

**Tempo Total**: ~6 horas

---

## 🎯 DECISÕES TÉCNICAS

### Decisão 1: Qual tabela de planos usar?
**Opção A**: `billing_plans` (Recomendado)
- Nome mais claro
- Já tem dados
- Já tem RLS

**Opção B**: `subscription_plans`
- Nome mais específico
- Já tem dados
- Já tem RLS

**Decisão**: Usar `billing_plans` e deprecar `subscription_plans`

---

### Decisão 2: Criar `user_subscriptions`?
**Sim**, é necessário para:
- Assinaturas de usuários individuais
- Assinaturas de profissionais
- Assinaturas de motoristas
- Separar de `business_subscriptions`

---

### Decisão 3: Usar Stripe Checkout ou Custom?
**Stripe Checkout** (Recomendado)
- Mais rápido de implementar
- PCI compliant por padrão
- UI pronta
- Suporta múltiplos métodos de pagamento

**Custom Checkout**
- Mais controle
- Mais trabalho
- Mais responsabilidade

**Decisão**: Usar Stripe Checkout

---

### Decisão 4: Usar Stripe Customer Portal?
**Sim** (Recomendado)
- Pronto para uso
- Gerencia métodos de pagamento
- Gerencia assinaturas
- Gerencia faturas
- Menos código para manter

---

## 📊 ARQUITETURA PROPOSTA

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  Pricing Page → Checkout → Success/Cancel                   │
│  Subscription Management → Portal                            │
│  useBilling() hook → useSubscription() hook                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTIONS                          │
├─────────────────────────────────────────────────────────────┤
│  billing-create-checkout → Stripe Checkout Session          │
│  billing-create-portal → Stripe Portal Session              │
│  billing-webhook → Process Stripe Events                    │
│  billing-sync-subscription → Manual Sync                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                         STRIPE                               │
├─────────────────────────────────────────────────────────────┤
│  Products → Prices → Checkout → Subscriptions               │
│  Webhooks → Events → Customer Portal                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE                              │
├─────────────────────────────────────────────────────────────┤
│  billing_plans (SSOT)                                        │
│  user_subscriptions (NEW)                                    │
│  business_subscriptions (EXISTS)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CRITÉRIOS DE SUCESSO

### Backend:
- [x] Tabelas de planos existem
- [ ] Tabela `user_subscriptions` criada
- [ ] Integração com Stripe funcionando
- [ ] Webhooks processando eventos
- [ ] Services criados
- [ ] Edge functions criadas

### Stripe:
- [ ] Produtos criados
- [ ] Preços criados
- [ ] Webhooks configurados
- [ ] Test mode funcionando
- [ ] Production mode configurado

### Frontend:
- [ ] Página de pricing
- [ ] Checkout funcionando
- [ ] Portal do cliente acessível
- [ ] Status de assinatura visível

---

## 🚨 RISCOS IDENTIFICADOS

### Risco 1: Webhooks não confiáveis
**Probabilidade**: Média  
**Impacto**: Alto  
**Mitigação**: 
- Implementar retry logic
- Validar assinatura do webhook
- Idempotência nas operações
- Logging completo

### Risco 2: Sincronização fora de sincronia
**Probabilidade**: Média  
**Impacto**: Médio  
**Mitigação**:
- Webhook como fonte de verdade
- Função de sincronização manual
- Alertas de inconsistência

### Risco 3: Pagamentos falhando
**Probabilidade**: Baixa  
**Impacto**: Alto  
**Mitigação**:
- Usar Stripe Checkout (testado)
- Tratamento de erros robusto
- Notificações de falha

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Análise completa (este documento)
2. ⏳ Criar `user_subscriptions`
3. ⏳ Configurar Stripe SDK
4. ⏳ Criar edge functions
5. ⏳ Implementar webhooks
6. ⏳ Criar services e hooks
7. ⏳ Testar fluxo completo

---

**Status**: ✅ ANÁLISE COMPLETA  
**Próxima Ação**: Criar migration `user_subscriptions`  
**Tempo Estimado Restante**: 5.5 horas

---

*Documentado por: Kiro AI*  
*Data: 2026-04-18*  
*Fase: Pré-Lançamento - Billing & Subscriptions*
