# PROJECT-DOCUMENTATION-HARDENING.md

Data: 2026-07-28

Status: CONCLUIDO

Sprint: PROJECT.DOCUMENTATION.HARDENING.1

Regra de escopo: esta sprint alterou somente documentacao. Nao implementou codigo, runtime, arquitetura, banco ou governance.

## 1. Base obrigatoria

- `docs/DOCUMENTATION-INDEX.md`
- `docs/PROJECT-DOCUMENTATION-AUDIT.md`

## 2. Objetivo

Eliminar exclusivamente os conflitos documentais registrados na auditoria de consolidacao.

## 3. Ajustes executados

### DOC-H0: Indice oficial preservado

Arquivo alterado:

- `docs/DOCUMENTATION-INDEX.md`

Ajuste:

- adicionada a entrada `docs/PROJECT-DOCUMENTATION-HARDENING.md`;
- total do indice atualizado para 303 entradas.

Resultado:

- o relatorio desta sprint nao fica fora do indice oficial.

### DOC-H1: SSOT_REGISTRY alinhado

Arquivo alterado:

- `docs/architecture/SSOT_REGISTRY.md`

Ajustes:

- data de atualizacao ajustada para 2026-07-28;
- adicionado aviso de que o registry permanece canonico como mapa tecnico de SSOTs;
- adicionado alinhamento explicito com Feed STATUS: FROZEN;
- corrigido caminho documental de Entity Private Data para `docs/07-modules/ENTITY_PRIVATE_DATA_SSOT.md`;
- ajustada a responsabilidade de Posts para registro atomico;
- adicionada secao `Feed Public Boundary (FROZEN)` apontando para `FEED-GOVERNANCE.md`, `FEED-FREEZE.md`, `FeedService`, `FeedRepository`, `FeedContext`, `FeedTarget`, `FeedQueryKeys` e `CanonicalFeedUrl`.

Resultado:

- DOC-C1 encerrado.

### DOC-H2: PROJECT-MILESTONE-1 alinhado

Arquivo alterado:

- `docs/architecture/PROJECT-MILESTONE-1.md`

Ajustes:

- removidas `FEED-ROADMAP.md` e `FEED-EXECUTION-PLAN.md` da lista de documentos operacionais principais do marco;
- adicionada secao de evidencias historicas preservadas para esses dois documentos;
- linha de Roadmap do Feed alterada para apontar operacionalmente para `FEED-FREEZE.md` e `FEED-FREEZE-CHANGELOG.md`.

Resultado:

- DOC-C2 encerrado.

### DOC-H3: CANONICAL_MAP marcado como substituido

Arquivo alterado:

- `docs/03-architecture/CANONICAL_MAP.md`

Ajuste:

- adicionado aviso padronizado no inicio informando substituicao por `docs/DOCUMENTATION-INDEX.md`.

Resultado:

- DOC-C3 encerrado.

### DOC-H4: Avisos nos documentos substituidos

Arquivos alterados:

- `docs/01-product/STATUS.md`
- `docs/03-architecture/CANONICAL_MAP.md`
- `docs/07-modules/ARQUITETURA_POSTS_SSOT.md`
- `docs/07-modules/POSTS_FEED_SSOT.md`
- `docs/domain/TERRITORY-DATA-QUALITY.md`
- `docs/domain/TERRITORY-DATA-QUALITY-REVIEW.md`

Ajuste:

- todos receberam aviso padronizado no inicio indicando:
  - status `SUBSTITUIDO`;
  - documento canonico atual;
  - uso apenas historico, sem autoridade normativa.

Resultado:

- DOC-C4 encerrado;
- DOC-C5 encerrado.

## 4. Conflitos encerrados

| Conflito | Estado |
| --- | --- |
| DOC-C1: `SSOT_REGISTRY.md` desatualizado | Encerrado |
| DOC-C2: `PROJECT-MILESTONE-1.md` com referencias operacionais antigas de Feed | Encerrado |
| DOC-C3: `CANONICAL_MAP.md` competindo com novo indice | Encerrado |
| DOC-C4: docs de Posts/Feed antigos competindo com Feed Freeze | Encerrado |
| DOC-C5: docs de produto antigos sugerindo status global incorreto | Encerrado |

## 5. Nao realizado

Nao foram removidos documentos.

Nao foram alterados:

- codigo;
- runtime;
- banco;
- arquitetura;
- governance;
- contratos publicos.

## 6. Decisao

DOCUMENTATION CONSOLIDATION foi oficialmente concluida.
