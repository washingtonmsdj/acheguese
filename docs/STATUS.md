# STATUS OFICIAL DO PROJETO

Ultima atualizacao: 2026-04-20

## Resumo executivo
- Blindagem estrutural P0 executada.
- Gate incremental de arquitetura ativo no CI.
- Governanca arquitetural em estado verde.
- SSOT, typecheck, build e validacao de estrutura documental passando.
- Correcao de runtime aplicada para bootstrap de Supabase/cookies.
- Consolidacao de `verification` concluida com ownership final em `core/verification`.
- Consolidacao de `notifications` concluida com ownership final em `core/notifications`.
- Inversao `core -> modules` removida no dashboard de empresa.
- Inversao `core -> modules` removida em landing (services movidos para `core/landing`).
- Inversao `core -> modules` removida em analytics (ownership em `core/analytics` com wrappers de compatibilidade em `modules`).

## Estado tecnico validado
- `npm run validate:architecture:incremental -- --json`: `currentTotal=0`, `baselineTotal=0`.
- `npm run validate:architecture:governance -- --json`: `[]`.
- `npm run validate:ssot`: sucesso.
- `npm run typecheck`: sucesso.
- `npm run build`: sucesso.

## Divida tecnica remanescente
1. Consolidacao `core` x `modules`:
   - monitorar regressao por gate incremental e manter ownership canonico em `core`.
2. Consolidacao documental final:
   - manter este arquivo como status oficial unico;
   - reduzir duplicacoes em documentos de pre-launch para evitar status paralelo.

## Correcoes estruturais concluidas nesta rodada
- Imports de Supabase normalizados para `@/integrations/supabase/supabase`.
- Warning de build sobre reexport `client.ts` eliminado.
- `core/verification` deixou de depender de `modules/verification` (inversao de dependencia removida).
- `VerificationBanner` consolidado em `src/core/verification/components/VerificationBanner.tsx`.
- `AdminVerificationsPage`, `useVerifications` e `VerificationCard` migrados para `src/core/verification/*`.
- Facade legada `src/modules/verification/*` removida do repositorio.
- `BottomNav` migrou para hook canonico em `src/core/notifications/useUnifiedNotifications.ts`.
- `UnifiedNotificationBellV2` migrou para `src/core/notifications/components/UnifiedNotificationBellV2.tsx`.
- `AppTopbar` passou a importar o sino de notificacoes de `@/core/notifications`.
- Facade legada `src/modules/notifications/*` removida do repositorio.
- `DashboardEmpresaPageV2` deixou de importar `modules/dashboard/*` e passou a depender de `core/business` + `shared`.
- `useDashboardAccess` e `useDashboardTabs` migrados para `src/core/business/hooks/` com wrappers de compatibilidade no modulo.
- Servicos de landing migrados para `src/core/landing/services/` e consumidores de `core` atualizados.
- `AnalyticsPage`, `useAnalyticsAccess` e `dashboards.config` migrados para ownership canonico em `src/core/analytics/*`.
- `GeneralAnalyticsPage` atualizado para lazy import de `@/core/analytics/pages/AnalyticsPage`.
- Gate incremental endurecido para bloquear regressao de imports legados `@/modules/analytics`, `@/modules/notifications` e `@/modules/verification` em todo `src/`.
- Erro de runtime `Cannot access 'logger' before initialization` resolvido em `cookieStorage`.
- Warning de CSP em dev passou a depender de `VITE_SECURITY_DEBUG=true`.
- Bloqueio de `rg` no ambiente Windows corrigido (ripgrep MSVC + override de perfil PowerShell).

## Evidencias e documentos de referencia
- Auditoria estrutural: [AUDITORIA_ESTRUTURAL_MODULOS.md](./AUDITORIA_ESTRUTURAL_MODULOS.md)
- Indice canonico: [INDEX_CANONICO.md](./INDEX_CANONICO.md)
- Mapa canonico de ownership: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
