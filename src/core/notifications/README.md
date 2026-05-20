# Core Notifications

Ownership canonico do dominio de notificacoes.

## Contrato
- Hook oficial de leitura: `useUnifiedNotifications`
- Service oficial de escrita/consulta: `NotificationService`
- Tipos canonicos: `types.ts`
- Componente oficial de sino: `components/UnifiedNotificationBell.tsx`

## Regras
- Nao criar wrappers em `modules/notifications`.
- Nao acessar `supabase.from('notifications')` em UI (`.tsx`).
- Integracoes novas devem importar de `@/core/notifications`.

