# Reorganizacao Estrutural Controlada - Fase 1 (Baseline)

Data: 2026-05-16
Escopo: sem alteracao funcional (regras de negocio, rotas publicas e comportamento visual preservados)

## 1) Estado atual confirmado

- O projeto ja possui `docs/` e `scripts/` na raiz (nao houve necessidade de mover esses blocos nesta fase).
- A base ja possui organizacao por dominio em duas frentes:
  - `src/modules/*` (modulos de produto)
  - `src/core/*` (dominios transversais)
- Existe volume relevante de arquivos legados/temporarios versionados em `tmp/`, `playwright-report/` e `test-results/`.

## 2) Limpeza realizada nesta fase

- Remocao de artefatos temporarios versionados:
  - `tmp/**`
  - `playwright-report/**`
  - `test-results/**`
- Objetivo: reduzir ruido de manutencao, evitar acoplamento com saidas de execucao local e manter o repositorio limpo para IA/humanos.

## 3) Pontos de alto acoplamento identificados (prioridade de proximas fases)

Arquivos com alto volume de linhas e risco de concentracao de responsabilidades:

1. `src/core/profiles/services/ProfileService.ts` (~2795 linhas)
2. `src/core/posts/services/PostService.ts` (~2153 linhas)
3. `src/core/admin/services/AdminProfileGovernanceService.ts` (~1580 linhas)
4. `src/core/professional/services/ProfessionalService.ts` (~1565 linhas)
5. `src/modules/classifieds/jobs/pages/PublicarVagaPage.tsx` (~1224 linhas)

## 4) Dependencias criticas (impacto arquitetural)

- Roteamento: `react-router-dom`
- Estado de servidor/cache: `@tanstack/react-query`
- Backend client: `@supabase/supabase-js`
- Validacao: `zod`
- UI base: `react`, `radix`, `tailwind`
- Build/runtime: `vite`, `typescript`

## 5) Riscos tecnicos futuros

1. Servicos monoliticos aumentam risco de regressao em alteracoes locais.
2. Duplicidade de fachadas/compatibilidade legacy pode mascarar pontos de entrada canonicos.
3. Acumulo de artefatos de teste no VCS dificulta auditoria real de codigo.
4. Crescimento paralelo `core` + `modules` sem contratos claros pode gerar fronteiras ambigas.

## 6) Plano incremental recomendado (sem big-bang)

1. Fase 2: Profiles
   - Quebrar `ProfileService.ts` por responsabilidades internas (queries, comandos, adaptadores), mantendo API publica.
2. Fase 3: Posts
   - Repetir estrategia no `PostService.ts` com extracao de blocos de dominio.
3. Fase 4: Admin/Professional
   - Reduzir arquivos >1500 linhas com extracao de hooks/servicos auxiliares.
4. Fase 5: Consolidacao
   - Remover sobras legacy ja sem uso e padronizar naming/tipagem por modulo.

## 7) Garantias desta fase

- Nenhuma regra de negocio alterada.
- Nenhuma rota publica alterada.
- Nenhum comportamento visual alterado.
- Mudancas focadas em higiene estrutural e preparacao para refatoracoes seguras.
