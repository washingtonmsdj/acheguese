# SCREEN-MAP

> **MVP atual — atualizado em 2026-10-05:** **Business/Empresas** é o domínio público ativo. **Mapa, Perto de mim, Busca, Mensagens e Notificações** são capabilities horizontais ativas.
>
> Lifecycle canônico: `productModuleRegistry.ts` + `platformCapabilityRegistry.ts`, avaliados por `lifecycleRegistry.ts`. `launchScope.ts` é projeção de superfície.
>
> Flags efetivas do corte: `map=true`, `nearby=true`, `business=true`, `search=true`, `messaging=true`, `notifications=true`; verticais pós-MVP permanecem `false/paused`.

## Superfícies ativas

| Superfície | Rotas principais | Owner | Estado |
| --- | --- | --- | --- |
| Empresas | `/empresas`, `/:uf/:cidade[/:territorio]/empresas`, detalhe `.../empresas/:slug` | `core/business` | ativo |
| Mapa | `/mapa`, `/:uf/:cidade[/:territorio]/mapa` | `core/maps` | ativo |
| Perto de mim | `/perto-de-mim`, `/:uf/:cidade[/:territorio]/perto-de-mim` | `core/nearby` | ativo |
| Busca | `/busca`, `/buscar`, `/:uf/:cidade[/:territorio]/busca` | `core/search` | ativo |
| Mensagens | `/mensagens`, `/mensagens/:providerId/:threadId` | `core/messaging` + `modules/messaging` | ativo; providers lifecycle-scoped |
| Notificações | `/notificacoes`, `/conta/notificacoes` | `core/notifications` | ativo; eventos lifecycle-scoped |

## Contrato de integração

- Mapa, Nearby, Busca, Mensagens e Notificações são capabilities horizontais e não pertencem a Business.
- Business é hoje provider de domínio para as capabilities aplicáveis, mas nenhuma delas possui dependência estrutural de `business`.
- Se Business for pausado, suas layers, buckets, provider de mensagens e eventos deixam de participar; as capabilities horizontais continuam ativas para outros providers/eventos autorizados.
- Categoria de empresa não depende do lifecycle de uma vertical especializada. Uma escola pode aparecer em Empresas/Mapa/Perto de mim enquanto `education=false`.
- `notificationActionScope.ts` mantém ações de owners pausados fail-closed e pode usar a Inbox de Notificações como fallback seguro; isso não reativa a vertical de origem.
- Nenhum domínio pausado pode reaparecer por URL direta, navegação, preview, busca, mapa, Central, Mensagens, Notificações ou Admin.

## Infraestrutura pública e privada ativa

| Superfície | Objetivo |
| --- | --- |
| `/`, `/:uf/:cidade[/:territorio]` | resolução e contexto territorial |
| Auth / Conta | login, cadastro, sessão, privacidade e preferências |
| Mensagens | Inbox horizontal do produto |
| Notificações | Inbox e preferências horizontais do produto |
| Institucional | `/como-funciona`, `/sobre`, termos, privacidade, DPO, contato/status |
| Central | `/central/empresas/*` para gestão de Business |
| Admin | operação interna/RBAC das superfícies autorizadas |

## Fluxo privado de Business no MVP

A Central usa uma única árvore canônica em `/central/empresas/*` para lista, criação, visão geral, edição, fotos, horários, localização, produtos/serviços, dados e configurações.

**Mensagens e Notificações não são subseções da empresa.** Suas rotas permanecem próprias e continuam existindo se Business for pausado. Apenas o provider/eventos originados de Business saem do grafo.

## Módulos pós-MVP

Permanecem versionados e isolados até certificação individual: Comunidade, Gastronomia, Serviços profissionais, Classificados, Pontos Turísticos, Educação, Vagas/Oportunidades, Eventos, Comunicação territorial, Mobilidade, Cupons, Gamificação, Analytics público, Alertas, Issues, Achados e Perdidos, Safety familiar e Billing.

Ativar um domínio exige alterar seu lifecycle, satisfazer dependências e conectar seus providers/rotas pelos owners canônicos. Não é permitido reativar criando rota paralela, redirect, item manual de sidebar ou exceção local.

### Boundary da Central privada

`CentralRoutes.tsx` monta apenas owners ativos. Eventos, Comunicação, Gastronomia, Educação, Serviços/Profissional, Mobilidade, Billing, Cupons e Analytics permanecem fora da árvore ativa enquanto pausados.

### Boundary do shell público

`AppLayoutRoutes.tsx` monta apenas domínios e capabilities ativos pelo lifecycle. Código pós-MVP permanece nos bounded contexts, fora do grafo público ativo. URL sem owner ativo cai no `NotFound` canônico.

## Contrato territorial de rotas

A hierarquia pública é **território primeiro, módulo depois**:

```txt
/:uf/:cidade
/:uf/:cidade/:territorio
/:uf/:cidade/:territorio/empresas
/:uf/:cidade/:territorio/mapa
/:uf/:cidade/:territorio/perto-de-mim
/:uf/:cidade/:territorio/busca
```

Quando outra vertical for reativada, seguirá o mesmo contrato territorial quando aplicável.

## Rotas legadas

- `/settings/notifications` e `/notifications` continuam aposentadas, sem redirect.
- Rotas canônicas de Notificações são `/notificacoes` e `/conta/notificacoes`.
- Rotas canônicas de Mensagens são `/mensagens` e `/mensagens/:providerId/:threadId`.
- `/perfil/*`, `/create-business`, `/edit-business/:profileId` e `/dashboard/business/:profileId` permanecem aposentadas.
- rota desconhecida renderiza 404; não existe catch-all para `/`.

Redirect de compatibilidade não é mecanismo de lifecycle.
