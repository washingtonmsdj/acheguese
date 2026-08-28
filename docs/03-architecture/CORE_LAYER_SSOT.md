# CORE Layer SSOT (Arquitetura Oficial)

Data: 2026-07-09
Escopo: `src/core`

> Nota de vigencia (2026-07-14): este documento classifica a localizacao
> fisica das pastas. Ele nao prova que cada implementacao atual e o owner
> canonico da capacidade. `feed`, `interaction`, `permissions`, `messaging`,
> `social`, `favorites`, `notifications`, `reviews` e `realtime` possuem
> consolidacoes abertas em `CORE_PLATFORM_ARCHITECTURE_SSOT.md`. Em conflito
> de ownership por operacao/tabela, prevalece esse SSOT mais especifico.
>
> Nota G2 (2026-08-28): `src/core/business/**` e owner canonico de contratos,
> persistencia, queries e services de negocio reutilizaveis quando a capacidade
> precisa ser compartilhada entre superficies. A UI e a composicao de produto
> permanecem em `src/modules/business/**`. O namespace legado
> `src/core/gastronomy` continua proibido; Gastronomy compartilhada usa
> `src/core/business/**`, conforme `docs/07-modules/GASTRONOMY_CONSOLIDATION_SSOT.md`.

## Papel oficial da camada `core`
`src/core` é fundação transversal reutilizável do sistema e também abriga contratos/services de negócio compartilhados que não pertencem a uma única superfície de UI: autenticação/sessão/perfis, autorização/permissões, localização/território/mapas/geoespacial, comunicação/notificações/realtime, billing/subscription/pricing, contratos e persistência compartilhados de business, observabilidade e governança.

## Matriz completa: pasta atual -> classificação -> destino

| Pasta | Classificação | Destino SSOT |
|---|---|---|
| address | core transversal legítimo | manter em `src/core/address` |
| admin | legado de domínio de produto | migrar para `src/modules/admin` |
| alerts | core transversal legítimo | manter em `src/core/alerts` |
| analytics | core transversal legítimo | manter em `src/core/analytics` |
| auth | core transversal legítimo | manter em `src/core/auth` |
| authorization | core transversal legítimo | manter em `src/core/authorization` |
| banners | domínio de produto | migrar para `src/modules/business` |
| billing | core transversal legítimo | manter em `src/core/billing` |
| business | domínio de negócio compartilhado | manter contratos, persistência, queries e services reutilizáveis em `src/core/business`; UI/composição de produto em `src/modules/business` |
| city | subdomínio territorial transversal | consolidar em `src/core/location`/`territorial` |
| civic | legado historico removido | nao recriar; fluxos civicos atuais devem passar por owners comunitarios explicitos como `src/core/community-issues` ou `src/core/community/alerts` ate ADR dedicada |
| comments | core transversal legítimo | manter em `src/core/comments` |
| community | bounded context legado interno | manter apenas contratos legados internos; novas superficies usam `src/core/community-*` e `src/modules/community-*`, nunca `src/modules/community` |
| coverage | core transversal legítimo | manter em `src/core/coverage` |
| events | domínio de produto | eventos publicos canonicos vivem em `src/core/verticals/events`; o modulo comunitario fica em `src/modules/community-events` |
| family | core transversal legítimo | manter em `src/core/family` |
| favorites | core transversal legítimo | manter em `src/core/favorites` |
| feed | core transversal legítimo | manter em `src/core/feed` |
| gamification | core transversal legítimo | manter em `src/core/gamification` |
| gastronomy | namespace vertical legado removido | nao recriar `src/core/gastronomy`; produto/UI ficam em `src/modules/business/gastronomy` e ownership compartilhavel de persistencia/contratos fica em `src/core/business/**` |
| geocoding | core transversal legítimo | manter em `src/core/geocoding` |
| geospatial | core transversal legítimo | manter em `src/core/geospatial` |
| governance | core transversal legítimo | manter em `src/core/governance` |
| interaction | facade duplicada em retirada | migrar consumidores para owners tipados conforme Core Platform SSOT |
| landing | composição app/rota/página | **migrado** para `src/app/features/landing` |
| location | core transversal legítimo | manter em `src/core/location` |
| lostfound | domínio de produto | owner explicito em `src/core/community-lost-found`; modulo transversal em `src/modules/community-lost-found` |
| maps | core transversal legítimo | manter em `src/core/maps` |
| media | core transversal legítimo | manter em `src/core/media` |
| messaging | core transversal legítimo | manter em `src/core/messaging` |
| metrics | core transversal legítimo | consolidar com `analytics`/`telemetry` |
| mobility | domínio operacional compartilhado | manter contratos, serviços e UI cross-domain em `src/core/mobility`; telas de produto em `src/modules/mobility` |
| moderation | core transversal legítimo | manter em `src/core/moderation` |
| notifications | core transversal legítimo | manter em `src/core/notifications` |
| permissions | tipos paralelos sem runtime | consolidar contratos em `src/core/authorization` |
| posts | core transversal legítimo | manter em `src/core/posts` |
| pricing | core transversal legítimo | manter em `src/core/pricing` |
| privacy | core transversal legítimo | manter em `src/core/privacy` |
| professional | domínio de produto | migrar para `src/modules/professionals/services` |
| profile | legado/duplicidade conceitual | **migrado** para `src/core/profiles` + `src/modules/profile` |
| profiles | core transversal legítimo | manter em `src/core/profiles` |
| public-identity | core transversal legítimo | manter em `src/core/public-identity` |
| qr | core transversal legítimo | manter em `src/core/qr` |
| realtime | core transversal legítimo | manter em `src/core/realtime` |
| residence | subdomínio transversal de localização | consolidar em `src/core/location` |
| reviews | core transversal legítimo | manter em `src/core/reviews` |
| rollout | core transversal legítimo | manter em `src/core/rollout` |
| routing | composição de aplicação (shell/rotas) | migrar gradualmente para `src/app/routes` |
| safety | core transversal legítimo | manter em `src/core/safety` |
| search | core transversal legítimo | manter em `src/core/search` |
| service-areas | core transversal legítimo | manter em `src/core/service-areas` |
| session | core transversal legítimo | manter em `src/core/session` |
| social | core transversal legítimo | manter em `src/core/social` |
| subscription | core transversal legítimo | manter em `src/core/subscription` |
| telemetry | core transversal legítimo | consolidar com `analytics`/`metrics` |
| territorial | core transversal legítimo | manter em `src/core/territorial` |
| tourist-points | domínio de produto | **migrado** para `src/modules/guide/tourist-points` |
| tracking | core transversal legítimo | manter em `src/core/tracking` |
| users | core transversal legítimo | manter em `src/core/users` |
| verification | core transversal legítimo | manter em `src/core/verification` |
| verticals | configuração transversal de verticalização | manter em `src/core/verticals` |

## Execução aplicada nesta rodada
- Fronteiras consolidadas:
  - facades `src/core/community-alerts` e `src/modules/community-alerts`
    removidas; consumidores usam diretamente o owner
    `src/core/community/alerts`
  - `src/core/community-issues` mantido como owner explicito de problemas
    comunitarios; superficie de produto em `src/modules/community-issues`
  - `src/core/promotions` -> `src/modules/business/promotions`
  - `src/core/services` -> `src/modules/professionals/services`
  - `src/core/vagas` -> `src/modules/classifieds/jobs`
  - `src/core/classifieds` -> `src/modules/classifieds`
  - `src/core/events` legado substituido por `src/core/verticals/events` e
    `src/modules/community-events`
  - `src/core/gastronomy` legado removido; Gastronomy de produto/UI permanece
    em `src/modules/business/gastronomy` e persistencia/contratos reutilizaveis
    sao canonicos em `src/core/business/**`
  - `src/core/lostfound` legado substituido por `src/core/community-lost-found`
    e `src/modules/community-lost-found`
  - `src/core/tourist-points` -> `src/modules/guide/tourist-points`
  - `src/core/civic` removido sem recriar agregador `src/modules/community`
- Removido de `core` e consolidado em `app`:
  - `src/core/landing` -> `src/app/features/landing`
- Supabase retirado de `core`:
  - removido `src/core/supabase`
  - canônico em `src/integrations/supabase`
  - imports atualizados para `@/integrations/supabase`
- Mobility ficou dividido por responsabilidade:
  - `src/core/mobility` e o dono de contratos, servicos operacionais, tracking,
    delivery core e UI cross-domain reutilizada por mais de um dominio;
  - `src/modules/mobility` e o dono das paginas, jornadas e componentes
    especificos do produto Mobility;
  - caminhos antigos em `src/modules/mobility` podem reexportar contratos
    promovidos para `core`, mas `src/core` nao deve reexportar implementacoes de
    `modules`.

## Árvore alvo oficial (core)

```text
src/core/
  address auth authorization billing business coverage geocoding geospatial
  governance location maps media messaging moderation notifications
  permissions posts pricing privacy profiles public-identity qr realtime
  reviews rollout safety search service-areas session social subscription
  territorial tracking users verification
  mobility
  community-experience community-feed community-groups community-issues
  community-lost-found community-recommendations
  analytics metrics telemetry
  verticals
```

## Blindagem anti-regressão
- `tools/architecture/validate-project-taxonomy.ts` bloqueia reintrodução em `src/core` de:
  - `admin-identidade`, `admin-motoristas`, `community-alerts`, `supabase`, `profile`, `promotions`, `services`, `vagas`, `classifieds`, `civic`, `events`, `tourist-points`, `landing`, `lostfound`, `gastronomy`
  - referencias ativas que tentem recriar `src/modules/community` como destino
    atual para issues, eventos, lost-found ou civic.
- Regra operacional: novo diretório em `src/core` só entra com ADR/SSOT e validador atualizado no mesmo PR.
