# Guia de Manutencao

## Objetivo
Manter o repositorio aderente ao SSOT, com documentacao navegavel e com gates estruturais acionados no fluxo normal.

## Rotina obrigatoria
1. Regenerar inventario estrutural quando houver consolidacao relevante.
2. Rodar os validadores estruturais antes de build e antes de merge.
3. Registrar evidência factual em `docs/08-roadmap/checkpoints/` e atualizar o plano operacional quando um gate ou owner mudar.
4. Manter `docs/README.md` como entrada documental única e validar seus links contra a arvore real.

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
- Histórico de auditoria: `docs/10-archive/audits/`
- Dominio vivo: `src/<dominio>/README.md` ou `src/<dominio>/docs/`

## Higiene estrutural
- revisar novas duplicacoes de service e tipo no diff
- revisar novos imports cruzados entre modulos
- rejeitar accesso direto ao banco fora de service/repository
- rejeitar regra de negocio nova em hooks e pages
- rejeitar documentacao nova fora das pastas oficiais
