# TAXONOMY SSOT

Data de referencia: 2026-04-22

## 1. Objetivo
Definir uma taxonomia unica e oficial do projeto, separando com clareza:
- dominio de produto,
- subdominio,
- vertical derivado,
- transversal/core,
- infraestrutura,
- pagina/rota,
- legado/historico.

## 2. Camadas oficiais do projeto

### 2.1 `src/app`
- Papel: shell da aplicacao, roteamento, composicao de fluxo e paginas.
- Classificacao: pagina/rota.
- Regra: fluxos de app (landing, onboarding, dashboard) ficam aqui, em `app/features/*`.

### 2.2 `src/modules`
- Papel: bounded contexts de produto.
- Classificacao: dominio principal e subdominio de produto.
- Topo canonico:
  - `admin`
  - `business`
  - `classifieds`
  - `community`
  - `guide`
  - `mobility`
  - `professionals`
  - `profile`

### 2.3 `src/core`
- Papel: capacidades transversais, contratos canonicos, servicos centrais.
- Classificacao: transversal/core.
- Regra: `core` nao compete com taxonomia de produto; ele estabiliza contratos entre dominios.

### 2.4 `src/shared`
- Papel: primitivas reutilizaveis agnosticas de dominio.
- Classificacao: transversal/core.

### 2.5 `src/integrations`
- Papel: adaptadores com provedores externos (maps, supabase, etc.).
- Classificacao: infraestrutura.

### 2.6 `docs`
- Papel: SSOT documental ativo + historico/arquivo.
- Classificacao:
  - ativo: `docs/`, `docs/architecture`, `docs/audits`, `docs/tasks`
  - legado/historico: `docs/archive`, `docs/historico`

### 2.7 `scripts`
- Papel: validacao, governanca, migracoes, automacao.
- Classificacao: infraestrutura de engenharia.

## 3. Regras oficiais de vertical x horizontal
- `business`/`empresas` e dominio horizontal base.
- `business` nao e vertical.
- Vertical oficial empresarial existe somente por declaracao em `src/core/verticals/config.ts`.
- Estado atual oficial: apenas `gastronomy`.

## 4. Regras de fronteira
- subdominio fica dentro do dominio base, nao no topo.
- modulo transversal nao ocupa topo de `modules`.
- fluxo de app nao fica em `modules`.
- aliases legados de modulo sao proibidos no estado atual.

## 5. Guardrails obrigatorios
- `npm run validate:taxonomy`
- `npm run validate:architecture:governance`
- `npm run validate:ssot`
- `npm run validate:docs-structure`

## 6. Observacao de governanca
Alguns nomes em `src/core` ainda coexistem por historico (`profile/profiles`, `services/service-areas/professional/vagas`, `admin/admin-identidade/admin-motoristas`). Isso deve ser tratado por fases de consolidacao de `core`, sem quebrar contratos publicos.

## 7. Consolidacao de vertical oficial
- consolidacao detalhada da vertical oficial `gastronomy`:
  - `docs/architecture/GASTRONOMY_CONSOLIDATION_SSOT.md`
- essa consolidacao e normativa para caminhos, ownership e blindagem anti-regressao.
