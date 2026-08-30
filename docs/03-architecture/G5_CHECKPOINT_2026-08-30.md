# G5 — Database/RLS reconciliation checkpoint — 2026-08-30

Status: **EM EXECUÇÃO**.  
HEAD de source consolidado antes deste checkpoint: `92081657de98d4eb618585abcb640d84212c0232`.  
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
- `92081657de98d4eb618585abcb640d84212c0232` — reconcilia o SSOT Registry com `src/integrations/supabase/types.generated.ts` como única autoridade.

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

O conector Supabase disponível neste checkpoint não expõe operação oficial de delete de bucket. Portanto esse item permanece **BLOCKED por capability operacional**, não PASS e não falha de source.

## 5. Canonical database types: estrutura fechada, snapshot vivo ainda pendente

Authority atual:

- arquivo canônico: `src/integrations/supabase/types.generated.ts`;
- gerador canônico: `tools/supabase/generate-supabase-types.ts`;
- comando: `npm run generate:types`;
- workflow: `.github/workflows/supabase-types-sync.yml`.

A geração oficial conectada retornou schema com `PostgrestVersion: "14.5"`; o snapshot canônico comprometido observado antes do sync ainda declarava `14.4`. Logo não é correto declarar o contrato remoto sincronizado antes de uma regeneração materializada e verificável.

Workflow `Supabase Types Sync`, run `33308805361`: revalidado em 2026-08-30 e continua **queued** no runner autorizado. O workflow ainda aponta para o HEAD antigo que o disparou (`06e452d...`), portanto não serve como prova de verificação dos commits novos deste checkpoint.

## 6. CI / gates

Os jobs de GitHub Actions disparados após os cortes de source falharam antes de executar steps (`runner_id=0` / steps vazios na inspeção registrada). Isso é evidência de indisponibilidade de execução do CI, não evidência de teste funcional vermelho.

Consequência:

- não marcar testes como PASS sem execução real;
- não reverter source apenas por um job que não chegou a executar;
- assim que runner/Actions voltar a executar steps, rodar os gates do G5 e o sync canônico de types sobre o HEAD atual.

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

1. materializar a geração viva em `src/integrations/supabase/types.generated.ts` e provar que o diff está reconciliado;
2. remover `classified-images` pela Storage API oficial, com preflight/postcheck;
3. obter execução real dos gates do G5 no HEAD atual;
4. somente se os três itens acima fecharem sem novo blocker, atualizar este checkpoint para **G5 CLOSED**;
5. apenas depois iniciar G6.

## 10. Do not repeat

- não refazer o inventário global de SECURITY DEFINER já fechado;
- não reabrir as relações RLS-without-policy já classificadas;
- não recriar `delivery_requests` ou `business_views`;
- não criar policies em tabelas fail-closed apenas para silenciar Advisor;
- não dropar legados Billing com dados;
- não apagar `verification-documents` apenas porque está vazio;
- não contornar `storage.protect_delete()` por SQL;
- não reintroduzir `src/shared/types/database.types.ts`;
- não reintroduzir `src/integrations/supabase/types.ts`;
- não reescrever migrations históricas já aplicadas para satisfazer o ratchet futuro;
- não declarar o sync de types concluído enquanto o snapshot canônico não for regenerado/verificado;
- não iniciar G6 enquanto houver item G5 BLOCKED/aberto.