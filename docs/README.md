# Documentacao Ativa

## Objetivo
Centralizar a documentacao viva em `docs/`, manter contratos tecnicos junto do dominio em `src/` e isolar historico sem contaminar o SSOT.

## Ler Primeiro
1. [INDEX_CANONICO.md](./INDEX_CANONICO.md)
2. [CURRENT_RULES.md](./CURRENT_RULES.md)
3. [ARCHITECTURE.md](./ARCHITECTURE.md)
4. [STATUS.md](./STATUS.md)
5. [audits/MASTER_REPORT.md](./audits/MASTER_REPORT.md)

## Estrutura Oficial
- `docs/`: regras globais, arquitetura, seguranca, manutencao e mapa canonico.
- `docs/audits/`: inventario estrutural, relatorio mestre, checklist, quick wins e backlog pos-prontidao.
- `docs/archive/`: relatorios antigos, sessoes, snapshots e materiais que nao regem o estado atual.
- `docs/historico/`: arvores historicas consolidadas, incluindo `architecture-fix/`.
- `docs/temp-work-*`: rascunhos temporarios de execucao. Nao sao fonte SSOT e devem ser limpos/arquivados apos consolidacao.
- `src/<dominio>/README.md` e `src/<dominio>/docs/`: contratos vivos de dominio.

## Politica
- Documento ativo global fica em `docs/`.
- Documento ativo de dominio fica ao lado do codigo dono.
- Relatorio de fase, sessao, entrega datada ou comparativo historico vai para `docs/archive/` ou `docs/historico/`.
- `docs/temp-work-*` e `supabase/migrations_old` sao historico operacional: nao usar como base para decisao de schema, regra de negocio ou contrato atual.
- A raiz do repositorio permanece restrita a `README.md` e `SECURITY.md`.

## Navegacao
- Indice canonico: [INDEX_CANONICO.md](./INDEX_CANONICO.md)
- Indice mestre legado: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- Mapa canonico: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
- Documentos substituidos: [DOCUMENT_REPLACEMENTS.md](./DOCUMENT_REPLACEMENTS.md)
- Arquivo historico: [ARCHIVE_INDEX.md](./ARCHIVE_INDEX.md)
