# G5 — Provider revalidation — 2026-09-02

Status: **EM EXECUÇÃO / G6 BLOQUEADO**  
Branch: `main`  
HEAD source revalidado antes deste checkpoint: `6515bdca8bf8500a429c991fed6f69be53d49c52`  
Projeto Supabase canônico: `xhdowzacfujckjelqhtd` (`acheguese`, ACTIVE_HEALTHY)

Este arquivo é um **delta operacional de evidência** para o plano permanente `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`. Não substitui os checkpoints G5 anteriores e não cria uma segunda autoridade.

## 1. Resultado executivo

A revalidação live de 2026-09-02 não encontrou justificativa para nova migration de RLS/schema neste corte.

O estado correto é:

- banco vivo acessível e saudável;
- RLS continua fail-closed nas tabelas próprias sem policy;
- `spatial_ref_sys` continua sendo a única tabela `public` sem RLS e permanece provider-owned/PostGIS;
- o snapshot TypeScript versionado continua em drift contra o gerador oficial live;
- o workflow canônico de types sync continua aguardando o runner autorizado;
- o bucket órfão `classified-images` continua vazio e sem policy associada, mas sua remoção continua dependendo do lifecycle oficial Supabase Storage;
- G6 continua **NÃO AUTORIZADO**.

Nenhum DDL foi aplicado nesta revalidação.

## 2. Supabase generated types — drift confirmado, transporte oficial bloqueado

A geração oficial conectada para `xhdowzacfujckjelqhtd` continua funcionando e representa o schema live atual com PostgREST `14.5`.

O snapshot canônico versionado permanece:

- arquivo: `src/integrations/supabase/types.generated.ts`;
- header atual: `PostgREST 14.4`.

O output live inclui contratos ausentes/mais novos no snapshot, incluindo `account_deletion_requests`. Portanto o drift é real e não deve ser tratado como falso positivo de CI.

Regra preservada:

- não reconstruir `types.generated.ts` manualmente ou por amostragem;
- não copiar um payload truncado;
- não criar segundo gerador;
- materializar o arquivo inteiro somente pela authority canônica já instalada.

### Workflow atual

- workflow: `Supabase Types Sync`;
- run: `33602288627`;
- HEAD: `6515bdca8bf8500a429c991fed6f69be53d49c52`;
- status revalidado: `queued`;
- conclusion: `null`.

O workflow usa deliberadamente o runner self-hosted autorizado (`acheguese-heavy-windows` / `remote-only`). Não trocar para `ubuntu-latest` apenas para contornar indisponibilidade do runner, porque a governança do repositório exige esse boundary.

## 3. RLS live — snapshot de 2026-09-02

Consulta read-only sobre `pg_class`, `pg_namespace` e `pg_policies` no projeto canônico:

- tabelas `public`: **233**;
- RLS habilitado: **232**;
- RLS desabilitado: **1**;
- `FORCE ROW LEVEL SECURITY`: **2**;
- tabelas sem policy: **13**.

As duas tabelas com FORCE RLS observadas são:

- `pricing_rules`;
- `verification`.

A única tabela sem RLS é:

- `spatial_ref_sys` — PostGIS/provider-owned; não alterar para satisfazer ratchet local.

### Tabelas sem policy no snapshot live

Todas abaixo, exceto `spatial_ref_sys`, possuem RLS ligado e portanto permanecem **fail-closed** para acesso que não atravesse uma authority privilegiada explícita:

- `account_deletion_requests`;
- `analytics_sessions`;
- `banned_users`;
- `community_social_audit_log`;
- `community_user_moderation_actions`;
- `emergency_delivery_log`;
- `gastronomy_subscriptions`;
- `group_message_reactions`;
- `review_helpfulness`;
- `trust_admin_actions`;
- `trust_events`;
- `user_active_profiles`;
- `spatial_ref_sys` — provider-owned e fora da regra de RLS do produto.

A ausência de policy **não é motivo para criar policy automaticamente**. Para tabelas próprias com RLS ligado, zero policies é um estado fail-closed válido. Qualquer abertura futura exige caller/provenance e teste explícito.

`account_deletion_requests` permanece exatamente no posture já decidido pelo G5: RLS ON + zero policy. Não criar policy somente para silenciar advisor.

## 4. Storage — órfão confirmado sem ambiguidade de identidade

Revalidação read-only de `storage.buckets` + `storage.objects`:

| bucket | public | objetos | classificação |
|---|---:|---:|---|
| `classified-images` | true | 0 | **REMOTE ORPHAN** |
| `classified_images` | true | 0 | identidade histórica/canônica distinta; não remover por confusão de nome |

Também foi revalidado que não existe policy em `storage.objects` cujo `qual` ou `with_check` referencie `classified-images` (hífen).

Busca de source não encontrou `classified-images` como bucket canônico de runtime. Já `classified_images` continua presente no SSOT de buckets e em migrations/ratchets históricos, portanto as identidades não podem ser tratadas como equivalentes.

### Capability blocker

O lifecycle correto continua sendo a API oficial do Supabase Storage:

1. preflight de zero objetos;
2. `emptyBucket` quando exigido pelo provider;
3. `deleteBucket` somente para `classified-images`;
4. postcheck de ausência;
5. preservar `classified_images`.

As capabilities Supabase conectadas nesta sessão não expõem mutation de bucket, e a busca por capability/plugin adicional de `supabase storage` não encontrou opção instalável.

Portanto:

- **não** executar `DELETE FROM storage.buckets`;
- **não** criar Edge Function administrativa descartável;
- **não** ampliar um broker de domínio apenas para apagar o bucket;
- manter esse item como provider/capability blocker.

## 5. Schema migrations live

O ledger `supabase_migrations.schema_migrations` continua com migrations G5 versionadas até a sequência de 2026-08-31; nesta revalidação não foi aplicada migration adicional.

A diferença observada entre medições intermediárias de contagem de policies/RLS não é suficiente para afirmar uma mudança concorrente específica sem provenance. Este checkpoint adota apenas o **snapshot live mais recente acima** como evidência canônica desta sessão.

## 6. Decisão de migration deste corte

**NENHUMA NOVA MIGRATION.**

Motivos:

- não existe tabela própria publicamente aberta detectada por esta auditoria;
- tabelas próprias sem policy estão fail-closed por RLS;
- `account_deletion_requests` está no posture intencional já documentado;
- `spatial_ref_sys` é provider-owned;
- o drift de TypeScript é de materialização do artefato gerado, não autorização para alterar schema;
- o residual de Storage exige API oficial do provider, não SQL direto.

Criar migration para "fazer números parecerem melhores" violaria as invariantes do G5.

## 7. Blockers G5 após esta revalidação

Restam três blockers centrais, todos separados de source business logic:

1. **Supabase generated types** — materialização integral pelo runner autorizado do snapshot PostgREST 14.5/live;
2. **Storage orphan** — remoção oficial de `classified-images` via Supabase Storage API + postcheck;
3. **GitHub Actions / runner** — jobs remotos precisam obter runner e executar steps reais para fornecer hosted proof do mesmo SHA.

Enquanto qualquer um desses três estiver aberto, G5 permanece **EM EXECUÇÃO** e G6 permanece **BLOQUEADO**.

## 8. next_action

1. revalidar `main` antes de qualquer novo write;
2. se `33602288627` sair de `queued`, revisar o commit gerado e confirmar que `types.generated.ts` foi materializado integralmente a partir do projeto `xhdowzacfujckjelqhtd`;
3. se surgir capability oficial de Storage, repetir preflight e remover **somente** `classified-images` via lifecycle oficial;
4. não criar policy para tabelas fail-closed sem caller/provenance;
5. quando Actions voltar a executar steps reais, rodar/reconciliar os testes live G5 no mesmo SHA;
6. somente depois dos três blockers centrais fechados, reconciliar o checkpoint G5 principal e avaliar autorização de G6.

## 9. do_not_repeat

- não iniciar G6;
- não editar `types.generated.ts` parcialmente;
- não trocar o runner canônico por conveniência;
- não apagar bucket Storage via SQL;
- não confundir `classified-images` com `classified_images`;
- não criar RLS policy apenas para reduzir contagem de tabelas sem policy;
- não alterar `spatial_ref_sys`;
- não interpretar job `queued`/pré-step como falha de aplicação;
- não aplicar migration sem divergência real de schema/RLS com provenance.
