# Revisão — Feed da comunidade

Status: implementada para a superfície pública de leitura e pré-visualização visual dev.

Branch analisada: `codex/reformulacao-entrada-comunidade`; base `d061fb230`; data 18/09/2026.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Identidade do território e primeira dobra | Já atende com ajuste | `src/core/community-feed/components/CommunityOverviewSurface.tsx` — hero, localização, métricas e CTA | Preservar a identidade resolvida; melhorar contraste do CTA público com token solar | Preview interno em mobile; título, localização, CTA e métricas legíveis |
| Feed, ordenação e contexto | Já atende | `CommunityOverviewSurface.tsx` e `CommunityFeed.tsx` — Posts, Grupos, Discussões, ordenação e estados de feed | Manter a navegação contextual; não copiar abas ilustrativas que conflitam com a navegação canônica de módulos | `CommunityOverviewSurface.spec.tsx`: 6 testes |
| Dados e estados públicos | Já atende | `useCommunityFeedSimple`, `LandingFeaturedService`, `eventRuntimeService` e `CommunityAvailabilityState` | Preservar consultas reais, vazio, erro, carregamento e launch scope; fixture somente com query visual dev explícita | Preview visual com `visualMock=community-concept`; produção continua sem fallback fictício |
| Acesso e participação | Já atende com ajuste de preview | `ComunidadePage.tsx` — `CommunityAccessPolicy` e `CommunityPortalGate` | A prévia dev atravessa somente a guarda de disponibilidade para permitir inspeção; ações públicas continuam levando a login e regras reais permanecem | `ComunidadePage.publicDeepLink.spec.tsx`: 5 testes |
| Shell territorial | Ajuste necessário para revisão visual | `CommunityTerritorialShell.tsx` — faixa de módulo indisponível | Ocultar a faixa apenas em `DEV` + `visualMock=community-concept`; não alterar disponibilidade real | Preview interno sem faixa falsa; TypeScript e ESLint aprovados |
| Funcionalidades futuras | Desativadas por regra | `src/app/config/launchScope.ts` e filtros do feed | Não ativar Alertas, Comunicação, Problemas ou tipos não autorizados apenas por aparecerem na prancha | Contratos de launch scope existentes preservados |

Limitações: a captura visual usa o fixture local existente para validar composição e responsividade; o feed real continua condicionado à disponibilidade persistida da Community, sessão, vínculo e permissões específicas. A referência mostra controles de publicação de membro; no modo público o compositor é somente uma entrada que direciona para login.
