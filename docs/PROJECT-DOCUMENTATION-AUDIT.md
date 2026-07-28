# PROJECT-DOCUMENTATION-AUDIT.md

Data: 2026-07-28

Status: CANONICO

Sprint: PROJECT.DOCUMENTATION.CONSOLIDATION.1

Regra de escopo: esta auditoria nao implementa codigo, runtime, arquitetura, banco ou governance. Nenhum documento existente foi corrigido nesta sprint. Documentacao antiga ainda referenciada foi apenas registrada.

## 1. Objetivo

Consolidar oficialmente a documentacao arquitetural do projeto apos:

- Territory consolidado como dominio governado;
- Feed com STATUS: FROZEN.

O objetivo e eliminar ambiguidade documental e impedir que documentos obsoletos sejam reativados como fonte normativa.

## 2. Inventario auditado

Foram classificados 302 registros documentais:

- 300 arquivos existentes em `docs/`;
- 2 documentos criados nesta sprint: `DOCUMENTATION-INDEX.md` e `PROJECT-DOCUMENTATION-AUDIT.md`.

Distribuicao:

| Status | Quantidade | Uso permitido |
| --- | ---: | --- |
| CANONICO | 68 | Fonte ativa para decisao dentro do seu dominio. |
| HISTORICO | 69 | Evidencia de sprint/auditoria/contexto passado. |
| SUBSTITUIDO | 6 | Nao usar; seguir documento substituto. |
| RASCUNHO | 15 | Nao executar sem revalidacao. |
| ARQUIVADO | 144 | Arquivo morto; nao usar como fonte ativa. |

## 3. Documentos ativos

Ativos como documentos estruturais do projeto:

- `docs/DOCUMENTATION-INDEX.md`;
- `docs/PROJECT-DOCUMENTATION-AUDIT.md`;
- `docs/README.md`;
- `docs/FEATURE-MAP.md`;
- `docs/SCREEN-MAP.md`;
- `docs/architecture/PROJECT-MILESTONE-1.md`;
- `docs/architecture/SSOT_REGISTRY.md`.

Ativos para Territory:

- `docs/domain/TERRITORY-GOVERNANCE.md`;
- `docs/domain/TERRITORY-ROADMAP.md`;
- `docs/domain/TERRITORY-DATA-QUALITY-V2.md`.

Ativos para Feed:

- `docs/feed/FEED-GOVERNANCE.md`;
- `docs/feed/FEED-GOVERNANCE-CHANGELOG.md`;
- `docs/feed/FEED-FREEZE.md`;
- `docs/feed/FEED-FREEZE-CHANGELOG.md`.

Ativos por dominio/modulo enquanto nao houver governance macro equivalente:

- `docs/03-architecture/*.md`, exceto `CANONICAL_MAP.md`;
- `docs/04-design/*.md`;
- `docs/05-ux/*.md`;
- `docs/06-navigation/*.md`;
- `docs/07-modules/*.md`, exceto docs de Posts/Feed substituidos;
- `docs/09-reference/governance/**/*.md`;
- `docs/09-reference/governance/**/*.json`;
- `docs/09-reference/SECURITY.md`;
- `docs/09-reference/SUPABASE_SECRETS.md`;
- `docs/09-reference/EDGE_FUNCTION_SECRETS.md`;
- `docs/mobility/motoboy/STATUS_OPERACIONAL.md`.

## 4. Documentos historicos

Historicos principais:

- relatórios e reviews de sprints Feed (`docs/feed/FEED-P*.md`, `FEED-MILESTONE-*`, `FEED-AUDIT.md`, `FEED-ROADMAP.md`, `FEED-EXECUTION-PLAN.md`);
- relatorios de readiness e P0 de Territory (`docs/domain/P0-*.md`, `SALVADOR-*`, `TERRITORY-ENTERPRISE-AUDIT.md`, `TERRITORY-FREEZE-AUDIT.md`);
- fundacao antiga de dominio em `docs/02-domain/**`;
- relatorios antigos de produto em `docs/01-product/**`, exceto `STATUS.md` que foi marcado como substituido;
- auditorias antigas em `docs/audits/*.md`;
- ADR Motoboy em `docs/09-reference/adr/**`.

Esses documentos podem ser usados como evidencia historica, mas nao como autoridade de estado atual.

## 5. Documentos redundantes

| Documento | Motivo | Documento atual |
| --- | --- | --- |
| `docs/03-architecture/CANONICAL_MAP.md` | Mapa canonico antigo e incompleto diante do novo indice. | `docs/DOCUMENTATION-INDEX.md` |
| `docs/07-modules/POSTS_FEED_SSOT.md` | Feed publico foi congelado em boundary proprio. | `docs/feed/FEED-FREEZE.md` |
| `docs/07-modules/ARQUITETURA_POSTS_SSOT.md` | Arquitetura publica de posts/feed foi substituida pelo Feed Freeze. | `docs/feed/FEED-FREEZE.md` |
| `docs/domain/TERRITORY-DATA-QUALITY.md` | Modelo V1 de score unico substituido. | `docs/domain/TERRITORY-DATA-QUALITY-V2.md` |
| `docs/domain/TERRITORY-DATA-QUALITY-REVIEW.md` | Review incorporada na V2. | `docs/domain/TERRITORY-DATA-QUALITY-V2.md` |
| `docs/01-product/STATUS.md` | Documento extenso com afirmacoes antigas de estado global. | `docs/architecture/PROJECT-MILESTONE-1.md`, `docs/FEATURE-MAP.md`, `docs/SCREEN-MAP.md` |

## 6. Candidatos a remocao futura

Nenhum arquivo foi removido nesta sprint.

Candidatos fortes para remocao futura, apos aprovacao:

- `docs/audits/_tmp_*.txt`;
- documentos substituidos listados na secao 5;
- planos antigos em `docs/08-roadmap/**` e `docs/tasks/**` que nao forem revalidados;
- qualquer documento em `docs/10-archive/**` que esteja duplicado em backup externo ou que nao precise permanecer versionado.

## 7. Conflitos encontrados

### DOC-C1: `SSOT_REGISTRY.md` esta desatualizado

Evidencia:

- o documento declara ultima atualizacao em 2026-04-19;
- nao reflete Feed STATUS: FROZEN;
- trata Posts como SSOT publico de Feed, enquanto o Feed Freeze define `FeedService` como boundary publico;
- referencia `docs/architecture/ENTITY_PRIVATE_DATA_SSOT.md`, mas o arquivo existente esta em `docs/07-modules/ENTITY_PRIVATE_DATA_SSOT.md`.

Acao nesta sprint: nao corrigido, apenas registrado.

### DOC-C2: `PROJECT-MILESTONE-1.md` ainda referencia documentos historicos de Feed como base

Evidencia:

- `docs/feed/FEED-ROADMAP.md`;
- `docs/feed/FEED-EXECUTION-PLAN.md`.

Classificacao: referencias historicas aceitaveis como base de marco, mas nao devem ser usadas para executar novas sprints sem passar por `FEED-FREEZE.md` e ADR/DECISION quando aplicavel.

Acao nesta sprint: nao corrigido, apenas registrado.

### DOC-C3: `CANONICAL_MAP.md` compete com o novo indice

Evidencia:

- aponta para documentos antigos ou ausentes;
- nao conhece Territory governance atual;
- nao conhece Feed STATUS: FROZEN.

Classificacao: SUBSTITUIDO.

Acao nesta sprint: nao removido.

### DOC-C4: documentos de Posts/Feed antigos competem com Feed Freeze

Evidencia:

- `docs/07-modules/POSTS_FEED_SSOT.md`;
- `docs/07-modules/ARQUITETURA_POSTS_SSOT.md`.

Classificacao: SUBSTITUIDO por `docs/feed/FEED-FREEZE.md`.

Acao nesta sprint: nao removido.

### DOC-C5: docs de produto antigos podem sugerir status global incorreto

Evidencia:

- `docs/01-product/STATUS.md` e relatorios antigos possuem afirmacoes longas de status que antecedem Territory/Feed Freeze;
- esse documento tambem cita pastas antigas como `docs/archive`/`docs/historico`, enquanto o arquivo morto atual esta em `docs/10-archive`.

Classificacao: `STATUS.md` SUBSTITUIDO; demais relatorios Product HISTORICO.

Acao nesta sprint: nao corrigido.

## 8. Verificacao dos quatro documentos obrigatorios

### FEATURE-MAP

Resultado: alinhado com Feed STATUS: FROZEN.

Evidencia:

- possui marcador `Domain status: Feed = STATUS: FROZEN`;
- secao Comunidade aponta para `docs/feed/FEED-FREEZE.md`;
- detalhe e compartilhamento de post apontam para Feed.

### SCREEN-MAP

Resultado: alinhado com Feed STATUS: FROZEN.

Evidencia:

- possui marcador `Domain status: Feed = STATUS: FROZEN`;
- deep link de post usa rota territorial `?post=<id>`;
- `/p/:slug/*` esta documentado como business, nao Feed.

### PROJECT-MILESTONE-1

Resultado: parcialmente alinhado.

Evidencia:

- marca Feed como STATUS: FROZEN;
- referencia `FEED-FREEZE.md` e `FEED-FREEZE-CHANGELOG.md`;
- ainda lista `FEED-ROADMAP.md` e `FEED-EXECUTION-PLAN.md` como documentos de referencia. Esses documentos foram classificados como HISTORICO e devem ser lidos apenas como base de contexto.

### SSOT_REGISTRY

Resultado: parcialmente alinhado.

Evidencia:

- continua canonico como registry tecnico;
- esta desatualizado em relacao a Feed Freeze;
- contem pelo menos um caminho documental incorreto (`docs/architecture/ENTITY_PRIVATE_DATA_SSOT.md` em vez de `docs/07-modules/ENTITY_PRIVATE_DATA_SSOT.md`).

## 9. ADRs incorporadas

| ADR | Status | Observacao |
| --- | --- | --- |
| `docs/09-reference/adr/ADR-001-ssot-motoboy-ride-requests.md` | HISTORICO | Decisao preservada; nao reabrir sem nova ADR/DECISION. |

## 10. Governancas antigas

Nao foi encontrada uma governance antiga equivalente a Feed que continue ativa fora de `docs/feed/FEED-GOVERNANCE.md`.

Foram encontrados documentos que podem ser confundidos com governanca:

- `docs/03-architecture/CANONICAL_MAP.md`;
- `docs/07-modules/POSTS_FEED_SSOT.md`;
- `docs/07-modules/ARQUITETURA_POSTS_SSOT.md`;
- relatorios antigos em `docs/10-archive/**`.

Todos foram classificados como SUBSTITUIDO ou ARQUIVADO quando competem com documentos atuais.

## 11. Roadmaps e execution plans antigos

Roadmaps/plans classificados como RASCUNHO:

- `docs/08-roadmap/MONOREPO_MIGRATION_PLAN.md`;
- `docs/08-roadmap/NEXT-STEPS.md`;
- `docs/08-roadmap/RECOVERY-ROADMAP.md`;
- `docs/PLANO_MESTRE_EXECUCAO_INTEGRAL_SSOT.md`;
- `docs/tasks/PLANO_AAA_MONETIZACAO_MULTI_VERTICAL_SSOT.md`;
- `docs/tasks/SSOT_EXECUCAO_CONTINUIDADE_2026-04-20.md`.

Planos Feed/Territory ja executados foram classificados como HISTORICO, nao RASCUNHO.

## 12. Decisao

O indice oficial passa a ser `docs/DOCUMENTATION-INDEX.md`.

Documentos CANONICO podem orientar trabalho futuro dentro do seu dominio.

Documentos HISTORICO, SUBSTITUIDO, RASCUNHO e ARQUIVADO nao podem ser usados para reabrir arquitetura, Feed, Territory ou governanca sem revisao explicita.
