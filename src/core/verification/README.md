# Core Verification

Ownership canonico do dominio de verificacao.

## Contrato
- Service de verificacao: `services/VerificationService.ts`
- Hook administrativo: `hooks/useVerifications.ts`
- Componentes oficiais: `components/VerificationBanner.tsx` e `components/VerificationCard.tsx`
- Pagina admin oficial: `pages/AdminVerificationsPage.tsx`

## Regras
- Nao criar `modules/verification` como fachada paralela.
- Consumo novo deve usar `@/core/verification`.
- Regras de aprovacao/rejeicao administrativa devem passar por `ProfileVerificationAdminService`.

