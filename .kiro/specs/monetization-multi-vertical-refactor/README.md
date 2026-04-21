# Refatoração de Monetização Multi-Vertical SSOT

**Projeto**: Correção do Sistema de Billing e Links Curtos
**Status**: Fase 1 e 2 Concluídas ✅
**Data de Início**: 2026-04-21

---

## 📋 Índice de Documentos

### Planejamento e Auditoria

1. **[PLANO_AAA_MONETIZACAO_MULTI_VERTICAL_SSOT.md](../../docs/tasks/PLANO_AAA_MONETIZACAO_MULTI_VERTICAL_SSOT.md)**
   - Plano mestre de refatoração (10 fases)
   - Diagnóstico completo dos problemas
   - Arquitetura alvo proposta

2. **[FASE_0_AUDITORIA.md](./FASE_0_AUDITORIA.md)**
   - Inventário completo de tabelas, services e hooks
   - Mapeamento de hardcodes e acoplamentos
   - 47 gates frontend identificados
   - 2 webhooks Stripe paralelos
   - Matriz de fonte atual vs domínio correto

### Modelagem e Decisões

3. **[FASE_1_MODELAGEM_CONCEITUAL.md](./FASE_1_MODELAGEM_CONCEITUAL.md)**
   - Plano de execução completo (Fase 1 a 9)
   - Decisões arquiteturais binding
   - Backlog operacional do Kiro

4. **[F1_1_SANEAMENTO_MODELAGEM.md](./F1_1_SANEAMENTO_MODELAGEM.md)** ✅
   - 5 ADRs aprovadas
   - Enums canônicos validados
   - Precedência de entitlement oficial
   - Política de versionamento
   - Invariantes de negócio

### Implementação

5. **[F2_MIGRATIONS_E_BACKFILL_REPORT.md](./F2_MIGRATIONS_E_BACKFILL_REPORT.md)** ✅
   - 3 migrations criadas
   - EntitlementResolver implementado
   - useEntitlements hook criado
   - BusinessUrlService atualizado
   - Fluxo corrigido do link curto

6. **[RESUMO_CORRECOES_LINK_CURTO.md](./RESUMO_CORRECOES_LINK_CURTO.md)** ✅
   - Resumo executivo das correções
   - Antes vs Depois
   - Impacto no sistema
   - Próximos passos

### Documentos de Auditoria (Fase 0)

7. **[F0_T0-04_GATES_FRONTEND.md](./F0_T0-04_GATES_FRONTEND.md)**
   - 47 pontos de decisão no frontend
   - Matriz de prioridade (P0/P1/P2)
   - Plano de migração por fase

8. **[F0_T0-05_STRIPE_INVENTARIO.md](./F0_T0-05_STRIPE_INVENTARIO.md)**
   - Inventário de webhooks e price IDs
   - Riscos financeiros concretos
   - Taxonomia de lookup key

9. **[F0_ADR_CONSOLIDACAO_MONETIZACAO.md](./F0_ADR_CONSOLIDACAO_MONETIZACAO.md)**
   - 5 decisões arquiteturais
   - Estratégia de transição segura
   - Plano de sunset com prazos

---

## 🎯 Objetivo do Projeto

Corrigir o sistema de monetização e links curtos seguindo rigorosamente o SSOT, eliminando:

- ❌ Ambiguidade de fonte de verdade (3 tabelas de assinatura)
- ❌ Webhooks duplicados (2 pipelines Stripe)
- ❌ Entitlements hardcoded (`plans.ts`)
- ❌ Decisões de negócio no frontend (47 gates)
- ❌ Link curto baseado em flag isolada

---

## ✅ Progresso por Fase

### Fase 0: Auditoria e Inventário ✅
- [x] Inventário de tabelas (T0-01)
- [x] Inventário de services/hooks (T0-02)
- [x] Hardcodes e acoplamentos (T0-03)
- [x] Gates frontend (T0-04)
- [x] Stripe/integrações (T0-05)
- [x] ADR de consolidação

### Fase 1: Modelagem Conceitual ✅
- [x] Fase 1.1: Saneamento de Modelagem
- [x] 5 ADRs aprovadas
- [x] Enums canônicos definidos
- [x] Precedência de entitlement
- [x] Política de versionamento

### Fase 2: Banco e Migrações ✅
- [x] Migration: Evolução de `user_subscriptions`
- [x] Migration: Sistema de catálogo versionado
- [x] Migration: Seed do catálogo inicial
- [x] Service: EntitlementResolver
- [x] Hook: useEntitlements
- [x] Service: BusinessUrlService (atualizado)

### Fase 3: Migração de Componentes 🔄
- [ ] Migrar gates P0 (8 pontos em GastronomyDashboardPage)
- [ ] Remover uso de PLANS hardcoded (12 pontos)
- [ ] Atualizar AdminBusinessesPage (3 pontos)
- [ ] Migrar MotoboyAuthorizationService (1 ponto)
- [ ] Migrar badges/visual (22 pontos)

### Fase 4: Webhooks ⏳
- [ ] Consolidar stripe-webhook + billing-webhook
- [ ] Dual-run controlado
- [ ] Desativar webhook legado
- [ ] Reconciliação periódica

### Fase 5: Admin Monetization ⏳
- [ ] CRUD de catálogo com governança
- [ ] Workflow de versionamento
- [ ] Visão de impacto em contratos

### Fase 6: Frontend Catálogo ⏳
- [ ] Endpoint de elegibilidade
- [ ] Mensagens de indisponibilidade
- [ ] Testes de cobertura

### Fase 7: SSOT Enforcement ⏳
- [ ] Regras de lint arquitetural
- [ ] Testes de contrato
- [ ] Gates de CI

### Fase 8: Sunset de Legado ⏳
- [ ] Remover gastronomy_subscriptions
- [ ] Remover stripe-webhook
- [ ] Remover funções gastronomy-*

### Fase 9: Validação Final ⏳
- [ ] E2E completo
- [ ] Reconciliação financeira
- [ ] Teste de rollback
- [ ] Documento de operação

---

## 📊 Métricas de Sucesso

### Estrutura de Dados
- ✅ 5 tabelas de catálogo criadas
- ✅ 14 campos novos em `user_subscriptions`
- ✅ 6 índices parciais criados
- ✅ 3 base plans seedados

### Código
- ✅ 1 service de resolução (EntitlementResolver)
- ✅ 3 hooks (useEntitlements + atalhos)
- ✅ 1 service atualizado (BusinessUrlService)
- ✅ 0 gambiarras

### Documentação
- ✅ 9 documentos criados
- ✅ 3 migrations documentadas
- ✅ Comentários SQL completos
- ✅ JSDoc em todos os métodos

---

## 🚀 Como Usar

### Para Desenvolvedores

1. **Consultar entitlements**:
```typescript
import { useEntitlements } from '@/core/billing/hooks/useEntitlements';

function MyComponent({ business_id }) {
  const { hasShortPremiumLink, can, isLoading } = useEntitlements({
    business_id,
    subscription_scope: 'business'
  });
  
  if (hasShortPremiumLink) {
    // Exibir link curto
  }
}
```

2. **Verificar entitlement específico**:
```typescript
const { can } = useEntitlements({ business_id });

if (can('canUseAdvancedMenu')) {
  // Exibir menu avançado
}
```

3. **Gerar URL de compartilhamento**:
```typescript
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { useHasShortPremiumLink } from '@/core/billing/hooks/useEntitlements';

const hasShortLink = useHasShortPremiumLink(business_id);
const shareUrl = BusinessUrlService.getShareUrlByEntitlement(ctx, hasShortLink);
```

### Para Administradores

1. **Criar novo plano**:
   - Inserir em `catalog_item`
   - Definir `catalog_entitlement_policy`
   - Definir `catalog_pricing_policy`
   - Publicar versão do catálogo

2. **Alterar entitlements**:
   - Criar nova versão do catálogo
   - Atualizar políticas
   - Publicar (imutável após publicação)

3. **Ajuste manual de contrato**:
   - Atualizar `contract_snapshot.overrides`
   - Precedência: override > addon > vertical > base

---

## 🔗 Links Úteis

- [Plano Mestre](../../docs/tasks/PLANO_AAA_MONETIZACAO_MULTI_VERTICAL_SSOT.md)
- [Auditoria Completa](./FASE_0_AUDITORIA.md)
- [Modelagem Conceitual](./FASE_1_MODELAGEM_CONCEITUAL.md)
- [Resumo de Correções](./RESUMO_CORRECOES_LINK_CURTO.md)

---

## 📞 Contato

Para dúvidas ou sugestões sobre a refatoração:
- Consultar documentos desta pasta
- Verificar ADRs em `F1_1_SANEAMENTO_MODELAGEM.md`
- Seguir precedência oficial de entitlement

---

**Última atualização**: 2026-04-21
**Próxima revisão**: Após conclusão da Fase 3
**Status**: ✅ Fase 1 e 2 Concluídas - Pronto para Fase 3
