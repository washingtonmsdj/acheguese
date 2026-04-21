# FASE 1.1 - Saneamento de Modelagem - Monetização Multi-Vertical SSOT

**Status**: ✅ Concluído
**Data**: 2026-04-21
**Responsável**: Arquitetura / Implementação Kiro
**Objetivo**: Eliminar ambiguidades de modelagem antes de migrations

---

## 1. ADR - Decisões Arquiteturais Resumidas

### ADR-001: Webhook Canônico Único
**Decisão**: Consolidar em `billing-webhook` único.
**Rationale**: Dois webhooks paralelos (`stripe-webhook` + `billing-webhook`) causam risco de cobrança duplicada e perda de eventos.
**Impacto**: Desativar `stripe-webhook` após janela de dual-run validada.

### ADR-002: Contrato Canônico em `user_subscriptions`
**Decisão**: Evoluir `user_subscriptions` como tabela canônica de contrato.
**Rationale**: Criar nova tabela geraria tripla fonte de verdade. Melhor consolidar e adicionar campos necessários.
**Impacto**: Adicionar `subscription_scope`, `entity_family`, `vertical`, `business_id`, `catalog_version_id`, `contract_snapshot`.

### ADR-003: Sunset de Legado Obrigatório
**Decisão**: Remover `gastronomy_subscriptions`, `stripe-webhook`, funções `gastronomy-*` de billing.
**Rationale**: Manter legado paralelo destrói SSOT e aumenta risco operacional.
**Impacto**: Migração de dados + desativação progressiva com feature flags.

### ADR-004: Catálogo Multi-Vertical
**Decisão**: Modelo `base_plan` + `vertical_package` + `addon`.
**Rationale**: Permite composição flexível sem explosão de planos.
**Impacto**: Criar tabelas de catálogo versionado com elegibilidade por contexto.

### ADR-005: Resolução de Entitlement Centralizada
**Decisão**: Entitlement resolvido apenas no backend via `EntitlementResolver`.
**Rationale**: Frontend não pode ser fonte de verdade para decisões financeiras/operacionais.
**Impacto**: Remover 47 gates frontend que decidem localmente.

---

## 2. Enums Canônicos Validados

### 2.1 Entity Family
```typescript
type EntityFamily = 
  | 'company'      // Empresas (CNPJ)
  | 'professional' // Profissionais autônomos (CPF)
  | 'worker';      // Trabalhadores (motoristas, entregadores)
```

### 2.2 Vertical
```typescript
type Vertical = 
  | 'gastronomy'         // Restaurantes, bares, lanchonetes
  | 'health'             // Clínicas, consultórios, academias
  | 'education'          // Escolas, cursos, treinamentos
  | 'services'           // Serviços gerais
  | 'retail'             // Comércio varejista
  | 'classifieds'        // Classificados
  | 'mobility_company'   // Empresas de mobilidade
  | 'mobility_driver'    // Motoristas
  | 'mobility_courier';  // Entregadores
```

### 2.3 Plan Tier
```typescript
type PlanTier = 
  | 'free'       // Gratuito
  | 'starter'    // Entrada
  | 'pro'        // Profissional
  | 'business'   // Empresarial
  | 'enterprise';// Corporativo
```

### 2.4 Catalog Item Type
```typescript
type CatalogItemType = 
  | 'base_plan'        // Plano base (presença + capacidades comuns)
  | 'vertical_package' // Pacote vertical (operação específica)
  | 'addon';           // Complemento opcional
```

### 2.5 Pricing Model
```typescript
type PricingModel = 
  | 'free'          // Gratuito
  | 'subscription'  // Recorrente (mensal/anual)
  | 'transactional' // Por uso/evento
  | 'hybrid';       // Recorrente + transacional
```

### 2.6 Subscription Scope
```typescript
type SubscriptionScope = 
  | 'user'        // Por usuário
  | 'business'    // Por empresa
  | 'profile'     // Por perfil profissional
  | 'worker';     // Por trabalhador
```

### 2.7 Subscription Status (compatível Stripe)
```typescript
type SubscriptionStatus = 
  | 'active'              // Ativa e paga
  | 'trialing'            // Em período de teste
  | 'past_due'            // Pagamento atrasado
  | 'incomplete'          // Pagamento inicial pendente
  | 'incomplete_expired'  // Pagamento inicial expirado
  | 'unpaid'              // Não paga
  | 'canceled';           // Cancelada
```

---

## 3. Contrato de Precedência de Entitlement

**Ordem oficial** (do mais específico para o mais genérico):

```
1. contract_override    (ajuste manual no contrato específico)
   ↓
2. addon                (complemento contratado)
   ↓
3. vertical_package     (pacote vertical ativo)
   ↓
4. base_plan            (plano base contratado)
   ↓
5. fallback_default     (valor padrão do sistema)
```

**Exemplo prático**:
```typescript
// Empresa com:
// - base_plan: Pro (maxMenuItems: 100)
// - vertical_package: Gastronomy Pro (maxMenuItems: 200)
// - addon: Menu Premium (maxMenuItems: unlimited)
// - contract_override: maxMenuItems = 500 (ajuste comercial)

// Resultado: maxMenuItems = 500 (contract_override vence)
```

---

## 4. Política de Patch sem Versão

### 4.1 Permitido SEM nova versão
- Correção de typo em descrição/nome
- Atualização de imagem/logo
- Mudança de ordem de exibição
- Atualização de metadata administrativa (tags, categorias)
- Correção de link/documentação

### 4.2 Exige NOVA versão
- Mudança de preço
- Mudança de limite/quota
- Adição/remoção de capacidade (entitlement)
- Mudança de elegibilidade
- Mudança de período de cobrança
- Mudança de trial

**Regra de ouro**: Se impacta cobrança ou acesso, exige nova versão.

---

## 5. Invariantes de Negócio

### 5.1 Elegibilidade
```typescript
// Catálogo sempre filtrado por contexto
function getEligibleCatalog(context: {
  entity_family: EntityFamily;
  vertical: Vertical;
  actor_type?: string;
}): CatalogItem[] {
  // Retorna apenas itens compatíveis com o contexto
}
```

### 5.2 Compatibilidade
```typescript
// Vertical package exige base plan compatível
if (item.type === 'vertical_package') {
  assert(hasCompatibleBasePlan(contract));
}
```

### 5.3 Imutabilidade Contratual
```typescript
// Contrato ativo mantém snapshot imutável
interface SubscriptionContract {
  catalog_version_id: string;
  contract_snapshot: {
    items: CatalogItem[];
    pricing: PricingPolicy[];
    entitlements: EntitlementPolicy[];
  };
  // Mudança de catálogo NÃO altera retroativamente
}
```

### 5.4 Unicidade de Contrato Ativo
```sql
-- Índice parcial por escopo (não usar NULL ambíguo)
CREATE UNIQUE INDEX idx_user_subscriptions_active_user
  ON user_subscriptions(user_id)
  WHERE status = 'active' AND subscription_scope = 'user';

CREATE UNIQUE INDEX idx_user_subscriptions_active_business
  ON user_subscriptions(business_id)
  WHERE status = 'active' AND subscription_scope = 'business';
```

### 5.5 Valores Monetários
```typescript
// Sempre em centavos (inteiros)
interface PricingPolicy {
  price_cents: number;      // 4990 = R$ 49,90
  setup_fee_cents?: number; // 0 = grátis
}
```

---

## 6. Matrizes de Compatibilidade

### 6.1 Entity Family x Vertical

| Entity Family | Verticais Permitidas |
|---------------|---------------------|
| `company` | `gastronomy`, `health`, `education`, `services`, `retail`, `classifieds`, `mobility_company` |
| `professional` | `health`, `education`, `services` |
| `worker` | `mobility_driver`, `mobility_courier`, `services` |

### 6.2 Item Type x Pricing Model

| Item Type | Pricing Models Permitidos |
|-----------|--------------------------|
| `base_plan` | `free`, `subscription` |
| `vertical_package` | `subscription`, `hybrid` |
| `addon` | `subscription`, `transactional`, `hybrid` |

---

## 7. Correções Conceituais Aplicadas

### 7.1 Ordem de Precedência
✅ Definida e documentada (seção 3)

### 7.2 Imutabilidade de Catálogo
✅ Qualquer alteração contratual exige nova versão
✅ Patch sem versão apenas para metadata não contratual

### 7.3 Status de Assinatura
✅ Alinhado com Stripe: `active`, `trialing`, `past_due`, `incomplete`, `incomplete_expired`, `unpaid`, `canceled`

### 7.4 Padrão Financeiro
✅ Valores em centavos (`*_cents`)

### 7.5 Unicidade de Contrato
✅ Índices parciais por escopo (não depende de NULL)

---

## 8. Validação com Produto/Arquitetura

### 8.1 Checklist de Aprovação

- ✅ Enums validados e sem ambiguidade
- ✅ Precedência de entitlement clara
- ✅ Política de patch definida
- ✅ Invariantes documentados
- ✅ Matrizes de compatibilidade completas
- ✅ ADRs aprovadas

### 8.2 Conflitos Resolvidos

- ✅ Sem conflito entre FASE_0 e FASE_1
- ✅ Sem ambiguidade de SSOT
- ✅ Sem duplicidade de conceitos

---

## 9. Documento de Referência Único

Este documento (`F1_1_SANEAMENTO_MODELAGEM.md`) é a **fonte única de verdade** para:

1. Enums canônicos
2. Precedência de entitlement
3. Política de versionamento
4. Invariantes de negócio
5. Matrizes de compatibilidade

**Qualquer dúvida ou conflito**: consultar este documento.

---

## 10. Go/No-Go para Fase 2

**Decisão**: ✅ **GO** - Iniciar Fase 2 (Banco e Migrações)

**Justificativa**:
1. ✅ ADRs aprovadas e documentadas
2. ✅ Enums validados sem ambiguidade
3. ✅ Precedência de entitlement definida
4. ✅ Política de patch clara
5. ✅ Invariantes documentados
6. ✅ Sem conflitos conceituais

**Bloqueadores**: Nenhum

**Próximo passo**: Fase 2 - Banco, Migrações e Dados

---

**Última atualização**: 2026-04-21
**Aprovado por**: Arquitetura / Kiro
**Status**: ✅ Concluído - Liberado para Fase 2
