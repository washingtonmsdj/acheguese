# Documentacao Ativa

## Objetivo
Centralizar a documentacao viva em `docs/`, manter contratos tecnicos junto do dominio em `src/` e isolar historico sem contaminar o SSOT.

## Ler Primeiro
1. [CURRENT_RULES.md](./CURRENT_RULES.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
4. [audits/MASTER_REPORT.md](./audits/MASTER_REPORT.md)

## Estrutura Oficial
- `docs/`: regras globais, arquitetura, seguranca, manutencao e mapa canonico.
- `docs/audits/`: inventario estrutural, relatorio mestre, checklist, quick wins e backlog pos-prontidao.
- `docs/archive/`: relatorios antigos, sessoes, snapshots e materiais que nao regem o estado atual.
- `docs/historico/`: arvores historicas consolidadas, incluindo `architecture-fix/`.
- `src/<dominio>/README.md` e `src/<dominio>/docs/`: contratos vivos de dominio.

## Politica
- Documento ativo global fica em `docs/`.
- Documento ativo de dominio fica ao lado do codigo dono.
- Relatorio de fase, sessao, entrega datada ou comparativo historico vai para `docs/archive/` ou `docs/historico/`.
- A raiz do repositorio permanece restrita a `README.md` e `SECURITY.md`.

## Navegacao
- Indice mestre: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- Mapa canonico: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
- Documentos substituidos: [DOCUMENT_REPLACEMENTS.md](./DOCUMENT_REPLACEMENTS.md)
- Arquivo historico: [ARCHIVE_INDEX.md](./ARCHIVE_INDEX.md)
