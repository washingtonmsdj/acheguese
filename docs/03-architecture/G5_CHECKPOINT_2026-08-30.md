# G5 — Database/RLS reconciliation checkpoint — 2026-08-30

Status: **EM EXECUÇÃO**.  
Base GitHub observada antes deste checkpoint: `06e452d786b6b8f055859b0c4e52bc55260e336f`.  
Projeto Supabase: `xhdowzacfujckjelqhtd`.

Este documento reconcilia o checklist mestre de G5 com as provas versionadas e o catálogo remoto vivo. Ele existe para impedir repetição de auditorias já fechadas e, ao mesmo tempo, não converter blockers operacionais em PASS.

## 1. Checklist reconciliado

| item G5 | estado | prova/decisão |
| --- | --- | --- |
| schema atual vs migrations | **CLOSED** | `G5_MIGRATION_DRIFT_CLOSED_2026-08-30.md`: `ALIAS=0`, `CONFLICT=0`, `LOCAL_ONLY=0`, `REMOTE_ONLY=0` no fechamento registrado |
| RLS e grants | **CLOSED** para superfície application-owned | `G5_RLS_GRANTS_AUDIT_2026-08-30.md`; resíduos PostGIS continuam extension-owned, não bypass de domínio |
| funções/RPCs e authority | **CLOSED** | `G5_SECURITY_DEFINER_INVENTORY_2026-08-30.md`: snapshot final application-owned e famílias de maior risco revisadas |
| tabelas legadas sem caller | **CLOSED para os legados SQL já classificados** | Billing preservado/locked; Delivery e `business_views` vazios retirados com provenance; helpers/RPCs órfãos retirados em cortes próprios |
| órfãos | **BLOCKED — 1 residual conhecido de Storage** | bucket remoto `classified-images`; vazio e sem caller/dependência conhecida, mas Supabase impede delete SQL e exige Storage API |
| fixtures/E2E sem provenance | **CLOSED** | `G5_E2E_FIXTURE_PROVENANCE_2026-08-30.md` |
| indexes/constraints | **CLOSED** | `G5_SCHEMA_INTEGRITY_2026-08-30.md` |
| migrations idempotentes/fail-closed | **EM REVISÃO FINAL** | migrations destrutivas G5 recentes usam preflight/postcondition e retirada conservadora; falta fechar o sweep/ratchet global sem exigir replay cego de migrations ledger-owned |
| source ↔ DB contract drift | **EM EXECUÇÃO / BLOCKED por runner no último passo** | segunda autoridade manual de tipos removida; ratchet criado; geração oficial viva retorna PostgREST `14.5`, enquanto o snapshot canônico comprometido observado ainda estava em `14.4`; workflow de sync está queued |
| definir plano de limpeza sem perda de dados | **CLOSED neste checkpoint** | plano abaixo distingue DROP seguro, retenção/export e blockers operacionais |

**G5 inteiro ainda não está fechado. Não iniciar G6.**

## 2. Legados SQL: decisão atual

### Billing — RETAIN / LOCKED

`billing_plans`, `subscription_plans`, `business_subscriptions` e `gastronomy_subscriptions` permanecem sem caller runtime canônico e sem acesso browser. Existem dados históricos nas quatro superfícies e a provenance já está documentada em `G5_LEGACY_BILLING_PROVENANCE_2026-08-30.md`.

Decisão:

- não reintroduzir como SSOT;
- não conceder grants de browser;
- não apagar enquanto não existir snapshot/export e certificação de dependências externas/auditoria;
- a ausência de linha canônica Business em `user_subscriptions` continua significando Free no runtime; não criar backfill sintético só para esvaziar legado.

### Delivery — RETIRED

O cluster vazio `delivery_requests` / `delivery_status_history` / `delivery_tracking` foi retirado por `20260830033337_retire_empty_legacy_delivery_cluster.sql` com `RESTRICT`, sem `CASCADE` e sem perda de dados.

### Business views — RETIRED

`public.business_views` foi retirado por `20260830095958_retire_empty_legacy_business_views.sql` somente após preflight provar ausência de linhas. O ratchet `tests/security/retired-legacy-business-views.test.ts` impede recriação silenciosa.

### Relações fail-closed ativas — RETAIN

As relações classificadas em `G5_FAIL_CLOSED_RELATION_PROVENANCE_2026-08-30.md` não são órfãs apenas por estarem vazias ou sem policy. O snapshot classificado mantém owners ativos para Auth/Analytics/Trust/Moderation/Notifications/Safety/Reviews/Messaging e contextos privados.

## 3. Storage: residual órfão comprovado

O inventário vivo de buckets encontrou `classified-images` com hífen, distinto do antigo `classified_images` com underscore.

Provas observadas em 2026-08-30:

- bucket existe;
- objetos em `storage.objects`: `0`;
- uploads multipart em `storage.s3_multipart_uploads`: `0`;
- partes multipart em `storage.s3_multipart_uploads_parts`: `0`;
- policies que mencionam `classified-images`: `0`;
- funções/procedures que mencionam `classified-images`: `0`;
- views/materialized views que mencionam `classified-images`: `0`;
- triggers que mencionam `classified-images`: `0`;
- busca no HEAD por `"classified-images"`: nenhum caller versionado;
- `supabase_migrations.schema_migrations.statements`: nenhuma migration registrada menciona `classified-images`.

Classificação: **REMOTE ORPHAN / EMPTY / NO KNOWN CALLER**.

### Tentativa de retirada

Uma migration fail-closed foi tentada somente depois dessas provas, mas o Supabase rejeitou o `DELETE FROM storage.buckets` com:

`Direct deletion from storage tables is not allowed. Use the Storage API instead.`

A transação falhou e nenhuma migration foi registrada. O ledger remoto continuou terminando em `20260830100944_lock_ai_images_and_dormant_documents_storage_g5` no snapshot imediatamente posterior.

Decisão:

- **não contornar `storage.protect_delete()`**;
- remover `classified-images` apenas pela Storage API oficial;
- imediatamente antes da remoção operacional, repetir os checks de zero objetos/uploads/parts e zero refs;
- depois da remoção, confirmar ausência do bucket e instalar/atualizar ratchet se necessário.

O conector Supabase disponível neste checkpoint não expõe operação de delete de bucket da Storage API. Portanto este residual fica **BLOCKED por capability**, não PASS e não falha de source.

## 4. `verification-documents` não é órfão removível

Apesar de vazio e sem policies browser no snapshot, `verification-documents` possui provenance e referências canônicas:

- `20260604143000_private_verification_documents_storage.sql`;
- `20260830054127_lock_dormant_verification_documents_bucket.sql`;
- `src/core/media/config/storageBuckets.ts`;
- `src/core/media/services/MediaService.ts`;
- `src/core/verification` e testes/ratchets correspondentes.

Classificação: **DORMANT / LOCKED / RETAIN**, não autorização para delete.

## 5. Compatibilidades que não devem ser confundidas com legado órfão

### Community Interest

`community_interest_registrations` permanece em janela ADDITIVE. Há caller administrativo ativo (`AdminCommunityInterestService`) e o broker `register-community-interest` é a target authority. O cutover final continua guardado em `docs/09-reference/migrations-pending/20260810152014_finalize_community_interest_cutover.sql`.

Não promover o cutover sem toda a evidência operacional exigida pelo preflight (secret Turnstile, allowed origins, frontend broker publicado e smoke/release evidence).

### Community Poll

`community_poll_votes` possui comentário histórico de provenance, mas é tabela canônica ativa. O HEAD contém Poll SSOT, export LGPD, migrations de reconciliação/hardening e testes de authority/compatibility. RLS limita leitura/mutação ao próprio usuário/active profile.

Classificação: **ACTIVE / CANONICAL**, não órfão.

### `territory_aliases`

Permanece view de compatibilidade read-only sobre `location_aliases`, com `security_invoker=true` e apenas SELECT para browser. Não é segundo writer nem candidato a DROP sem novo contrato de compatibilidade.

## 6. Source ↔ DB / TypeScript SSOT

Cortes já executados:

- `9f69bf8558fba476b8c889612c68f393442a2993` — remove `src/shared/types/database.types.ts`, snapshot manual/duplicado sem caller e com project-id antigo;
- `f7b0824ea1b5aee2e0d0bca790dc62488a8b93b4` — ratchet exige `src/integrations/supabase/types.generated.ts` como única autoridade gerada e bloqueia retorno/import do snapshot retirado;
- `be99b21043e64273b9026dc2a9a64919cf87fbd5` / `06e452d786b6b8f055859b0c4e52bc55260e336f` — workflow reprodutível de sync criado e alinhado ao runner autorizado do projeto.

A geração oficial via Supabase conectada retornou schema completo com `PostgrestVersion: "14.5"`. O arquivo canônico comprometido observado antes do sync ainda declarava `14.4`. Portanto existe drift real até o commit de regeneração pousar e ser verificado.

Workflow `Supabase Types Sync`, run `33308805361`: último estado observado neste checkpoint = **queued**. Não declarar PASS antes de execução/commit verificáveis.

## 7. Plano de limpeza lossless

1. **SQL vazio + sem dependência/caller comprovados:** retirar em migration pequena com preflight, `RESTRICT` quando aplicável e postcondition; nunca `CASCADE` por conveniência.
2. **Legado com dados:** primeiro bloquear browser/writes, preservar linhas, documentar owner sucessor; DROP só após snapshot/export, dependências externas e requisito de retenção/auditoria aprovados.
3. **Storage vazio:** usar Storage API oficial; SQL direto em `storage.*` não é mecanismo de remoção de bucket.
4. **Compatibilidade ativa:** manter menor superfície possível e retirar somente por cutover evidence-gated.
5. **Extension-owned:** não alterar como objeto application-owned; PostGIS e resíduos semelhantes exigem estratégia da extensão.
6. **Fixtures:** mutações apenas em targets aprovados e identidades marcadas; ausência de runner nunca vira PASS.
7. **Types/source↔DB:** geração oficial é authority; nenhum snapshot manual paralelo.

## 8. Próximas ações corretas

1. fechar o sync de `types.generated.ts` e verificar o commit gerado;
2. reconciliar `docs/architecture/SSOT_REGISTRY.md`, que ainda precisa refletir uma única autoridade de database types;
3. concluir o sweep `migrations idempotentes/fail-closed` com ratchet apropriado à semântica ledger-owned;
4. remover `classified-images` quando houver acesso à Storage API oficial e registrar a prova;
5. somente depois reavaliar se G5 pode ser fechado.

## 9. Do not repeat

- não refazer o inventário global de SECURITY DEFINER já fechado;
- não reabrir as 17 relações RLS-without-policy já classificadas;
- não recriar `delivery_requests` ou `business_views`;
- não criar policies em tabelas fail-closed para silenciar Advisor;
- não dropar os legados Billing com dados;
- não apagar `verification-documents` apenas porque está vazio;
- não contornar `storage.protect_delete()` por SQL;
- não promover Community Interest CUTOVER sem evidência manual completa;
- não declarar o sync de tipos concluído enquanto o run/commit não forem observados;
- não iniciar G6 enquanto houver checkbox G5 aberto ou BLOCKED sem decisão explícita.