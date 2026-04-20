# STATUS OFICIAL DO PROJETO

Ultima atualizacao: 2026-04-20

## Resumo executivo
- Blindagem estrutural P0 executada.
- Gate incremental de arquitetura ativo no CI.
- Governanca arquitetural em estado verde.
- SSOT, typecheck, build e validacao de estrutura documental passando.
- Correcao de runtime aplicada para bootstrap de Supabase/cookies.
- P3 iniciado com consolidacao real de `verification` (ownership em `core`).
- Consolidacao de `notifications` iniciada no consumo de app (`BottomNav` em `core`).
- `UnifiedNotificationBellV2` consolidado em `core/notifications` e consumido por `AppTopbar` via barrel canonico.
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
   - definir ownership final de `notifications` (facade permanente em `modules` ou absorcao total em `core`);
   - definir janela de deprecacao para facades legadas de `modules` (especialmente `notifications`).
2. Consolidacao documental final:
   - manter este arquivo como status oficial unico;
   - evitar novos arquivos paralelos de status fora do fluxo canonico.

## Correcoes estruturais concluidas nesta rodada
- Imports de Supabase normalizados para `@/integrations/supabase/supabase`.
- Warning de build sobre reexport `client.ts` eliminado.
- `core/verification` deixou de depender de `modules/verification` (inversao de dependencia removida).
- `VerificationBanner` consolidado em `src/core/verification/components/VerificationBanner.tsx`.
- `BottomNav` migrou para hook canonico em `src/core/notifications/useUnifiedNotifications.ts`.
- `UnifiedNotificationBellV2` migrou para `src/core/notifications/components/UnifiedNotificationBellV2.tsx`.
- `AppTopbar` passou a importar o sino de notificacoes de `@/core/notifications`.
- `DashboardEmpresaPageV2` deixou de importar `modules/dashboard/*` e passou a depender de `core/business` + `shared`.
- `useDashboardAccess` e `useDashboardTabs` migrados para `src/core/business/hooks/` com wrappers de compatibilidade no modulo.
- Servicos de landing migrados para `src/core/landing/services/` e consumidores de `core` atualizados.
- `AnalyticsPage`, `useAnalyticsAccess` e `dashboards.config` migrados para ownership canonico em `src/core/analytics/*`.
- `GeneralAnalyticsPage` atualizado para lazy import de `@/core/analytics/pages/AnalyticsPage`.
- Gate incremental endurecido para bloquear regressao de imports legados `@/modules/analytics` e `@/modules/notifications` em `app/core/shared`.
- Erro de runtime `Cannot access 'logger' before initialization` resolvido em `cookieStorage`.
- Warning de CSP em dev passou a depender de `VITE_SECURITY_DEBUG=true`.
- Bloqueio de `rg` no ambiente Windows corrigido (ripgrep MSVC + override de perfil PowerShell).

## Evidencias e documentos de referencia
- Auditoria estrutural: [AUDITORIA_ESTRUTURAL_MODULOS.md](./AUDITORIA_ESTRUTURAL_MODULOS.md)
- Indice canonico: [INDEX_CANONICO.md](./INDEX_CANONICO.md)
- Mapa canonico de ownership: [CANONICAL_MAP.md](./CANONICAL_MAP.md)
