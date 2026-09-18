# Checkpoint 2026-09-18 — P1: projeção explícita de operação Business

## Achado

`public.business_operation_config` tem leitura pública legítima: a página pública
de Empresa usa fechamento temporário e a busca AI filtra empresas fechadas. A
gestão Gastronomia também usa a configuração completa.

O problema não era a existência dessa leitura, mas o contrato:

- `anon` e `authenticated` possuíam `SELECT` de tabela;
- `BusinessHoursService.getOperationConfig()` usava `select("*")`;
- uma coluna futura passaria a ser legível automaticamente, sem revisão do
  boundary público.

## Mudança remota

Migration aplicada:

`20260918123447_bound_business_operation_config_select_columns`

Ela:

- revoga `SELECT` de tabela de `anon` e `authenticated`;
- regranta explicitamente as 14 colunas existentes;
- não altera as policies atuais nem o conjunto de dados legível hoje.

Validação live:

- `anon_table_select = false`;
- `authenticated_table_select = false`;
- todas as 14 colunas atuais continuam `SELECT=true` para ambos os papéis.

## Código

`BusinessHoursService` passa a usar
`BUSINESS_OPERATION_CONFIG_COLUMNS` tanto na leitura quanto no receipt de
`setOperationConfig`.

Isso faz nova coluna nascer privada por padrão e também evita que um
`select("*")` quebre ou exponha o contrato quando o schema evoluir.

## Limites

- a policy pública de leitura por linha é mantida porque existe uso público real;
- nenhuma coluna atual foi escondida;
- nenhuma grant de escrita foi ampliada;
- grants de mutação owner-side permanecem dívida separada para revisão de
  field-level authority, sem alterar o lifecycle Business neste corte.
