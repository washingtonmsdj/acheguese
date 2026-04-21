# ADR: Consolidação de Monetização Multi-Vertical

**Status**: ✅ Aprovado
**Data**: 2026-04-21
**Decisores**: Arquitetura + Produto + Engenharia
**Contexto**: Fase 0 - Auditoria e Inventário concluída

---

## Contexto

A auditoria da Fase 0 identificou **conflito estrutural de SSOT** no sistema de monetização:

### Problemas Críticos Identificados
1. **Tripla trilha de assinatura**: `user_subscriptions`, `business_subscriptions`, `gastronomy_subscriptions`
2. **Dois webhooks Stripe paralelos**: `stripe-webhook` (legado) e `billing-webhook` (novo)
3. **Cinco funções legadas** específicas de gastronomia
4. **Três serviços de assinatura** com semântica diferente
5. **Sem snapshot contratual** imutável
6. **Sem versionamento** de catálogo comercial

### Impacto
- **Risco financeiro**: Cobrança duplicada, estado inconsistente
- **Bloqueio de expansão**: Impossível adicionar novas verticais
- **Dívida técnica**: Manutenção de 3 sistemas paralelos

---

## Decisão 1: Webhook Canônico Único

### Opções Consideradas

#### Opção A: Manter `stripe-webhook` (legado)
**Prós**:
- Já está em produção
- Testado em gastronomia

**Contras**:
- ❌ Específico de gastronomia
- ❌ Usa `plan_tier` em vez de `plan_code`
- ❌ Sem idempotência
- ❌ Sem auditoria completa
- ❌ Escreve em `gastronomy_subscriptions` (legado)

#### Opção B: Manter `billing-webhook` (novo)
**Prós**:
- ✅ Genérico (não específico de vertical)
- ✅ Usa `plan_code` (alinhado com `billing_plans`)
- ✅ Idempotência via `register_stripe_webhook_event`
- ✅ Auditoria completa via `log_billing_transaction`
- ✅ Salva `stripe_price_id`
- ✅ Escreve em `user_subscriptions` (canônico)

**Contras**:
- Mais novo (menos testado)

#### Opção C: Criar webhook novo unificado
**Prós**:
- Limpo, sem legado

**Contras**:
- ❌ Retrabalho desnecessário
- ❌ Atraso na migração
- ❌ `billing-webhook` já atende requisitos

---

### **DECISÃO: Opção B - `billing-webhook` é o webhook canônico**

**Justificativa**:
- Genérico e extensível para múltiplas verticais
- Alinhado com `billing_plans` (usa `plan_code`)
- Idempotência e auditoria completas
- Já implementado e funcional

---

### Estratégia de Transição

#### Fase 1: Preparação (Fase 2 do refactor)
**Prazo**: Semana 1-2
**Ações**:
1. Adicionar campo `stripe_price_id` em `billing_plans`
2. Adicionar campo `stripe_lookup_key` em `billing_plans`
3. Migrar dados de `gastronomy_subscriptions` para `user_subscriptions`
4. Adicionar campo `subscription_scope` em `user_subscriptions`
5. Validar que `billing-webhook` está configurado no Stripe

**Critério de aceite**: Migrations aplicadas, dados migrados sem perda.

---

#### Fase 2: Dual-Write (Fase 3 do refactor)
**Prazo**: Semana 3
**Ações**:
1. Manter ambos webhooks ativos (dual-write)
2. Monitorar logs de ambos por 7 dias
3. Comparar resultados (devem ser idênticos)
4. Validar que `billing-webhook` processa 100% dos eventos

**Critério de aceite**: 
- 0 eventos perdidos
- 0 divergências entre webhooks
- Logs confirmam processamento correto

---

#### Fase 3: Cutover (Fase 3 do refactor)
**Prazo**: Semana 4
**Ações**:
1. Atualizar metadata de assinaturas ativas no Stripe:
   - De: `{ business_id, plan_tier }`
   - Para: `{ supabase_user_id, plan_code, vertical, subscription_scope }`
2. Desativar `stripe-webhook` no Stripe dashboard
3. Monitorar `billing-webhook` por 7 dias
4. Validar que não há perda de eventos

**Critério de aceite**:
- 0 eventos perdidos após desativação
- 0 erros de processamento
- Assinaturas sincronizadas corretamente

**Rollback**: Reativar `stripe-webhook` via Stripe dashboard (< 5 minutos)

---

#### Fase 4: Cleanup (Fase 8 do refactor)
**Prazo**: Após 90 dias de estabilidade
**Ações**:
1. Remover função `stripe-webhook` do código
2. Remover tabela `gastronomy_subscriptions` (após backup)
3. Remover funções legadas:
   - `gastronomy-upgrade-plan`
   - `gastronomy-cancel-subscription`
   - `gastronomy-reactivate-subscription`
   - `gastronomy-add-payment-method`

**Critério de aceite**: Código limpo, sem legado.

---

### Validação e Rollback

**Validação contínua**:
- Dashboard de monitoramento de webhooks
- Alertas de divergência Stripe ↔ Banco
- Reconciliação diária automática

**Rollback**:
- **Fase 2**: Sem impacto (dual-write)
- **Fase 3**: Reativar `stripe-webhook` via Stripe dashboard
- **Fase 4**: Restaurar função de backup

**Janela de rollback**: 30 dias após cada fase.

---

## Decisão 2: Contrato Canônico de Assinatura

### Opções Consideradas

#### Opção A: `user_subscriptions` como canônico
**Prós**:
- ✅ Já tem mais referências (10 vs 9)
- ✅ Alinhado com `billing-webhook`
- ✅ Escopo de usuário (mais genérico)

**Contras**:
- ❌ Sem campo `subscription_scope` explícito
- ❌ Sem snapshot contratual
- ❌ Sem suporte a add-ons

#### Opção B: `business_subscriptions` como canônico
**Prós**:
- ✅ Escopo de negócio explícito
- ✅ Já usado em mobilidade

**Contras**:
- ❌ Menos referências (9 vs 10)
- ❌ Não alinhado com `billing-webhook`
- ❌ Sem snapshot contratual
- ❌ Sem suporte a add-ons

#### Opção C: Criar `subscriptions` novo unificado
**Prós**:
- ✅ Limpo, sem legado
- ✅ Pode incluir todos os campos necessários desde o início
- ✅ Suporte a snapshot, add-ons, escopo

**Contras**:
- ❌ Migração mais complexa
- ❌ Requer atualizar todas as referências (19 arquivos)
- ❌ Risco de quebrar contratos ativos

---

### **DECISÃO: Opção A - Evoluir `user_subscriptions` como canônico**

**Justificativa**:
- Já alinhado com `billing-webhook` (webhook canônico)
- Menos risco de quebrar contratos ativos
- Migração incremental possível
- Pode ser estendido com campos necessários

---

### Estratégia de Evolução

#### Fase 1: Estender Schema (Fase 2 do refactor)
**Ações**:
1. Adicionar campos em `user_subscriptions`:
```sql
ALTER TABLE user_subscriptions ADD COLUMN subscription_scope TEXT DEFAULT 'user';
ALTER TABLE user_subscriptions ADD COLUMN vertical TEXT;
ALTER TABLE user_subscriptions ADD COLUMN entity_family TEXT;
ALTER TABLE user_subscriptions ADD COLUMN business_id UUID REFERENCES business_data(id);
ALTER TABLE user_subscriptions ADD COLUMN contract_snapshot JSONB;
ALTER TABLE user_subscriptions ADD COLUMN catalog_version_id UUID;
```

2. Criar tabela `subscription_addons`:
```sql
CREATE TABLE subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  addon_code TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at TIMESTAMPTZ,
  stripe_subscription_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

3. Criar tabela `subscription_history`:
```sql
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'reactivated'
  old_plan_code TEXT,
  new_plan_code TEXT,
  old_snapshot JSONB,
  new_snapshot JSONB,
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Critério de aceite**: Schema estendido sem quebrar queries existentes.

---

#### Fase 2: Migrar Dados (Fase 2 do refactor)
**Ações**:
1. Migrar `business_subscriptions` → `user_subscriptions`:
```sql
INSERT INTO user_subscriptions (
  user_id, plan_code, status, subscription_scope, business_id,
  current_period_start, current_period_end, stripe_subscription_id, stripe_customer_id
)
SELECT 
  bd.owner_id, bs.plan_tier, bs.status, 'business', bs.business_id,
  bs.current_period_start, bs.current_period_end, bs.stripe_subscription_id, bs.stripe_customer_id
FROM business_subscriptions bs
JOIN business_data bd ON bd.id = bs.business_id
WHERE bs.business_id NOT IN (
  SELECT business_id FROM user_subscriptions WHERE business_id IS NOT NULL
);
```

2. Migrar `gastronomy_subscriptions` → `user_subscriptions`:
```sql
INSERT INTO user_subscriptions (
  user_id, plan_code, status, subscription_scope, business_id, vertical,
  current_period_start, current_period_end, stripe_subscription_id, stripe_customer_id
)
SELECT 
  bd.owner_id, gs.plan_tier, gs.status, 'business', gs.business_id, 'gastronomy',
  gs.current_period_start, gs.current_period_end, gs.stripe_subscription_id, gs.stripe_customer_id
FROM gastronomy_subscriptions gs
JOIN business_data bd ON bd.id = gs.business_id
WHERE gs.business_id NOT IN (
  SELECT business_id FROM user_subscriptions WHERE business_id IS NOT NULL
);
```

**Critério de aceite**: 
- 0 registros perdidos
- Reconciliação confirma migração completa
- Queries antigas continuam funcionando

---

#### Fase 3: Atualizar Serviços (Fase 3 do refactor)
**Ações**:
1. Consolidar `SubscriptionService`:
   - Remover `src/core/billing/SubscriptionService.ts` (business)
   - Remover `src/core/subscription/services/SubscriptionService.ts` (legado)
   - Manter `src/core/billing/services/SubscriptionService.ts` (canônico)
2. Atualizar queries para usar `user_subscriptions` com filtro por `subscription_scope`
3. Adicionar lógica de snapshot contratual em criação/upgrade

**Critério de aceite**: 
- 1 serviço canônico
- 0 queries diretas fora do serviço
- Snapshot criado em toda mudança de plano

---

#### Fase 4: Deprecar Tabelas Legadas (Fase 8 do refactor)
**Ações**:
1. Marcar `business_subscriptions` como deprecated
2. Marcar `gastronomy_subscriptions` como deprecated
3. Após 90 dias de estabilidade, remover tabelas

**Critério de aceite**: Código não referencia tabelas legadas.

---

### Definição de Subscription Scope

| Scope | Descrição | Exemplo |
|-------|-----------|---------|
| `user` | Assinatura pessoal do usuário | Plano Pro para perfil pessoal |
| `business` | Assinatura de negócio | Plano Delivery para restaurante |
| `profile` | Assinatura de perfil profissional | Plano Pro para prestador de serviços |
| `worker` | Assinatura de trabalhador | Plano Starter para motorista |

**Regra**: Um usuário pode ter múltiplas assinaturas (uma por scope/contexto).

---

## Decisão 3: Plano de Sunset Legado

### Tabelas a Deprecar

| Tabela | Status Atual | Ação | Prazo |
|--------|--------------|------|-------|
| `subscription_plans` | Duplicada sem uso | Remover | Fase 2 (imediato) |
| `gastronomy_subscriptions` | Legado ativo | Migrar → Deprecar → Remover | Fase 2-8 (90 dias) |
| `business_subscriptions` | Ativo paralelo | Migrar → Deprecar → Remover | Fase 2-8 (90 dias) |

---

### Serviços a Deprecar

| Serviço | Status Atual | Ação | Prazo |
|---------|--------------|------|-------|
| `src/core/billing/SubscriptionService.ts` (business) | Ativo | Consolidar | Fase 3 |
| `src/core/subscription/services/SubscriptionService.ts` (legado) | Ativo | Remover | Fase 3 |
| `src/core/billing/plans.ts` (hardcoded) | Deprecated mas usado | Remover | Fase 3 |

---

### Edge Functions a Deprecar

| Função | Status Atual | Ação | Prazo |
|--------|--------------|------|-------|
| `stripe-webhook` | Legado ativo | Desativar → Remover | Fase 3-8 |
| `gastronomy-upgrade-plan` | Legado ativo | Substituir → Remover | Fase 3-8 |
| `gastronomy-cancel-subscription` | Legado ativo | Substituir → Remover | Fase 3-8 |
| `gastronomy-reactivate-subscription` | Legado ativo | Substituir → Remover | Fase 3-8 |
| `gastronomy-add-payment-method` | Legado ativo | Substituir → Remover | Fase 3-8 |

**Substituição**: Criar funções genéricas:
- `subscription-upgrade` (substitui `gastronomy-upgrade-plan`)
- `subscription-cancel` (substitui `gastronomy-cancel-subscription`)
- `subscription-reactivate` (substitui `gastronomy-reactivate-subscription`)
- `payment-method-add` (substitui `gastronomy-add-payment-method`)

---

### Critério Objetivo para Remoção

**Tabelas**:
- ✅ 0 queries diretas no código
- ✅ 0 referências em serviços
- ✅ 90 dias de estabilidade após migração
- ✅ Backup completo realizado

**Serviços**:
- ✅ 0 imports no código
- ✅ Funcionalidade substituída por serviço canônico
- ✅ Testes passando

**Edge Functions**:
- ✅ 0 chamadas em 30 dias (logs)
- ✅ Funcionalidade substituída por função genérica
- ✅ Desativada no Stripe dashboard

---

## Decisão 4: Metadata Stripe Padronizada

### Formato Canônico

Todas as funções de billing devem usar metadata padronizada:

```typescript
{
  // Obrigatórios
  supabase_user_id: string,  // UUID do usuário
  plan_code: string,  // Código do plano (free, pro, delivery, etc.)
  
  // Opcionais (contexto)
  vertical?: string,  // gastronomy, mobility_driver, services, etc.
  entity_family?: string,  // company, professional, worker
  subscription_scope?: string,  // user, business, profile, worker
  business_id?: string,  // UUID do negócio (se scope = business)
  
  // Auditoria
  created_by?: string,  // user_id que criou a assinatura
  created_at?: string,  // ISO timestamp
}
```

---

### Funções a Atualizar

| Função | Metadata Atual | Ação |
|--------|----------------|------|
| `billing-create-checkout` | ✅ Já usa formato correto | Adicionar campos opcionais |
| `billing-webhook` | ✅ Já usa formato correto | Processar campos opcionais |
| `gastronomy-upgrade-plan` | ❌ Usa `business_id` + `plan_tier` | Atualizar para formato canônico |

---

## Decisão 5: Reconciliação Periódica

### Implementação

**Função**: `billing-reconciliation` (nova)
**Frequência**: Diária (3h da manhã)
**Timeout**: 5 minutos

**Lógica**:
1. Buscar todas as assinaturas ativas no Stripe
2. Buscar todas as assinaturas ativas em `user_subscriptions`
3. Comparar:
   - Ativa no Stripe, mas não no banco → criar registro + alerta
   - Cancelada no Stripe, mas ativa no banco → atualizar status + alerta
   - Price ID diferente → alerta crítico
   - Status diferente → atualizar + alerta
4. Gerar relatório de divergências
5. Enviar email para admin se divergências críticas

**Critério de aceite**:
- Execução diária sem falhas
- Relatório gerado e armazenado
- Alertas enviados para divergências críticas

---

## Resumo das Decisões

| # | Decisão | Justificativa | Prazo |
|---|---------|---------------|-------|
| 1 | `billing-webhook` é webhook canônico | Genérico, idempotente, auditável | Fase 3 |
| 2 | `user_subscriptions` é contrato canônico | Alinhado com webhook, menos risco | Fase 2-3 |
| 3 | Deprecar tabelas/serviços legados | Eliminar dupla verdade | Fase 2-8 |
| 4 | Metadata Stripe padronizada | Consistência entre funções | Fase 3 |
| 5 | Reconciliação periódica obrigatória | Detectar divergências | Fase 6 |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de eventos durante migração | Média | Crítico | Dual-write + monitoramento |
| Quebra de contratos ativos | Baixa | Crítico | Snapshot + validação |
| Downtime durante cutover | Baixa | Alto | Rollback < 5min |
| Divergência Stripe ↔ Banco | Média | Alto | Reconciliação diária |

---

## Critérios de Aceite do ADR

- ✅ Decisão explícita para webhook canônico
- ✅ Decisão explícita para contrato canônico
- ✅ Plano de sunset com prazos objetivos
- ✅ Estratégia de transição segura (dual-write)
- ✅ Rollback definido (< 5 minutos)
- ✅ Reconciliação periódica obrigatória
- ✅ Metadata padronizada
- ✅ Nenhuma recomendação de manter legados paralelos indefinidamente

---

## Aprovação

**Arquitetura**: ✅ Aprovado
**Produto**: ✅ Aprovado
**Engenharia**: ✅ Aprovado
**Operações**: ✅ Aprovado

**Data de aprovação**: 2026-04-21
**Validade**: Permanente (até revisão formal)

---

## Próximos Passos

1. ✅ Concluir Fase 0 (auditoria)
2. ⏳ Iniciar Fase 1 (modelagem conceitual)
3. ⏳ Implementar Fase 2 (banco + migração)
4. ⏳ Implementar Fase 3 (services + cutover webhook)

---

**Documento criado em**: 2026-04-21
**Última atualização**: 2026-04-21
**Status**: Aprovado e vigente
