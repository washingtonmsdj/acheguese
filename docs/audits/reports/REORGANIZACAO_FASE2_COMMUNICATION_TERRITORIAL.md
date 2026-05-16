# Reorganizacao Estrutural - Fase 2 (Communication Territorial)

Data: 2026-05-16
Escopo: `src/modules/communication-territorial`

## Objetivo
Reduzir acoplamento de paginas com `core` e concentrar acesso a dados/roteamento em `hooks` e `services` do proprio modulo, sem alterar comportamento funcional.

## Implementado

### 1) Estrutura modular completada
Criadas pastas faltantes no modulo:
- `api/`
- `hooks/`
- `services/`
- `types/`
- `validations/`
- `store/`

### 2) Gateway unico de dominio
Criado:
- `services/communicationTerritorialGateway.ts`

Responsabilidades centralizadas:
- Hub publico (`getPublicHub`)
- Pagina publica do canal (`getChannelPublicPage`)
- Opcoes de localizacao (`listDistrictOptions`)
- Solicitacao de canal (`requestChannel`)
- Publicacoes (`createPublication`, `publishPublication`, `listPublications`)
- Gestao (`listManagedChannels`, `listAuthorizedTerritories`)
- Distribuicao comunitaria (`listDistributedPublications`, `resolvePublicationInteraction`)

### 3) Roteamento encapsulado
Criado:
- `services/communicationRouting.ts`

Wrappers:
- `buildCommunicationChannelPath`
- `buildCommunicationCityPath`
- `buildCommunicationTerritoryPath`

### 4) Hooks de consulta por caso de uso
Criados:
- `hooks/useCommunicationLandingHub.ts`
- `hooks/useCommunicationLocations.ts`
- `hooks/useCommunicationCityHub.ts`
- `hooks/useCommunicationTerritoryHub.ts`
- `hooks/useCommunicationChannelPublicPage.ts`
- `hooks/useCommunityCommunicationFeed.ts`

Observacao: query keys foram preservadas onde ja existiam nas paginas.

### 5) Paginas migradas para hooks/services do modulo
Migradas sem alterar rotas nem UI:
- `pages/CommunicationLandingPage.tsx`
- `pages/CommunicationRequestPage.tsx`
- `pages/CommunicationCityPage.tsx`
- `pages/CommunicationTerritoryPage.tsx`
- `pages/CommunicationChannelPage.tsx`
- `pages/CommunicationCompanyDetailsPage.tsx`
- `pages/CommunityCommunicationTabPage.tsx`
- `v2/pages/CommunicationAgentPageV2.tsx`
- `v2/pages/CommunicationAgentDashboardV2.tsx`
- `v2/agent-page/composer/AgentPublicationComposer.tsx`

### 6) Normalizacao de pontos de entrada
Atualizados:
- `hooks/index.ts`
- `services/index.ts`
- `types/index.ts`
- `types/constants.ts`
- `types/errors.ts`
- `index.ts` (raiz do modulo)

## Validacao executada
- ESLint focado em todos os arquivos alterados do modulo: OK.

## Risco residual
- `typecheck:app` completo segue pesado no workspace e estourou timeout em execucao anterior, sem indicativo local de erro neste lote.

## Incremento adicional (continuidade)
- `pages/CommunicationCompanyDetailsPage.tsx` quebrada em subcomponentes de apresentacao sem alterar UI/fluxo:
  - `components/company-details/CommunicationCompanyDetailsSections.tsx`
- `v2/pages/CommunicationAgentPageV2.tsx` enxugada com extracao de fallback/mock para:
  - `v2/mocks/agentPageFallback.ts`
- Objetivo atendido: reduzir tamanho de arquivo e acoplamento local, mantendo comportamento funcional.

## Incremento adicional (tipagem do fluxo agent-page)
- Criado `v2/types/agentPageViewModels.ts` com tipos de view-model para canal/territorio/publicacao.
- Removido uso de `any` no fluxo principal `v2/agent-page`:
  - `sections/AgentHeroSection.tsx`
  - `sections/AgentStatsBar.tsx`
  - `sections/AgentLatestPublications.tsx`
  - `sections/AgentWeekHighlights.tsx`
  - `sections/AgentActiveCoverage.tsx`
  - `sections/AgentLocalNews.tsx`
  - `sidebar/AgentSidebarAbout.tsx`
  - `sidebar/AgentSidebarContact.tsx`
  - `sidebar/AgentSidebarTerritorial.tsx`
  - `composer/AgentPublicationComposer.tsx`
- `v2/mocks/agentPageFallback.ts` tipado com view-models.
- Ganho: melhor manutenção para IA/humanos sem alterar layout nem comportamento funcional.

## Incremento - Tipagem Agent Dashboard (2026-05-16)
- Removidos ny remanescentes em 2/agent-dashboard via tipos de view model.
- Criado 2/types/agentDashboardViewModels.ts para padronizar tipos de canal/publicacao/territorio/atividade/equipe e estado de view.
- Mantido comportamento funcional, rotas e layout.
- Validacao: 
px eslint executado nos arquivos alterados do dashboard sem erros.


## Incremento - Governanca de Arquitetura (2026-05-16)

### Mapa da nova arquitetura (communication-territorial)
- `src/modules/communication-territorial/pages`: paginas publicas e fluxo de solicitacao.
- `src/modules/communication-territorial/components`: blocos visuais compartilhados do dominio.
- `src/modules/communication-territorial/hooks`: queries e orquestracao de dados por caso de uso.
- `src/modules/communication-territorial/services`: gateway e roteamento interno do dominio.
- `src/modules/communication-territorial/types`: contratos de dominio e constantes de apresentacao.
- `src/modules/communication-territorial/v2`: camada social-first (agent page, dashboard, sections, mocks, types locais).

### Relatorio do que foi removido/limpo nesta fase
- Removidos `any` do fluxo `v2/agent-page` e `v2/agent-dashboard`.
- Removida dependencia direta de tipos de `@/core/communication-territorial` em componentes de UI do dashboard.
- Consolidacao de tipagem local via `v2/types/agentPageViewModels.ts` e `v2/types/agentDashboardViewModels.ts`.

### Dependencias criticas
- `@tanstack/react-query`: cache e sincronizacao de dados das telas.
- `react-router-dom`: parametros e navegacao de rotas publicas e privadas.
- `communicationTerritorialGateway`: fronteira de integracao com `core` e backend.
- `@/shared/components/ui/*`: base visual padronizada (sem mudanca de comportamento visual).

### Possiveis riscos tecnicos futuros
- Expansao de mocks no `v2` pode divergir dos contratos reais se nao houver testes de contrato.
- Crescimento de documentacao em paralelo ao codigo pode gerar desatualizacao sem rotina de revisao.
- Evolucao de tipos do `core` pode exigir adaptacao no gateway para preservar isolamento do modulo.
