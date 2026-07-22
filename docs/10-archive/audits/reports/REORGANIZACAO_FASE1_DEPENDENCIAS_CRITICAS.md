# Dependencias Criticas - Fase 1 (2026-05-16)

## Runtime de aplicacao
- `react`, `react-dom`, `react-router-dom`
- `@tanstack/react-query`
- `@supabase/supabase-js`
- `zod`, `zustand`

## Infra de build e qualidade
- `vite`, `typescript`, `eslint`, `vitest`, `@playwright/test`
- Scripts sob `scripts/` sao parte do fluxo de governanca/validacao SSOT e arquitetura.

## Dependencias de arquitetura (acoplamentos tecnicos atuais)
- Camada `src/core/*` ainda concentra servicos muito extensos e compartilhados por multiplos modulos.
- `src/integrations/supabase/types.generated.ts` e base de tipagem transversal.
- Rotas em `src/app/routes/*` continuam sendo ponto central de composicao.

## Arquivos grandes priorizados para fase de desacoplamento (>700 linhas)
1. `src/core/profiles/services/ProfileService.ts`
2. `src/core/posts/services/PostService.ts`
3. `src/core/admin/services/AdminProfileGovernanceService.ts`
4. `src/core/professional/services/ProfessionalService.ts`
5. `src/modules/classifieds/jobs/pages/PublicarVagaPage.tsx`
6. `src/core/community/pages/GrupoDetailPage.tsx`
7. `src/modules/mobility/core/RideOperationalService.ts`
8. `src/modules/business/education/pages/EducationDetailPage.tsx`
9. `src/app/pages/CidadeLandingPage.tsx`
10. `src/core/social/services/SocialInteractionsService.ts`

Observacao: `src/integrations/supabase/types.generated.ts` (gerado) nao deve ser quebrado manualmente.
