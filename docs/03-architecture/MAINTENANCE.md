# Guia de Manutencao

## Objetivo
Manter o repositorio aderente ao SSOT, com documentacao navegavel e com gates estruturais acionados no fluxo normal.

## Rotina obrigatoria
1. Regenerar inventario estrutural quando houver consolidacao relevante.
2. Rodar os validadores estruturais antes de build e antes de merge.
3. Atualizar `docs/audits/MASTER_REPORT.md` quando a topologia do projeto mudar de forma material.
4. Manter `docs/INDEX_CANONICO.md` e `docs/CANONICAL_MAP.md` consistentes com a arvore real.

## Validacoes recomendadas
```bash
npm run audit:architecture
npm run validate:architecture:governance
npm run validate:ssot
npm run validate:docs-structure
npm run lint
npm run typecheck
```

## Politica de documentacao
- Global ativo: `docs/`
- Auditoria executiva: `docs/audits/`
- Dominio vivo: `src/<dominio>/README.md` ou `src/<dominio>/docs/`

## Higiene estrutural
- revisar novas duplicacoes de service e tipo no diff
- revisar novos imports cruzados entre modulos
- rejeitar accesso direto ao banco fora de service/repository
- rejeitar regra de negocio nova em hooks e pages
- rejeitar documentacao nova fora das pastas oficiais
