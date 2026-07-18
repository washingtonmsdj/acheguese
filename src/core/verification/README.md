# Core Verification

Ownership canonico do dominio de verificacao.

## Contrato
- Service de verificacao: `services/VerificationService.ts`
- Service administrativo: `services/VerificationAdminService.ts`
- Lifecycle e tipos: `types.ts`
- Hook administrativo: `hooks/useVerifications.ts`
- Componentes oficiais: `components/VerificationBanner.tsx` e `components/VerificationCard.tsx`
- Pagina admin oficial: `pages/AdminVerificationsPage.tsx`
- Persistencia e seguranca: `public.verification`,
  `private.profile_verification_audit_log` e migration `20260718150000`

## Regras
- Nao criar `modules/verification` como fachada paralela.
- Consumo novo deve usar `@/core/verification`.
- Solicitacoes do titular passam por `request_profile_verification`.
- Leituras e decisoes administrativas passam por `VerificationAdminService` e
  pela Edge Function `admin-verify-profile`.
- `profiles.verified` e apenas a projecao do selo de identidade; nao armazena o
  workflow.
- Verificacao de moradia nao concede selo de identidade.
- Aprovacao de motorista pertence a `driver_moderation_events` em Mobility.

Detalhes: `docs/architecture/PROFILE_VERIFICATION_SSOT.md`.
