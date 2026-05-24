# Documentacao Ativa

## Objetivo
Centralizar a documentacao viva em `docs/` e manter contratos tecnicos junto do dominio em `src/`.

## Ler Primeiro
1. [INDEX_CANONICO.md](./INDEX_CANONICO.md)
2. [CURRENT_RULES.md](./CURRENT_RULES.md)
3. [ARCHITECTURE.md](./ARCHITECTURE.md)
4. [STATUS_ATUAL.md](./STATUS_ATUAL.md)
5. [ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md](./ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md)
6. [audits/MASTER_REPORT.md](./audits/MASTER_REPORT.md)

## Estrutura Oficial
- `docs/`: regras globais, arquitetura, seguranca, manutencao e mapa canonico.
- `docs/audits/`: inventario estrutural, relatorio mestre, checklist, quick wins e backlog pos-prontidao.
- `src/<dominio>/README.md` e `src/<dominio>/docs/`: contratos vivos de dominio.

## Politica
- Documento ativo global fica em `docs/`.
- Documento ativo de dominio fica ao lado do codigo dono.
- Relatorio de fase, sessao, entrega datada ou comparativo historico nao deve permanecer no repositorio principal.
- `supabase/migrations/` e a unica fonte de schema versionado.
- A raiz do repositorio permanece restrita a `README.md` e `SECURITY.md`.

## Navegacao
- Indice canonico: [INDEX_CANONICO.md](./INDEX_CANONICO.md)
- Status atual: [STATUS_ATUAL.md](./STATUS_ATUAL.md)
- Plano executavel atual: [ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md](./ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md)
- Mapa canonico: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
