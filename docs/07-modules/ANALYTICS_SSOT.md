# Analytics SSOT

Status: G4 global Analytics authority fechado em 2026-08-29
Owner: `src/core/analytics/AnalyticsService.ts` + RPCs/tabelas canônicas no Supabase

## 1. Decisão

O Analytics horizontal da plataforma possui um único owner de aplicação:
`src/core/analytics/AnalyticsService.ts`.

Domínios podem definir **eventos e métricas derivadas**, mas não podem criar um
segundo gateway para `public.analytics_events`, `public.analytics_sessions` ou
`public.analytics_daily_metrics`.

A escrita de eventos passa por `public.track_analytics_event(...)`. O browser
não recebe DML direto nas tabelas de evento/sessão. Leituras agregadas passam por
`get_analytics_metrics`, `get_recent_analytics_events` ou pela leitura de
`analytics_daily_metrics` encapsulada no `AnalyticsService`.

## 2. Autoridades

| Responsabilidade | Autoridade |
| --- | --- |
| Tipos de evento/source no cliente | `src/core/analytics/AnalyticsService.ts` |
| Tracking browser | `AnalyticsService.trackEvent()` -> `public.track_analytics_event` |
| Session id de tracking | `AnalyticsService.getSessionId()` |
| Métricas agregadas | `AnalyticsService.getMetrics()` -> `public.get_analytics_metrics` |
| Eventos recentes | `AnalyticsService.getRecentEvents()` -> `public.get_recent_analytics_events` |
| Série diária | `AnalyticsService.getDailyMetrics()` -> `public.analytics_daily_metrics` sob RLS |
| Persistência de eventos | `public.analytics_events` |
| Persistência de sessão | `public.analytics_sessions` |
| Read model diário | `public.analytics_daily_metrics` |
| Ratchet arquitetural | `tools/architecture/validate-analytics-ssot.ts` |

## 3. Escrita

`track_analytics_event` é `SECURITY DEFINER`, possui `search_path` endurecido e
não concede `EXECUTE` a `PUBLIC`. `anon`, `authenticated` e `service_role`
executam o broker explicitamente conforme o contrato versionado.

O RPC valida identidade, sessão e rate limit. Para tráfego anônimo, uma sessão
válida é obrigatória. Grants diretos de `INSERT/UPDATE/DELETE` em
`analytics_events` e `analytics_sessions` para browser permanecem revogados.

A policy histórica `analytics_events_public_insert` ainda existe no remoto, mas
é **inert** porque `anon` e `authenticated` não possuem INSERT na tabela. Sua
remoção física é dívida de G5 Database/RLS, não uma segunda autoridade ativa.

## 4. Leitura e autorização de Business

Em 2026-08-29 foi encontrado drift remoto real nas policies de leitura:
`business_data.profile_id` referencia `profiles.id`, porém a policy antiga o
comparava diretamente com `auth.uid()` (`auth.users.id`). Auditoria estrutural
do remoto confirmou 100/100 linhas de `business_data.profile_id` correspondendo
a `profiles.id` e 0/100 correspondendo diretamente a `auth.users.id`.

A migration
`20260829164446_repair_analytics_business_read_authority.sql` corrigiu o
contrato:

- `analytics_daily_metrics` é `SELECT` somente para `authenticated`;
- Business metrics usam `private.can_manage_profile(bd.profile_id)`;
- admin global continua autorizado por `private.is_admin(auth.uid())`;
- `analytics_events` preserva a policy global de admin e usa
  `private.can_manage_profile` para Business managers;
- `anon` perdeu SELECT em `analytics_events` e `analytics_daily_metrics`;
- `get_analytics_metrics` e `get_recent_analytics_events` perderam
  `PUBLIC/anon EXECUTE` e permanecem executáveis por `authenticated` e
  `service_role`.

`private.can_manage_profile` é a autoridade já adotada por Business: dono direto
do Profile ou membership ativo `owner/admin`. Analytics não reimplementa essa
regra.

## 5. Contratos TypeScript x remoto

O RPC `get_recent_analytics_events` retorna somente:

- `id`;
- `event_type`;
- `event_source`;
- `user_id`;
- `session_id`;
- `created_at`.

O TypeScript agora expõe `RecentAnalyticsEvent` exatamente com esse shape. Foi
removido o antigo cast para um row completo de `analytics_events`, que prometia
campos que o RPC não retornava.

A union `AnalyticsEventType` também foi reconciliada com o enum remoto
`public.analytics_event_type`. Dois valores sem contraparte no banco e sem
produtor runtime (`structured_vaga_click_search` e
`structured_vaga_open_search`) foram removidos do source em vez de expandir o
schema para acomodar código morto.

## 6. Superfícies aposentadas em G4

Foram removidas por não terem caller runtime ou por duplicarem autoridade:

- `src/core/analytics/services/AnalyticsService.ts` — adapter duplicado com o
  mesmo nome do owner;
- `src/core/analytics/hooks/*` — hooks de apresentação dentro de `core`;
- `src/core/analytics/config/dashboards.config.ts` — configuração de Power BI de
  apresentação dentro de `core`;
- `src/core/analytics/pages/AnalyticsPage.tsx` — página pausada dentro de
  `core`;
- `WorkOpportunityCirculationAnalyticsService` — read model pausado que lia
  `analytics_events` diretamente e era incompatível com o RLS remoto.

As rotas de Analytics já estavam explicitamente pausadas por
`createLaunchPausedRoute("Analytics")`. Quando a UI voltar ao launch scope, ela
deve nascer em `src/modules/analytics` e consumir apenas o facade do core.

## 7. Work Opportunities

A telemetria ativa de Work Opportunities permanece válida e não possui store
paralelo. `WorkOpportunityTelemetryService` delega eventos a
`AnalyticsService.trackEvent()` e reutiliza `AnalyticsService.getSessionId()`.
A semântica específica do domínio fica em `metadata.event_name` e demais
metadados, enquanto o tipo de evento usa o enum horizontal existente.

O antigo dashboard de circulação foi aposentado porque sua única UI estava
pausada e sua leitura direta de `analytics_events` não era autorizada para todos
os perfis que a UI simulava suportar. Não foi criado um novo RPC genérico apenas
para preservar código morto.

## 8. Analytics de domínio que não são duplicação horizontal

`education_analytics_events` é uma store específica do domínio Education, com
contrato e lifecycle próprios, e não é writer de `public.analytics_events`.
Da mesma forma, `src/shared/utils/monitoring/analytics` representa diagnóstico
local/session performance e não persiste no SSOT horizontal.

Esses nomes devem continuar semanticamente separados. Se um domínio começar a
registrar o mesmo fato operacional em dois stores como fonte de verdade, isso é
nova violação e deve ser reconciliado.

## 9. Ratchet

`tools/architecture/validate-analytics-ssot.ts` está no Gate-First e falha quando:

- qualquer caminho Analytics aposentado reaparece;
- código em `src` acessa `analytics_events` ou `analytics_sessions` diretamente;
- código fora do owner lê `analytics_daily_metrics` diretamente;
- código fora do owner chama `track_analytics_event`, `get_analytics_metrics`
  ou `get_recent_analytics_events` diretamente;
- o owner deixa de expor os contratos canônicos esperados.

A allowlist não inclui o antigo read model de Work Opportunities nem o antigo
adapter de tracking.

## 10. Evidência e limite do fechamento

No checkpoint G4 de 2026-08-29:

- há um único owner horizontal no source;
- writers ativos convergem em `track_analytics_event`;
- browser não possui DML direto nas tabelas centrais;
- readers de Business usam a autoridade canônica de Profile management;
- `anon` não lê os read models privados de Business;
- contratos de enum e RPC estão alinhados ao remoto conhecido;
- o read model paralelo pausado foi removido;
- o ratchet está ligado ao Gate-First.

A policy INSERT inerte e a auditoria exaustiva de grants/policies históricas
permanecem para G5. A certificação hosted same-SHA permanece separada em G7;
runner sem steps não é tratado como PASS de código.
