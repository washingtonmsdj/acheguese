# Issue #51 — pruning documental e prova de dependências

Data: 2026-09-17  
Base auditada: PR #117, HEAD `4bd69616f25f6d344d650ee764eda68e910a1705`

## Decisão documental

`docs/README.md` já era a entrada usada pelo README raiz, `SECURITY.md`, plano main-only e `validate-doc-live-links`. O inventário de 28/07 e os relatórios de consolidação/hardening repetiam essa função com contagem desatualizada. O README agora é a única entrada normativa; os snapshots e relatórios foram preservados sob `docs/10-archive/`.

## Ajuste de taxonomia encontrado na validação

O gate apontou `src/modules/messaging` como raiz não listada. `src/core/messaging/README.md` já declarava essa pasta como owner da UI e `lazyImports.ts` tinha duas rotas consumidoras. O catálogo de módulos e a lista canônica do validator agora incluem `messaging`; a validação estrutural passou.

## Referências verificadas antes da movimentação

| Fonte retirada da árvore ativa | Dependências vivas encontradas | Tratamento |
| --- | --- | --- |
| `docs/DOCUMENTATION-INDEX.md` | `validate-project-taxonomy.ts` ainda o lia; README raiz e `SECURITY.md` já apontavam para `docs/README.md`. | Validador agora valida `docs/README.md`; inventário datado arquivado. |
| `docs/PROJECT-DOCUMENTATION-AUDIT.md` e `docs/PROJECT-DOCUMENTATION-HARDENING.md` | Nenhum caller de runtime/teste; relação recíproca apenas nos próprios relatórios e no inventário de julho. | Relatórios arquivados como registros concluídos. |
| `docs/01-product/STATUS.md` | README documental, checkpoint G152 e marcadores do validador. | Referências vivas apontam para fontes atuais; tombstone movido para arquivo. |
| `docs/03-architecture/CANONICAL_MAP.md` | README, registry/observações de arquitetura e marcadores do validador. | Links e registry apontam para `docs/README.md` e owners atuais; mapa movido para arquivo. |
| `docs/07-modules/ARQUITETURA_POSTS_SSOT.md` | Um teste de regressão validava ali contrato de Q&A. | Teste passou a validar `COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`; o `POSTS_FEED_SSOT.md` atual permanece ativo e listado pelo README. |
| `docs/domain/TERRITORY-DATA-QUALITY.md` e `TERRITORY-DATA-QUALITY-REVIEW.md` | A V2 preservava links de proveniência para ambos. | Links de proveniência agora apontam para as cópias arquivadas; a V2 continua como padrão oficial. |

## Inventário de artefatos legados

A árvore remota não contém diretórios de topo `plans/`, `handoff/`, `screenshots/` ou `product-qa-screenshots/`, nem `.kiro/specs/`. Os screenshots de QA existentes estão sob `docs/10-archive/root-legacy/product-qa-screenshots/`. `docs/08-roadmap/handoff/` é documentação de execução e foi mantida como caminho vivo, distinto do diretório de handoff legado da raiz.

## Validação

- `npm run validate:docs-structure`, `npm run validate:docs-live-links`, o validador de taxonomia e `npm run validate:architecture:core-platform` passaram.
- Os três testes de contrato documental/Posts passaram: 23/23.
- `git diff --check` passou.
- `npm run validate:architecture:governance` ainda aponta 8 findings fora deste lote (6 regras em UI e 2 imports entre módulos); eles permanecem para os lotes de owners/layout.

## Lote C — concluído em 2026-09-17

- A árvore não contém `src/features/events`, `src/core/verticals/events`, `src/core/verticals/guide` ou `src/core/verticals/jobs`.
- A UI de Eventos está consolidada em `src/modules/community-events` (43 arquivos); serviços e contratos reutilizáveis estão em `src/core/community-events`.
- Os SSOTs vivos `CORE_LAYER_SSOT`, `COMMUNITY_FIRST_ARCHITECTURE_SSOT`, `PROJECT-MILESTONE-1` e o registry de arquitetura agora refletem `src/core/community-events`.
- Os três callers da facade Guide passaram a importar o owner de URLs em `src/core/guide/tourist-points/routes/useTouristPointPublicUrls.ts`; o export do barrel e a facade `src/modules/guide/hooks/useGuideUrls.ts` foram removidos, e o ratchet valida a ausência.
- A UI estruturada de vagas permanece em `src/modules/classifieds/jobs`; `src/core/work-opportunities` mantém rotas e distribuição de oportunidades rápidas. Não há imports de runtime dos owners `core/verticals/guide` ou `core/verticals/jobs`.

## Lote D — revisão concluída em 2026-09-17

- Não existem `src/__tests__/`, `src/test/` nem `e2e/` na raiz; testes de owner continuam co-localizados em `src/**`, e `tests/README.md` define as categorias não co-localizadas.
- `tests/architecture/test-root-layout-ratchet.test.ts` impede testes soltos diretamente em `tests/`.
- Existe um `playwright.config.ts` e um `vitest.config.ts`; `tsconfig.test.json` é referenciado pelo `tsconfig.json`. Não há variante de configuração sem caller que possa ser removida com segurança.
- Screenshots e relatórios antigos de QA estão em `docs/10-archive/root-legacy/product-qa-screenshots/`; não há `test-results/`, `playwright-report/` ou screenshots ativos versionados.
- Os seis arquivos `*.generated.ts` identificados têm consumidores reais; o schema Supabase tem gerador explícito em `tools/supabase/generate-supabase-types.ts`. Foram preservados.

## Lote E — concluído em 2026-09-17

- `ResponsiveWorkspaceShell` concentra o shell autenticado com sidebar/header e navegação móvel; `ResponsivePageFrame` padroniza largura, gutters e largura mínima de páginas.
- O shell da área autenticada e a Central passaram a usar o workspace compartilhado. Home territorial e Comunidade usam o frame responsivo compartilhado; os menus de território e de workspace continuam refletindo domínios distintos.
- O label móvel da navegação territorial agora é `Comunidade`, com cobertura unitária e E2E. A superfície pública de mobilidade permanece pausada (`PUBLIC_LAUNCH_SURFACES.mobility=false`).
- Os oito findings antigos foram reconciliados: extração de regras de perfil, ofertas de motorista e histórico administrativo para owners/services de core; remoção de facades não usadas; e classificador AST para regras de negócio em UI. `validate:architecture:governance` agora passa sem findings.
- A Home foi exercitada em 390×844 e 1365×900; a CTA móvel recebe o clique e não há overflow horizontal. Os E2E cobrem Home, Comunidade e redirecionamento da Central sem sessão em mobile/tablet/desktop.

## Validação final do plano

- `npm run typecheck:app`, `npm run validate:architecture:governance` (zero findings), `npm run validate:architecture:core-platform`, `npm run validate:docs-structure`, `npm run validate:docs-live-links` e `npm run validate:taxonomy` passaram.
- Vitest focado: 18 testes passaram em 7 arquivos, incluindo os novos contratos de seleção de perfil, histórico de suspensão, localização de layouts de mobilidade e classificação AST.
- E2E focado: 14 passaram e 2 foram pulados. Os dois fluxos autenticados dependem de `E2E_USER_EMAIL`/`E2E_USER_PASSWORD`, ausentes neste ambiente; o teste sem autenticação da Central passou. Os navegadores disponíveis eram Chromium revision 1234, expostos ao Playwright por cache isolado local.
- O smoke de Home passou nas resoluções móvel e desktop. O smoke direto da rota de Comunidade terminou no estado de timeout do resolvedor remoto de território; a suíte E2E com fixtures cobriu os estados funcionais da Comunidade.
- `git diff --check`, validação de estrutura, links vivos e taxonomia passaram após a consolidação documental.

Issue #51 está concluída neste checkpoint. A ausência de credenciais continua sendo uma limitação do ambiente para executar os dois fluxos E2E autenticados; não houve aprovação de release nem mudança no estado de deploy.
