# PENDING G104 — Admin Mobility Analytics Snapshot

Data: 2026-09-12
Status: **NÃO EXECUTÁVEL / NÃO APLICADO**

## Motivo

A superfície `/admin/analytics-mobilidade` ainda agrega dados no navegador e a solução final continua precisando de uma fronteira server-side.

O G109 reduziu o problema sem DDL:

- `ride_requests` deixou de ser baixado como histórico global nessa superfície;
- `AdminMobilityAnalyticsReadService.listWindowRides(startIso)` lê somente linhas que podem afetar criação ou resolução dentro da janela selecionada;
- a projeção de corrida ficou limitada a lifecycle, valor concluído e `driver_profile_id`;
- rotas, endereços, identidade de passageiro, notas, metadata e presença operacional não entram no payload de analytics.

G113/G114 reduziram também a superfície de motorista:

- `AdminMobilityAnalyticsDriverReadService.listMetricRows()` lê globalmente somente `profile_id + is_verified` para cardinalidade/verificação;
- identidade (`name/display_name/avatar_url`) é carregada separadamente por `listDirectory(profileIds)` apenas para motoristas que aparecem nas corridas concluídas da janela;
- o antigo `adminMobilityService.getAllDriversComplete()` e seu DTO global foram removidos fisicamente.

Ainda permanecem globais no browser enquanto este gate estiver pendente:

- linhas mínimas `profile_id + is_verified` de todos os motoristas;
- `adminMobilityService.getAllRideRatings()` porque a UI atual declara explicitamente **“Avaliação média geral”** e janelar ratings mudaria a semântica do produto;
- a agregação final dessas métricas continua sendo feita no cliente.

Portanto G109/G113/G114 reduzem custo e exposição, mas não substituem G104. O custo dos conjuntos globais remanescentes ainda cresce com a base.

O G103 corrigiu a semântica das métricas; o G104 deve mover a agregação para uma fronteira server-side sem alterá-la.

## Bloqueio remoto atual

O projeto Supabase `xhdowzacfujckjelqhtd` continua inacessível pelo caminho SQL usado para preflight.

Em 2026-09-12 foram repetidos dois testes via conexão Supabase direta:

1. preflight de metadata/schema;
2. `select 1 as ok` isolado.

Ambos encerraram com `Connection terminated due to connection timeout`.

Por isso este documento **não é uma migration canônica** e nenhum DDL foi aplicado.

Também não foi inventado timestamp/nome em `supabase/migrations`. Quando a CLI/conexão voltar, materializar com:

```bash
supabase migration new mobility_admin_analytics_snapshot_g104
```

Somente o arquivo criado por esse comando poderá receber o SQL aprovado e ser promovido.

## Divergência de schema obrigatória no preflight

Há uma inconsistência versionada que precisa ser resolvida antes de escrever/promover o SQL do G104:

- `src/integrations/supabase/types.generated.ts` não expõe `actual_fare` em `ride_requests.Row`;
- migrations posteriores G73/G74 consultam explicitamente `ride.actual_fare` em `public.ride_requests`.

Logo, **não é permitido assumir** nem que `actual_fare` existe, nem que foi removido no ambiente remoto.

O preflight deve consultar o schema real e então:

1. se `actual_fare` existir, regenerar os tipos e preservar a semântica `COALESCE(final_price, actual_fare, 0)`;
2. se `actual_fare` não existir, tratar G73/G74 como inconsistência de migration/source e corrigir a authority antes de materializar G104;
3. nunca substituir `actual_fare` por `suggested_price` como fallback de valor realizado.

## Authority proposta

Criar uma função de domínio:

`public.mobility_get_admin_analytics_snapshot(p_days integer) -> jsonb`

Características obrigatórias:

- `STABLE`;
- `SECURITY DEFINER` somente porque o snapshot administrativo precisa agregar globalmente sem expor linhas base ao browser;
- `SET search_path TO ''`;
- `SET statement_timeout TO '5s'`;
- `auth.uid()` obrigatório;
- autorização interna via `private.is_admin(auth.uid())`;
- `p_days` limitado a uma janela segura (7/30/90 ou, no máximo, 1..90);
- nenhum parâmetro de `profile_id`, `user_id` ou actor fornecido pelo navegador;
- retorno somente agregado/read-model, sem PII de passageiro, localização, rota, endereço, telefone ou metadata de custódia;
- `REVOKE ALL ... FROM PUBLIC`;
- `REVOKE EXECUTE ... FROM anon`;
- `GRANT EXECUTE ... TO authenticated, service_role` somente após o check interno de admin;
- comentários e verificação de grants no final da migration.

A escolha de `SECURITY DEFINER` só é aceitável com os controles acima porque o snapshot precisa atravessar RLS para agregação administrativa global. Não usar `SECURITY DEFINER` como correção genérica de permissão.

## Contrato de saída

O payload deve substituir exatamente o trabalho hoje feito no hook G103/G109/G113:

```ts
{
  stats: {
    totalRides: number;
    openRides: number;
    preAcceptRides: number;
    driverOwnedOpenRides: number;
    resolvedRides: number;
    completedRides: number;
    cancelledRides: number;
    failedRides: number;
    expiredRides: number;
    totalDrivers: number;
    verifiedDrivers: number;
    unverifiedDrivers: number;
    completedValue: number;
    avgRating: number;
    verificationRate: number;
    completionRate: number;
    cancellationRate: number;
  };
  dailyData: Array<{
    date: string;
    ridesCreated: number;
    completedValue: number;
    completed: number;
    cancelled: number;
  }>;
  topDrivers: Array<{
    driver: {
      id: string;
      name?: string;
      profile?: { avatar_url?: string };
    };
    count: number;
    completedValue: number;
  }>;
}
```

## Semântica financeira obrigatória

A intenção versionada do G103/G73/G74 é que valor realizado use `final_price` e, quando comprovadamente existente no schema, `actual_fare`.

A expressão alvo permanece:

`COALESCE(final_price, actual_fare, 0)`

**somente se o preflight remoto confirmar `actual_fare`**.

Nunca usar `suggested_price` como valor concluído e nunca chamar esse agregado de receita líquida da plataforma.

## Semântica temporal

- `ridesCreated`: `created_at` dentro da janela;
- conclusão: `COALESCE(completed_at, updated_at, created_at)`;
- cancelamento: `COALESCE(cancelled_at, updated_at, created_at)`;
- top motoristas: somente corridas `completed` resolvidas dentro da janela;
- valor concluído: associado ao timestamp de conclusão, não ao dia em que a corrida foi criada;
- `avgRating` permanece geral enquanto a UI disser “Avaliação média geral”; qualquer mudança para nota da janela exige alteração explícita de contrato/UI.

## Lifecycle

G62 já bloqueia novas escritas fora dos estados canônicos, mas não fornece classificadores SQL reutilizáveis. O G102 é hoje a authority de leitura no TypeScript.

Na migration G104, **não espalhar listas de status em várias CTEs**. Definir cada conjunto uma única vez dentro da função (CTE/arrays locais) e derivar:

- open;
- pre-accept;
- driver-owned open;
- cancelled;
- resolved.

Os conjuntos devem permanecer semanticamente equivalentes a `RideLifecycleStatus.ts`, inclusive compatibilidade histórica `cancelled` e aliases de leitura ainda suportados.

Se outro RPC precisar da mesma classificação depois do G104, promover esses classificadores para helpers `private.*` em gate separado; não criar helpers globais especulativos agora.

## Índices / performance

O repositório já versiona índices para:

- `ride_requests(status)`;
- `ride_requests(driver_profile_id)`;
- `(ride_mode, status)`;
- ratings por `(rated_id, created_at)` e unicidade por corrida/rater.

Não foi encontrado índice versionado específico para as janelas temporais usadas pelo analytics.

Antes de promover G104, validar com `EXPLAIN (ANALYZE, BUFFERS)`/advisors e, se necessário, incluir na migration os índices mínimos comprovados, por exemplo:

- `ride_requests(created_at)`;
- índice parcial/adequado para `completed_at` em `status='completed'`;
- índice parcial/adequado para `cancelled_at` nos estados de cancelamento.

Não adicionar índices por suposição: a escolha final depende do schema/estatísticas remotos e do plano real.

## Cutover do frontend

`AdminMobilityAnalyticsReadService` e `AdminMobilityAnalyticsDriverReadService` são fronteiras transitórias de redução de exposição enquanto G104 está bloqueado.

Depois que a migration for aplicada e validada:

1. trocar a implementação da fronteira de analytics para `mobility_get_admin_analytics_snapshot(p_days)`;
2. `useAdminMobilityAnalytics` passa a consumir um único snapshot agregado;
3. remover do hook `AdminMobilityAnalyticsDriverReadService.listMetricRows()` e `adminMobilityService.getAllRideRatings()`;
4. remover `AdminMobilityAnalyticsDriverReadService.listDirectory()` se o RPC já retornar `topDrivers` completo e a busca confirmar ausência de outros consumidores;
5. remover `getAllRideRatings()` se a busca confirmar que ficou sem outros consumidores;
6. manter removido `getAllDriversComplete()` — G114 já aposentou definitivamente esse reader;
7. substituir os ratchets transitórios G109/G113 por um ratchet que proíba qualquer leitura de linha base dentro do hook de analytics.

## Preflight obrigatório para promoção

1. conexão SQL remota operacional;
2. capturar definition/grants atuais de `private.is_admin(uuid)` e confirmar uso suportado;
3. confirmar colunas atuais de `ride_requests`, incluindo **explicitamente `actual_fare`**, além de `driver_data`, `profiles` e `ride_ratings`;
4. reconciliar/regenerar `types.generated.ts` contra o schema confirmado;
5. confirmar índices reais via `pg_indexes`;
6. materializar migration com `supabase migration new mobility_admin_analytics_snapshot_g104`;
7. rodar lint/parser da migration;
8. aplicar em ambiente autorizado;
9. testar não-admin => `42501`/negado;
10. testar admin => snapshot sem PII;
11. comparar numericamente snapshot server-side vs G103/G109/G113 em 7/30/90 dias;
12. verificar query plan/advisors;
13. só então fazer o cutover do hook e remover readers globais remanescentes sem consumidores.

## Estado deste gate

**PENDING / FAIL-CLOSED.** Nenhum deploy, migration ou alteração de banco foi realizada durante este checkpoint.
