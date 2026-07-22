# Riscos Tecnicos Futuros - Fase 1 (2026-05-16)

## Riscos de curto prazo
1. Quebra de links de documentacao em arquivos historicos que ainda apontam para paths da raiz.
2. Scripts manuais externos que referenciem paths antigos.
3. Regressao de manutencao se novos artefatos temporarios voltarem para a raiz.

## Riscos estruturais (medio prazo)
1. Servicos de `core` com alta concentracao de responsabilidades.
2. Paginas muito extensas com UI, estado e fetch no mesmo arquivo.
3. Modulos com taxonomia incompleta (`validations`, `api`, `store` ausentes em parte da base).

## Mitigacoes recomendadas
1. Executar `npm run validate:docs-live-links` apos cada lote documental.
2. Criar wrappers de compatibilidade somente quando houver dependencia comprovada de caminho antigo.
3. Refatorar por modulo em lotes pequenos com smoke tests por rota publica.
4. Priorizar extracao de hooks/servicos em arquivos acima de 700 linhas antes de introduzir novas features.
5. Tratar arquivos gerados e SSOT como imutaveis fora dos scripts oficiais.