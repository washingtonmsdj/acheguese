# Checklist de Execução - Eliminação de Hardcodes

**Data Início:** 2026-04-16  
**Prazo:** 4 semanas  
**Status:** 🟡 Aguardando Início

---

## 📊 Progresso Geral

```
Fase 1 (Crítico)    [░░░░░░░░░░] 0%
Fase 2 (Alta)       [░░░░░░░░░░] 0%
Fase 3 (Média)      [░░░░░░░░░░] 0%
Fase 4 (Prevenção)  [░░░░░░░░░░] 0%

TOTAL               [░░░░░░░░░░] 0%
```

---

## 🔴 FASE 1: CRÍTICO (Semana 1)

### 1.1 Billing Plans - Unificação e Migração

#### Backend
- [x] Criar migration `20260416100000_create_billing_plans.sql`
- [ ] Aplicar migration em dev
- [ ] Validar estrutura da tabela
- [ ] Inserir dados seed
- [ ] Testar RLS policies

#### Service Layer
- [x] Criar `src/core/billing/services/BillingPlanService.ts`
- [x] Implementar `getActivePlans()`
- [x] Implementar `getPlanByCode()`
- [x] Implementar `getEntitlements()`
- [x] Adicionar cache
- [x] Testes unitários do service

#### Hooks
- [x] Criar `src/core/billing/hooks/useBillingPlans.ts`
- [x] Implementar `useBillingPlans()`
- [x] Implementar `useBillingPlan(tier)`
- [x] Implementar `usePlanEntitlements(tier)`
- [x] Configurar React Query

#### Migração de Código
- [ ] Atualizar componentes de pricing
- [x] Marcar `src/core/billing/plans.ts` como deprecated
- [x] Marcar `SUBSCRIPTION_PLANS` como deprecated
- [ ] Atualizar imports em todos os arquivos
- [ ] Validar que não há mais referências

#### Testes
- [x] Testes unitários criados
- [ ] Testes de integração
- [ ] Testes E2E de pricing
- [ ] Validar em staging
- [ ] Code review

#### Deploy
- [ ] Deploy em staging
- [ ] Validação funcional
- [ ] Deploy em produção
- [ ] Monitorar métricas

**Status:** [████████░░] 80% Implementado - Aguardando Migration

---

### 1.2 Mocks em Runtime - Eliminação

#### Vagas
- [ ] Criar `src/modules/vagas/services/VagasService.ts`
- [ ] Implementar `getVagasByTerritory()`
- [ ] Implementar `getVagaById()`
- [ ] Atualizar `src/modules/vagas/hooks/useVagas.ts`
- [ ] Remover import de `MOCK_VAGAS`
- [ ] Mover mock para `tests/fixtures/vagas.fixtures.ts`
- [ ] Criar seed script `scripts/seeds/seed-vagas-dev.ts`
- [ ] Testes

#### Jobs
- [ ] Criar `src/modules/jobs/services/JobService.ts`
- [ ] Implementar queries reais
- [ ] Atualizar hooks
- [ ] Remover import de `MOCK_JOBS`
- [ ] Mover mock para fixtures
- [ ] Criar seed script
- [ ] Testes

#### Guide/Tourist Points
- [ ] Validar service existente
- [ ] Remover fallback para mock em `TouristPointsPage.tsx`
- [ ] Implementar empty state adequado
- [ ] Mover mocks para fixtures
- [ ] Testes

#### Lint Rules
- [ ] Implementar regra `no-mock-in-production`
- [ ] Adicionar ao `eslint.config.js`
- [ ] Rodar lint em todo o projeto
- [ ] Corrigir violações
- [ ] Adicionar ao pre-commit hook

**Status:** [ ] Completo

---

### 1.3 Mobility Pricing - Mover para Banco

#### Backend
- [ ] Criar migration `20260416000002_create_mobility_pricing_rules.sql`
- [ ] Aplicar migration em dev
- [ ] Inserir regras seed
- [ ] Validar RLS policies

#### Service Layer
- [ ] Criar `src/modules/mobility/services/MobilityPricingService.ts`
- [ ] Implementar `getRule()`
- [ ] Implementar `getPricingRules()`
- [ ] Implementar `getDispatchRules()`
- [ ] Implementar `calculateRideFare()`
- [ ] Adicionar cache
- [ ] Testes unitários

#### Migração de Código
- [ ] Atualizar `src/modules/mobility/schemas/mobilitySchemas.ts`
- [ ] Criar `validateRidePrice()` dinâmica
- [ ] Atualizar `RideOperationalService.ts`
- [ ] Remover `BUSINESS_RULES` de `constants/index.ts`
- [ ] Manter apenas constantes de UI
- [ ] Atualizar todos os imports

#### Testes
- [ ] Testes de cálculo de preço
- [ ] Testes de validação
- [ ] Testes de multiplicadores
- [ ] Validar em staging

#### Deploy
- [ ] Deploy em staging
- [ ] Validação funcional
- [ ] Deploy em produção
- [ ] Monitorar performance

**Status:** [ ] Completo

---

## 🟡 FASE 2: ALTA (Semana 2)

### 2.1 Coordenadas Geográficas

#### Tourist Points
- [ ] Validar tabela `tourist_points` existente
- [ ] Adicionar campos `address_id` e `location_id`
- [ ] Migrar dados de `salvador-mock.ts`
- [ ] Migrar dados de `touristPointMocks.ts`
- [ ] Remover coordenadas hardcoded
- [ ] Atualizar service para usar address
- [ ] Testes

#### Admin Pontos de Embarque
- [ ] Criar tabela `boarding_points` se não existir
- [ ] Atualizar `AdminPontosEmbarque.tsx`
- [ ] Remover coordenadas default
- [ ] Usar location_id
- [ ] Testes

#### Gastronomy
- [ ] Validar estrutura de endereços
- [ ] Remover coordenadas de mocks
- [ ] Usar address_id
- [ ] Testes

**Status:** [ ] Completo

---

### 2.2 Status e Categorias

#### Criar Tabelas de Enums
- [ ] Criar `order_status_types`
- [ ] Criar `job_categories`
- [ ] Criar `profile_types`
- [ ] Criar `ad_status_types`
- [ ] Inserir dados seed
- [ ] RLS policies

#### Services
- [ ] Criar `OrderStatusService`
- [ ] Criar `JobCategoryService`
- [ ] Criar `ProfileTypeService`
- [ ] Criar `AdStatusService`
- [ ] Testes

#### Migração de Código
- [ ] Atualizar componentes de status
- [ ] Atualizar filtros de categoria
- [ ] Atualizar seletores de tipo
- [ ] Remover hardcodes
- [ ] Testes

**Status:** [ ] Completo

---

### 2.3 Limites Operacionais

#### Separar Limites
- [ ] Identificar limites de negócio
- [ ] Identificar constantes de UI
- [ ] Criar tabela `operational_limits`
- [ ] Migrar limites de negócio
- [ ] Manter constantes de UI no código

#### Service
- [ ] Criar `ConfigService`
- [ ] Implementar `getLimit()`
- [ ] Implementar cache
- [ ] Testes

#### Migração de Código
- [ ] Atualizar validações
- [ ] Atualizar componentes
- [ ] Remover limites hardcoded
- [ ] Testes

**Status:** [ ] Completo

---

## 🟢 FASE 3: MÉDIA (Semana 3)

### 3.1 UUIDs Hardcoded

#### Vagas
- [ ] Remover `LOCATION_PITUBA` hardcoded
- [ ] Buscar locations por slug
- [ ] Atualizar fixtures de teste
- [ ] Testes

#### Tests
- [ ] Validar isolamento de fixtures
- [ ] Garantir IDs de teste não vazam
- [ ] Adicionar validação em produção
- [ ] Testes

**Status:** [ ] Completo

---

### 3.2 Rollout e Feature Flags

#### Service
- [ ] Validar `RolloutService` existente
- [ ] Centralizar lógica de rollout
- [ ] Remover duplicações em scripts
- [ ] Testes

#### Migração de Código
- [ ] Atualizar verificações de rollout
- [ ] Padronizar uso do service
- [ ] Remover hardcodes
- [ ] Testes

**Status:** [ ] Completo

---

## 🛡️ FASE 4: PREVENÇÃO (Semana 4)

### 4.1 Lint Rules

#### Implementação
- [ ] Criar `eslint-plugin-ssot-hardcodes.cjs`
- [ ] Implementar `no-hardcoded-prices`
- [ ] Implementar `no-mock-in-production`
- [ ] Implementar `no-hardcoded-coordinates`
- [ ] Implementar `no-hardcoded-uuids`

#### Configuração
- [ ] Adicionar ao `eslint.config.js`
- [ ] Configurar severidade
- [ ] Rodar lint em todo o projeto
- [ ] Corrigir violações
- [ ] Adicionar ao pre-commit hook
- [ ] Adicionar ao CI/CD

**Status:** [ ] Completo

---

### 4.2 Documentação

#### Atualizar Guias
- [ ] Atualizar `SSOT_PATTERNS.md`
- [ ] Atualizar `QUICK_REFERENCE_SSOT.md`
- [ ] Criar guia de boas práticas
- [ ] Documentar padrões de service
- [ ] Documentar padrões de hooks

#### Exemplos
- [ ] Criar exemplos de código correto
- [ ] Criar exemplos de código incorreto
- [ ] Documentar casos de uso
- [ ] Criar templates

**Status:** [ ] Completo

---

### 4.3 Testes de Conformidade

#### Testes Automatizados
- [ ] Criar `tests/conformance/ssot-compliance.test.ts`
- [ ] Validar que mocks não são importados
- [ ] Validar consistência de dados
- [ ] Validar que services são usados
- [ ] Adicionar ao CI/CD

#### Validação Manual
- [ ] Checklist de code review
- [ ] Validação de PRs
- [ ] Auditoria periódica

**Status:** [ ] Completo

---

## 📊 Métricas de Acompanhamento

### Hardcodes Eliminados

```
Preços e Valores:        [░░░░░░░░░░] 0/45
Coordenadas:             [░░░░░░░░░░] 0/60
UUIDs:                   [░░░░░░░░░░] 0/30
Mocks em Runtime:        [░░░░░░░░░░] 0/15
Status e Categorias:     [░░░░░░░░░░] 0/80
Limites Operacionais:    [░░░░░░░░░░] 0/25
Feature Flags:           [░░░░░░░░░░] 0/7

TOTAL:                   [░░░░░░░░░░] 0/262
```

### Qualidade de Código

- [ ] 0 imports de mocks em produção
- [ ] 0 preços hardcoded
- [ ] 0 coordenadas hardcoded
- [ ] 0 UUIDs hardcoded
- [ ] 0 duplicações de dados
- [ ] Lint rules ativas
- [ ] Testes de conformidade passando

---

## 🎯 Critérios de Aceitação

### Por Fase

#### Fase 1
- [ ] Todos os planos vêm do banco
- [ ] Nenhum mock em runtime
- [ ] Pricing rules no banco
- [ ] Testes passando
- [ ] Deploy em produção

#### Fase 2
- [ ] Coordenadas no banco
- [ ] Status e categorias no banco
- [ ] Limites separados
- [ ] Testes passando
- [ ] Deploy em produção

#### Fase 3
- [ ] UUIDs removidos
- [ ] Rollout centralizado
- [ ] Testes passando
- [ ] Deploy em produção

#### Fase 4
- [ ] Lint rules ativas
- [ ] Documentação atualizada
- [ ] Testes de conformidade
- [ ] Processo de prevenção estabelecido

---

## 📅 Timeline

| Semana | Fase | Início | Fim | Status |
|--------|------|--------|-----|--------|
| 1 | Crítico | 2026-04-16 | 2026-04-22 | 🟡 Pendente |
| 2 | Alta | 2026-04-23 | 2026-04-29 | ⚪ Não Iniciado |
| 3 | Média | 2026-04-30 | 2026-05-06 | ⚪ Não Iniciado |
| 4 | Prevenção | 2026-05-07 | 2026-05-13 | ⚪ Não Iniciado |

---

## 👥 Responsáveis

### Por Fase
- **Fase 1:** Backend Team + Frontend Team
- **Fase 2:** Backend Team + Frontend Team
- **Fase 3:** Frontend Team
- **Fase 4:** DevOps + QA + Docs

### Por Tarefa
- **Migrations:** Backend Team
- **Services:** Backend Team
- **Hooks:** Frontend Team
- **Components:** Frontend Team
- **Lint Rules:** DevOps
- **Testes:** QA Team
- **Documentação:** Tech Writers

---

## 🚨 Riscos e Mitigações

### Riscos Identificados

1. **Quebra de Funcionalidades**
   - Mitigação: Testes extensivos, deploy gradual
   - Status: [ ] Mitigado

2. **Performance**
   - Mitigação: Cache adequado, monitoramento
   - Status: [ ] Mitigado

3. **Dados Inconsistentes**
   - Mitigação: Validação antes de migrar, scripts de reconciliação
   - Status: [ ] Mitigado

4. **Prazo Apertado**
   - Mitigação: Priorização clara, recursos adequados
   - Status: [ ] Mitigado

---

## 📞 Daily Standup

### Perguntas Diárias
1. O que foi feito ontem?
2. O que será feito hoje?
3. Há algum bloqueio?

### Métricas Diárias
- Hardcodes eliminados hoje: __
- Testes adicionados: __
- PRs abertos: __
- PRs merged: __

---

## ✅ Aprovações

### Fase 1
- [ ] Tech Lead
- [ ] Arquiteto
- [ ] Product Owner
- [ ] QA Lead

### Fase 2
- [ ] Tech Lead
- [ ] Arquiteto
- [ ] Product Owner
- [ ] QA Lead

### Fase 3
- [ ] Tech Lead
- [ ] Arquiteto
- [ ] Product Owner
- [ ] QA Lead

### Fase 4
- [ ] Tech Lead
- [ ] Arquiteto
- [ ] Product Owner
- [ ] QA Lead

---

**Última Atualização:** 2026-04-16  
**Próxima Revisão:** Diária durante execução  
**Status Geral:** 🟡 Aguardando Início
