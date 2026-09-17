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

## Próximos lotes da issue

Os lotes de consolidação de Events, organização de testes/configurações, outputs de QA e layouts permanecem pendentes e são acompanhados na issue #51.