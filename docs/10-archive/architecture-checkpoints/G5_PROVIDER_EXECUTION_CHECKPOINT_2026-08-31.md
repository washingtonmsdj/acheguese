# G5 — Provider execution checkpoint — 2026-08-31

Status: **EM EXECUÇÃO / G6 BLOQUEADO**  
Branch: `main`  
HEAD source validado antes deste checkpoint: `e70d0543c2d80edf82af2592b9652b34b4a9d0e5`  
Projeto Supabase: `xhdowzacfujckjelqhtd`

Este arquivo é um **delta operacional**. Não substitui `G5_CHECKPOINT_2026-08-30.md` nem `G5_LIVE_REVALIDATION_2026-08-30.md`; registra somente mudanças de estado e próximos passos que dependem de providers.

## 1. Vercel — source otimizado; bootstrap hospedado ainda rate-limited

A última produção comprovadamente verde avançou para:

- deployment: `dpl_Ger9r4sJJi85MbP221mdtZR28MT6`;
- source: `b682ced87c341ce6542e85f69b35d65929cd9f33`;
- target: `production`;
- state: `READY`;
- Vite: `built in 31.37s`;
- sitemap: 3 arquivos / 114302 URLs;
- runtime errors/fatals consultados: nenhum.

Esse source já contém as migrations G5 anteriores e o fechamento do antigo hosted typecheck blocker. O HEAD posterior difere por governança/docs/testes do ignored-build step; não houve nova mudança de aplicação em `src/**` nesta sequência.

### Ignored Build Step

Foi instalado um filtro conservador para evitar que commits sem impacto de deploy consumam builds de produção:

- `e8f963528f681249218e7d206154e4b0bc83b574` — adiciona `tools/release/vercel-ignore-build.mjs`;
- `41b956e3a635d9ded83ec564119d84b75801fc3f` — conecta `vercel.json -> ignoreCommand`;
- `acbada7ef0af34fad3c77ad61601327a71286754` — adiciona ratchet `tests/release/vercel-ignore-build.test.mjs`;
- `9e7453889fcf3d8258265c02b6d55744e5953f69` — remove `supabase/migrations/**` da superfície skippable;
- `e70d0543c2d80edf82af2592b9652b34b4a9d0e5` — alinha o ratchet para exigir que migrations forcem build.

Regra final:

- podem ser ignorados somente change sets compostos exclusivamente por docs comuns, `.github/**`, `.kiro/**`, `tests/**`, `e2e/**` e Markdown de raiz;
- `src/**`, `api/**`, `public/**`, `tools/**`, `package*.json`, `vercel.json`, Supabase Functions/config, docs de governança crítica e **qualquer migration** exigem build;
- conjunto misto exige build;
- conjunto vazio exige build;
- `VERCEL_GIT_PREVIOUS_SHA` ausente/inválido ou `git diff` falhando exige build.

Migrations ficaram deliberadamente fora do skip porque o production build gera sitemap consultando dados vivos via `LocationsReadService` e `territorialGroupService`, e o security validator também referencia contratos/migrations específicas. Uma migration/seed pode portanto alterar output/gates mesmo sem tocar `src/**`.

A ativação hospedada do novo `ignoreCommand` ainda não pôde ser provada porque Vercel retornou `Deployment rate limited — retry in 24 hours` antes de execução útil nos commits posteriores. Não interpretar isso como source failure.

## 2. GitHub Actions — blocker pré-runner reproduzido no HEAD atual

Run atual inspecionado:

- workflow: `SSOT Territorial Tests`;
- run: `33357086195`;
- source: `e70d0543c2d80edf82af2592b9652b34b4a9d0e5`.

Jobs relevantes:

- `Phase Core Gate (SSOT)`: failure, `logs_url = null`, `steps = null`;
- `E2E Tests (fixture-backed, remote-only)`: failure, `logs_url = null`, `steps = null`;
- `Authenticated Account E2E (remote-only)`: failure, `logs_url = null`, `steps = null`;
- `Runtime Tests (Vitest)`: failure, `logs_url = null`, `steps = null`;
- `All Tests Passed`: failure, `logs_url = null`, `steps = null`;
- `Regression Check`: skipped.

Nenhum gate de aplicação executou um primeiro step. Não corrigir Vitest, Playwright, typecheck ou source em reação a esse run.

O estado público do GitHub foi revalidado como operacional durante esta continuação; não há evidência de outage global explicando o padrão. A conta conectada possui permissão `admin` no repositório, porém o conector não expõe o endpoint administrativo `actions/permissions`, billing/usage nem inventário de runners. Portanto a causa mais específica de conta/repositório/alocação não é observável nem mutável por esta sessão.

## 3. Supabase Types Sync — source fechado, execução física pendente

O workflow canônico continua correto e stale-safe:

- gatilhos de migrations/config/gerador instalados;
- `cancel-in-progress: true`;
- única authority: `src/integrations/supabase/types.generated.ts`;
- único gerador: `tools/supabase/generate-supabase-types.ts`;
- runner autorizado preservado: Windows x64 self-hosted.

Run que permanece aguardando runner:

- run: `33355569221`;
- job: `99376938150` — `Regenerate canonical database types`;
- status atual observado: `queued`;
- conclusion: `null`;
- `logs_url = null`;
- `steps = null`.

Não mover esse job para `ubuntu-latest` apenas para contornar a indisponibilidade do runner autorizado. Não reconstruir manualmente o payload grande retornado por `generate_typescript_types`.

## 4. Storage orphan — sem mudança de decisão

Residual G5:

- `classified-images` (hífen): REMOTE ORPHAN / vazio na última revalidação;
- `classified_images` (underscore): identidade diferente e usada pelo contrato histórico; não confundir.

Remoção continua exigindo lifecycle oficial Supabase Storage `emptyBucket` -> `deleteBucket`. A capability conectada não expõe essas mutations. Não usar `DELETE FROM storage.buckets`, não criar Edge Function administrativa descartável e não ampliar broker de domínio apenas para fechar o gate.

## 5. Blockers centrais atuais

Restam exatamente:

1. **Supabase types** — runner autorizado precisa executar e materializar integralmente `types.generated.ts`;
2. **Storage orphan** — capability oficial precisa remover `classified-images` e provar ausência pós-delete;
3. **GitHub Actions** — jobs precisam obter runner e executar steps reais.

O hosted TypeScript/build da aplicação não volta a ser blocker por causa de status rate-limited em commits que não mudam aplicação. O novo ignored-build step, entretanto, só pode ser declarado **HOSTED PROVEN** quando Vercel voltar a aceitar uma execução e mostrar sua decisão.

## 6. next_action

Ordem correta na próxima continuação:

1. revalidar HEAD de `main` antes de qualquer write;
2. conferir `33355569221`; se o runner executar e o workflow commitar tipos, revisar o snapshot integral e o novo HEAD;
3. conferir apenas mudança de estado dos jobs Actions; não rerodar repetidamente enquanto seguirem pré-step;
4. se Vercel aceitar builds novamente, validar uma vez o `ignoreCommand` com um change set seguramente não-deploy e confirmar que mudança deploy-relevant continua forçando build;
5. se aparecer capability oficial Storage lifecycle, revalidar zero objetos e remover somente `classified-images`;
6. somente após fechar os três blockers centrais, reconciliar o checkpoint principal e considerar G6.

## 7. do_not_repeat

- não iniciar G6;
- não reabrir owner migrations já corrigidas sem erro hospedado novo;
- não interpretar `steps = null` / `logs_url = null` como teste quebrado;
- não trocar o Types Sync para runner alternativo;
- não editar `types.generated.ts` por amostragem;
- não apagar bucket Storage via SQL;
- não ignorar `supabase/migrations/**` no Vercel;
- não disparar builds/re-runs repetidos enquanto providers permanecem bloqueando antes da execução.
