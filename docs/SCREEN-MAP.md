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
| Perto de mim | `/perto-de-mim` | `core/nearby` | ativo; depende de Mapa + Empresas |
| Busca | `/busca`, `/busca/:uf/:cidade[/:bairro]`, `/buscar` | `core/search` + `BuscaPage`/`BuscarPage` | ativo; providers derivados do lifecycle |
| Mensagens | `/mensagens`, `/mensagens/business/:threadId` | `core/messaging` + `modules/messaging` | ativo; provider Business no MVP |

### Contrato de integração

- Mapa público renderiza somente layers de módulos ativos; no MVP, o layer de domínio é Business.
- Perto de mim consulta Business por proximidade e projeta as mesmas URLs canônicas de Empresas.
- Busca consulta apenas providers cujas superfícies estão ativas; no corte atual, Business é o provider público principal.
- Categoria de empresa não depende do lifecycle de uma vertical especializada. Uma escola pode aparecer em Empresas/Mapa/Perto de mim enquanto `education=false`.
- Nenhum módulo pausado pode reaparecer por URL direta, navegação, preview, busca, mapa ou Central.

## Infraestrutura pública

Estas superfícies/capabilities suportam o domínio Business e **não são domínios adicionais**:

| Superfície | Objetivo |
| --- | --- |
| `/`, `/:uf/:cidade[/:territorio]` | resolução e contexto territorial |
| Auth / Conta | login, cadastro, sessão, privacidade e preferências |
| Mensagens | Inbox/Chat horizontal; Business é o provider ativo |
| Institucional | termos, privacidade, DPO, contato/status quando aplicável |
| Admin/Central | operação interna, RBAC e gestão estritamente necessária |


## Módulos pós-MVP

Permanecem versionados e isolados até certificação individual: Comunidade, Gastronomia, Serviços profissionais, Classificados, Pontos Turísticos, Educação, Vagas/Oportunidades, Eventos, Comunicação territorial, Mobilidade, Cupons, Gamificação, Analytics público, Alertas, Issues, Achados e Perdidos, Safety familiar e Billing.

Ativar um módulo exige alterar o lifecycle no registry e satisfazer suas dependências. Não é permitido reativar um módulo criando rota paralela, redirect ou exceção local.

## Rotas legadas

- `/empresas-landing` foi removida. Não existe redirect de compatibilidade.
- `/conta/profissional` foi removida do shell público enquanto Serviços está pausado.
- `/perfil/*` foi aposentado como alias privado. Conta usa somente `/conta/*`; perfil público usa somente `/u/:username`.
- edição de perfil usa somente `/conta/editar/:profileId`; `/conta/editar` sem identidade explícita foi removida.
- `/settings/notifications` foi removida; preferências usam somente `/conta/notificacoes`.
- `/notifications` foi removida; a Inbox usa somente `/notificacoes`.
- `/conta/preferencias?tab=...` não redireciona para outras telas. Os destinos canônicos possuem URL própria.
- rota desconhecida renderiza 404; não existe catch-all para `/`.

Redirect de compatibilidade não é mecanismo de limpeza arquitetural. Guards de autenticação/autorização podem navegar para login ou para a superfície obrigatória correspondente porque isso representa controle de acesso, não alias legado.
