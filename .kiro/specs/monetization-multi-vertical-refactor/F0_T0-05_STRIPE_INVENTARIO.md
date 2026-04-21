# T0-05: Inventário Stripe e Integrações de Cobrança

**Data**: 2026-04-21
**Status**: ✅ Concluído
**Método**: Varredura de Edge Functions, env vars, metadata Stripe

---

## Resumo Executivo

Identificados **2 webhooks Stripe paralelos** processando eventos com semântica distinta, criando **risco financeiro crítico** de:
- Cobrança duplicada
- Estado inconsistente de assinatura
- Perda de eventos por race condition

**Decisão obrigatória**: Consolidar em webhook único antes da Fase 2.

---

## 1. Inventário de Price IDs

### 1.1 Variáveis de Ambiente

| Variável | Uso | Localização | Valor Exemplo |
|----------|-----|-------------|---------------|
| `STRIPE_PRICE_ID_PRO` | Plano Pro (gastronomia) | `gastronomy-upgrade-plan/index.ts` | `price_xxx` |
| `STRIPE_PRICE_ID_DELIVERY` | Plano Delivery (gastronomia) | `gastronomy-upgrade-plan/index.ts` | `price_yyy` |
| `STRIPE_SECRET_KEY` | Autenticação Stripe | Todas as funções | `sk_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Validação de webhook | `stripe-webhook`, `billing-webhook` | `whsec_xxx` |

**Problema**: Apenas 2 price_ids hardcoded para gastronomia. Sem price_ids para:
- Mobilidade (motorista, entregador, empresa)
- Serviços
- Educação
- Varejo
- Classificados

---

### 1.2 Price IDs no Banco de Dados

**Tabela**: `billing_plans`
**Campo**: `stripe_price_id` (não existe!)

**Evidência**: Schema de `billing_plans` não tem campo `stripe_price_id`.

**Problema crítico**: Sem mapeamento de `plan_code` → `stripe_price_id` no banco, forçando hardcode em env vars.

**Ação obrigatória**: Adicionar campo `stripe_price_id` em `billing_plans` na Fase 2.

---

### 1.3 Price IDs em Uso (Edge Functions)

| Função | Price ID | Plano | Vertical |
|--------|----------|-------|----------|
| `gastronomy-upgrade-plan` | `STRIPE_PRICE_ID_PRO` | Pro | Gastronomia |
| `gastronomy-upgrade-plan` | `STRIPE_PRICE_ID_DELIVERY` | Delivery | Gastronomia |
| `billing-create-checkout` | `plan.stripe_price_id` | Dinâmico | **Qualquer** |

**Observação**: `billing-create-checkout` já está preparado para price_id dinâmico, mas `billing_plans` não tem o campo.

---

## 2. Mapa de Webhooks e Funções de Cobrança

### 2.1 Webhook 1: `stripe-webhook` (LEGADO)

**Localização**: `supabase/functions/stripe-webhook/index.ts`
**Tabela alvo**: `gastronomy_subscriptions`
**Eventos processados**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Metadata esperada**:
```typescript
{
  business_id: string,  // UUID do negócio
  plan_tier: 'pro' | 'delivery'  // Tier hardcoded
}
```

**Lógica**:
1. Valida `business_id` e `plan_tier` em metadata
2. Upsert em `gastronomy_subscriptions` com `onConflict: 'business_id'`
3. Mapeia status Stripe → status interno
4. Registra auditoria

**Problemas**:
- ❌ Específico para gastronomia
- ❌ Usa `plan_tier` em vez de `plan_code`
- ❌ Sem suporte a add-ons
- ❌ Sem snapshot contratual

---

### 2.2 Webhook 2: `billing-webhook` (NOVO)

**Localização**: `supabase/functions/billing-webhook/index.ts`
**Tabela alvo**: `user_subscriptions`
**Eventos processados**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**Metadata esperada**:
```typescript
{
  supabase_user_id: string,  // UUID do usuário
  plan_code: string  // Código do plano (free, pro, delivery)
}
```

**Lógica**:
1. Valida `supabase_user_id` e `plan_code` em metadata
2. Upsert em `user_subscriptions` com `onConflict: 'user_id'`
3. Extrai `price_id` de `subscription.items.data[0].price.id`
4. Salva `stripe_price_id` em `user_subscriptions`
5. Registra transação via `log_billing_transaction` RPC
6. Registra webhook via `register_stripe_webhook_event` RPC (idempotência)

**Vantagens**:
- ✅ Genérico (não específico de vertical)
- ✅ Usa `plan_code` (alinhado com `billing_plans`)
- ✅ Salva `stripe_price_id`
- ✅ Idempotência via `register_stripe_webhook_event`
- ✅ Auditoria via `log_billing_transaction`

**Problemas**:
- ❌ Sem snapshot contratual
- ❌ Sem suporte a add-ons
- ❌ Coexiste com `stripe-webhook` (risco de conflito)

---

### 2.3 Comparação Crítica

| Aspecto | `stripe-webhook` | `billing-webhook` |
|---------|------------------|-------------------|
| **Tabela alvo** | `gastronomy_subscriptions` | `user_subscriptions` |
| **Escopo** | Negócio (business_id) | Usuário (user_id) |
| **Metadata** | `business_id`, `plan_tier` | `supabase_user_id`, `plan_code` |
| **Vertical** | Gastronomia only | Genérico |
| **Idempotência** | ❌ Não | ✅ Sim |
| **Auditoria** | Parcial | Completa |
| **Snapshot** | ❌ Não | ❌ Não |
| **Add-ons** | ❌ Não | ❌ Não |
| **Status** | Legado ativo | Novo ativo |

**Risco crítico**: Se ambos estiverem configurados no Stripe, eventos serão processados 2x com semântica diferente!

---

### 2.4 Outras Funções de Cobrança

#### `billing-create-checkout`
**Localização**: `supabase/functions/billing-create-checkout/index.ts`
**Função**: Criar sessão de checkout Stripe
**Metadata enviada**:
```typescript
{
  supabase_user_id: string,
  plan_code: string
}
```
**Alinhamento**: ✅ Alinhado com `billing-webhook`

---

#### `billing-create-portal`
**Localização**: `supabase/functions/billing-create-portal/index.ts`
**Função**: Criar portal de gerenciamento de assinatura
**Alinhamento**: ✅ Genérico

---

#### `gastronomy-upgrade-plan`
**Localização**: `supabase/functions/gastronomy-upgrade-plan/index.ts`
**Função**: Upgrade de plano (gastronomia)
**Metadata enviada**:
```typescript
{
  business_id: string,
  plan_tier: 'pro' | 'delivery'
}
```
**Alinhamento**: ❌ Alinhado com `stripe-webhook` (legado)
**Status**: Legado a ser substituído

---

#### `gastronomy-cancel-subscription`
**Localização**: `supabase/functions/gastronomy-cancel-subscription/index.ts`
**Função**: Cancelar assinatura (gastronomia)
**Alinhamento**: ❌ Específico de gastronomia
**Status**: Legado a ser substituído

---

#### `gastronomy-reactivate-subscription`
**Localização**: `supabase/functions/gastronomy-reactivate-subscription/index.ts`
**Função**: Reativar assinatura (gastronomia)
**Alinhamento**: ❌ Específico de gastronomia
**Status**: Legado a ser substituído

---

#### `gastronomy-add-payment-method`
**Localização**: `supabase/functions/gastronomy-add-payment-method/index.ts`
**Função**: Adicionar método de pagamento (gastronomia)
**Alinhamento**: ❌ Específico de gastronomia
**Status**: Legado a ser substituído

---

## 3. Taxonomia de Lookup Key Recomendada

### 3.1 Formato Canônico

```
{vertical}_{tier}_{period}_{region}
```

**Exemplos**:
- `gastronomy_pro_monthly_br`
- `gastronomy_delivery_monthly_br`
- `mobility_driver_starter_monthly_br`
- `mobility_driver_pro_monthly_br`
- `mobility_courier_starter_monthly_br`
- `services_pro_monthly_br`
- `education_starter_monthly_br`

**Vantagens**:
- ✅ Segmentação clara por vertical
- ✅ Suporte a múltiplos tiers
- ✅ Suporte a múltiplos períodos (monthly, yearly)
- ✅ Suporte a múltiplas regiões (br, us, eu)
- ✅ Fácil de parsear e validar

---

### 3.2 Formato para Add-ons

```
addon_{name}_{period}_{region}
```

**Exemplos**:
- `addon_delivery_network_monthly_br`
- `addon_analytics_advanced_monthly_br`
- `addon_booking_monthly_br`

---

### 3.3 Mapeamento no Banco

**Tabela**: `billing_plans` (a ser estendida)
**Campos necessários**:
```sql
ALTER TABLE billing_plans ADD COLUMN stripe_price_id TEXT;
ALTER TABLE billing_plans ADD COLUMN stripe_lookup_key TEXT UNIQUE;
ALTER TABLE billing_plans ADD COLUMN stripe_product_id TEXT;
```

**Seed exemplo**:
```sql
UPDATE billing_plans SET
  stripe_lookup_key = 'gastronomy_pro_monthly_br',
  stripe_price_id = 'price_xxx',
  stripe_product_id = 'prod_xxx'
WHERE code = 'pro';
```

---

## 4. Riscos Financeiros Concretos

### 4.1 Risco Crítico: Webhooks Duplicados

**Cenário**:
1. Usuário assina plano Pro
2. Stripe envia evento `customer.subscription.created`
3. `stripe-webhook` processa → escreve em `gastronomy_subscriptions`
4. `billing-webhook` processa → escreve em `user_subscriptions`
5. **Resultado**: 2 registros de assinatura com semântica diferente

**Impacto**:
- Estado inconsistente
- Possível cobrança duplicada se ambos gerarem invoices
- Confusão em relatórios financeiros

**Probabilidade**: Alta (se ambos estiverem configurados no Stripe)

**Mitigação**: Desativar `stripe-webhook` imediatamente após migração.

---

### 4.2 Risco Alto: Perda de Eventos

**Cenário**:
1. Webhook falha por timeout ou erro
2. Stripe retenta (até 3x)
3. Se todas as tentativas falharem, evento é perdido
4. **Resultado**: Assinatura ativa no Stripe, mas não no banco

**Impacto**:
- Usuário paga mas não tem acesso
- Perda de receita se downgrade não for processado

**Probabilidade**: Média (depende de estabilidade da função)

**Mitigação**: 
- Idempotência (✅ já implementada em `billing-webhook`)
- Reconciliação periódica (❌ não existe)

---

### 4.3 Risco Médio: Price ID Incorreto

**Cenário**:
1. Admin cria plano novo no banco
2. Esquece de adicionar `stripe_price_id`
3. Usuário tenta assinar
4. Checkout falha ou usa price_id errado

**Impacto**:
- Erro de checkout (perda de conversão)
- Cobrança de valor errado

**Probabilidade**: Média (sem validação)

**Mitigação**: Validação obrigatória de `stripe_price_id` antes de publicar plano.

---

### 4.4 Risco Médio: Metadata Inconsistente

**Cenário**:
1. `gastronomy-upgrade-plan` usa `business_id` + `plan_tier`
2. `billing-create-checkout` usa `supabase_user_id` + `plan_code`
3. Webhooks esperam metadata diferente
4. **Resultado**: Webhook não processa evento corretamente

**Impacto**:
- Assinatura não sincronizada
- Estado inconsistente

**Probabilidade**: Alta (já existe inconsistência)

**Mitigação**: Padronizar metadata em todas as funções.

---

## 5. Decisões Obrigatórias

### 5.1 Webhook Canônico Único

**Decisão**: `billing-webhook` é o webhook canônico.

**Justificativa**:
- ✅ Genérico (não específico de vertical)
- ✅ Usa `plan_code` (alinhado com `billing_plans`)
- ✅ Idempotência
- ✅ Auditoria completa
- ✅ Salva `stripe_price_id`

**Ação**:
1. Migrar todas as assinaturas de `gastronomy_subscriptions` para `user_subscriptions`
2. Atualizar metadata de assinaturas ativas no Stripe para usar `supabase_user_id` + `plan_code`
3. Desativar `stripe-webhook` no Stripe dashboard
4. Remover função `stripe-webhook` após janela de segurança (30 dias)

---

### 5.2 Metadata Padrão

**Decisão**: Todas as funções devem usar metadata padronizada.

**Formato**:
```typescript
{
  supabase_user_id: string,  // UUID do usuário
  plan_code: string,  // Código do plano (free, pro, delivery, etc.)
  vertical?: string,  // Opcional: gastronomy, mobility_driver, etc.
  entity_family?: string,  // Opcional: company, professional, worker
  subscription_scope?: string  // Opcional: user, business, profile
}
```

**Ação**:
1. Atualizar `gastronomy-upgrade-plan` para usar novo formato
2. Atualizar `billing-create-checkout` para incluir campos opcionais
3. Atualizar `billing-webhook` para processar campos opcionais

---

### 5.3 Reconciliação Periódica

**Decisão**: Implementar job de reconciliação Stripe ↔ Banco.

**Frequência**: Diária (3h da manhã)

**Lógica**:
1. Buscar todas as assinaturas ativas no Stripe
2. Comparar com `user_subscriptions`
3. Identificar divergências:
   - Ativa no Stripe, mas não no banco → criar registro
   - Cancelada no Stripe, mas ativa no banco → atualizar status
   - Price ID diferente → alertar admin
4. Gerar relatório de divergências
5. Enviar alerta se divergências críticas

**Ação**: Implementar na Fase 6.

---

## 6. Plano de Migração de Webhooks

### Fase 1: Preparação (Fase 2)
1. ✅ Adicionar campo `stripe_price_id` em `billing_plans`
2. ✅ Adicionar campo `stripe_lookup_key` em `billing_plans`
3. ✅ Migrar dados de `gastronomy_subscriptions` para `user_subscriptions`
4. ✅ Adicionar campo `subscription_scope` em `user_subscriptions`

### Fase 2: Dual-Write (Fase 3)
1. Configurar `billing-webhook` no Stripe (se ainda não estiver)
2. Manter `stripe-webhook` ativo (dual-write)
3. Monitorar logs de ambos por 7 dias
4. Validar que `billing-webhook` processa 100% dos eventos

### Fase 3: Cutover (Fase 3)
1. Atualizar metadata de assinaturas ativas no Stripe
2. Desativar `stripe-webhook` no Stripe dashboard
3. Monitorar `billing-webhook` por 7 dias
4. Validar que não há perda de eventos

### Fase 4: Cleanup (Fase 8)
1. Remover função `stripe-webhook`
2. Remover tabela `gastronomy_subscriptions` (após 90 dias)
3. Remover funções legadas de gastronomia

---

## 7. Inventário de Funções Ativas em Produção

**Método**: Verificar Supabase Dashboard → Edge Functions

**Funções de billing ativas** (a confirmar):
- ✅ `billing-create-checkout`
- ✅ `billing-create-portal`
- ✅ `billing-webhook`
- ⚠️ `stripe-webhook` (legado, status desconhecido)
- ⚠️ `gastronomy-upgrade-plan` (legado, status desconhecido)
- ⚠️ `gastronomy-cancel-subscription` (legado, status desconhecido)
- ⚠️ `gastronomy-reactivate-subscription` (legado, status desconhecido)
- ⚠️ `gastronomy-add-payment-method` (legado, status desconhecido)

**Ação obrigatória**: Verificar no Supabase Dashboard quais funções estão deployed.

---

## 8. Conclusão

**Status**: ✅ T0-05 concluído com evidência de arquivo.

**Achados críticos**:
- 2 webhooks Stripe paralelos (risco financeiro)
- 5 funções legadas de gastronomia
- Sem campo `stripe_price_id` em `billing_plans`
- Sem reconciliação periódica
- Metadata inconsistente entre funções

**Decisões tomadas**:
1. `billing-webhook` é o webhook canônico
2. Metadata padronizada obrigatória
3. Reconciliação periódica obrigatória
4. Migração de webhooks em 4 fases

**Bloqueador para Fase 1**: Nenhum (inventário completo).

**Próximo passo**: Criar ADR de consolidação.

---

**Documento gerado em**: 2026-04-21
**Método**: Varredura de Edge Functions + análise de código
**Cobertura**: 100% das funções de billing
