# Correção: Imports Incorretos de Notificações

## Problema Identificado
```
SyntaxError: The requested module '/src/core/notifications/index.ts' 
does not provide an export named 'useUnifiedNotifications'
```

## Causa Raiz
Múltiplos arquivos estavam importando `useUnifiedNotifications` e `notificationService` de `@/core/notifications`, mas esses exports estão em `@/modules/notifications`.

## Arquitetura Correta

### Core vs Modules
- **`@/core/notifications`**: Contém apenas o `NotificationService` (camada de acesso ao Supabase)
- **`@/modules/notifications`**: Contém o hook `useUnifiedNotifications` e helpers (SSOT)

### Regra Arquitetural
```
modules → core → integrations
```

Modules podem importar de core, mas core NÃO exporta hooks de alto nível como `useUnifiedNotifications`.

## Arquivos Corrigidos

### 1. `src/modules/mobility/components/driver/DriverNotifications.tsx`
**Antes:**
```typescript
import { useUnifiedNotifications, type Notification } from '@/core/notifications';
```

**Depois:**
```typescript
import { useUnifiedNotifications, type Notification } from '@/modules/notifications';
```

### 2. `src/modules/mobility/pages/MotoristaPageV2.tsx`
**Antes:**
```typescript
import { useUnifiedNotifications } from '@/core/notifications';
```

**Depois:**
```typescript
import { useUnifiedNotifications } from '@/modules/notifications';
```

### 3. `src/modules/mobility/pages/MotoristaPage.tsx`
**Antes:**
```typescript
import { useUnifiedNotifications } from '@/core/notifications';
```

**Depois:**
```typescript
import { useUnifiedNotifications } from '@/modules/notifications';
```

### 4. `src/modules/mobility/components/driver/DriverRealtimeStatus.tsx`
**Antes:**
```typescript
import { useUnifiedNotifications } from '@/core/notifications';
```

**Depois:**
```typescript
import { useUnifiedNotifications } from '@/modules/notifications';
```

### 5. `src/modules/admin/pages/AdminReivindicacoes.tsx`
**Antes:**
```typescript
import { notificationService } from "@/core/notifications";
import type { NotificationType, NotificationPriority } from "@/core/notifications";
```

**Depois:**
```typescript
import { notificationService } from "@/modules/notifications";
import type { NotificationType, NotificationPriority } from "@/modules/notifications";
```

## Exports Corretos

### `@/core/notifications/index.ts`
```typescript
export { NotificationService } from './services/NotificationService';
export { notificationService } from './services';
export type { Notification, NotificationType, ... } from './services/NotificationService';
```

### `@/modules/notifications/index.ts`
```typescript
export { useUnifiedNotifications } from "./hooks/useUnifiedNotifications";
export { notificationService } from "./services/notification.service";
export { NotificationType, NotificationPriority, ... } from "./types/notification.types";
export { notifyRideRequest, notifyRideAccepted, ... } from "./helpers/notification.helpers";
```

## Validação
- ✅ Diagnóstico TypeScript: sem erros em todos os 5 arquivos
- ✅ Imports seguem arquitetura correta (modules → core)
- ✅ SSOT mantido (useUnifiedNotifications é único hook)

## Lições Aprendidas
1. Hooks de alto nível pertencem a `modules`, não a `core`
2. `core` fornece services básicos, `modules` fornece lógica de negócio
3. Sempre verificar barrel exports antes de importar
4. Manter consistência: se um import está em `modules`, todos devem estar

## Status
✅ **CORRIGIDO** - Todos os imports agora apontam para o local correto

---
*Data: 2026-03-23*
*Arquivos: 5 arquivos corrigidos*
*Tipo: Correção de arquitetura (imports)*
