# Checkpoint 2026-09-18 — P1: autoridade de Territory AI Content

## Defeito encontrado

`territory_ai_content` misturava três responsabilidades no browser:

- leitura pública por `select("*")`;
- geração administrativa via Edge Function;
- edição administrativa por UPDATE direto da tabela.

O mesmo hook também expunha leitura pública e mutations administrativas, e o
cliente podia enviar identidade territorial e campos de provenance que
pertencem ao servidor.

## Contrato final

### Superfície pública

O browser possui somente leitura por coluna explícita:

- `territory_slug`;
- `territory_name`;
- `description`;
- `history`;
- `demographics`;
- `events`;
- `ai_generated_at`.

Não há:

- `SELECT *`;
- SELECT de tabela inteira;
- INSERT, UPDATE ou DELETE;
- acesso público a `id`, `is_manual_override`,
  `manually_edited_at`, `created_at` ou `updated_at`.

`useTerritoryAIContent` é exclusivamente read-only.

### Superfície administrativa

`useTerritoryAIContentAdmin` usa exclusivamente o broker
`territory-ai-content` para:

- `get`;
- `generate`;
- `update`.

A Edge Function:

- está ACTIVE v2;
- usa `verify_jwt=true`;
- exige `requireAdmin`, incluindo a política MFA/AAL2 canônica;
- usa `getSupabaseAdminClient` como única autoridade de persistência;
- aplica rate limits e audit log;
- aceita somente o envelope `{ action, params }`;
- não possui fallback para payload antigo;
- não aceita nome do território ou membros como autoridade do browser;
- resolve grupo, cidade âncora e membros diretamente das tabelas canônicas;
- valida e normaliza conteúdo editorial antes de persistir.

O save manual usa upsert server-side, portanto não depende de uma geração IA
prévia para criar conteúdo.

## Frontend

`TerritorialAIService` foi separado por intenção:

- `getAIContent` usa somente a projeção pública explícita;
- `getAdminContent`, `generateAIContent` e `updateAIContent` usam o broker;
- não existe DML direto em `territory_ai_content`;
- geração envia somente o slug canônico;
- update envia somente campos editoriais explícitos.

A landing não conhece mutations de IA. O painel admin não permite editar
`slug` ou nome territorial; esses valores vêm do grupo canônico.

Foram removidos:

- query builder local/falso;
- `Partial<TerritoryAIContent>` como contrato de update;
- `select("*")`;
- auto-generation morta na landing;
- comentário de Edge "não implantada";
- schema compartilhado antigo de request que aceitava
  `territory_name/members` do browser.

## Migrations remotas

A sequência aplicada foi materializada integralmente no Git para preservar
provenance:

1. `20260918135208_harden_territory_ai_content_browser_authority`;
2. `20260918135505_preserve_territory_ai_legacy_admin_update`;
3. `20260918135700_retire_territory_ai_legacy_admin_update`;
4. `20260918135813_remove_obsolete_territory_ai_manual_edit_trigger`;
5. `20260918135814_preserve_territory_ai_legacy_browser_read`;
6. `20260918135909_remove_territory_ai_legacy_browser_read`.

As etapas 2 e 5 registram bridges transitórias que existiram no ambiente.
Elas permanecem apenas porque migration aplicada é histórico imutável.

O contrato ativo é definido pelas etapas 3, 4 e 6:

- nenhum DML browser;
- trigger/helper transitório removido;
- nenhum SELECT de tabela inteira;
- somente a projeção editorial pública por coluna.

Nenhuma nova implementação deve depender das etapas 2 ou 5.

## Estado live verificado

- `territory-ai-content`: ACTIVE v2;
- `verify_jwt=true`;
- source remoto = source do branch;
- fallback legado ausente;
- browser table-wide SELECT = false;
- browser INSERT = false;
- browser UPDATE = false;
- `id` público = false;
- `is_manual_override` público = false;
- descrição e `ai_generated_at` públicos por coluna = true;
- trigger `stamp_territory_ai_manual_edit` ausente;
- função `private.stamp_territory_ai_manual_edit()` ausente;
- tabela contém 0 rows, portanto nenhum dado precisou ser transformado ou
  removido neste corte.

## Ratchets

`tests/security/territory-ai-content-authority.test.ts` impede:

- retorno a `select("*")`;
- DML browser;
- SELECT público de tabela inteira;
- reexposição de metadata administrativa;
- recriação do trigger/helper transitório;
- fallback de request sem `action`;
- autoridade de `territory_name/members` vinda do browser.

`TerritorialAIService.test.ts` valida o contrato de cliente público/admin e
os payloads mínimos enviados ao broker.

## Documentação ativa

`src/core/territorial/README.md` foi reduzida ao contrato atual. Notas de
rollout antigas, caminhos de compatibilidade e instruções G42/G43 superadas
não fazem mais parte da documentação operacional.

Migrations e checkpoints históricos continuam preservados como evidência; eles
não são tratados como instrução de implementação atual.

## Certificação

O deploy da Edge prova compilação do bundle remoto e a igualdade de source foi
verificada. Não há sessão admin AAL2 disponível neste executor para um smoke
autorizado de `get/generate/update`.

GitHub Actions continua apresentando runners que encerram antes de executar
steps reais. Este PR não deve ser mesclado enquanto os gates do mesmo SHA não
executarem de fato.
