# Checkpoint 2026-09-18 — P1: contrato e autoridade de Territorial Highlights

## Defeito encontrado

O módulo ativo de destaques editoriais estava dividido entre dois contratos
incompatíveis.

### Runtime atual

A UI, o service e a landing usam:

- `highlight_type`;
- `entity_id`;
- `subtitle`;
- `image_url`;
- `cta_label`;
- `cta_url`.

A rota administrativa `/admin/highlights` está registrada e a Home pública
consome `TerritorialHighlightService`.

### Banco remoto antes do corte

`public.territorial_highlights` tinha apenas o schema legado:

- `description`;
- `icon`;
- `color`;
- `metadata`;

e não possuía as seis colunas exigidas pelo runtime.

Além disso:

- browser possuía somente SELECT;
- INSERT/UPDATE/DELETE eram `service_role`-only;
- o repository tentava mutar diretamente com o client browser;
- a policy pública era `USING true`, portanto linhas inativas/agendadas/expiradas
  eram enumeráveis por consulta direta.

O `types.generated.ts` da main também refletia o schema legado e confirma o
drift.

## Migration remota

Aplicada:

`20260918133432_repair_territorial_highlights_contract`

A migration:

1. adiciona as seis colunas exigidas pelo runtime;
2. mantém os campos legados sem DROP destrutivo;
3. migra `description -> subtitle` quando aplicável;
4. usa `highlight_type='notice'` como compatibilidade neutra para as linhas
   legadas;
5. adiciona constraint de tipos válidos;
6. exige par consistente de CTA label/URL;
7. troca a policy pública ampla por leitura apenas de `status='active'` dentro
   da janela `starts_at/ends_at`;
8. revoga grants de tabela do browser e regranta somente a projeção pública;
9. mantém `description/icon/color/metadata` fora da projeção browser;
10. preserva `service_role` como autoridade completa.

## Dados preservados

Antes e depois: **4 rows**.

As quatro linhas atuais:

- foram preservadas;
- continuam ativas e visíveis agora;
- tiveram `subtitle` preenchido a partir de `description`;
- receberam `highlight_type='notice'`;
- apontam para um `territorial_group` existente.

Nenhum registro foi inventado ou removido.

## Autoridade administrativa

Foi criado `admin-highlights-rpc`:

- ACTIVE v1 no projeto remoto;
- `verify_jwt=true`;
- `requireAdmin` + política MFA/AAL2 canônica;
- client `service_role`;
- rate limit e audit log compartilhados;
- validações de UUID, território existente, tipo, status, datas, posição,
  textos, URLs e par CTA;
- ações `listAll`, `getById`, `create`, `update`, `delete`.

O `TerritorialHighlightRepositorySupabase` agora:

- mantém apenas a listagem pública válida no Data API;
- usa projeção explícita;
- envia listagem completa e todo CRUD ao broker;
- não executa INSERT/UPDATE/DELETE diretamente.

## Tipos

Os tipos foram gerados novamente a partir do schema remoto pós-migration.
Para manter o PR isolado das migrations remotas ainda abertas em outros PRs,
somente o bloco `territorial_highlights` foi aplicado sobre a versão da main.

Diff final do arquivo gerado neste slice: +18 linhas, sem mudanças de outras
tabelas.

## Validação

- 4/4 rows preservadas;
- 4/4 visíveis na janela pública atual;
- browser INSERT/UPDATE/DELETE = false;
- browser table-wide SELECT = false;
- `highlight_type` público por coluna = true;
- `metadata` legado público = false;
- território legado referenciado existe;
- Edge Function ACTIVE v1 / verify_jwt=true;
- Security Advisor não adicionou finding específico deste corte.

## Ratchet

`tests/security/territorial-highlights-authority.test.ts` protege:

- presença do schema runtime;
- policy pública active/current;
- ausência de wildcard read;
- campos legados fora do browser;
- broker admin/MFA como owner da gestão;
- validações de domínio;
- migrations futuras não podem restaurar DML browser ou `USING true`.

## Limite

A Edge Function foi compilada e ativada pelo Supabase, mas não há uma sessão
admin AAL2 disponível neste runtime para executar um smoke destrutivo real de
create/update/delete. Nenhum dado de produção foi usado como objeto de teste.

GitHub Actions continua sujeito ao bloqueio de runner pré-step; o PR não deve
ser integrado sem execução real dos gates no mesmo SHA.
