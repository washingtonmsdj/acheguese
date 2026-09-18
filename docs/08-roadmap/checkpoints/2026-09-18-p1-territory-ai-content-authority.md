# Checkpoint 2026-09-18 — P1: autoridade de Territory AI Content

## Problema

`territory_ai_content` misturava três autoridades no browser:

- leitura pública por `select("*")`;
- geração via Edge Function;
- edição administrativa via UPDATE direto da tabela, incluindo metadata de
  proveniência/timestamps fornecida pelo cliente.

O runtime também usava o mesmo hook para landing pública e painel admin, o que
misturava leitura pública com comandos privilegiados.

## Arquitetura atual

### Público

`TerritorialAIService.getAIContent()` é read-only e usa uma projeção explícita:

- `territory_slug`;
- `territory_name`;
- `description`;
- `history`;
- `demographics`;
- `events`;
- `ai_generated_at`.

O hook público `useTerritoryAIContent` não expõe geração nem update.

### Admin

`useTerritoryAIContentAdmin` usa o broker `territory-ai-content` para:

- `get`;
- `generate`;
- `update`.

A Edge Function exige admin/super_admin pelo `requireAdmin`, incluindo a
política MFA canônica, aplica rate limit, valida input e grava com
`service_role`.

A identidade territorial não vem do browser. O broker resolve o
`territory_slug` em `territorial_groups`, exige grupo ativo, deriva nome,
cidade âncora e membros ativos do banco e usa esse contexto para geração.

## Compatibilidade de rollout

A Edge Function implantada é retrocompatível com a main anterior:

- payload novo: `{ action, params }`;
- payload legado sem `action`: tratado como `generate`;
- `territory_name` e `members` fornecidos pelo payload legado são ignorados;
  o servidor resolve os valores canônicos.

Isso permitiu implantar o broker antes de promover o frontend novo.

## Migrations remotas

A sequência remota foi materializada integralmente:

1. `20260918135208_harden_territory_ai_content_browser_authority`;
2. `20260918135505_preserve_territory_ai_legacy_admin_update`;
3. `20260918135700_retire_territory_ai_legacy_admin_update`;
4. `20260918135813_remove_obsolete_territory_ai_manual_edit_trigger`;
5. `20260918135814_preserve_territory_ai_legacy_browser_read`.

A etapa 2 foi uma ponte curta para a main antiga. A etapa 3 aposentou toda
mutação browser após o broker ficar disponível. A etapa 4 removeu o trigger que
deixou de ser necessário.

A etapa 5 é uma ponte temporária **somente de leitura**, porque a main publicada
ainda usa `select("*")`. Ela não reabre INSERT/UPDATE/DELETE.

## Estado live verificado

- `territory-ai-content`: ACTIVE v1, `verify_jwt=true`;
- browser table INSERT/UPDATE/DELETE: false;
- nenhuma policy browser de mutação;
- trigger/helper manual legado: removidos;
- service-role broker owns admin read/generate/update;
- SELECT de tabela está temporariamente restaurado apenas para compatibilidade
  da main antiga.

## Próximo gate

Quando o frontend desta branch estiver promovido com gates reais:

1. provar que landing usa somente a projeção pública explícita;
2. provar que painel admin executa `get/generate/update` pelo broker;
3. aplicar uma nova migration remota que retire o SELECT de tabela temporário e
   preserve somente a projeção pública por coluna;
4. versionar essa migration final no repositório;
5. rodar Advisor + probes positivos/negativos no mesmo release SHA.

Não reabrir DML browser para resolver incompatibilidade de deploy.

## Limite atual

GitHub Actions continua apresentando jobs pré-step/sem execução real em PRs
urgentes. Portanto esta mudança não deve ser mesclada apenas com base em status
vermelho/queued de infraestrutura; precisa de execução real dos gates ou de
outro caminho de certificação confiável.
