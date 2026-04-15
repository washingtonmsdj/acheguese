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
| `business` | sim | sim | empresas, claims, dashboard, promocoes, pricing | separacao entre admin central e dashboard do negocio | `core/business` | critical | consolidar |
| `gastronomy` | sim | parcial | catalogo administrativo e estatisticas | menu, integridade operacional, ownership de promocao e catalogo | `core/gastronomy` | high | consolidar |
| `professionals/services` | sim | parcial | servicos, vagas | areas de atendimento, disponibilidade, reputacao operacional | `core/professional`, `core/service-areas` | high | consolidar |
| `community/posts` | sim | parcial | moderacao e filas | grupos, recomendacoes, eventos, achados/perdidos | `core/community`, `core/posts`, `core/comments` | critical | consolidar |
| `community-alerts` | sim | sim | alertas e issues administrativos | ownership documental unico e integracao com civic reports | `core/community-alerts`, `core/community-issues` | high | documentar |
| `map` | sim | parcial | `/admin/mapa`, locations, territorio, city metadata, pontos turisticos | write-side de boundaries, reconciliacao geografica, convergencia de Nearby, politicas administrativas de providers | `core/maps`, `core/location`, `core/admin/services/AdminMapGovernanceService.ts` | high | consolidar |
| `classifieds` | sim | sim | catalogo e denuncias | categorias, vendedor, URL history, politicas administrativas | `core/classifieds` | high | consolidar |
| `mobility` | sim | sim | operacoes, motoristas, analytics, pontos de embarque | dispatch, chat, verificacoes operacionais, governance de runtime | `core/mobility/services`, `modules/mobility/services` | critical | consolidar |
| `notifications` | sim | parcial | `/admin/notifications` com leitura global, backlog e estado de `user_notification_settings` | templates, canais externos, auditoria de entrega, politicas globais | `core/notifications/services/NotificationService.ts` + `core/admin/services/AdminNotificationsService.ts` | high | consolidar |

## Foco imediato
### Notifications
- Situacao atual:
  - dominio existe e esta consolidado em `core/notifications`
  - existe pagina administrativa dedicada em `/admin/notifications`
  - ha gestao por usuario e leitura sistemica oficial no admin
- Gestao faltante:
  - catalogo de tipos oficiais
  - politica de prioridade/canal
  - auditoria de entrega, falha e reprocessamento por tipo
  - backlog de notificacoes falhas ou orfas com acao administrativa
  - templates e versionamento de mensagem
- Minimo profissional para abrir coverage:
  - leitura agregada por `type`, `priority`, `read`
  - estado de `user_notification_settings`
  - fila/backlog operacional
  - contrato explicito de tipos suportados
  - status: entregue nesta fase

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
- Gestao faltante:
  - write-side de boundaries e reconciliacao territorial
  - governanca de geometrias (`location_boundaries`, `neighborhood_boundaries`)
  - convergencia de Nearby com o ownership final de `core/maps`
  - retirada do acoplamento restante de `MapaPageV4` com `modules/community-alerts`
- Minimo profissional para abrir coverage:
  - estado dos providers
  - camadas runtime em SSOT unico
  - hotspots de qualidade geografica e visibilidade
  - visao operacional de superficies publicas
  - status: entregue parcialmente nesta fase com `/admin/mapa`

## Ownership recomendado
| Tema | Dono primario | Dono de execucao | Observacao |
| --- | --- | --- | --- |
| governanca de `profile` | `core/profiles` | `modules/admin` | admin consome contrato, nao define regra |
| governanca de notificacoes | `core/notifications` | `modules/admin` | evitar reabrir wrapper paralelo |
| governanca do mapa | `core/maps` + `core/location` | `modules/admin` | mapa e produto, nao so infraestrutura |
| operacoes de mobilidade | `core/mobility` | `modules/admin` | separar runtime de backoffice |

## Proxima execucao recomendada
1. Aplicar e validar a migration de `family` no ambiente linked e manter `FamilyService` como unico ponto de acesso do dominio.
2. Fechar a segunda camada de notifications: templates, canais e auditoria de entrega.
3. Expandir a coverage operacional do mapa para write-side territorial e reconciliacao geografica.
