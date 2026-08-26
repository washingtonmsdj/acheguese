# Education Module

**Status:** HARDENING — NOT MVP CERTIFIED  
**Owner de UI/aplicação:** `src/modules/business/education`  
**Owner técnico de domínio/persistência:** `src/core/education`  
**Roteamento público:** permanece `launch-paused` até certificação funcional

## Objetivo

O domínio Education cobre descoberta territorial de instituições, perfil público, programas, leads, eventos e superfícies operacionais para instituições de ensino.

A existência de páginas, services ou testes históricos **não equivale a certificação de produção**. Durante a estabilização do MVP, Educação só pode ser marcada como pronta depois que arquitetura, banco, autorização, runtime e fluxo E2E estiverem comprovados no mesmo contrato.

## Estado atual comprovado

A implementação existente inclui Explorer, detalhe, setup, dashboard, programas, leads, eventos, analytics, planos, hooks, nichos e services. O Explorer já possui estados explícitos de loading/error/empty e resolução territorial.

A consolidação de ownership já começou: `EducationObservabilityService` passou para `src/core/education/services`, mantendo apenas uma ponte de compatibilidade no módulo.

Ainda restam três arquivos runtime do módulo com acesso direto a `@/integrations/*`. Esse baseline está congelado por `scripts/validate-education-module-boundaries.ts`; nenhum novo arquivo pode repetir o padrão:

- `services/EducationTrackingService.ts`
- `services/education.mutations.ts`
- `services/education.queries.ts`

A direção canônica é migrar persistência, autorização e integração para `src/core/education`, deixando `src/modules/business/education` responsável por composição de produto/UI e regras específicas que não possuam acesso direto à infraestrutura.

## Regras de arquitetura

- páginas, components e hooks não acessam Supabase diretamente;
- código novo no módulo não importa `@/integrations/*` nem `@supabase/supabase-js`;
- cada arquivo removido da dívida acima deve ser removido da allowlist no mesmo commit;
- `core` não pode depender de `modules`;
- contratos compartilhados devem convergir para `src/core/education` antes da migração de persistence services;
- não criar facade paralela que mantenha dois writers/read models concorrentes;
- bridges de compatibilidade são one-way e temporárias;
- não remover `launch-paused` apenas porque a tela renderiza.

## Critério para despausar o MVP

Educação só sai de `launch-paused` quando houver evidência para, no mínimo:

1. entrypoint e URLs territoriais canônicos;
2. read/write ownership sem acesso direto de infraestrutura na camada de módulo;
3. schema/RPC/migrations reconciliados com o ambiente alvo;
4. RLS/grants e autorização positiva/negativa validados;
5. fluxo público de listagem → detalhe funcional com dados reais e estados loading/empty/error;
6. fluxo operacional mínimo de instituição definido para o escopo MVP e validado;
7. testes de regressão relevantes executando de verdade;
8. E2E que não trate placeholder, fallback ou `paused` como sucesso;
9. smoke responsivo/mobile;
10. deployment do mesmo SHA comprovado no provider.

## Nichos

Os nichos existentes permanecem como capacidade de produto, não como declaração de readiness. O escopo de lançamento deve ser explicitamente certificado antes de ser exposto como suportado em produção.

## SSOT relacionado

- `src/core/verticals/config.ts` — registra `education` como vertical empresarial oficial;
- `src/core/education/` — owner técnico de contratos/persistência em consolidação;
- `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — ordem e Definition of Done do MVP;
- issue #50 — certificação funcional dos módulos;
- issue #51 — limpeza estrutural/owners/namespaces.

O histórico de implementação e antigas declarações de “production ready” permanece recuperável pelo Git e por documentos arquivados; não deve ser usado como evidência de release atual.
