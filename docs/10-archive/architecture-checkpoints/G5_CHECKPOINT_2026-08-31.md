# G5 — Checkpoint de revalidação — 2026-08-31

## 1. Autoridade e escopo

Este checkpoint continua o plano permanente `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` sem criar uma segunda autoridade.

- branch de execução: `main`;
- HEAD revalidado imediatamente antes deste write: `2f8ab00dbb5451d353f01db09989822f9c897133`;
- projeto Supabase canônico: `xhdowzacfujckjelqhtd`;
- fase: **G5 — Database, RLS e legado — EM EXECUÇÃO**;
- G6 permanece **NÃO AUTORIZADO** enquanto houver blocker G5 aberto.

A checklist G5 do plano raiz ficou deliberadamente conservadora e já não representa todos os fechamentos técnicos obtidos em 2026-08-30. Este documento reconcilia o estado real sem reabrir auditorias já encerradas e sem declarar PASS onde a prova operacional ainda não existe.

## 2. Reconciliação da checklist G5

| Item do plano raiz | Estado reconciliado | Evidência / decisão |
| --- | --- | --- |
| auditar schema atual vs migrations | **FECHADO** | `G5_MIGRATION_DRIFT_CLOSED_2026-08-30.md`; catálogo remoto e lineage foram reconciliados. O drift do snapshot TypeScript é tratado separadamente como contrato source↔DB. |
| auditar RLS e grants | **FECHADO** | `G5_RLS_GRANTS_AUDIT_2026-08-30.md`; app-owned RLS/grants e relações fail-closed foram classificadas. |
| auditar functions/RPCs e autoridade de execução | **FECHADO** | `G5_SECURITY_DEFINER_INVENTORY_2026-08-30.md`; 239 `SECURITY DEFINER` inventariadas, seis superfícies anônimas allowlisted e gateways autenticados classificados. |
| identificar tabelas legadas sem caller | **AUDITORIA FECHADA; DROP DEFERIDO ONDE HÁ DADOS** | Billing legado não possui caller runtime canônico, porém `gastronomy_subscriptions` mantém 5 linhas históricas. Não apagar sem snapshot/export e prova de retenção/dependências. |
| identificar órfãos | **PARCIAL / BLOQUEADO OPERACIONALMENTE** | órfão remoto `classified-images` já foi classificado como vazio e sem caller conhecido; remoção só pode ocorrer pela Storage API oficial. |
| separar fixtures/E2E de dados sem provenance | **FECHADO** | `G5_E2E_FIXTURE_PROVENANCE_2026-08-30.md`; targets e identidades de fixture foram classificados. |
| revisar índices e constraints | **FECHADO** | `G5_SCHEMA_INTEGRITY_2026-08-30.md`; PK/FK/UNIQUE/índices/constraints revisados, sem blanket indexing para silenciar Advisor. |
| garantir migrations idempotentes/fail-closed | **FECHADO PARA MIGRATIONS NOVAS** | cutover em `20260830101000`; ratchet proíbe destruição tolerante a pré-condição ausente, `DROP ... CASCADE`, exceções que escondem falhas e deleção direta de `storage.buckets`. |
| validar contratos fonte ↔ banco | **BLOQUEADO** | `src/integrations/supabase/types.generated.ts` está materialmente stale frente à geração oficial viva; é proibida correção manual/parcial. |
| definir plano de limpeza sem perda de dados | **PLANO FECHADO; EXECUÇÃO PARCIALMENTE BLOQUEADA/DEFERIDA** | SQL vazio só sai com preflight/postcondition; legado com dados é retido; Storage somente via API oficial; extension-owned não é tratado como app-owned. |

Conclusão: a maioria da checklist raiz já possui auditoria/decisão fechada. **G5 como fase continua aberto** por blockers de materialização/prova operacional, não por ausência de inventário global.

## 3. Revalidação viva em 2026-08-31

### 3.1 Security Advisor / `SECURITY DEFINER`

O Security Advisor atual passou a exibir avisos para funções `SECURITY DEFINER` executáveis por `anon`/`authenticated`. Esses avisos foram tratados como sinal de revisão, não como ordem para revogar grants em massa.

Revalidação direta de funções sensíveis confirmou os guards esperados, incluindo:

- `apply_trust_admin_actions`: autenticação + admin + bloqueio de self-target indevido;
- `create_notification`: não-service exige `auth.uid()` e ownership do `p_user_id`, com controles de throttling/dedupe;
- `get_community_poll_for_post`: leitura condicionada a publicação/visibilidade ou owner/admin;
- `get_review_aggregates_admin`: auth/service + admin;
- `list_federated_moderation_queue`: auth/service + admin;
- `profile_public_territory_projection`: guards de visibilidade;
- `track_analytics_event`: validação, rate limit, bloqueio de spoofing e eventos privilegiados restritos a service role;
- `get_shared_ride_safety_data`: acesso condicionado a share secret ativo/não expirado;
- `get_ride_rating_summary`: agregado público deliberado.

Decisão: **não executar blanket revoke para zerar Advisor**. O inventário fechado de authority continua sendo a fonte de decisão, e qualquer mudança futura deve ser função a função com prova de quebra/abuso real.

### 3.2 RLS-without-policy e PostGIS

As relações app-owned RLS-without-policy já classificadas continuam intencionalmente fail-closed e não devem receber policies artificiais apenas para silenciar o Advisor. `spatial_ref_sys` permanece residual extension-owned do PostGIS e não deve receber hack de ownership/policy como se fosse tabela da aplicação.

### 3.3 GitHub Actions

A indisponibilidade de execução continua sendo infraestrutura, não evidência de regressão de source. Na revalidação atual, o run `33368313132` ainda materializa jobs sem runner e sem steps executados (`runner_id = 0`, `steps = []`).

Consequências:

- não interpretar o badge `failure` como lint/test/typecheck executado e falhando;
- não reverter source por jobs que nunca receberam runner;
- não trocar a authority/runners só para obter badge verde;
- somente registrar PASS quando houver steps reais executados no SHA observado.

## 4. Blockers centrais que mantêm G5 aberto

### B1 — Snapshot oficial de tipos Supabase

O único SSOT de tipos continua sendo:

`src/integrations/supabase/types.generated.ts`

A geração oficial viva provou drift material:

- remoto reporta `PostgrestVersion: "14.5"`;
- snapshot commitado ainda reporta `14.4`;
- remoto possui `public.account_deletion_requests`, ausente no snapshot observado;
- há drift semântico já documentado em enums reparados no banco.

O fechamento exige **materializar integralmente o output oficial** no arquivo canônico e validar o diff. É proibido editar manualmente versão, enums ou tipos pontuais para simular regeneração.

### B2 — Bucket remoto órfão `classified-images`

O residual permanece classificado como `REMOTE ORPHAN / EMPTY / NO KNOWN CALLER`. O fechamento exige:

1. revalidar ausência de objetos/referências imediatamente antes;
2. `emptyBucket` pela API oficial quando aplicável;
3. `deleteBucket` pela API oficial;
4. confirmar ausência depois.

O conector Supabase disponível não expõe lifecycle de bucket. Não usar SQL direto, não contornar `storage.protect_delete()`, não ampliar Edge Functions de domínio e não criar/derivar autoridade service-role paralela apenas para remover o bucket.

### B3 — Execução efetiva de GitHub Actions

É necessário obter pelo menos uma execução real dos gates no HEAD então atual, com runner alocado e steps materializados. Falha pré-step continua sendo blocker de plataforma, não prova funcional.

## 5. Estado dos legados e limpeza lossless

### Billing — RETAIN / LOCKED

`billing_plans`, `subscription_plans`, `business_subscriptions` e `gastronomy_subscriptions` permanecem sem caller runtime canônico e sem acesso browser, porém dados históricos impedem remoção destrutiva sem processo de retenção. Em especial, `gastronomy_subscriptions` mantém 5 linhas históricas.

### Delivery — RETIRED

`delivery_requests`, `delivery_status_history` e `delivery_tracking` já foram retirados. Não recriar.

### Business views — RETIRED

`public.business_views` já foi retirado com preflight e ratchet. Não recriar silenciosamente.

### `verification-documents` — DORMANT / LOCKED / RETAIN

Possui provenance/callers canônicos e não deve ser apagado apenas por estar vazio.

## 6. Próxima execução autorizada

A ordem de fechamento de G5 permanece:

1. materializar oficialmente e integralmente `types.generated.ts`, depois provar reconciliação source↔DB;
2. remover `classified-images` exclusivamente pela Storage API oficial, com preflight/postcheck;
3. recuperar execução efetiva do GitHub Actions e observar os gates com runner/steps reais;
4. consumir a próxima execução Vercel real para confirmar os gates source já corrigidos, sem confundir `build-rate-limit` com falha da aplicação;
5. se e somente se B1, B2 e B3 estiverem fechados e nenhum novo blocker real aparecer, declarar **G5 CLOSED**;
6. somente então iniciar G6.

## 7. Do not repeat

- não refazer o inventário global de `SECURITY DEFINER` já fechado;
- não reabrir as relações RLS-without-policy já classificadas;
- não criar policies artificiais para silenciar Advisor;
- não aplicar blanket revoke em RPCs deliberadamente públicas/autenticadas;
- não mexer em PostGIS extension-owned como se fosse app-owned;
- não blanket-indexar FKs apenas por Advisor;
- não dropar Billing legado com dados;
- não recriar `delivery_requests` ou `business_views`;
- não apagar `verification-documents` só porque está vazio;
- não deletar bucket por SQL;
- não criar executor service-role paralelo para contornar Storage API ausente;
- não reconstruir manualmente `types.generated.ts`;
- não criar segundo arquivo de tipos Supabase;
- não editar pontualmente `PostgrestVersion`/enums para simular sync;
- não reescrever migrations históricas já aplicadas para satisfazer o ratchet futuro;
- não interpretar GitHub Actions pré-step ou Vercel `build-rate-limit` como regressão de source;
- não iniciar G6 enquanto qualquer blocker G5 permanecer aberto.

## 8. Critério de saída reconciliado

G5 será considerado fechado somente quando coexistirem no mesmo estado canônico:

- migrations novas protegidas pelo ratchet fail-closed;
- grants/policies e funções com authority auditada;
- legados classificados e cleanup lossless definido;
- fixtures com provenance;
- schema/indexes/constraints reconciliados;
- snapshot oficial de tipos materializado e reconciliado com o banco;
- órfão `classified-images` removido pela autoridade correta;
- gates de CI efetivamente executados, não apenas agendados/falhando pré-step.

Até lá, o estado correto permanece: **G5 EM EXECUÇÃO / G6 BLOQUEADO**.

## 9. Continuação de execução — 2026-09-02

### 9.1 HEAD e correções de source

A execução foi retomada diretamente na `main`. Antes desta atualização documental, o HEAD revalidado era `9596975bea40189b61c5ac73ba134537639946fa`.

A cadeia de correções que levou ao estado verde inclui:

- centralização do cliente Supabase E2E na authority operacional existente;
- correção de ownership de `business_data` para `core/business`;
- delegação de Education ao owner territorial;
- classificação do `sitemap` como gateway backend territorial read-only;
- remoção da RPC direta de Analytics no `AdminService` em favor de `AnalyticsService`;
- preservação da autoridade de sessão via `SessionService`;
- correção do resolver de imports para não tratar diretórios como arquivos;
- alinhamento de governança de facades canônicas;
- remoção dos hardcodes detectados pelo ratchet;
- migração do Playwright e helpers E2E do path aposentado `scripts/lib/remote-mutation-safety` para `tools/supabase/remote-mutation-safety`;
- fechamento das violações de Community sem abrir exceção genérica: `communityLaunch` permanece o único contrato documentado permitido nessa árvore, e o teste de `PostHeader` consome a facade de `core/posts`;
- ratchet de migrations alinhado ao cutover canônico `20260830101000`, preservando o engine integral e impedindo apenas retroatividade das três regras explicitamente futuras sobre migrations históricas já aplicadas;
- remoção da facade temporária e sem caller `src/core/community-experience/config/communityLaunch.ts`.

### 9.2 B3 — GitHub Actions — FECHADO

O blocker de execução real de CI está **FECHADO**.

No SHA `1391ca32b7c6c6633f4b17b82b76874c3f44c717`, houve runners reais, checkout, instalação e steps efetivamente executados:

- SSOT Enforcement run `33600030861`, job `100153295166`: **SUCCESS**;
  - dependency boundaries: PASS;
  - taxonomy: PASS;
  - Phase 1 architecture guards: PASS;
  - incremental boundaries: PASS;
  - Core Platform ownership: PASS;
  - architecture governance: PASS;
  - delivery: PASS;
  - communication: PASS;
  - critical file sizes: PASS;
  - Maps architecture: PASS;
  - global SSOT: PASS;
  - Community boundaries: PASS;
  - Education boundaries: PASS;
  - Gastronomy boundaries: PASS;
  - Billing rules/contracts e checks de subscriptions/planTier: PASS.
- Security Check run `33600030898`:
  - `Validate No Hardcoded Credentials`, job `100153296821`: **SUCCESS**;
  - `Run Tests`, job `100153297055`: **SUCCESS**;
  - `Lint and Type Check`, job `100153297064`: **SUCCESS**, incluindo ESLint, TypeScript, Upload SSOT, Media SSOT, incremental architecture e Core Platform;
  - `Maps Architecture Enforcement`, job `100153297097`: **SUCCESS**.

Também houve prova anterior de execução real para Runtime Vitest, Regression Check e E2E territorial fixture-backed. O erro anterior do Playwright ocorria antes de abrir navegador por apontar para o path aposentado; após a migração, o E2E territorial executou e concluiu com sucesso.

Decisão: não tratar mais indisponibilidade histórica do run `33368313132` como blocker atual. A evidência viva substitui esse estado anterior.

### 9.3 B2 — `classified-images` — REVALIDADO / BLOQUEADO SOMENTE PELA AUTHORITY DISPONÍVEL

A revalidação remota de 2026-09-02 confirmou:

- bucket `classified-images`: presente;
- `public = true`;
- `object_count = 0`;
- busca atual no repositório: somente documentação/checkpoints/migrations; nenhum caller runtime identificado.

O conector Supabase disponível foi novamente inspecionado e continua sem operação suportada de lifecycle de Storage equivalente a `emptyBucket`/`deleteBucket`.

Portanto o estado permanece:

`REMOTE ORPHAN / EMPTY / NO RUNTIME CALLER / DELETE BLOCKED BY CONNECTOR CAPABILITY`.

Não executar `DELETE` em `storage.buckets`, não contornar proteção por SQL, não criar Edge Function e não criar authority service-role paralela somente para remover esse residual.

### 9.4 B1 — tipos Supabase — GERADOR OFICIAL ALCANÇÁVEL / MATERIALIZAÇÃO AINDA BLOQUEADA

O gerador oficial do projeto Supabase `xhdowzacfujckjelqhtd` foi invocado novamente nesta continuação e responde com o schema vivo. Entretanto, o transporte disponível nesta sessão não forneceu um artefato integral reutilizável que possa ser persistido atomicamente no GitHub sem reconstrução manual do output.

O workflow oficial `.github/workflows/supabase-types-sync.yml` já possui a authority correta — `npx supabase gen types typescript --project-id xhdowzacfujckjelqhtd` — e grava integralmente `src/integrations/supabase/types.generated.ts`, porém depende de runner self-hosted Windows e ainda não materializou um commit atual de tipos.

A inspeção do arquivo canônico em 2026-09-02 confirma que ele continua com:

`PostgrestVersion: "14.4"`

logo B1 **não pode ser declarado fechado**.

Decisão: não copiar trechos truncados, não reconstruir tipos manualmente, não alterar apenas `PostgrestVersion`, enums ou tabelas pontuais. O blocker agora é de **materialização/transporte do output oficial**, não de desconhecimento do schema remoto.

### 9.5 Estado reconciliado dos blockers

| Blocker | Estado em 2026-09-02 | Próxima authority válida |
| --- | --- | --- |
| B1 — tipos oficiais | **ABERTO — materialização bloqueada** | output integral do gerador oficial, preferencialmente pelo workflow `Supabase Types Sync` ou por transporte que preserve o artefato completo |
| B2 — bucket órfão | **ABERTO — lifecycle Storage indisponível no conector** | Storage API oficial `emptyBucket`/`deleteBucket` |
| B3 — CI real | **FECHADO** | nenhuma ação adicional; reutilizar as provas acima |

### 9.6 Próxima ação e do-not-repeat atualizado

Próxima ação autorizada de G5:

1. materializar integralmente o output oficial de tipos e validar o diff;
2. remover `classified-images` somente quando uma authority oficial de Storage lifecycle estiver disponível;
3. não rerodar a campanha global já verde sem mudança de source que justifique nova prova;
4. somente com B1+B2 fechados declarar G5 CLOSED e liberar G6.

Não repetir:

- a sequência de correções de Business/Territory/Analytics/Auth/Community já comprovada pelos gates verdes;
- os 36 testes de Fase 1 apenas para reproduzir prova já obtida;
- a auditoria global SSOT, que chegou a zero violações;
- a tentativa de corrigir migrations históricas para satisfazer ratchets posteriores ao cutover;
- qualquer patch manual de `types.generated.ts`;
- qualquer deleção SQL de `classified-images`.

Estado final desta continuação: **G5 EM EXECUÇÃO / B3 FECHADO / B1+B2 ABERTOS / G6 BLOQUEADO**.
