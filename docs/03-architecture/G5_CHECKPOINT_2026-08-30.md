# G5 — Database/RLS reconciliation checkpoint — 2026-08-30

Status: **EM EXECUÇÃO**.  
HEAD de source observado antes desta atualização: `14f912017046e31bf86db831bbbcb818dcc5472d`.  
Projeto Supabase: `xhdowzacfujckjelqhtd`.

Este documento reconcilia o checklist mestre de G5 com as provas versionadas e o catálogo remoto vivo. Ele existe para impedir repetição de auditorias já fechadas e, ao mesmo tempo, não converter blockers operacionais em PASS.

## 1. Checklist reconciliado

| item G5 | estado | prova/decisão |
| --- | --- | --- |
| schema atual vs migrations | **CLOSED** | `G5_MIGRATION_DRIFT_CLOSED_2026-08-30.md`; o reparo forward-only dos enums de `vagas` foi aplicado e o arquivo fonte foi alinhado ao versionamento real do ledger em `20260830131902_repair_malformed_vaga_enums_g5.sql` |
| RLS e grants | **CLOSED** para superfície application-owned | `G5_RLS_GRANTS_AUDIT_2026-08-30.md`; resíduos PostGIS continuam extension-owned, não bypass de domínio |
| funções/RPCs e authority | **CLOSED** | `G5_SECURITY_DEFINER_INVENTORY_2026-08-30.md`: snapshot final application-owned e famílias de maior risco revisadas |
| tabelas legadas sem caller | **CLOSED para os legados SQL já classificados** | Billing preservado/locked; Delivery e `business_views` vazios retirados com provenance; helpers/RPCs órfãos retirados em cortes próprios |
| órfãos | **BLOCKED — 1 residual conhecido de Storage** | bucket remoto `classified-images`; revalidado vazio em 2026-08-30, mas a retirada exige Storage API oficial |
| fixtures/E2E sem provenance | **CLOSED** | `G5_E2E_FIXTURE_PROVENANCE_2026-08-30.md` |
| indexes/constraints | **CLOSED** | `G5_SCHEMA_INTEGRITY_2026-08-30.md`; `idx_vagas_highlight` também foi revalidado após o reparo de enums |
| migrations idempotentes/fail-closed | **CLOSED EM SOURCE / CI PENDENTE** | `tests/security/migration-fail-closed-ratchet.test.ts` instala cutover futuro após o ledger histórico; migrations já aplicadas não são reescritas |
| source ↔ DB contract drift | **ESTRUTURA CLOSED / SNAPSHOT VIVO BLOCKED** | `types.generated.ts` é a única autoridade, porém o snapshot commitado ainda contém os valores de enum históricos corrompidos; regeneração integral é obrigatória |
| SSOT Registry database types | **CLOSED** | `docs/architecture/SSOT_REGISTRY.md` reconciliado para uma única autoridade gerada e um único gerador canônico |
| reparo dos enums de `vagas` | **CLOSED** | banco vivo canônico, dados preservados e migration source↔ledger alinhada |
| install manifest / lock consistency | **CLOSED EM SOURCE / EXECUÇÃO PENDENTE** | `package.json` foi reconciliado com `package-lock.json` e registry para `browser-image-compression@^2.0.2`; validação remota está bloqueada por plataformas antes do build |
| definir plano de limpeza sem perda de dados | **CLOSED neste checkpoint** | plano abaixo distingue DROP seguro, retenção/export e blockers operacionais |

**G5 inteiro ainda não está fechado. Não iniciar G6.**

## 2. Source fechado nesta execução

Commits relevantes:

- `993aa37c96fb02652076b2fc8d8ec4e40379148b` — remove `src/integrations/supabase/types.ts`, segundo snapshot gerado redundante;
- `79fc84038904ab83ee8564cc499af501c56fb8fd` — ratchet de authority de database types restrito aos snapshots realmente aposentados;
- `f6f22177bc395c0967790269453dfac3fa62422f` — ratchet fail-closed para migrations futuras;
- `92081657de98d4eb618585abcb640d84212c0232` — reconcilia o SSOT Registry com `src/integrations/supabase/types.generated.ts` como única autoridade;
- `994c2e3014b5df323492881f2e1e1e1f664dd870` — consolida os blockers operacionais remanescentes do G5;
- `bc8f9989cfa28f63f0c7a39a58fc3c53553e189f` — aplica em source o reparo forward-only dos enums malformados de `vagas`;
- `8aac5c7d8b8eb9e21c914deeff725eb000002cd6` — alinha atomicamente o nome da migration ao timestamp efetivamente registrado pelo ledger remoto, sem mudar o SQL aplicado;
- `8e1db32c128783399c1adcd35dabf05da681d23e` — reconcilia o checkpoint com o reparo de enums e com o blocker amplo de Actions;
- `14f912017046e31bf86db831bbbcb818dcc5472d` — restaura `browser-image-compression` para a faixa publicada `^2.0.2`, alinhada ao lockfile e ao registry.

O runtime já importava `Database` de `types.generated.ts`; o gerador canônico `tools/supabase/generate-supabase-types.ts` também escreve nesse mesmo destino. O G5 impede o retorno de `src/shared/types/database.types.ts` e `src/integrations/supabase/types.ts` como autoridades paralelas.

## 3. Reparo forward-only dos enums de `vagas`: CLOSED

A revalidação do catálogo identificou corrupção histórica de labels criada por uma migration já aplicada. Em vez de reescrever histórico, foi criada e aplicada uma migration corretiva forward-only, fail-closed.

Estado vivo após o reparo:

- `vaga_application_channel`: `internal`, `whatsapp`, `email`, `external_url`, `phone`;
- `vaga_salary_mode`: `fixed`, `range`, `a_combinar`;
- `vaga_highlight_type`: `none`, `premium`, `sponsored`, `featured`;
- zero labels malformados remanescentes;
- 15/15 linhas de `vagas` preservadas;
- distribuição de destaque preservada: 11 `none`, 4 `premium`;
- default de `highlight_type` preservado;
- `idx_vagas_highlight` existente e válido;
- nenhuma função/RPC dependia dos tipos corrompidos em sua assinatura.

O ledger remoto registrou a aplicação como `20260830131902_repair_malformed_vaga_enums_g5`. O source foi alinhado para `supabase/migrations/20260830131902_repair_malformed_vaga_enums_g5.sql` sem alterar os bytes do SQL já aplicado. Portanto este defeito não é mais blocker de schema/migration.

## 4. Migration fail-closed: cutover instalado

O cutover do ratchet futuro começa em `20260830101000`. Migrations históricas já aplicadas continuam ledger-owned; o reparo de enums foi realizado por nova migration, não por mutação retroativa.

A partir do corte, migrations novas:

- não podem usar `DROP ... IF EXISTS` destrutivo para esconder pré-requisito ausente;
- não podem usar `DROP ... CASCADE` destrutivo;
- não podem engolir falhas inesperadas com `EXCEPTION ... THEN NULL/NOTICE/WARNING`;
- não podem apagar buckets com `DELETE FROM storage.buckets`;
- em retirada destrutiva, devem usar transação explícita, precondition que falha fechado, `RESTRICT` para relações e postcondition verificável.

## 5. Storage: residual órfão comprovado e revalidado

O bucket remoto `classified-images` continua classificado como **REMOTE ORPHAN / EMPTY / NO KNOWN CALLER**:

- existente;
- público;
- `object_count = 0`;
- limite de arquivo `10485760`;
- MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`;
- auditoria anterior: zero multipart uploads/parts e zero caller/dependência conhecida.

Decisão:

- não contornar `storage.protect_delete()`;
- não executar `DELETE FROM storage.buckets`;
- remover apenas pela Storage API oficial;
- repetir zero-objects/refs imediatamente antes da remoção e confirmar ausência depois.

A enumeração completa do conector Supabase continua sem expor operação oficial equivalente a `emptyBucket`/`deleteBucket`. Também foram inspecionadas as Edge Functions existentes relacionadas a Storage:

- `media-assets` usa service role, mas sua autoridade é estritamente o upload e rollback de objetos do bucket canônico `media-assets`;
- `media-assets-cleanup` usa service role, mas sua autoridade é estritamente a coleta de objetos órfãos do mesmo bucket `media-assets`, protegida por `CRON_SECRET`;
- ambas hardcodeiam `MEDIA_ASSET_BUCKET = "media-assets"` e não são executores de lifecycle de buckets.

Portanto `classified-images` permanece **BLOCKED por capability operacional**. Ampliar essas funções de domínio para administrar/deletar buckets apenas para contornar o blocker misturaria responsabilidades e criaria autoridade indevida; esse caminho foi explicitamente descartado.

## 6. Canonical database types: estrutura fechada, snapshot vivo comprovadamente stale

Authority atual:

- arquivo canônico: `src/integrations/supabase/types.generated.ts`;
- gerador canônico: `tools/supabase/generate-supabase-types.ts`;
- comando: `npm run generate:types`;
- workflow: `.github/workflows/supabase-types-sync.yml`.

Provas acumuladas:

- a última alteração real do snapshot canônico ocorreu em `872668f2276ca9e1e50a6d08034a8734c3773852`, em 2026-08-11;
- o banco recebeu múltiplas migrations estruturais em 2026-08-30;
- a geração oficial conectada reporta `PostgrestVersion: "14.5"`, enquanto o snapshot commitado observado ainda reporta `14.4`;
- após o reparo vivo dos enums de `vagas`, o snapshot commitado em `8aac5c7d...` continua contendo os antigos labels concatenados como valores únicos, enquanto o banco vivo já possui os labels canônicos separados.

Logo o drift é **estrutural e semântico**, não apenas metadata de PostgREST. É proibido corrigir manualmente só a versão ou só os três enums.

Assinatura compacta do catálogo vivo usada como evidência auxiliar nesta reconciliação:

- `public`: 257 relações; MD5 estrutural `41e8a0341a25c6d09a11389a65a3001b`;
- `private`: 20 relações; MD5 estrutural `3d080ebd47200bf97eac850bf9a00ad8`.

A capability `generate_typescript_types` executa a geração viva, mas a resposta grande não é disponibilizada como artefato/arquivo transferível de modo que permita substituir com segurança o snapshot integral. Repetir chamadas ou reconstruir o arquivo a partir de saída truncável não transforma isso em uma regeneração confiável. Portanto o blocker permanece **materialização integral do output oficial**.

## 7. CI / gates e build remoto: blockers de plataforma separados do source

No HEAD `14f912017046e31bf86db831bbbcb818dcc5472d`, os três workflows de push voltaram a concluir como `failure`. O run `33316832687` (`SSOT Enforcement`) expôs job concluído com `steps = null` e sem log de execução. O mesmo padrão pré-step já havia sido reproduzido em `Security Check` e `SSOT Territorial Tests` nos HEADs anteriores, inclusive com jobs `ubuntu-latest` e `runner_id = 0`.

Portanto a evidência continua sendo de indisponibilidade mais ampla de GitHub Actions/conta/alocação, e **não apenas** do runner self-hosted `acheguese-heavy-windows`.

O `Supabase Types Sync` continua deliberadamente governado pelo runner Windows self-hosted autorizado. Sua migração histórica de `ubuntu-latest` para o runner autorizado não deve ser revertida apenas para obter execução. Porém os failures atuais dos outros workflows mostram que restaurar apenas o runner pesado pode não ser suficiente: a infraestrutura de Actions precisa efetivamente voltar a executar steps.

### Vercel: defeito de manifesto corrigido, nova prova bloqueada por rate limit

A inspeção do deployment Vercel do commit `8aac5c7d...` revelou um erro de source real antes do build:

- `npm ci` falhava com `ETARGET` para `browser-image-compression@^2.2.0`;
- o registry oficial publica `2.0.2` como versão atual;
- o `package-lock.json` já exigia `^2.0.2`, enquanto somente `package.json` havia divergido para `^2.2.0`.

O commit `14f912017046e31bf86db831bbbcb818dcc5472d` corrigiu apenas o manifesto para `^2.0.2`, preservando o lockfile já correto.

A Vercel não executou o build pós-correção: o status do novo commit falhou antes de deployment com target `upgradeToPro=build-rate-limit`, e o projeto está em plano Hobby. Portanto:

- o ETARGET anterior foi corrigido em source;
- ainda não existe prova remota pós-fix de `npm ci`/build;
- o novo `Vercel = failure` é atualmente **rate limit de plataforma**, não evidência de regressão do commit `14f91201...`.

Consequência:

- não marcar testes/build como PASS sem execução real;
- não tratar `failure` pré-step do Actions como regressão de source;
- não tratar `build-rate-limit` da Vercel como regressão de source;
- não reverter source por jobs que nunca executaram;
- não trocar runners/autorização só para obter badge verde;
- quando as plataformas voltarem a executar, validar primeiro `npm ci`, depois o sync canônico de types e os gates do G5.

## 8. Legados SQL: decisão preservada

### Billing — RETAIN / LOCKED

`billing_plans`, `subscription_plans`, `business_subscriptions` e `gastronomy_subscriptions` permanecem sem caller runtime canônico e sem acesso browser, mas contêm dados históricos com provenance documentada. Não apagar sem snapshot/export, revisão de dependências externas e retenção/auditoria.

### Delivery — RETIRED

O cluster vazio `delivery_requests` / `delivery_status_history` / `delivery_tracking` já foi retirado. Não recriar.

### Business views — RETIRED

`public.business_views` já foi retirado após preflight de ausência de linhas e possui ratchet contra recriação silenciosa.

### `verification-documents` — DORMANT / LOCKED / RETAIN

Não é órfão removível: possui provenance e callers canônicos. Não apagar por estar vazio.

## 9. Plano lossless vigente

1. **SQL vazio + sem dependência/caller comprovados:** retirar em migration pequena com preflight, `RESTRICT` quando aplicável e postcondition; nunca `CASCADE` por conveniência.
2. **Legado com dados:** bloquear browser/writes, preservar linhas, documentar sucessor; DROP somente após snapshot/export e certificação de retenção/dependências.
3. **Storage vazio:** remover exclusivamente pela Storage API oficial.
4. **Compatibilidade ativa:** manter a menor superfície possível e retirar apenas por cutover evidence-gated.
5. **Extension-owned:** não tratar como objeto application-owned.
6. **Fixtures:** mutações apenas em targets aprovados e identidades marcadas; ausência de runner nunca vira PASS.
7. **Types/source↔DB:** `types.generated.ts` é a única authority; nenhum snapshot manual paralelo.

## 10. Próximas ações exatas

1. obter um caminho oficial que materialize integralmente a geração viva em `src/integrations/supabase/types.generated.ts`, sem edição manual/parcial;
2. remover `classified-images` pela Storage API oficial, com preflight/postcheck, usando capability oficial já autorizada — sem SQL direto, sem ampliar Edge Functions de domínio e sem criar autoridade service-role paralela;
3. recuperar execução efetiva do GitHub Actions e obter steps reais dos gates no HEAD então atual;
4. quando a Vercel permitir novo build, confirmar que `npm ci` ultrapassa o antigo ETARGET e registrar o próximo erro real, se houver;
5. após a materialização dos types, provar que o snapshot não contém os labels malformados e que o diff source↔DB foi reconciliado;
6. somente se os três blockers operacionais centrais concluírem sem novo blocker, atualizar este checkpoint para **G5 CLOSED**;
7. apenas depois iniciar G6.

## 11. Do not repeat

- não refazer o inventário global de SECURITY DEFINER já fechado;
- não reabrir as relações RLS-without-policy já classificadas;
- não recriar `delivery_requests` ou `business_views`;
- não criar policies em tabelas fail-closed apenas para silenciar Advisor;
- não dropar legados Billing com dados;
- não apagar `verification-documents` apenas porque está vazio;
- não contornar `storage.protect_delete()` por SQL;
- não criar um executor service-role paralelo apenas para apagar `classified-images`;
- não ampliar `media-assets` ou `media-assets-cleanup` para lifecycle/deleção de bucket só para contornar o blocker;
- não reintroduzir `src/shared/types/database.types.ts`;
- não reintroduzir `src/integrations/supabase/types.ts`;
- não reconstruir manualmente o snapshot canônico a partir de saída de ferramenta truncável;
- não editar pontualmente `PostgrestVersion` ou os enums do snapshot gerado para simular regeneração;
- não trocar o runner autorizado do type sync só para driblar indisponibilidade operacional;
- não assumir que o blocker de Actions é somente o runner pesado: nesta execução até jobs `ubuntu-latest` falharam antes dos steps;
- não interpretar `Vercel = failure` com `upgradeToPro=build-rate-limit` como regressão de source;
- não voltar `browser-image-compression` para `^2.2.0`; a faixa publicada e lockada é `^2.0.2`;
- não reescrever migrations históricas já aplicadas para satisfazer o ratchet futuro;
- não declarar o sync de types concluído enquanto o snapshot canônico não for regenerado/verificado;
- não iniciar G6 enquanto houver item G5 BLOCKED/aberto.
