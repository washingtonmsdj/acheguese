# Matriz de Coverage Admin

## Objetivo
Transformar cobertura administrativa implicita em contrato explicito de ownership.

Esta matriz responde, por dominio:
- o que ja existe no sistema
- o que ja existe no admin
- o que ainda esta sem gestao
- qual servico canonico deve sustentar a evolucao
- qual a criticidade

## Matriz mestre
| Dominio | Existe no sistema | Existe no admin | Cobertura atual | Falta gestao | Servico/SSOT canonico | Criticidade | Classificacao |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `core/routing/location/public-identity` | sim | parcial | locations, territory groups, city metadata | namespace publico, landing, regras de identidade, ownership de rota | `core/routing`, `core/location`, `core/public-identity` | critical | consolidar |
| `profile` | sim | sim | `/admin/usuarios`, `/admin/roles`, `/admin/verificacoes`, `/admin/assinaturas`, `/admin/identidade` | rollout da migration de `family`, historico administrativo de permissoes e politica de override reputacional | `core/profiles/services/ProfileService.ts` + `core/family/services/FamilyService.ts` + `core/admin/services/AdminProfileGovernanceService.ts` | critical | consolidar |
| `admin` | sim | sim | dashboard, crud, roles, ssot, operacoes, verificacoes | ownership formal das paginas, governanca do proprio agregado admin | `core/admin` | critical | documentar |
| `business` | sim | sim | empresas, claims, dashboard, promocoes, pricing | backlog em politicas de auditoria e trilha de aprovacao, sem ambiguidade de ownership entre admin e dashboard | `core/business` | critical | consolidar |
| `gastronomy` | sim | sim | catalogo administrativo, menus, itens, integridade operacional e ownership de promocao | backlog em politicas finas de moderacao editorial e automacoes de qualidade de catalogo | `core/gastronomy` | high | consolidar |
| `professionals/services` | sim | parcial | servicos, vagas | areas de atendimento, disponibilidade, reputacao operacional | `core/professional`, `core/service-areas` | high | consolidar |
| `community/posts` | sim | parcial | moderacao e filas | grupos, recomendacoes, eventos, achados/perdidos | `core/community`, `core/posts`, `core/comments` | critical | consolidar |
| `community-alerts` | sim | sim | alertas e issues administrativos | ownership documental unico e integracao com civic reports | `core/community-alerts`, `core/community-issues` | high | documentar |
| `map` | sim | sim | `/admin/mapa`, locations, territorio, city metadata, pontos turisticos e write-side de hotspots (boundaries/coordenadas) | convergencia de Nearby, politicas administrativas de providers, governanca de geometrias | `core/maps`, `core/location`, `core/admin/services/AdminMapGovernanceService.ts` | high | consolidar |
| `classifieds` | sim | sim | catalogo, denuncias, categorias, vendedor, URL history e politicas administrativas | backlog em automacoes de enforcement e trilha de sancoes administrativas | `core/classifieds` | high | consolidar |
| `mobility` | sim | sim | operacoes, motoristas, analytics, pontos de embarque e governanca de rollout no admin central | dispatch, chat, verificacoes operacionais e aprofundamento de auditoria operacional | `core/mobility/services`, `modules/mobility/services` | critical | consolidar |
| `notifications` | sim | sim | `/admin/notifications` com leitura global, backlog, estado de `user_notification_settings`, templates, canais e auditoria de entrega | politicas globais de notificacao e governanca de reprocessamento administrativo | `core/notifications/services/NotificationService.ts` + `core/admin/services/AdminNotificationsService.ts` | high | consolidar |

## Foco imediato
### Notifications
- Situacao atual:
  - dominio existe e esta consolidado em `core/notifications`
  - existe pagina administrativa dedicada em `/admin/notifications`
  - ha gestao por usuario e leitura sistemica oficial no admin
- Gestao faltante:
  - politica global de notificacoes (governanca administrativa de prioridades/canais)
  - estrategia de reprocessamento administrativo para falhas persistentes
- Minimo profissional para abrir coverage:
  - leitura agregada por `type`, `priority`, `read`
  - estado de `user_notification_settings`
  - fila/backlog operacional
  - contrato explicito de tipos suportados
  - templates e metricas de entrega por canal
  - status: entregue nesta fase (segunda camada fechada em 2026-04-21)

### Profile
- Situacao atual:
  - coverage administrativa formal em `/admin/identidade`, alem de `/admin/usuarios`, `/admin/roles`, `/admin/assinaturas` e `/admin/verificacoes`
  - identidade publica foi consolidada no roteamento e possui ownership administrativo dedicado
  - `AdminProfileGovernanceService` agora expone reputacao por origem e preferencias por escopo no agregado canonicamente auditado
  - residencia canonica primaria e snapshot de permissoes efetivas agora tambem fazem parte da coverage oficial
  - `family` entrou em leitura administrativa via `FamilyService` e expone explicitamente quando o schema local nao modela o dominio
  - o admin nao acessa mais `family_connections` diretamente
  - o contrato local do banco foi formalizado em migration propria, com tabelas prefixadas, triggers e RLS
- Gestao faltante:
  - aplicacao e validacao da migration de `family` nos ambientes
  - entidades derivadas alem de residence/family
  - historico administrativo de permissoes operacionais
  - politica administrativa de ajuste excepcional de reputacao
- Minimo profissional para abrir coverage:
  - visao unica de dados publicos vs privados
  - painel de identidade publica
  - historico e integridade de username
  - reputacao consolidada por fonte
  - mapa de preferencias por escopo
  - mapa de entidades vinculadas ao usuario
  - residencia canonica primaria
  - snapshot efetivo de permissoes
  - status: entregue nesta fase, com backlog residual objetivo

### Map
- Situacao atual:
  - ha gestao territorial, city metadata, locations e pontos turisticos
  - existe coverage operacional dedicada em `/admin/mapa`
  - a nova superficie consolida providers, camadas runtime, hotspots territoriais e superficies publicas do produto
  - write-side de hotspots esta ativo via `AdminMapGovernanceService.resolveHotspot` (boundaries e reconciliacao de coordenadas)
- Gestao faltante:
  - governanca de geometrias (`location_boundaries`, `neighborhood_boundaries`)
  - convergencia de Nearby com o ownership final de `core/maps`
- Minimo profissional para abrir coverage:
  - estado dos providers
  - camadas runtime em SSOT unico
  - hotspots de qualidade geografica e visibilidade
  - visao operacional de superficies publicas
  - status: coverage administrativo fechado nesta fase para leitura + write-side de boundaries/coordenadas

### Classifieds
- Situacao atual:
  - coverage administrativa consolidada em `/admin/classificados` (catalogo, taxonomia, vendedores e governanca)
  - `AdminClassifiedsService` agora expone agregados de categorias, vendedores, historico de URL e politicas administrativas
  - moderacao de denuncias segue em `/admin/classificados/denuncias` com fluxo operacional dedicado
- Gestao faltante:
  - automacoes de enforcement (sancoes/reincidencia) e trilha administrativa de decisoes
- Minimo profissional para manter coverage:
  - leitura unificada de catalogo com filtros por status/categoria
  - matriz de categorias/subcategorias versus uso real no catalogo
  - agregado por vendedor (volume, status e recencia)
  - historico de URL canônica + metricas de violacao de contrato SSOT (`category_id`, `subcategory_id`, `location_id`, `public_id`, `slug`)
  - status: coverage administrativo fechado nesta fase

## Ownership recomendado
| Tema | Dono primario | Dono de execucao | Observacao |
| --- | --- | --- | --- |
| governanca de `profile` | `core/profiles` | `modules/admin` | admin consome contrato, nao define regra |
| governanca de notificacoes | `core/notifications` | `modules/admin` | evitar reabrir wrapper paralelo |
| governanca do mapa | `core/maps` + `core/location` | `modules/admin` | mapa e produto, nao so infraestrutura |
| operacoes de mobilidade | `core/mobility` | `modules/admin` | separar runtime de backoffice |

## Proxima execucao recomendada
1. Aplicar e validar a migration de `family` no ambiente linked e manter `FamilyService` como unico ponto de acesso do dominio.
2. Registrar historico administrativo formal de permissoes efetivas por profile.
3. Fechar governanca administrativa de geometrias (`location_boundaries`/`neighborhood_boundaries`) no fluxo de mapa.
