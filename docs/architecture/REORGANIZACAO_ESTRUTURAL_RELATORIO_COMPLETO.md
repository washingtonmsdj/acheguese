# Reorganizacao Estrutural Controlada - Relatorio Completo

Data: 2026-05-16  
Escopo: reorganizacao incremental sem alteracao de regra de negocio, rotas publicas e layout/estrutura visual do frontend.

## 1) Resultado executado

- Limpeza controlada de artefatos versionados de runtime/teste.
- Blindagem da raiz para evitar regressao de sujeira (`.gitignore`).
- Reorganizacao incremental do dominio `profiles/services` com extracao de regras puras e facades auxiliares.
- Integracao de mudancas de comunidade solicitadas, sem restauracao.

## 2) Mapa da arquitetura (estado atual consolidado)

Estrutura macro:

- `src/modules/*`: modulos de produto (ex.: `community`, `mobility`, `classifieds`, `profile`)
- `src/core/*`: dominios e servicos transversais (ex.: `profiles`, `location`, `notifications`, `maps`)
- `src/app/*`: composicao de interface e paginas

Mapa simplificado:

```text
app (pages/layout)
  -> modules (experiencias por dominio)
  -> core (servicos SSOT/transversal)
       -> integrations/supabase
       -> shared/utils/types
```

## 3) Relatorio do que foi removido

Total removido do versionamento: 55 artefatos temporarios

Principais grupos:

- `playwright-report/index.html`
- `test-results/.last-run.json`
- `tmp/central-audit/**`
- `tmp/central-smoke/**`
- `tmp/ts-trace-app*/trace.json`
- imagens e logs temporarios em `tmp/*`

Observacao:
- Remocao foi de artefatos de execucao/debug, sem impacto funcional.

## 4) Reorganizacao aplicada em `profiles/services`

Arquivo central reduzido por extracao de responsabilidades:

- `ProfileService.ts` (orquestracao e SSOT)
- `profile.service.types.ts` (tipos internos)
- `profile.service.rules.ts` (regras puras de status/plano/reputacao/verificacao/business mapping/suspensao)
- `profile.service.admin-rules.ts` (regras puras de admin/verificacao)
- `profile.workspace.rules.ts` (regras puras do workspace privado)
- `profile.workspace.business-modules.ts` (montagem de snapshot de modulos de negocio)
- `profile.facade.ts` (facade de queries/mutations)

Diretriz cumprida:
- Nenhum acesso SSOT critico (queries/mutations) foi movido para fora de `ProfileService`.

## 4.1) Reorganizacao incremental aplicada em `posts/services`

- `PostService.ts` mantido como boundary SSOT de orquestracao.
- Extracao de transformacao pura para reduzir acoplamento interno:
  - `post.service.rules.ts` (mapper de rows para cards de posts com imagens).
- Sem alteracao de comportamento de consulta/filtragem/retorno funcional.

## 5) Dependencias criticas

Runtime/arquitetura:

- `react`, `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `@supabase/supabase-js`
- `zod`
- `zustand`

Build/qualidade:

- `typescript`
- `vite`
- `eslint`
- `vitest`
- `@playwright/test`

Seguranca/observabilidade:

- `eslint-plugin-security`
- `@sentry/react`

## 6) Riscos tecnicos futuros

1. Servicos transversais ainda extensos (`ProfileService`, `PostService`) seguem com risco de regressao por alta concentracao de responsabilidade.  
2. Convivencia `core/*` e `modules/*` exige contratos de fronteira ativos para nao gerar bypass de SSOT.  
3. Mudancas funcionais em filtros de feed comunitario devem ser validadas por testes de contrato para evitar regressao de experiencia.  
4. Typecheck global ainda apresenta passivo historico fora deste escopo (nao introduzido nesta reorganizacao).

## 7) Validacoes executadas nesta reorganizacao

- `eslint` nos arquivos alterados: aprovado.
- Verificacao de alteracoes incrementais por diff/local checks em cada fatia.

## 8) Garantias preservadas

- Sem alteracao de regras de negocio.
- Sem alteracao de rotas publicas.
- Sem alteracao de layout/estrutura visual do frontend por esta reorganizacao estrutural.
- Sem abstracoes enterprise desnecessarias; apenas extracoes de legibilidade/manutencao.
