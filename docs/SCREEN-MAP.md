# SCREEN-MAP

> **MVP atual — decisão consolidada em 2026-09-22:** **Business/Empresas** é o domínio público ativo. **Mapa, Perto de mim, Busca e Mensagens** são capabilities horizontais ativas.
>
> Lifecycle canônico: `productModuleRegistry.ts` + `platformCapabilityRegistry.ts`, avaliados por `lifecycleRegistry.ts`. `launchScope.ts` é compatibilidade de superfície.
>
> Flags efetivas do corte: `map=true`, `nearby=true`, `business=true`, `search=true`, `billing=false`, `gastronomy=false`, `services=false`, `touristPoints=false`, `education=false`, `jobs=false`, `events=false`, `communityEventsPreview=false`, `communication=false`, `messaging=true`, `mobility=false`, `coupons=false`, `gamification=false`, `communityCommunication=false`.

## Superfícies públicas ativas

| Superfície | Rotas principais | Owner | Estado |
| --- | --- | --- | --- |
| Empresas | `/empresas`, `/empresas/:uf/:cidade[/:bairro]`, detalhe canônico por slug | `core/business` + `EmpresasLandingPage` | ativo |
| Mapa | `/mapa`, `/mapa/:uf/:cidade[/:bairro]` | `core/maps` | ativo |
| Perto de mim | `/perto-de-mim`, `/perto-de-mim/:uf/:cidade[/:bairro]` | `core/nearby` | ativo; depende de Mapa + Empresas; rota territorial é autoridade quando presente |
| Busca | `/busca`, `/busca/:uf/:cidade[/:bairro]`, `/buscar` | `core/search` + `BuscaPage`/`BuscarPage` | ativo; providers e sugestões derivados do lifecycle; preview de Business preserva a URL canônica do documento |
| Mensagens | `/mensagens`, `/mensagens/business/:threadId` | `core/messaging` + `modules/messaging` | ativo; provider Business no MVP |

### Contrato de integração

- Mapa público renderiza somente layers de módulos ativos; no MVP, o layer de domínio é Business.
- Perto de mim consulta Business por proximidade e projeta as mesmas URLs canônicas de Empresas. Em rota territorial, o território resolvido pela URL prevalece sobre estado global lembrado; GPS real continua sendo a única fonte de distância pessoal.
- Busca consulta apenas providers cujas superfícies estão ativas; no corte atual, Business é o provider público principal. Sugestões também obedecem ao lifecycle e não promovem providers pausados. O preview de mapa reutiliza `SearchDocument.url` para abrir a empresa específica; não reimplementa a regra de URL.
- Categoria de empresa não depende do lifecycle de uma vertical especializada. Uma escola pode aparecer em Empresas/Mapa/Perto de mim enquanto `education=false`.
- Nenhum módulo pausado pode reaparecer por URL direta, navegação, preview, busca, mapa, Central ou Admin. No shell público, módulo `paused` não tem rota/fallback próprio; URL sem owner ativo cai no 404 canônico.

## Infraestrutura pública

Estas superfícies/capabilities suportam o domínio Business e **não são domínios adicionais**:

| Superfície | Objetivo |
| --- | --- |
| `/`, `/:uf/:cidade[/:territorio]` | resolução e contexto territorial |
| Auth / Conta | login, cadastro, sessão, privacidade e preferências |
| Mensagens | Inbox/Chat horizontal; Business é o provider ativo |
| Institucional | `/como-funciona`, `/sobre`, termos, privacidade, DPO, contato/status; conteúdo deve refletir somente o lifecycle ativo e pode mencionar módulos pausados apenas como futuros/indisponíveis |
| Admin/Central | operação interna, RBAC e gestão estritamente necessária; Admin deriva lifecycle por `adminSurfaceScope.ts`; Central ativa contém apenas Business/Empresas (`/central/empresas/*`) + infraestrutura, sem rotas/placeholders/queries de módulos pausados |

## Módulos pós-MVP

Permanecem versionados e isolados até certificação individual: Comunidade, Gastronomia, Serviços profissionais, Classificados, Pontos Turísticos, Educação, Vagas/Oportunidades, Eventos, Comunicação territorial, Mobilidade, Cupons, Gamificação, Analytics público, Alertas, Issues, Achados e Perdidos, Safety familiar e Billing.

Ativar um módulo exige alterar o lifecycle no registry, satisfazer suas dependências e só então conectar seus owners ao barrel/registry ativo. O mesmo vale para sua superfície Admin: rota e navegação são derivadas de `adminSurfaceScope.ts`. Não é permitido reativar um módulo criando rota paralela, redirect, item manual de sidebar ou exceção local.

### Boundary da Central privada

`CentralRoutes.tsx` importa somente `activeCentralLazyImports.ts`. No MVP, a Central monta hub, gestão canônica de Business/Empresas, edição/dados/configurações e infraestrutura de acesso. Eventos, Comunicação, Gastronomia, Educação, Serviços/Profissional, Mobilidade, Billing, Cupons e Analytics permanecem fora da árvore ativa. URL privada sem owner ativo cai no `NotFound` canônico, sem `LaunchPausedPage`, redirect ou alias.

O shell de gestão Business também não pode consultar Billing/Gastronomia/verticais pausadas apenas para ocultar UI. Extensões pós-MVP permanecem preservadas nos seus bounded contexts fora do grafo ativo. O antigo `centralLazyImports.ts` não é autoridade de preservação e foi aposentado após ficar sem caller runtime.

### Boundary do shell público

`AppLayoutRoutes.tsx` importa somente `activeLazyImports.ts`. O antigo `lazyImports.ts` e a cadeia órfã `TerritorialModulePages.tsx` → `launchPausedComponent.ts` → `LaunchPausedPage.tsx` foram aposentados após censo provar ausência de caller runtime. Código pós-MVP permanece nos bounded contexts/owners preservados, fora do grafo público ativo. O boundary territorial ativo é `ActiveTerritorialModulePages.tsx`; URL sem owner ativo cai naturalmente no `NotFound` canônico, sem placeholder, redirect ou fallback de módulo pausado.

## Rotas legadas

- `/splash` foi removida após censo comprovar ausência de caller real. Não existe redirect de compatibilidade.
- `/empresas-landing` foi removida. Não existe redirect de compatibilidade.
- `/conta/profissional` foi removida do shell público enquanto Serviços está pausado.
- `/perfil/*` foi aposentado como alias privado. Conta usa somente `/conta/*`; perfil público usa somente `/u/:username`.
- edição de perfil usa somente `/conta/editar/:profileId`; `/conta/editar` sem identidade explícita foi removida.
- `/settings/notifications` foi removida; preferências usam somente `/conta/notificacoes`.
- `/notifications` foi removida; a Inbox usa somente `/notificacoes`.
- `/conta/preferencias?tab=...` não redireciona para outras telas. Os destinos canônicos possuem URL própria.
- rota desconhecida renderiza 404; não existe catch-all para `/`.
- gestão de Business não possui raízes paralelas: `/create-business`, `/edit-business/:profileId` e `/dashboard/business/:profileId` foram aposentadas; criação/gestão/edição usam somente `/central/empresas/*`.

Redirect de compatibilidade não é mecanismo de limpeza arquitetural. Guards de autenticação/autorização podem navegar para login ou para a superfície obrigatória correspondente porque isso representa controle de acesso, não alias legado.