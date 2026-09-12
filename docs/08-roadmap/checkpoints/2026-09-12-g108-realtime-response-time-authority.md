# G108 — Realtime response-time authority

Status: **SOURCE-CLOSED / REMOTE CERTIFICATION PENDING**

Data: 2026-09-12

## Problema de raiz

O dashboard administrativo exibia `avgResponseTime`, mas o cálculo vinha de campos `avg_response_time_minutes` / `avg_response_time_seconds` procurados no read model de motorista. Esses campos não pertencem ao contrato real usado pelo admin e, na prática, a ausência deles era convertida em `0 min`.

Isso misturava duas responsabilidades:

- perfil/cadastro do motorista;
- latência de resposta a uma oferta de corrida, que é um fato de lifecycle.

## Authority correta

O lifecycle de mobilidade já possui os timestamps necessários:

- `driver_assigned_at`: gravado quando o dispatch atribui a oferta ao motorista;
- `driver_accepted_at`: gravado quando a oferta é aceita.

A métrica passa a ser calculada por amostra válida como:

`driver_accepted_at - driver_assigned_at`

em minutos.

Linhas sem os dois timestamps, datas inválidas ou ordem temporal invertida são excluídas. Quando nenhuma amostra válida existe, o resultado é `null`, não zero.

## Mudanças

### `admin.queries.ts`

Criado `getAverageDriverResponseTimeMinutes()`.

Removida completamente a leitura de:

- `avg_response_time_minutes`;
- `avg_response_time_seconds`.

`getRealtimeMetrics()` agora deriva a latência dos registros de `ride_requests` já carregados pelo snapshot atual.

### Contrato

`RealtimeMetrics.avgResponseTime` passou de:

`number`

para:

`number | null`

A ausência de amostra deixa de ser confundida com resposta instantânea.

### UI

`AdminRealtimeDashboard` agora exibe:

- `<valor>min` quando há amostra;
- `sem amostra` quando o backend retorna `null`.

## Ratchet

Adicionado:

`src/modules/mobility/__tests__/AdminRealtimeResponseTimeG108.test.ts`

Protege:

- uso de `driver_assigned_at` + `driver_accepted_at`;
- ausência dos campos fantasmas `avg_response_time_*`;
- contrato nullable;
- ausência de renderização enganosa `nullmin`/`0min` por falta de amostra.

## Commits

- `aa95978d112acd0d1e8531c49e27225079876371` — contrato nullable;
- `ce10887f9dab1825dc8e2bc80e2c3157be6a599e` — cálculo pelo lifecycle real;
- `464695e07e14d84899bde394fc63cd54b5a13c8c` — UI sem amostra;
- `09071468afa26af247ab25930948ebce039e6183` — ratchet.

## Validação

O diff source foi verificado. A suíte remota continua sem certificação confiável enquanto os jobs recentes falham antes de executar steps (`runner_id=0`) e a conexão SQL/metadata do Supabase permanece sujeita a timeout.

Nenhum DDL foi necessário.

## Próximo corte

O próximo gargalo de Mobilidade continua sendo o full-scan global de `ride_requests` usado por analytics/realtime. O G104 define a solução final server-side; até a conexão SQL voltar, o próximo source gate deve reduzir o volume carregado no navegador com projeções e janelas temporais explícitas, sem alterar a state machine nem criar migration não validada.
