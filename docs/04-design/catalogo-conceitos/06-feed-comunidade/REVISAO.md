# Revisão — Feed da comunidade

Status: implementada para a superfície pública de leitura e pré-visualização visual dev, com segunda passada de fidelidade ao concept.

Branch analisada: `codex/reformulacao-entrada-comunidade`; base `d061fb230`; data 18/09/2026.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Identidade do território e primeira dobra | Ajustada ao concept | `CommunityOverviewSurface.tsx` e `TerritoryTopbar.tsx` — header claro, título “Comunidade” e composição da primeira dobra | Usar a linguagem editorial da prancha no feed; manter o hero territorial disponível nas demais visões | Preview interno em mobile; espaçamento e hierarquia conferidos visualmente |
| Correspondência de viewport e grade | Ajustada | `CommunityOverviewSurface.tsx` — breakpoints mobile e grade `10.75rem / minmax(0,1fr) / 20rem` a partir de `xl` | Reproduzir a coluna lateral, eixo principal e agenda do desktop sem alterar rotas | Captura ao vivo em viewport interno de aproximadamente 425 px; regras `xl` revisadas para desktop |
| Composer e cards do feed | Ajustado ao concept | `CommunityComposerEntry.tsx` e `CommunityOverviewSurface.tsx` — placeholder, ações Foto/Pergunta/Publicar e aviso solar | Manter ações protegidas por login no modo público; aplicar destaque amarelo somente ao tipo `aviso` | Preview confirma composer, tabs, aviso e cards brancos; 6 testes do surface |
| Feed, ordenação e contexto | Já atende | `CommunityOverviewSurface.tsx` e `CommunityFeed.tsx` — Posts, Grupos, Discussões, ordenação e estados de feed | Manter a navegação contextual; não copiar abas ilustrativas que conflitam com a navegação canônica de módulos | `CommunityOverviewSurface.spec.tsx`: 6 testes |
| Dados e estados públicos | Já atende | `useCommunityFeedSimple`, `LandingFeaturedService`, `eventRuntimeService` e `CommunityAvailabilityState` | Preservar consultas reais, vazio, erro, carregamento e launch scope; fixture somente com query visual dev explícita | Preview visual com `visualMock=community-concept`; produção continua sem fallback fictício |
| Acesso e participação | Já atende com ajuste de preview | `ComunidadePage.tsx` — `CommunityAccessPolicy` e `CommunityPortalGate` | A prévia dev atravessa somente a guarda de disponibilidade para permitir inspeção; ações públicas continuam levando a login e regras reais permanecem | `ComunidadePage.publicDeepLink.spec.tsx`: 5 testes |
| Shell territorial | Ajuste necessário para revisão visual | `CommunityTerritorialShell.tsx` — faixa de módulo indisponível | Ocultar a faixa apenas em `DEV` + `visualMock=community-concept`; não alterar disponibilidade real | Preview interno sem faixa falsa; TypeScript e ESLint aprovados |
| Funcionalidades futuras | Desativadas por regra | `src/app/config/launchScope.ts` e filtros do feed | Não ativar Alertas, Comunicação, Problemas ou tipos não autorizados apenas por aparecerem na prancha | Contratos de launch scope existentes preservados |

Limitações: a captura visual usa o fixture local existente para validar composição e responsividade; o feed real continua condicionado à disponibilidade persistida da Community, sessão, vínculo e permissões específicas. A referência mostra controles de publicação de membro; no modo público o compositor exibe as ações do concept, mas cada ação continua direcionando para login. A API de preview disponível não permite forçar outra largura de viewport na aba interna; por isso a fidelidade desktop foi aplicada e revisada pelos breakpoints `xl`, enquanto a captura ao vivo permaneceu aberta no viewport móvel.

## Atualização — pranchas 116 e 117

As pranchas 116 e 117 substituem 002 e 115 como referência visual vigente. A implementação foi recalibrada para o shell petróleo/solar, com `Publicações`, `Avisos`, `Grupos` e `Agenda`, busca mobile acessível, composer compacto, resposta destacada e rail contextual no desktop.

- `CommunityOverviewSurface.tsx`: remove os atalhos/cards de módulos antigos somente no preview visual, preserva a navegação canônica fora dele e implementa as variações de avisos, visitante, vínculo pendente, vazio e erro.
- `CommunityComposerEntry.tsx`: adiciona a entrada compacta do concept, mantendo ações protegidas pela política de acesso.
- `communityOverviewVisualFixture.ts`: mantém dados demonstrativos restritos ao query param de preview, com publicação de pergunta, resposta, foto, relato e comunicado autorizado.
- `TerritoryTopbar.tsx`: mantém a busca disponível no mobile sem alterar a topbar compartilhada fora da comunidade.

Validação: TypeScript, ESLint e os contratos específicos do surface e do deep link passaram; a aba interna permaneceu aberta no preview `visualMock=community-concept` durante a conferência visual dos cenários.
