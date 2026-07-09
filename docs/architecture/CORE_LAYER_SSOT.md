# CORE Layer SSOT (Arquitetura Oficial)

Data: 2026-04-22
Escopo: `src/core`

## Papel oficial da camada `core`
`src/core` é fundação transversal reutilizável do sistema: autenticação/sessão/perfis, autorização/permissões, localização/território/mapas/geoespacial, comunicação/notificações/realtime, billing/subscription/pricing, observabilidade e governança.

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
| business | domínio de produto | migrar para `src/modules/business` |
| city | subdomínio territorial transversal | consolidar em `src/core/location`/`territorial` |
| civic | domínio de produto | **migrado** para `src/modules/community` |
| comments | core transversal legítimo | manter em `src/core/comments` |
| community | domínio de produto | migrar para `src/modules/community` |
| coverage | core transversal legítimo | manter em `src/core/coverage` |
| events | domínio de produto | **migrado** para `src/modules/community/events` |
| family | core transversal legítimo | manter em `src/core/family` |
| favorites | core transversal legítimo | manter em `src/core/favorites` |
| feed | core transversal legítimo | manter em `src/core/feed` |
| gamification | core transversal legítimo | manter em `src/core/gamification` |
| gastronomy | vertical de produto | **migrado** para `src/modules/business/gastronomy` |
| geocoding | core transversal legítimo | manter em `src/core/geocoding` |
| geospatial | core transversal legítimo | manter em `src/core/geospatial` |
| governance | core transversal legítimo | manter em `src/core/governance` |
| interaction | core transversal legítimo | manter em `src/core/interaction` |
| landing | composição app/rota/página | **migrado** para `src/app/features/landing` |
| location | core transversal legítimo | manter em `src/core/location` |
| lostfound | domínio de produto | **migrado** para `src/modules/community/lostfound` |
| maps | core transversal legítimo | manter em `src/core/maps` |
| media | core transversal legítimo | manter em `src/core/media` |
| messaging | core transversal legítimo | manter em `src/core/messaging` |
| metrics | core transversal legítimo | consolidar com `analytics`/`telemetry` |
| mobility | domínio operacional compartilhado | manter contratos, serviços e UI cross-domain em `src/core/mobility`; telas de produto em `src/modules/mobility` |
| moderation | core transversal legítimo | manter em `src/core/moderation` |
| notifications | core transversal legítimo | manter em `src/core/notifications` |
| permissions | core transversal legítimo | manter em `src/core/permissions` |
| posts | core transversal legítimo | manter em `src/core/posts` |
| pricing | core transversal legítimo | manter em `src/core/pricing` |
| privacy | core transversal legítimo | manter em `src/core/privacy` |
| professional | domínio de produto | migrar para `src/modules/professionals/services` |
| profile | legado/duplicidade conceitual | consolidar em `src/core/profiles` + `src/modules/profile` |
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
- Removidos de `core` e consolidados em `modules`:
  - `src/core/community-alerts` -> `src/modules/community/alerts`
  - `src/core/community-issues` -> `src/modules/community/issues`
  - `src/core/promotions` -> `src/modules/business/promotions`
  - `src/core/services` -> `src/modules/professionals/services`
  - `src/core/vagas` -> `src/modules/classifieds/jobs`
  - `src/core/classifieds` -> `src/modules/classifieds`
  - `src/core/events` -> `src/modules/community/events`
  - `src/core/gastronomy` -> `src/modules/business/gastronomy`
  - `src/core/lostfound` -> `src/modules/community/lostfound`
  - `src/core/tourist-points` -> `src/modules/guide/tourist-points`
  - `src/core/civic` -> `src/modules/community` (facade removida)
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
  address auth authorization billing coverage geocoding geospatial
  governance location maps media messaging moderation notifications
  permissions posts pricing privacy profiles public-identity qr realtime
  reviews rollout safety search service-areas session social subscription
  territorial tracking users verification
  mobility
  analytics metrics telemetry
  verticals
```

## Blindagem anti-regressão
- `scripts/validate-project-taxonomy.ts` bloqueia reintrodução em `src/core` de:
  - `admin-identidade`, `admin-motoristas`, `community-alerts`, `community-issues`, `supabase`, `promotions`, `services`, `vagas`, `classifieds`, `civic`, `events`, `tourist-points`, `landing`, `lostfound`, `gastronomy`
- Regra operacional: novo diretório em `src/core` só entra com ADR/SSOT e validador atualizado no mesmo PR.

