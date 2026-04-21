# Requirements: Monetização Multi-Vertical SSOT

**Feature**: Refatoração arquitetural do sistema de monetização para suportar múltiplas verticais de negócio
**Status**: Fase 0 - Auditoria e Inventário
**Prioridade**: Crítica (bloqueador para expansão multi-vertical)
**Referência**: `docs/tasks/PLANO_AAA_MONETIZACAO_MULTI_VERTICAL_SSOT.md`

---

## 1. Contexto e Problema

### 1.1 Situação Atual
O sistema de monetização está **conceitualmente errado na raiz** porque mistura:
1. Produto comercial (plano)
2. Capacidade técnica (entitlement)
3. Segmentação de mercado (vertical/actor)
4. Mecanismo de cobrança (subscription/transactional)
5. Contexto de UI/admin

**Evidências concretas**:
- Tabela `billing_plans` tem apenas 3 planos globais: `free`, `pro`, `delivery`
- Todos os planos são "gastronomy-centric" (features como "Cardápio", "Pedidos internos")
- Entitlements de mobilidade (`canUseMotoboyNetwork`) estão embutidos no plano Delivery de gastronomia
- Não existe campo `vertical` ou `entity_family` para segmentar planos
- Admin pode editar qualquer campo sem validação de impacto em contratos ativos
- Frontend não filtra catálogo por contexto do usuário

### 1.2 Impactos do Problema
1. **Bloqueio de expansão**: Impossível criar planos para motoristas, entregadores, serviços, educação
2. **Acoplamento indevido**: Mobilidade depende de gastronomia
3. **Risco financeiro**: Erro de entitlement impacta receita e compliance contratual
4. **Explosão de catálogo**: Cada microcategoria viraria um plano separado
5. **Regressão contínua**: Sem separação de domínios, mudanças quebram funcionalidades

### 1.3 Decisão Estratégica
**Não fazer remendos**. A correção correta é separar catálogo comercial, resolução de entitlement e execução de cobrança em domínios independentes, versionados e auditáveis.

---

## 2. Objetivos de Negócio

### 2.1 Objetivos Primários
1. **Suportar múltiplas verticais** com planos específicos:
   - Gastronomia (restaurantes, bares, food trucks)
   - Mobilidade Empresa (frotas, logística)
   - Mobilidade Motorista (autônomos, cooperativas)
   - Mobilidade Entregador (motoboys, couriers)
   - Serviços (profissionais autônomos)
   - Educação (escolas, cursos)
   - Varejo (lojas, e-commerce)
   - Classificados (anúncios)

2. **Permitir composição flexível** de planos:
   - Base Plan (presença digital básica)
   - Vertical Package (recursos específicos da vertical)
   - Add-ons (capacidades opcionais transversais)

3. **Suportar múltiplos modelos de cobrança**:
   - Free (freemium)
   - Subscription (recorrente mensal/anual)
   - Transactional (por uso: pedido, corrida, lead)
   - Hybrid (assinatura + transacional)

### 2.2 Objetivos Secundários
4. Preservar contratos ativos sem alterar termos
5. Permitir versionamento de catálogo comercial
6. Garantir auditoria completa de mudanças
7. Facilitar onboarding comercial de novas verticais
8. Reduzir risco de regressão em billing

---

## 3. Requisitos Funcionais

### RF-01: Catálogo Comercial Multi-Vertical
**Prioridade**: Crítica
**Descrição**: Sistema deve manter catálogo de itens comerciais segmentados por vertical e entity family.

**Critérios de aceite**:
- [ ] Catálogo suporta tipos: `base_plan`, `vertical_package`, `addon`
- [ ] Cada item tem campos: `entity_family`, `vertical`, `actor_type` (opcionais para filtro)
- [ ] Catálogo é versionado com status: `draft`, `published`, `archived`
- [ ] Mudanças em catálogo publicado criam nova versão
- [ ] Query de catálogo filtra por contexto: `getEligibleCatalog(entity_family, vertical, actor_type)`

**Exemplo de uso**:
```typescript
// Motorista autônomo vê apenas planos de mobilidade para worker
const plans = await CatalogService.getEligibleCatalog({
  entity_family: 'worker',
  vertical: 'mobility_driver',
  actor_type: 'autonomous'
});
// Retorna: [Base Free, Mobility Driver Starter, Mobility Driver Pro]
```

---

### RF-02: Resolução de Entitlements
**Prioridade**: Crítica
**Descrição**: Sistema deve resolver entitlements em runtime baseado em assinatura ativa + add-ons + overrides.

**Critérios de aceite**:
- [ ] Entitlements são resolvidos por precedência: base < vertical < addon < override contratual
- [ ] Resolução é centralizada em `EntitlementResolver.resolve(subscriptionContext)`
- [ ] Componentes e hooks NÃO calculam entitlements diretamente
- [ ] Resolução é cacheada com invalidação por mudança de assinatura
- [ ] Auditoria registra decisões de entitlement

**Exemplo de uso**:
```typescript
// Restaurante com plano Pro + addon Delivery Network
const entitlements = await EntitlementResolver.resolve({
  subscription_id: 'sub_123',
  user_id: 'user_456'
});
// Retorna: { canUseAdvancedMenu: true, canUseMotoboyNetwork: true, ... }
```

---

### RF-03: Snapshot Contratual Imutável
**Prioridade**: Crítica
**Descrição**: Contratos de assinatura devem preservar termos no momento da contratação.

**Critérios de aceite**:
- [ ] Ao criar assinatura, sistema salva snapshot de: plano, preço, entitlements, features
- [ ] Mudanças no catálogo NÃO afetam contratos ativos automaticamente
- [ ] Upgrade/downgrade cria novo snapshot com novos termos
- [ ] Histórico de snapshots é preservado para auditoria
- [ ] Cancelamento preserva último snapshot ativo

---

### RF-04: Admin com Governança
**Prioridade**: Alta
**Descrição**: Admin deve editar catálogo com validações e workflow de publicação.

**Critérios de aceite**:
- [ ] Admin tem telas separadas: Base Plans, Vertical Packages, Add-ons
- [ ] Edição de item publicado cria draft de nova versão
- [ ] Publicação valida compatibilidade e impacto em contratos ativos
- [ ] Sistema exibe quantos contratos serão afetados antes de publicar
- [ ] Edições destrutivas são bloqueadas sem estratégia de migração
- [ ] Auditoria registra: autor, timestamp, diff semântico

---

### RF-05: Frontend com Catálogo Elegível
**Prioridade**: Alta
**Descrição**: Frontend deve exibir apenas planos elegíveis para o contexto do usuário.

**Critérios de aceite**:
- [ ] Página de planos consulta `CatalogService.getEligibleCatalog(context)`
- [ ] Composição de plano é explícita: "Base Free + Mobility Driver Pro"
- [ ] Planos inelegíveis mostram motivo: "Disponível apenas para empresas"
- [ ] Checkout valida elegibilidade no backend antes de criar assinatura
- [ ] Sem hardcodes de vertical em componentes

---

### RF-06: Integração de Cobrança Multi-Vertical
**Prioridade**: Alta
**Descrição**: Sistema de cobrança deve suportar múltiplas verticais e modelos de pricing.

**Critérios de aceite**:
- [ ] `lookup_key` segue taxonomia: `{vertical}_{tier}_{period}` (ex: `mobility_driver_pro_monthly`)
- [ ] `price_id` é separado por ambiente: dev, staging, prod
- [ ] Cobrança transacional tem escopo explícito: pedido, corrida, lead
- [ ] Reconciliação periódica compara ledger interno vs Stripe
- [ ] Alertas de divergência financeira

---

## 4. Requisitos Não-Funcionais

### RNF-01: Preservação de Contratos
**Prioridade**: Crítica
**Descrição**: Migração NÃO pode alterar termos de clientes existentes.
**Métrica**: 0 alterações não autorizadas em contratos ativos.

### RNF-02: Zero Downtime
**Prioridade**: Crítica
**Descrição**: Migração deve ocorrer sem interrupção de serviço.
**Métrica**: Disponibilidade > 99.9% durante rollout.

### RNF-03: Auditoria Completa
**Prioridade**: Alta
**Descrição**: Todas as mudanças em catálogo e contratos devem ser auditadas.
**Métrica**: 100% das operações críticas registradas com autor, timestamp, diff.

### RNF-04: Performance de Resolução
**Prioridade**: Média
**Descrição**: Resolução de entitlements deve ser rápida.
**Métrica**: P95 < 100ms, com cache.

### RNF-05: Rollback Seguro
**Prioridade**: Alta
**Descrição**: Sistema deve permitir rollback via feature flag.
**Métrica**: Rollback completo em < 5 minutos.

---

## 5. Modelo Conceitual

### 5.1 Entidades Principais

#### Entity Family
Tipo macro do assinante:
- `company`: Empresas (CNPJ)
- `professional`: Profissionais autônomos (CPF)
- `worker`: Trabalhadores (motoristas, entregadores)

#### Vertical
Contexto comercial operacional:
- `gastronomy`: Restaurantes, bares, food trucks
- `mobility_company`: Frotas, logística
- `mobility_driver`: Motoristas autônomos
- `mobility_courier`: Entregadores, motoboys
- `services`: Serviços profissionais
- `education`: Escolas, cursos
- `retail`: Varejo, e-commerce
- `classifieds`: Anúncios

#### Plan Tier
Nível comercial:
- `free`: Freemium
- `starter`: Entrada paga
- `pro`: Intermediário
- `business`: Avançado
- `enterprise`: Customizado

#### Catalog Item Type
- `base_plan`: Plano base (presença digital)
- `vertical_package`: Pacote específico da vertical
- `addon`: Capacidade opcional transversal

#### Pricing Model
- `free`: Sem cobrança
- `subscription`: Recorrente (mensal/anual)
- `transactional`: Por uso (pedido, corrida, lead)
- `hybrid`: Assinatura + transacional

### 5.2 Regras de Negócio

**RN-01**: Um usuário pode ter múltiplas assinaturas (uma por vertical/contexto)
**RN-02**: Base Plan é obrigatório, Vertical Package é opcional, Add-ons são opcionais
**RN-03**: Entitlements são resolvidos por precedência: base < vertical < addon < override
**RN-04**: Mudança de catálogo publicado requer nova versão
**RN-05**: Snapshot contratual é imutável após criação
**RN-06**: Upgrade/downgrade cria novo snapshot e preserva histórico
**RN-07**: Cancelamento preserva último snapshot para auditoria

---

## 6. Fases de Execução (Resumo)

### Fase 0: Auditoria e Inventário ⬅️ **ATUAL**
**Objetivo**: Mapear estado real e dívida arquitetural
**Duração estimada**: 1-2 semanas
**Bloqueador**: Nenhum
**Entregável**: Inventário completo de tabelas, services, hooks, integrações

### Fase 1: Modelagem Conceitual Formal
**Objetivo**: Fechar dicionário canônico SSOT
**Duração estimada**: 1 semana
**Bloqueador**: Fase 0
**Entregável**: ADR/Spec aprovada com glossário e invariantes

### Fase 2: Banco e Migração de Dados
**Objetivo**: Criar estrutura física alinhada ao modelo
**Duração estimada**: 2-3 semanas
**Bloqueador**: Fase 1
**Entregável**: Migrations idempotentes + dados migrados

### Fase 3: Services, Contratos e Types
**Objetivo**: Centralizar regra de negócio na camada correta
**Duração estimada**: 2-3 semanas
**Bloqueador**: Fase 2
**Entregável**: CatalogService, EntitlementResolver, SubscriptionService

### Fase 4: Admin Monetization
**Objetivo**: Tornar admin editor de catálogo com governança
**Duração estimada**: 2 semanas
**Bloqueador**: Fase 3
**Entregável**: CRUD de catálogo com validações

### Fase 5: Frontend e UX
**Objetivo**: Exibir catálogo correto por contexto
**Duração estimada**: 2 semanas
**Bloqueador**: Fase 3, 4
**Entregável**: Páginas de planos com filtro por contexto

### Fase 6: Integração de Cobrança
**Objetivo**: Alinhar billing provider ao modelo novo
**Duração estimada**: 2-3 semanas
**Bloqueador**: Fase 2, 3
**Entregável**: Stripe integrado com taxonomia correta

### Fase 7: Blindagem SSOT
**Objetivo**: Impedir regressão arquitetural
**Duração estimada**: 1 semana
**Bloqueador**: Fase 3-6
**Entregável**: Lint arquitetural + testes de contrato

### Fase 8: Docs e Limpeza
**Objetivo**: Eliminar duplicidade e código morto
**Duração estimada**: 1 semana
**Bloqueador**: Fase 4-7
**Entregável**: Documentação consolidada + legado removido

### Fase 9: Validação e Rollout
**Objetivo**: Ativar arquitetura nova com risco controlado
**Duração estimada**: 2-3 semanas
**Bloqueador**: Todas anteriores
**Entregável**: Sistema em produção com shadow mode validado

**Duração total estimada**: 16-22 semanas (4-5.5 meses)

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Alterar termos de contratos ativos | Média | Crítico | Snapshot imutável + validação |
| Erro de cobrança (duplicada/faltante) | Média | Crítico | Reconciliação + alertas |
| Quebra de checkout | Baixa | Alto | Validação backend + testes E2E |
| Regressão arquitetural | Alta | Médio | Lint + gates de PR |
| Resistência organizacional | Média | Médio | Buy-in de liderança + enforcement |
| Integração Stripe quebrada | Baixa | Alto | Testes em sandbox + rollback |

---

## 8. Critérios de Sucesso

### Critérios Técnicos
- [ ] Catálogo comercial versionado operacional
- [ ] Resolução de entitlement centralizada e testada
- [ ] Contratos ativos preservados com snapshot histórico
- [ ] Frontend sem hardcode de vertical
- [ ] Cobrança reconciliada com ledger interno
- [ ] Nenhum acesso direto a billing fora de services
- [ ] Legado desativado com rollback documentado

### Critérios de Negócio
- [ ] Pelo menos 2 verticais operacionais (gastronomia + mobilidade)
- [ ] Tempo de onboarding de nova vertical < 1 semana
- [ ] Zero alterações não autorizadas em contratos
- [ ] Zero divergências críticas de cobrança
- [ ] Conversão de checkout mantida ou melhorada

### Critérios de Qualidade
- [ ] Cobertura de testes > 80% em services críticos
- [ ] Documentação completa e atualizada
- [ ] Auditoria 100% das operações críticas
- [ ] Performance P95 < 100ms para resolução de entitlements

---

## 9. Dependências Externas

1. **Stripe**: Criação de novos `price_id` por vertical
2. **Produto**: Definição de prioridade de verticais
3. **Legal**: Validação de termos contratuais
4. **Design**: UX de composição de planos
5. **CS/Suporte**: Treinamento em novo modelo

---

## 10. Próximos Passos

### Imediato (Fase 0)
1. ✅ Criar este documento de requirements
2. ⏳ Executar inventário completo (T0-01, T0-02, T0-03)
3. ⏳ Mapear pontos de decisão comercial no código
4. ⏳ Identificar acoplamentos indevidos com gastronomia

### Após Fase 0
5. Criar documento de design (Fase 1)
6. Aprovar modelo conceitual com stakeholders
7. Iniciar implementação de schema (Fase 2)

---

## 11. Referências

- Plano mestre: `docs/tasks/PLANO_AAA_MONETIZACAO_MULTI_VERTICAL_SSOT.md`
- Migrations atuais: `supabase/migrations/20260416100000_create_billing_plans.sql`
- Service atual: `src/core/billing/services/BillingPlanService.ts`
- Admin atual: `src/modules/admin/pages/AdminBillingPlansEditor.tsx`
- Entitlements: `src/core/billing/entitlements.ts`

---

**Documento criado em**: 2026-04-21
**Última atualização**: 2026-04-21
**Status**: Em progresso - Fase 0
**Responsável**: Equipe de Arquitetura + Produto
