# G113 — Admin Analytics Driver Separation

Data: 2026-09-12
Status: **SOURCE-CLOSED**

## Problema

Depois do G109/G112, o analytics de Mobilidade ainda carregava `name`, `display_name` e `avatar_url` de **todos** os motoristas apenas para calcular duas responsabilidades diferentes:

- métricas globais de cadastro/verificação;
- identidade dos poucos motoristas exibidos no ranking da janela selecionada.

Isso mantinha PII de diretório global no payload do navegador enquanto o G104 server-side aggregate continua bloqueado.

## Correção

`AdminMobilityAnalyticsDriverReadService` foi separado em duas leituras:

### `listMetricRows()`

Lê globalmente somente:

- `profile_id`;
- `is_verified`.

Não consulta relação `profiles` e não contém nome/avatar.

### `listDirectory(profileIds)`

Lê identidade mínima somente para os IDs explicitamente necessários ao ranking:

- `profile_id`;
- `profiles.name`;
- `profiles.display_name`;
- `profiles.avatar_url`.

A query é limitada por `.in("profile_id", uniqueProfileIds)` e retorna vazio quando nenhum perfil precisa ser apresentado.

## Hook analytics

`useAdminMobilityAnalytics` agora:

1. carrega corridas da janela, métricas globais mínimas de motorista e ratings;
2. calcula as corridas `completed` resolvidas na janela;
3. deriva `rankingDriverIds` somente dessas corridas;
4. só então busca o diretório mínimo desses motoristas;
5. monta o ranking.

Portanto identidade de motoristas fora do ranking/janela não é mais baixada para o navegador por essa superfície.

## Presença

Nenhuma presença operacional foi movida para este reader. `is_online`, `is_available`, localização e ride ownership continuam fora do analytics driver read model e pertencem a `driver_availability`/readers operacionais apropriados.

## G104

Este gate **não substitui** o G104. Ainda permanecem globais no browser:

- cardinalidade/verificação de motoristas;
- ratings usados para a “Avaliação média geral”;
- agregação final de métricas no cliente.

O G104 continua PENDING/fail-closed porque o preflight SQL remoto voltou a falhar por timeout inclusive em `select 1` em 2026-09-12.

## Ratchet

`src/modules/mobility/__tests__/AdminAnalyticsDriverSeparationG113.test.ts`

Protege:

- projeção global limitada a `profile_id, is_verified`;
- ausência de identidade na leitura global;
- diretório de identidade limitado aos IDs do ranking;
- ausência do antigo `AdminMobilityAnalyticsDriverReadService.list()` global.

## Validação

Os diffs/source foram inspecionados e o ratchet foi versionado. Este checkpoint não declara suite/CI verde sem execução confiável.
