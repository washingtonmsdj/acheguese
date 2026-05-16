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
