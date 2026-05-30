# Reorganizacao Estrutural - Fase 2 (Communication Territorial)

Data: 2026-05-16
Escopo: `src/modules/communication-territorial`

## Objetivo
Reduzir acoplamento de paginas com `core` e concentrar acesso a dados/roteamento em `hooks` e `services` do proprio modulo, sem alterar comportamento funcional.

## Implementado

### 1. Estrutura modular completada
Criadas pastas faltantes no modulo:
- `api/`
- `hooks/`
- `services/`
- `types/`
- `validations/`
- `store/`

### 2. Gateway unico de dominio
Criado `services/communicationTerritorialGateway.ts` para centralizar:
- Hub publico (`getPublicHub`)
- Pagina publica do canal (`getChannelPublicPage`)
- Opcoes de localizacao (`listDistrictOptions`)
- Solicitacao de canal (`requestChannel`)
- Publicacoes (`createPublication`, `publishPublication`, `listPublications`)
- Gestao (`listManagedChannels`, `listAuthorizedTerritories`)
- Distribuicao comunitaria (`listDistributedPublications`, `resolvePublicationInteraction`)

### 3. Roteamento encapsulado
Criado `services/communicationRouting.ts` com wrappers:
- `buildCommunicationChannelPath`
- `buildCommunicationCityPath`

### 4. Hooks de consulta por caso de uso
Criados:
- `hooks/useCommunicationLandingHub.ts`
- `hooks/useCommunicationLocations.ts`
- `hooks/useCommunicationCityHub.ts`
- `hooks/useCommunicationChannelPublicPage.ts`
- `hooks/useCommunityCommunicationFeed.ts`

### 5. Paginas migradas para hooks/services do modulo
Migradas sem alterar rotas nem UI:
- `pages/CommunicationLandingPage.tsx`
- `pages/CommunicationRequestPage.tsx`
- `pages/CommunicationCityPage.tsx`
- `pages/CommunicationChannelPage.tsx`
- `pages/CommunicationCompanyDetailsPage.tsx`
- `pages/CommunityCommunicationTabPage.tsx`
- `v2/pages/CommunicationAgentPageV2.tsx`
- `v2/pages/CommunicationAgentDashboardV2.tsx`
- `v2/agent-page/composer/AgentPublicationComposer.tsx`

## Incrementos adicionais
- `pages/CommunicationCompanyDetailsPage.tsx` foi quebrada em subcomponentes de apresentacao.
- `v2/pages/CommunicationAgentPageV2.tsx` foi enxugada com fallback local tipado.
- `v2/types/agentPageViewModels.ts` e `v2/types/agentDashboardViewModels.ts` padronizam view-models.
- Removidos `any` do fluxo principal `v2/agent-page` e `v2/agent-dashboard`.

## Governanca de Arquitetura
- `pages`: paginas publicas e fluxo de solicitacao.
- `components`: blocos visuais compartilhados do dominio.
- `hooks`: queries e orquestracao de dados por caso de uso.
- `services`: gateway e roteamento interno do dominio.
- `types`: contratos de dominio e constantes de apresentacao.
- `v2`: camada social-first de agent page e dashboard.

## Dependencias criticas
- `@tanstack/react-query`: cache e sincronizacao de dados das telas.
- `react-router-dom`: parametros e navegacao.
- `communicationTerritorialGateway`: fronteira de integracao com `core` e backend.
- `@/shared/components/ui/*`: base visual padronizada.

## Riscos residuais
- Fallbacks locais do `v2` devem permanecer tipados e cobertos por contrato para nao divergir dos dados reais.
- Documentacao paralela ao codigo precisa de rotina de revisao para evitar desatualizacao.
- Evolucao de tipos do `core` pode exigir adaptacao no gateway para preservar isolamento do modulo.
