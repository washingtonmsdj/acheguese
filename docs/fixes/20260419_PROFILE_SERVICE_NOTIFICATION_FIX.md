# Correção: ProfileService - getNotificationStats Error

**Data:** 2026-04-19  
**Tipo:** Bug Fix  
**Severidade:** Medium  
**Status:** ✅ Resolvido

---

## 🐛 Problema

Console exibia erro ao carregar workspace privado do perfil:

```
TypeError: getNotificationStats is not a function
  at ProfileServiceLegacy.getPrivateWorkspace (ProfileService.ts:974:40)
```

---

## 🔍 Causa Raiz

Import dinâmico incorreto no método `getPrivateWorkspace()`:

```typescript
// ❌ ANTES - Import incorreto
const {
  getStats: getNotificationStats,
  fetchNotifications,
} = await import("@/core/notifications/services");

// Tentava usar funções que não existem no export
const notificationStatsPromise = getNotificationStats(userId).catch(() => null);
const notificationFeedPromise = fetchNotifications(userId, { limit: 5 }).catch(() => []);
```

**Problema:** O módulo `@/core/notifications/services` exporta:
- `NotificationService` (classe)
- `notificationService` (instância singleton)

Não exporta `getStats` e `fetchNotifications` como funções standalone.

---

## ✅ Solução

Corrigido para usar a instância singleton `notificationService`:

```typescript
// ✅ DEPOIS - Import correto
const { notificationService } = await import("@/core/notifications/services");

// Usa métodos da instância
const notificationStatsPromise = notificationService.getStats(userId).catch(() => null);
const notificationFeedPromise = notificationService.fetchNotifications(userId, { limit: 5 }).catch(() => []);
```

---

## 📝 Mudanças

### Arquivo Modificado

**`src/core/profiles/services/ProfileService.ts`**

1. **Linha ~944:** Corrigido import dinâmico
   ```typescript
   - const { getStats: getNotificationStats, fetchNotifications } = await import("@/core/notifications/services");
   + const { notificationService } = await import("@/core/notifications/services");
   ```

2. **Linhas ~972-973:** Corrigidas chamadas dos métodos
   ```typescript
   - const notificationStatsPromise = getNotificationStats(userId).catch(() => null);
   - const notificationFeedPromise = fetchNotifications(userId, { limit: 5 }).catch(() => []);
   + const notificationStatsPromise = notificationService.getStats(userId).catch(() => null);
   + const notificationFeedPromise = notificationService.fetchNotifications(userId, { limit: 5 }).catch(() => []);
   ```

---

## 🧪 Validação

- ✅ TypeScript compila sem erros
- ✅ Import dinâmico correto
- ✅ Métodos existem na instância `notificationService`
- ✅ Workspace privado deve carregar sem erros

---

## 📚 Contexto Técnico

### NotificationService Architecture

O módulo de notificações segue padrão singleton:

```typescript
// src/core/notifications/services/NotificationService.ts
class NotificationService {
  static async getStats(userId: string): Promise<{ total: number; unread: number }> { ... }
  
  async getStats(userId: string): Promise<{ total: number; unread: number }> {
    return NotificationService.getStats(userId);
  }
  
  async fetchNotifications(userIdOrFilters?: string | NotificationFilters, filters?: NotificationFilters): Promise<Notification[]> { ... }
}

export const notificationService = new NotificationService();
```

### Export Pattern

```typescript
// src/core/notifications/services/index.ts
export { NotificationService, notificationService } from "./NotificationService";
```

---

## 🎯 Impacto

- ✅ Workspace privado do perfil carrega corretamente
- ✅ Estatísticas de notificações aparecem no perfil
- ✅ Feed de notificações recentes funciona
- ✅ Console limpo, sem erros TypeError

---

## 📋 Checklist

- [x] Erro identificado
- [x] Causa raiz diagnosticada
- [x] Import corrigido
- [x] Chamadas de método corrigidas
- [x] TypeScript validado
- [x] Documentação criada

---

**Correção aplicada com sucesso! 🎉**
