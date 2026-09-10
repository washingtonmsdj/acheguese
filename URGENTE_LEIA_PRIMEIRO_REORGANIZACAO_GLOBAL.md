# URGENTE — ponteiro de compatibilidade

> **STATUS: SUBSTITUÍDO COMO AUTORIDADE.**
>
> Este arquivo existe temporariamente apenas para não quebrar referências históricas, workflows e agentes antigos. Ele **não é o SSOT operacional** e deve permanecer curto.

## Autoridades vivas

Leia nesta ordem:

1. `docs/README.md` — índice documental canônico;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais vigentes;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — execução operacional atual;
4. `docs/08-roadmap/checkpoints/2026-09-10-g38-professional-authority.md` — checkpoint incremental G38 enquanto o SSOT principal aguarda consolidação;
5. `SECURITY.md` — segurança e gates de release.

## Checkpoint operacional curto — 2026-09-10

- Home + identidade visual estão integradas à `main`; identidade ativa: Plus Jakarta Sans, petróleo `#123E3D`, solar `#F3CB4C`, superfície `#FAFBF7`, texto principal `#203534`;
- `7f1abe79` sincronizou a Home responsiva sem regressão estrutural;
- os 10 erros TypeScript revelados pelo build pós-merge foram corrigidos pela consolidação dos owners canônicos de Admin, Location/ServiceAreas, Mobility e Safety, sem restaurar bridges ou writers antigos;
- `9a90aaed` aposentou contratos mortos de Admin/Profile e o reexport local obsoleto de `ServiceArea`;
- `cce689c7` alinhou `admin-create-user` ao lifecycle canônico de Auth/Profile; auditoria posterior confirmou que a função **não tem caller ativo no frontend/Admin atual**, portanto ela não deve ser implantada apenas por existir no Git;
- `f6e6fd1` corrigiu o `vercel-ignore`; sem prova suficiente de diff ele executa build normal, e checkout sem remote `origin` não gera falso erro fatal;
- deployment production `dpl_8DWo9NXMwyXaMGkKwkoV4h4Ldho1` de `f6e6fd1` está **READY** e atende `acheguese.com.br`, `www.acheguese.com.br` e `acheguese.vercel.app`;
- sitemap resiliente foi provado em produção: Supabase/Cloudflare 522 cai no fallback estático validado com 7 URLs sem derrubar o release;
- `profile-rpc` foi reconciliado no runtime em **v19 ACTIVE**, `verify_jwt=true`; `service_area`, `service_areas` e `service_radius_km` são rejeitados em Professional/extensionData e Coverage permanece em `public.service_areas`;
- a geração oficial de tipos Supabase continua intermitentemente bloqueada por 522; não editar `types.generated.ts` manualmente nem substituir o boundary estreito de `register_safety_evidence` por `any`;
- `5bead48b` corrigiu o novo Search/Explorar para projetar pins via `mapEntityProjection`; `be2d464b` integrou a Search por merge real de dois pais, preservando o hardening funcional da `main`;
- `fc912273` reduziu exatamente os **11 allowances stale** detectados pelo último build READY: 5 writers Safety, 1 reader `service_areas`, 3 callers RPC e 2 dynamic writers de Mobilidade; nenhuma nova permissão foi adicionada;
- G38: `AdminServicos` não escreve mais disponibilidade Professional diretamente; `admin-professional-rpc` está **v6 ACTIVE**, `verify_jwt=true`, com entrypoint e shared helpers reconciliados ao source da `main`;
- G38: `ProfessionalLeadService` não faz mais read-modify-write/upsert de `professional_stats.contacts_count`; a migration versionada move o contador para trigger atômico server-owned e revoga DML browser;
- **runtime DB G38 ainda pendente:** `apply_migration` e até `list_migrations` estão falhando antes de iniciar por `Connection terminated due to connection timeout`; não declarar trigger/revoke ativos sem prova posterior;
- `codex/identidade-visual-achegue-se` foi sincronizada com a `main` por merge sem force-push; validação final mostrou `behind_by=0` e apenas quatro deltas visuais próprios (`TerritoryAdaptiveNavigation`, `TerritoryMapPreview`, `BuscaPage`, `TerritoryTopbar`);
- builds atuais da `main` continuam sujeitos ao **build-rate-limit da Vercel** (`Deployment rate limited — retry in 24 hours`), blocker externo de execução e não prova de compilação aprovada ou reprovada;
- **não revogar ainda** os grants temporários de `professional_data/profiles` enquanto o frontend novo não estiver comprovadamente LIVE no mesmo SHA; retirar compatibilidade somente após zero callers antigos;
- Mobilidade continua **launch-paused**: `PUBLIC_LAUNCH_SURFACES.mobility=false`;
- não restaurar DML direto, operator scripts obsoletos, wrappers concorrentes, dynamic-table novo ou authorities paralelas.

## Regra para novas IAs/agentes

- inspecionar primeiro o projeto real: código da `main`, rotas, owners, serviços, schema/migrations, testes, deploy/runtime e comportamento observado;
- documentação pode estar desatualizada e nunca autoriza sozinha remover feature implementada;
- feature coerente com o produto que esteja quebrada, incompleta ou `launch-paused` deve ser corrigida na causa raiz, não apagada para simplificar;
- remover somente legado real, duplicação, compatibility bridge ou owner substituído, depois de preservar/migrar a capacidade funcional válida e comprovar callers/impacto;
- trabalhar diretamente na `main`, sem force-push, revalidando o HEAD antes de cada write;
- preferir owner/SSOT canônico em `src/core`, `src/modules`, `src/app`, `src/integrations` e `src/shared`;
- atualizar `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` quando um checkpoint operacional mudar e usar checkpoints incrementais em `docs/08-roadmap/checkpoints/` somente quando necessário para evitar reescrita insegura do SSOT durante execução concorrente;
- usar `teste-acheguese` apenas como laboratório/prova de UX territorial quando aplicável; o produto consolidado continua neste repositório.

## Política de migração deste ponteiro

Este arquivo só poderá ser removido depois que referências ativas forem migradas para os documentos canônicos e referências históricas restantes estiverem apenas em `docs/10-archive/`.
