# Auditoria Sistemática de Hardcodes - Projeto AAA

**Data:** 2026-04-16  
**Objetivo:** Identificar e eliminar todos os hardcodes indevidos seguindo rigorosamente o SSOT

## Metodologia

### Categorias de Hardcodes Críticos (DEVEM ser eliminados)
1. **Valores de Negócio**: preços, comissões, taxas, limites operacionais
2. **Territórios**: IDs de cidades, bairros, coordenadas fixas
3. **Permissões**: roles, capabilities, access levels
4. **Status**: estados de workflow, categorias de entidades
5. **Planos e Billing**: tiers, features, entitlements
6. **Rotas Canônicas**: slugs, paths, URLs de negócio
7. **Rollouts**: feature flags, percentuais de ativação
8. **IDs de Entidades**: UUIDs de registros específicos
9. **Contadores e Limites**: max items, page sizes operacionais
10. **Fallbacks Operacionais**: valores default de negócio
11. **Regras Condicionais**: lógica de negócio embutida

### Categorias Aceitáveis (podem permanecer)
1. **Design Tokens**: cores, espaçamentos, breakpoints
2. **Labels Visuais**: textos puramente de UI sem lógica
3. **Enums Técnicos**: tipos TypeScript, constantes de código
4. **Constantes de UI**: debounce times, animation durations
5. **Configurações de Build**: env vars, flags de desenvolvimento

## Fluxo Correto SSOT
```
Banco de Dados (source of truth)
    ↓
Service Layer (SSOT services)
    ↓
Hooks (React Query)
    ↓
UI Components (presentation only)
```

## Progresso da Auditoria

### Fase 1: Varredura Automatizada ✅
- [x] Buscar IDs hardcoded (UUIDs) - **30+ encontrados**
- [x] Buscar coordenadas geográficas - **60+ encontrados**
- [x] Buscar valores monetários - **45+ encontrados**
- [x] Buscar slugs e rotas - **Incluído em análise manual**
- [x] Buscar status e categorias - **80+ encontrados**
- [x] Buscar limites e contadores - **25+ encontrados**
- [x] Buscar feature flags - **7+ encontrados**

### Fase 2: Análise Manual por Módulo ✅
- [x] src/modules/mobility - **85 violações**
- [x] src/modules/business/gastronomy - **52 violações**
- [x] src/modules/business - **Incluído em billing**
- [x] src/modules/classifieds - **Incluído em análise**
- [x] src/modules/community - **Incluído em análise**
- [x] src/modules/delivery - **Incluído em mobility**
- [x] src/modules/jobs - **18 violações**
- [x] src/modules/vagas - **18 violações**
- [x] src/core (todos os submódulos) - **Analisado**
- [x] src/pages - **Analisado**
- [x] src/shared/components - **Analisado**

### Fase 3: Correções e Migrações 🔄
- [ ] Mover dados para banco - **Planejado**
- [ ] Criar/atualizar services SSOT - **Planejado**
- [ ] Criar/atualizar hooks - **Planejado**
- [ ] Atualizar componentes - **Planejado**
- [ ] Remover duplicidades - **Planejado**
- [ ] Atualizar documentação - **Em andamento**

## Descobertas

### Hardcodes Críticos Encontrados

**Total: 262+ violações**

#### Por Categoria:
1. **Preços e Valores Monetários** - 45+ violações
   - Billing plans duplicados
   - Mobility pricing hardcoded
   - Gastronomy preços em mocks
   - Jobs/Vagas salários hardcoded

2. **Coordenadas Geográficas** - 60+ violações
   - Tourist points com coordenadas hardcoded
   - Admin pontos de embarque
   - Gastronomy endereços mock
   - Guide mocks geográficos

3. **UUIDs de Entidades** - 30+ violações
   - Vagas location IDs hardcoded
   - Tests com IDs que podem vazar
   - Referências a entidades específicas

4. **Mocks em Runtime** - 15+ violações
   - MOCK_VAGAS em produção
   - MOCK_JOBS em produção
   - MOCK_TOURIST_POINTS em produção
   - Fallbacks para mocks

5. **Status e Categorias** - 80+ violações
   - Promotions status hardcoded
   - Profile tipos hardcoded
   - Mobility status hardcoded
   - Services categorias hardcoded

6. **Limites Operacionais** - 25+ violações
   - Pagination limits misturados
   - Mobility timeouts hardcoded
   - Billing limits hardcoded
   - Vagas limits hardcoded

7. **Feature Flags** - 7+ violações
   - Rollout checks hardcoded
   - Module availability hardcoded

### Ações Corretivas Necessárias

#### Prioridade Crítica (Semana 1)
1. **Billing Plans**
   - Criar tabela `billing_plans`
   - Implementar `BillingPlanService`
   - Remover duplicações

2. **Mocks em Runtime**
   - Implementar `VagasService` real
   - Implementar `JobService` real
   - Mover mocks para fixtures

3. **Mobility Pricing**
   - Criar tabela `mobility_pricing_rules`
   - Implementar `MobilityPricingService`
   - Mover validações para backend

#### Prioridade Alta (Semana 2)
4. **Coordenadas Geográficas**
   - Migrar tourist points para banco
   - Usar address_id e location_id
   - Remover coordenadas hardcoded

5. **Status e Categorias**
   - Criar tabelas de enums
   - Implementar services SSOT
   - Remover hardcodes

6. **Limites Operacionais**
   - Separar limites de negócio de UI
   - Mover para configuração do banco
   - Criar ConfigService

#### Prioridade Média (Semana 3)
7. **UUIDs Hardcoded**
   - Remover IDs específicos
   - Usar slugs e queries dinâmicas
   - Isolar fixtures de teste

8. **Rollout e Feature Flags**
   - Criar RolloutService centralizado
   - Remover duplicações
   - Padronizar verificações

#### Prevenção (Semana 4)
9. **Lint Rules**
   - Implementar regras de detecção
   - Adicionar ao pre-commit
   - Validar em CI/CD

10. **Documentação**
    - Atualizar guias
    - Criar exemplos
    - Documentar padrões

---

**Status:** ✅ Auditoria Concluída - Aguardando Execução de Correções

**Documentação Gerada:**
- ✅ Resumo Executivo
- ✅ Relatório Completo
- ✅ Plano de Migração
- ✅ Exemplos de Código
- ✅ README de Navegação
- ✅ Sumário Geral

**Próximo Passo:** Iniciar Fase 1 de Correções (Billing Plans)

