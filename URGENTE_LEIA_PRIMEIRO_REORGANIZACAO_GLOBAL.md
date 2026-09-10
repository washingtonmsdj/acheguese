# URGENTE — ponteiro de compatibilidade

> **STATUS: SUBSTITUÍDO COMO AUTORIDADE.**
>
> Este arquivo existe temporariamente apenas para não quebrar referências históricas, workflows e agentes antigos. Ele **não é o SSOT operacional** e deve permanecer curto.

## Autoridades vivas

Leia nesta ordem:

1. `docs/README.md` — índice documental canônico;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais vigentes;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — execução operacional atual;
4. `docs/08-roadmap/checkpoints/2026-09-10-g42-runtime-authority-contracts.md` — checkpoint G42: MFA/AAL2 server-side, contratos runtime fail-closed, Try-On e contenção de branches concorrentes;
5. `docs/08-roadmap/checkpoints/2026-09-10-g41-edge-client-contracts.md` — checkpoint G41: contratos Edge, IA, Push, LGPD e consolidação de authorities;
6. `docs/08-roadmap/checkpoints/2026-09-10-g40-edge-error-contract.md` — checkpoint G40, fechamento do creator legado, contrato HTTP de Edge e fixture E2E isolada;
7. `docs/08-roadmap/checkpoints/2026-09-10-g39-professional-lead-intake.md` — checkpoint G39 e gate de cutover Professional;
8. `docs/08-roadmap/checkpoints/2026-09-10-g38-professional-authority.md` — checkpoint anterior G38;
9. `SECURITY.md` — segurança e gates de release.

## Checkpoint operacional curto — 2026-09-10

- Home + identidade visual estão integradas à `main`; identidade ativa: Plus Jakarta Sans, petróleo `#123E3D`, solar `#F3CB4C`, superfície `#FAFBF7`, texto principal `#203534`;
- `7f1abe79` sincronizou a Home responsiva sem regressão estrutural;
- os 10 erros TypeScript revelados pelo build pós-merge foram corrigidos pela consolidação dos owners canônicos de Admin, Location/ServiceAreas, Mobility e Safety, sem restaurar bridges ou writers antigos;
- `9a90aaed` aposentou contratos mortos de Admin/Profile e o reexport local obsoleto de `ServiceArea`;
- `cce689c7` alinhou `admin-create-user` ao lifecycle canônico de Auth/Profile; auditoria posterior confirmou que a função **não tem caller ativo no frontend/Admin atual**, portanto ela não deve ser implantada apenas por existir no Git;
- `f6e6fd1` corrigiu o `vercel-ignore`; sem prova suficiente de diff ele executa build normal, e checkout sem remote `origin` não gera falso erro fatal;
- deployment production `dpl_8DWo9NXMwyXaMGkKwkoV4h4Ldho1` de `f6e6fd1` ficou READY; deployment production posterior `dpl_7duftbyCnSp1cHUEr2uNPbhzvZBN` de `ba691ca6` também está READY e é a produção conhecida mais recente desta linha;
- sitemap resiliente foi provado em produção: Supabase/Cloudflare 522 cai no fallback estático validado com 7 URLs sem derrubar o release;
- `profile-rpc` foi reconciliado no runtime em **v19 ACTIVE**, `verify_jwt=true`; `service_area`, `service_areas` e `service_radius_km` são rejeitados em Professional/extensionData e Coverage permanece em `public.service_areas`;
- a geração oficial de tipos Supabase continua intermitentemente bloqueada por 522; não editar `types.generated.ts` manualmente nem substituir o boundary estreito de `register_safety_evidence` por `any`;
- `5bead48b` corrigiu o novo Search/Explorar para projetar pins via `mapEntityProjection`; `be2d464b` integrou a Search por merge real de dois pais, preservando o hardening funcional da `main`;
- `fc912273` reduziu exatamente os **11 allowances stale** detectados pelo último build READY: 5 writers Safety, 1 reader `service_areas`, 3 callers RPC e 2 dynamic writers de Mobilidade; nenhuma nova permissão foi adicionada;
- G38: `AdminServicos` não escreve mais disponibilidade Professional diretamente; `admin-professional-rpc` está **v6 ACTIVE**, `verify_jwt=true`, com entrypoint e shared helpers reconciliados ao source da `main`;
- G38/G39: `ProfessionalLeadService` não faz mais read-modify-write/upsert de `professional_stats.contacts_count`; o futuro contador atômico por trigger **não está na fila ativa de migrations** para evitar dupla contagem com o frontend LIVE antigo;
- G39: `9b01a9a3` moveu a criação pública de orçamento para `ProfessionalLeadIntakeService` + `create-professional-lead`, com Turnstile, honeypot, rate-limit, origin/body guards, deduplicação e identidade/lifecycle derivados server-side;
- G39: `create-professional-lead` está **v2 ACTIVE**, `verify_jwt=false`, como broker público governado; o endpoint é aditivo e a produção antiga não depende dele;
- G39: o SQL destrutivo está somente em `docs/09-reference/migrations-pending/20260910133000_finalize_professional_lead_intake_g39.sql`; **não mover/aplicar** até frontend novo LIVE + smoke anônimo/autenticado + zero caller LIVE do criador direto;
- G39: `3e68743b` ratcheta o staging e exige que a futura revogação de `INSERT` em `professional_leads` e DML em `professional_stats` ocorra no mesmo cutover transacional;
- G40: `86d92e03` removeu fisicamente `ProfessionalLeadService.createLead` depois da prova de zero callers runtime; `71d3c42b` impede por teste que o creator e seus helpers mortos retornem;
- G40: `src/integrations/supabase/functionErrors.ts` centraliza leitura de `FunctionsHttpError`; intake Professional e broker genérico preservam erros estruturados 4xx/5xx sem importar `@supabase/supabase-js` em `core`;
- G40: `55b25cd0` migrou a fixture técnica de `professional_leads` para `createOptionalOperationalAdminClient()` em target E2E aprovado; `878e06d2` ratcheta essa separação;
- G41: Billing, Territorial, Verificação/Admin, Educação, cadastro de interesse, Safety e LGPD foram alinhados ao contrato canônico de erro Edge e passaram a rejeitar payloads de sucesso incompletos nos pontos críticos;
- G41: `PrivacyService` deixou de reportar `sizeBytes=0` e contagem incorreta de seções: os valores agora são derivados do payload real de `user-export-data`; a flag `LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE=false` permanece intocada;
- G41: `OpenAIProvider`/`ai-intent-parse` foram aposentados porque o endpoint não existe; `IntentParser` usa agora `EdgeAIProvider -> aiClient.text -> ai-text`, com structured output e fallback determinístico;
- G41: Push foi reduzido à authority real de self-service: `send-push-bulk`/`sendToUsers` inexistentes foram removidos, `sendToUser` é primitive privada do autoteste e só há sucesso quando `successCount >= 1`;
- G41: o `AdminService` duplicado em `src/core/profiles/services/multi-profile/adminService.ts` foi removido após prova de zero callers runtime; o teste G36 agora exige um único owner de moderação em `core/admin`;
- G42: `MFAService.checkMFARequired()` não transforma mais falha do broker em `required:false`; policy MFA desconhecida para sessão autenticada permanece fail-closed;
- G42: recovery codes locais sem autoridade real foram removidos; status MFA visível é derivado de fatores verificados do Supabase Auth;
- G42: `_shared/mfaPolicy.ts` centraliza a decisão server-side e `_shared/adminAuth.ts` exige MFA real para `admin`/`super_admin`; o JWT atual precisa apresentar AAL2 para operações administrativas;
- G42: enquanto o DDL de fechamento não puder ser provado no remoto, `admin_mfa_enforcement`, `is_exempt` e `grace_period_expires_at` não podem afrouxar autorização; o tracker é cache, não authority;
- G42: o DDL de fechamento permanece somente em `docs/09-reference/migrations-pending/20260910203000_harden_mfa_authority_g42.sql`; **não mover/aplicar** sem preflight remoto e confirmação das policies/grants reais;
- G42: `tryon-generate` não expõe mais erro interno/provider em resposta 500 nem em `error_message`; transições `processing`, progresso e `completed` verificam persistência antes de continuar;
- G42: permanece aberto o fechamento transacional da cascata territorial para descendentes; não implementar loop de writes no Edge porque isso criaria mutação parcial sem transação;
- G42: `module/mobilidade` e `codex/identidade-visual-achegue-se` são zonas de trabalho paralelo reservadas; `codex/nova-home-comunidade` e demais `codex/*`/`agent/*` existentes não devem ser apagadas/fundidas automaticamente;
- G42: o GitHub Actions observado continua criando jobs que falham antes de executar steps (`steps=[]`, sem log útil); isso é gate de execução indisponível e **não** certificação verde nem prova de regressão;
- ainda faltam os smokes públicos anônimo e autenticado do G39 pelo broker + Turnstile e a certificação real de security/architecture/typecheck/build antes do cutover;
- builds atuais da `main` continuam sujeitos ao **build-rate-limit da Vercel** (`Deployment rate limited — retry in 24 hours`), blocker externo de execução e não prova de compilação aprovada ou reprovada;
- **não revogar ainda** os grants temporários de `professional_data/profiles` nem executar o cutover de leads/stats enquanto o frontend novo não estiver comprovadamente LIVE no mesmo SHA/descendente certificado;
- `codex/identidade-visual-achegue-se` deve receber `main` por merge sem force-push, preservando seus deltas visuais próprios; nunca substituir a branch visual por uma árvore antiga para “sincronizar” arquitetura;
- Mobilidade continua **launch-paused**: `PUBLIC_LAUNCH_SURFACES.mobility=false`;
- não restaurar DML direto, operator scripts obsoletos, wrappers concorrentes, dynamic-table novo ou authorities paralelas.

## Regra para novas IAs/agentes

- inspecionar primeiro o projeto real: código da `main`, rotas, owners, serviços, schema/migrations, testes, deploy/runtime e comportamento observado;
- documentação pode estar desatualizada e nunca autoriza sozinha remover feature implementada;
- feature coerente com o produto que esteja quebrada, incompleta ou `launch-paused` deve ser corrigida na causa raiz, não apagada para simplificar;
- remover somente legado real, duplicação, compatibility bridge ou owner substituído, depois de preservar/migrar a capacidade funcional válida e comprovar callers/impacto;
- trabalhar diretamente na `main`, sem force-push, revalidando o HEAD antes de cada write;
- tratar `module/mobilidade` e `codex/identidade-visual-achegue-se` como branches reservadas enquanto houver trabalho paralelo ativo; não cherry-pickar, resetar, substituir árvore ou force-pushar essas linhas automaticamente;
- preferir owner/SSOT canônico em `src/core`, `src/modules`, `src/app`, `src/integrations` e `src/shared`;
- atualizar `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` quando um checkpoint operacional mudar e usar checkpoints incrementais em `docs/08-roadmap/checkpoints/` somente quando necessário para evitar reescrita insegura do SSOT durante execução concorrente;
- usar `teste-acheguese` apenas como laboratório/prova de UX territorial quando aplicável; o produto consolidado continua neste repositório.

## Política de migração deste ponteiro

Este arquivo só poderá ser removido depois que referências ativas forem migradas para os documentos canônicos e referências históricas restantes estiverem apenas em `docs/10-archive/`.
