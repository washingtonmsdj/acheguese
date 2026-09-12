# G109 — Admin Mobility Analytics Ride Window

Data: 2026-09-12
Status: **SOURCE-CLOSED / G104 AINDA PENDENTE / REMOTE SCHEMA PREFLIGHT PENDENTE**

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
- `actual_fare` — mantido como divergência explícita até preflight remoto;
- `driver_profile_id`.

Não entram nesse payload rota, endereço, identidade de passageiro, notas, metadata de custódia ou presença operacional.

## Divergência `actual_fare`

A validação posterior contra `src/integrations/supabase/types.generated.ts` mostrou que o snapshot TypeScript versionado de `ride_requests.Row` não expõe `actual_fare`.

Por outro lado, migrations posteriores G73/G74 referenciam explicitamente `ride.actual_fare` em `public.ride_requests`.

Portanto o repositório possui uma divergência de fontes versionadas que não pode ser resolvida por suposição enquanto a introspecção SQL remota estiver indisponível. O reader G109 modela `actual_fare` explicitamente fora do `Pick<Tables<"ride_requests">,...>` para tornar essa exceção visível.

O preflight remoto deve confirmar a coluna real e regenerar os tipos antes da promoção do G104. Este checkpoint não afirma que `actual_fare` existe ou não no ambiente remoto.

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
- `AdminMobilityAnalyticsReadService` passa a ser a fronteira estável que futuramente trocará sua implementação pelo RPC agregado `mobility_get_admin_analytics_snapshot`;
- a semântica financeira envolvendo `actual_fare` não pode ser promovida em SQL sem resolver a divergência de schema no preflight.

Nenhum DDL ou deploy Supabase foi executado.

## Ratchet

`src/modules/mobility/__tests__/AdminMobilityAnalyticsWindowG109.test.ts`

O ratchet impede:

- retorno de `getAllRides()` ao hook;
- retorno de `select("*")` ao reader janelado;
- inclusão de campos de rota/passageiro na projeção;
- perda de qualquer um dos relógios de criação/resolução;
- mudança silenciosa de “Avaliação média geral” para rating janelado.

## Validação

Os diffs GitHub e o snapshot de tipos versionado foram verificados após as escritas. Este checkpoint não declara suite verde nem schema remoto certificado: o ratchet foi versionado, mas nenhuma execução de CI confiável foi observada neste gate e a divergência `actual_fare` permanece aberta para preflight remoto.
