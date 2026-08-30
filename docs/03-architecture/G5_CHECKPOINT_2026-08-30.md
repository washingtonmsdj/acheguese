# G5 — Database/RLS reconciliation checkpoint — 2026-08-30

Status: **EM EXECUÇÃO**.  
HEAD de source consolidado antes deste checkpoint: `92081657de98d4eb618585abcb640d84212c0232`.  
Main observado antes desta revalidação operacional: `994c2e3014b5df323492881f2e1e1e1f664dd870`.  
Projeto Supabase: `xhdowzacfujckjelqhtd`.

Este documento reconcilia o checklist mestre de G5 com as provas versionadas e o catálogo remoto vivo. Ele existe para impedir repetição de auditorias já fechadas e, ao mesmo tempo, não converter blockers operacionais em PASS.

## 1. Checklist reconciliado

| item G5 | estado | prova/decisão |
| --- | --- | --- |
| schema atual vs migrations | **CLOSED** | `G5_MIGRATION_DRIFT_CLOSED_2026-08-30.md`: `ALIAS=0`, `CONFLICT=0`, `LOCAL_ONLY=0`, `REMOTE_ONLY=0` no fechamento registrado |
| RLS e grants | **CLOSED** para superfície application-owned | `G5_RLS_GRANTS_AUDIT_2026-08-30.md`; resíduos PostGIS continuam extension-owned, não bypass de domínio |
| funções/RPCs e authority | **CLOSED** | `G5_SECURITY_DEFINER_INVENTORY_2026-08-30.md`: snapshot final application-owned e famílias de maior risco revisadas |
| tabelas legadas sem caller | **CLOSED para os legados SQL já classificados** | Billing preservado/locked; Delivery e `business_views` vazios retirados com provenance; helpers/RPCs órfãos retirados em cortes próprios |
| órfãos | **BLOCKED — 1 residual conhecido de Storage** | bucket remoto `classified-images`; revalidado vazio em 2026-08-30, mas a retirada exige Storage API oficial |
| fixtures/E2E sem provenance | **CLOSED** | `G5_E2E_FIXTURE_PROVENANCE_2026-08-30.md` |
| indexes/constraints | **CLOSED** | `G5_SCHEMA_INTEGRITY_2026-08-30.md` |
| migrations idempotentes/fail-closed | **CLOSED EM SOURCE / CI PENDENTE** | `tests/security/migration-fail-closed-ratchet.test.ts` instala cutover futuro após o ledger atual; migrations já aplicadas não são reescritas |
| source ↔ DB contract drift | **ESTRUTURA CLOSED / SYNC VIVO BLOCKED** | `types.generated.ts` é a única autoridade; snapshots paralelos foram aposentados e ratchetados; a geração viva ainda precisa materializar o snapshot canônico |
| SSOT Registry database types | **CLOSED** | `docs/architecture/SSOT_REGISTRY.md` reconciliado para uma única autoridade gerada e um único gerador canônico |
| definir plano de limpeza sem perda de dados | **CLOSED neste checkpoint** | plano abaixo distingue DROP seguro, retenção/export e blockers operacionais |

**G5 inteiro ainda não está fechado. Não iniciar G6.**

## 2. Source fechado nesta execução

Commits relevantes:

- `993aa37c96fb02652076b2fc8d8ec4e40379148b` — remove `src/integrations/supabase/types.ts`, segundo snapshot gerado redundante;
- `79fc84038904ab83ee8564cc499af501c56fb8fd` — ratchet de authority de database types restrito aos snapshots realmente aposentados;
- `f6f22177bc395c0967790269453dfac3fa62422f` — ratchet fail-closed para migrations futuras;
- `92081657de98d4eb618585abcb640d84212c0232` — reconcilia o SSOT Registry com `src/integrations/supabase/types.generated.ts` como única autoridade;
- `994c2e3014b5df323492881f2e1e1e1f664dd870` — consolida os blockers operacionais remanescentes do G5 antes desta revalidação.

O runtime já importava `Database` de `types.generated.ts`; o gerador canônico `tools/supabase/generate-supabase-types.ts` também escreve nesse mesmo destino. O G5 agora impede o retorno de `src/shared/types/database.types.ts` e `src/integrations/supabase/types.ts` como autoridades paralelas.

## 3. Migration fail-closed: cutover instalado

O ledger remoto observado termina em `20260830100944_cleanup_orphan_overload_helpers`.

O ratchet novo começa em `20260830101000`, deliberadamente depois do ledger existente. A partir desse corte, migrations novas:

- não podem usar `DROP ... IF EXISTS` destrutivo para esconder pré-requisito ausente;
- não podem usar `DROP ... CASCADE` destrutivo;
- não podem engolir falhas inesperadas com `EXCEPTION ... THEN NULL/NOTICE/WARNING`;
- não podem apagar buckets com `DELETE FROM storage.buckets`;
- em retirada destrutiva, devem usar transação explícita, precondition que falha fechado, `RESTRICT` para relações e postcondition verificável.

Migrations históricas já aplicadas permanecem ledger-owned e não são reescritas apenas para adequação estética retroativa.

## 4. Storage: residual órfão comprovado e revalidado

O bucket remoto `classified-images` foi reconsultado em 2026-08-30 e continua:

- existente;
- público;
- `object_count = 0`;
- limite de arquivo `10485760`;
- MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`.

Auditorias anteriores já haviam mostrado zero multipart uploads/parts e zero caller/dependência conhecida.

Classificação: **REMOTE ORPHAN / EMPTY / NO KNOWN CALLER**.

Decisão:

- não contornar `storage.protect_delete()`;
- não executar `DELETE FROM storage.buckets`;
- remover apenas pela Storage API oficial;
- repetir zero-objects/refs imediatamente antes da remoção e confirmar ausência depois.

A revalidação de capability de 2026-08-30 confirmou que o conector Supabase instalado não expõe operação oficial equivalente a `emptyBucket`/`deleteBucket`, e a busca de plugins não encontrou executor adicional apropriado. Portanto esse item permanece **BLOCKED por capability operacional**, não PASS e não falha de source. Não será criado um segundo mecanismo service-role apenas para contornar esse blocker.

## 5. Canonical database types: estrutura fechada, snapshot vivo ainda pendente

Authority atual:

- arquivo canônico: `src/integrations/supabase/types.generated.ts`;
- gerador canônico: `tools/supabase/generate-supabase-types.ts`;
- comando: `npm run generate:types`;
- workflow: `.github/workflows/supabase-types-sync.yml`.

A geração oficial conectada retornou schema com `PostgrestVersion: "14.5"`; o snapshot canônico comprometido observado antes do sync ainda declarava `14.4`. Logo não é correto declarar o contrato remoto sincronizado antes de uma regeneração materializada e verificável.

A capability conectada `generate_typescript_types` consegue executar a geração viva, porém sua resposta não é exposta como arquivo transferível (`file_id`) nem existe capability de export/download para esse resultado. O materializador de arquivos disponível aceita apenas arquivos/referências reais, não uma resposta textual grande de outra ferramenta. Portanto não é seguro reconstruir manualmente ou parcialmente `types.generated.ts` a partir de saída truncável.

Workflow `Supabase Types Sync`, run `33308805361`: revalidado em 2026-08-30 e continua **queued**, sem steps/logs iniciados, apontando para o HEAD antigo que o disparou (`06e452d...`). O histórico do próprio workflow mostra o commit `06e452d786b6b8f055859b0c4e52bc55260e336f` com mensagem `ci(g5): run type sync on authorized runner`; portanto trocar o workflow para outro runner apenas para driblar a fila contrariaria uma decisão explícita do G5. O runner autorizado deve ser recuperado/ativado, e só então o sync deve ser executado contra o HEAD atual.

## 6. CI / gates

Os jobs de GitHub Actions disparados após os cortes de source falharam antes de executar steps. No HEAD `994c2e3014b5df323492881f2e1e1e1f664dd870`, o run `33310303083` do `SSOT Territorial Tests` apresentou job `99255773261` com `steps=[]` e sem log de job disponível. Isso é evidência de indisponibilidade de execução do CI, não evidência de teste funcional vermelho.

O `Supabase Types Sync` run `33308805361` também permanece queued no runner self-hosted autorizado `acheguese-heavy-windows`, sem início de steps. Não criar dispatch duplicado enquanto a causa de indisponibilidade do runner persistir.

Consequência:

- não marcar testes como PASS sem execução real;
- não reverter source apenas por um job que não chegou a executar;
- não trocar o runner autorizado apenas para obter badge verde;
- assim que o runner autorizado voltar a executar steps, rodar o sync canônico de types sobre o HEAD atual e os gates do G5.

## 7. Legados SQL: decisão preservada

### Billing — RETAIN / LOCKED

`billing_plans`, `subscription_plans`, `business_subscriptions` e `gastronomy_subscriptions` permanecem sem caller runtime canônico e sem acesso browser, mas contêm dados históricos com provenance documentada. Não apagar sem snapshot/export, revisão de dependências externas e retenção/auditoria.

### Delivery — RETIRED

O cluster vazio `delivery_requests` / `delivery_status_history` / `delivery_tracking` já foi retirado. Não recriar.

### Business views — RETIRED

`public.business_views` já foi retirado após preflight de ausência de linhas e possui ratchet contra recriação silenciosa.

### `verification-documents` — DORMANT / LOCKED / RETAIN

Não é órfão removível: possui provenance e callers canônicos. Não apagar por estar vazio.

## 8. Plano lossless vigente

1. **SQL vazio + sem dependência/caller comprovados:** retirar em migration pequena com preflight, `RESTRICT` quando aplicável e postcondition; nunca `CASCADE` por conveniência.
2. **Legado com dados:** bloquear browser/writes, preservar linhas, documentar sucessor; DROP somente após snapshot/export e certificação de retenção/dependências.
3. **Storage vazio:** remover exclusivamente pela Storage API oficial.
4. **Compatibilidade ativa:** manter a menor superfície possível e retirar apenas por cutover evidence-gated.
5. **Extension-owned:** não tratar como objeto application-owned.
6. **Fixtures:** mutações apenas em targets aprovados e identidades marcadas; ausência de runner nunca vira PASS.
7. **Types/source↔DB:** `types.generated.ts` é a única authority; nenhum snapshot manual paralelo.

## 9. Próximas ações exatas

1. recuperar/ativar o runner self-hosted autorizado `acheguese-heavy-windows` e deixar a fila existente resolver sem duplicar dispatch desnecessário;
2. após o runner voltar, executar o `Supabase Types Sync` contra o HEAD atual, materializar `src/integrations/supabase/types.generated.ts` e provar que o diff está reconciliado;
3. remover `classified-images` pela Storage API oficial, com preflight/postcheck, usando uma capability oficial já autorizada — sem SQL direto e sem criar autoridade service-role paralela;
4. obter execução real dos gates do G5 no HEAD atual;
5. somente se os três itens de fechamento operacional acima concluírem sem novo blocker, atualizar este checkpoint para **G5 CLOSED**;
6. apenas depois iniciar G6.

## 10. Do not repeat

- não refazer o inventário global de SECURITY DEFINER já fechado;
- não reabrir as relações RLS-without-policy já classificadas;
- não recriar `delivery_requests` ou `business_views`;
- não criar policies em tabelas fail-closed apenas para silenciar Advisor;
- não dropar legados Billing com dados;
- não apagar `verification-documents` apenas porque está vazio;
- não contornar `storage.protect_delete()` por SQL;
- não criar um executor service-role paralelo apenas para apagar `classified-images`;
- não reintroduzir `src/shared/types/database.types.ts`;
- não reintroduzir `src/integrations/supabase/types.ts`;
- não reconstruir manualmente o snapshot canônico a partir de saída de ferramenta truncável;
- não trocar o runner autorizado do type sync só para driblar a indisponibilidade operacional;
- não reescrever migrations históricas já aplicadas para satisfazer o ratchet futuro;
- não declarar o sync de types concluído enquanto o snapshot canônico não for regenerado/verificado;
- não iniciar G6 enquanto houver item G5 BLOCKED/aberto.