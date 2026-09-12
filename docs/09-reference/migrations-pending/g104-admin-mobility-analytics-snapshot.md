# PENDING G104 — Admin Mobility Analytics Snapshot

Data: 2026-09-12
Status: **NÃO EXECUTÁVEL / NÃO APLICADO**

## Motivo

A superfície `/admin/analytics-mobilidade` ainda agrega dados no navegador e a solução final continua precisando de uma fronteira server-side.

O G109 reduziu o problema sem DDL:

- `ride_requests` deixou de ser baixado como histórico global nessa superfície;
- `AdminMobilityAnalyticsReadService.listWindowRides(startIso)` lê somente linhas que podem afetar criação ou resolução dentro da janela selecionada;
- a projeção de corrida ficou limitada a `status`, timestamps de criação/resolução, valor concluído e `driver_profile_id`;
- rotas, endereços, identidade de passageiro, notas, metadata e presença operacional não entram no payload de analytics.

Ainda permanecem globais no browser enquanto este gate estiver pendente:

- `adminMobilityService.getAllDriversComplete()` para contagem/verificação e identidade mínima do ranking;
- `adminMobilityService.getAllRideRatings()` porque a UI atual declara explicitamente **“Avaliação média geral”** e janelar ratings mudaria a semântica do produto.

Portanto G109 é uma redução de custo e exposição, não substitui G104. O custo dos dois conjuntos globais remanescentes ainda cresce com a base, e a agregação de métricas continua no cliente.

O G103 corrigiu a semântica dessas métricas; o G104 deve mover a agregação para uma fronteira server-side sem alterar essa semântica.

## Bloqueio remoto atual

O projeto Supabase `xhdowzacfujckjelqhtd` está `ACTIVE_HEALTHY`, porém o caminho SQL/metadata estava encerrando por timeout inclusive para `select 1` e geração de tipos no último preflight confirmado.

Por isso este documento **não é uma migration canônica** e nenhum DDL foi aplicado.

Também não foi inventado timestamp/nome em `supabase/migrations`. Quando a CLI/conexão voltar, materializar com:

```bash
supabase migration new mobility_admin_analytics_snapshot_g104
```

Somente o arquivo criado por esse comando poderá receber o SQL aprovado e ser promovido.

## Authority proposta

Criar uma função de domínio:

`public.mobility_get_admin_analytics_snapshot(p_days integer) -> jsonb`

Características obrigatórias:

- `STABLE`;
- `SECURITY DEFINER` apenas porque o snapshot administrativo precisa agregar globalmente sem expor linhas base ao browser;
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

## Contrato de saída

O payload deve substituir exatamente o trabalho hoje feito no hook G103/G109:

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

Valor realizado continua sendo somente:

`COALESCE(final_price, actual_fare, 0)`

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
- índice parcial/adequado para `cancelled_at` nos estados de cancelamento;

Não adicionar índices por suposição: a escolha final depende do schema/estatísticas remotos e do plano real.

## Cutover do frontend

`AdminMobilityAnalyticsReadService` já existe desde o G109 como fronteira estável para o frontend. Enquanto G104 estiver bloqueado, ele lê apenas as linhas de corrida potencialmente relevantes à janela.

Depois que a migration for aplicada e validada:

1. trocar a implementação de `AdminMobilityAnalyticsReadService` para `mobility_get_admin_analytics_snapshot(p_days)`;
2. `useAdminMobilityAnalytics` passa a consumir um único snapshot agregado;
3. remover do hook `getAllDriversComplete()` e `getAllRideRatings()`;
4. remover `getAllRideRatings()` se a busca confirmar que ficou sem outros consumidores;
5. manter/remover `getAllRides()` e `getAllDriversComplete()` conforme os consumidores reais restantes (`admin.queries.ts`/realtime), nunca por suposição;
6. substituir o ratchet G109 por um ratchet que proíba qualquer leitura de linha base dentro do hook de analytics.

## Preflight obrigatório para promoção

1. conexão SQL remota operacional;
2. capturar definition/grants atuais de `private.is_admin(uuid)` e confirmar uso suportado;
3. confirmar colunas atuais de `ride_requests`, `driver_data`, `profiles` e `ride_ratings`;
4. confirmar índices reais via `pg_indexes`;
5. materializar migration com `supabase migration new mobility_admin_analytics_snapshot_g104`;
6. rodar lint/parser da migration;
7. aplicar em ambiente autorizado;
8. testar não-admin => `42501`/negado;
9. testar admin => snapshot sem PII;
10. comparar numericamente snapshot server-side vs G103/G109 em 7/30/90 dias;
11. verificar query plan/advisors;
12. só então fazer o cutover do hook e remover os readers globais sem consumidores.

## Estado deste gate

**PENDING / FAIL-CLOSED.** Nenhum deploy, migration ou alteração de banco foi realizada durante este checkpoint.
