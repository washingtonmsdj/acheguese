# G109 — Admin Mobility Analytics Ride Window

Data: 2026-09-12
Status: **SOURCE-CLOSED / G104 AINDA PENDENTE**

## Problema

`/admin/analytics-mobilidade` oferecia períodos de 7/30/90 dias, mas o hook continuava chamando `adminMobilityService.getAllRides()` e baixando o histórico inteiro de `ride_requests` para o navegador.

Isso era desnecessário e aumentava custo de rede, memória e exposição de dados conforme o histórico crescia.

## Correção

Foi criada a fronteira:

`src/core/admin/services/AdminMobilityAnalyticsReadService.ts`

Ela lê apenas linhas que podem afetar a janela escolhida:

- `created_at >= startIso` para corridas criadas no período;
- `completed_at >= startIso` para conclusões;
- `cancelled_at >= startIso` para cancelamentos;
- `updated_at >= startIso` para preservar o fallback histórico de resolução definido no G103.

A projeção foi limitada a:

- `status`;
- `created_at`;
- `updated_at`;
- `completed_at`;
- `cancelled_at`;
- `final_price`;
- `actual_fare`;
- `driver_profile_id`.

Não entram nesse payload rota, endereço, identidade de passageiro, notas, metadata de custódia ou presença operacional.

## Hook

`useAdminMobilityAnalytics` deixou de usar:

`adminMobilityService.getAllRides()`

E passou a usar:

`AdminMobilityAnalyticsReadService.listWindowRides(startISO)`

Também foi removido o cast `as unknown as AnalyticsRide[]` do conjunto de corridas.

## Ratings

`getAllRideRatings()` foi mantido deliberadamente neste gate porque a UI atual declara **“Avaliação média geral”**.

Filtrar ratings por 7/30/90 dias alteraria a semântica do produto silenciosamente. O G104 deve substituir essa leitura por agregado server-side preservando a semântica geral, a menos que UI/contrato sejam explicitamente alterados em gate próprio.

## G104

O plano pendente `g104-admin-mobility-analytics-snapshot.md` foi reconciliado:

- a leitura global de corridas já não faz parte do hook de analytics;
- drivers e ratings globais ainda permanecem;
- `AdminMobilityAnalyticsReadService` passa a ser a fronteira estável que futuramente trocará sua implementação pelo RPC agregado `mobility_get_admin_analytics_snapshot`.

Nenhum DDL ou deploy Supabase foi executado.

## Ratchet

`src/modules/mobility/__tests__/AdminMobilityAnalyticsWindowG109.test.ts`

O ratchet impede:

- retorno de `getAllRides()` ao hook;
- retorno de `select("*")` ao reader janelado;
- inclusão de campos de rota/passsageiro na projeção;
- perda de qualquer um dos relógios de criação/resolução;
- mudança silenciosa de “Avaliação média geral” para rating janelado.

## Validação

Os diffs GitHub foram verificados após as escritas. Este checkpoint não declara suite verde: o ratchet foi versionado, mas nenhuma execução de CI confiável foi observada neste gate.
