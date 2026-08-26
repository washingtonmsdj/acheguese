# Education Module

**Status:** HARDENING — NOT MVP CERTIFIED  
**Owner de UI/aplicação:** `src/modules/business/education`  
**Owner técnico de contratos/persistência:** `src/core/education`  
**Roteamento público:** permanece `launch-paused` até certificação funcional

## Objetivo

O domínio Education cobre descoberta territorial de instituições, perfil público, programas, leads, eventos e superfícies operacionais para instituições de ensino.

A existência de páginas, services ou testes históricos **não equivale a certificação de produção**. Durante a estabilização do MVP, Educação só pode ser marcada como pronta depois que arquitetura, banco, autorização, runtime e fluxo E2E estiverem comprovados no mesmo contrato.

## Estado atual comprovado

A implementação existente inclui Explorer, detalhe, setup, dashboard, programas, leads, eventos, analytics, planos, hooks, nichos e services. O Explorer já possui estados explícitos de loading/error/empty e resolução territorial.

A consolidação de ownership já moveu para `src/core/education`:

- contratos de domínio em `contracts.ts`;
- `EducationObservabilityService`;
- `EducationTrackingService`.

Os paths antigos de types/services no módulo são apenas bridges one-way de compatibilidade quando necessários.

Ainda restam **dois** arquivos runtime do módulo com acesso direto a `@/integrations/*`. Esse baseline está congelado por `scripts/validate-education-module-boundaries.ts`; nenhum novo arquivo pode repetir o padrão:

- `services/education.mutations.ts`
- `services/education.queries.ts`

A direção canônica é mover esses read/write models para `src/core/education`, deixando `src/modules/business/education` responsável por composição de produto/UI e regras específicas que não possuam acesso direto à infraestrutura.

## Regras de arquitetura

- páginas, components e hooks não acessam Supabase diretamente;
- código novo no módulo não importa `@/integrations/*` nem o pacote Supabase diretamente;
- cada arquivo removido da dívida acima deve ser removido da allowlist no mesmo commit;
- `core` não pode depender de `modules`;
- contratos compartilhados pertencem a `src/core/education/contracts.ts`;
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

## SSOT relacionado

- `src/core/verticals/config.ts` — registra `education` como vertical empresarial oficial;
- `src/core/education/contracts.ts` — contratos do domínio;
- `src/core/education/services/` — serviços de infraestrutura/domínio em consolidação;
- `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — ordem e Definition of Done do MVP;
- issue #50 — certificação funcional dos módulos;
- issue #51 — limpeza estrutural/owners/namespaces.

O histórico de implementação e antigas declarações de “production ready” permanece recuperável pelo Git e por documentos arquivados; não deve ser usado como evidência de release atual.
