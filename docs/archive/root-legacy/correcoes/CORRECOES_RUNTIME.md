# 🔧 Correções de Runtime

**Data**: 2026-03-23  
**Contexto**: Correções aplicadas após iniciar `npm run dev`

---

## ❌ Erros Identificados

### 1. Import Incorreto de Supabase
**Erro**: `No matching export in "src/core/chat/index.ts" for import "supabase"`

**Arquivos Afetados**:
- `src/modules/mobility/hooks/useMobilidadeChat.ts`
- `src/modules/mobility/hooks/useRideChat.ts`

**Problema**: Tentando importar `supabase` de `@/core/chat` que não exporta essa variável.

**Solução**: ✅ Corrigido para importar de `@/core/supabase`
```typescript
// Antes
import { supabase } from '@/core/chat';

// Depois
import { supabase } from '@/core/supabase';
```

---

### 2. Import Incorreto de Componente
**Erro**: `No matching export in "src/core/mobility/index.ts" for import "ActiveRideWidget"`

**Arquivos Afetados**:
- `src/modules/profile/components/ProfileMainContent.tsx`
- `src/modules/profile/pages/PerfilCentralPage.tsx`

**Problema**: `ActiveRideWidget` está em `modules/mobility`, não em `core/mobility`.

**Solução**: ✅ Corrigido para importar do local correto
```typescript
// Antes
import { ActiveRideWidget } from '@/core/mobility';

// Depois
import { ActiveRideWidget } from '@/modules/mobility/components/ActiveRideWidget';
```

---

### 3. Dependência Circular em Notifications
**Erro**: `Uncaught ReferenceError: Cannot access 'coreNotificationService' before initialization`

**Arquivo Afetado**:
- `src/modules/notifications/services/notification.service.ts`

**Problema**: Dependência circular entre core e modules
```
core/notifications/index.ts → modules/notifications
modules/notifications/services → core/notifications
```

**Solução**: ✅ Corrigido barrel export de `core/notifications/index.ts`
```typescript
// Antes
export * from '@/modules/notifications';

// Depois
export { NotificationService } from './services/NotificationService';
export { notificationService } from './services';
export type { ... } from './services/NotificationService';
```

---

### 4. Hook useAuthorization Incorreto
**Erro**: `Uncaught (in promise) TypeError: can is not a function`

**Arquivo Afetado**:
- `src/core/profiles/hooks/useProfileLocation.ts`

**Problema**: Hook `useAuthorization` retorna `canPerform`, não `can`.

**Solução**: ✅ Corrigido para usar a função correta
```typescript
// Antes
const { can } = useAuthorization();
const isProfessional = can("manage", "service_areas");

// Depois
const { canPerform } = useAuthorization();
const isProfessional = await canPerform("manage", { resource: "service_areas" });
```

---

## ✅ Status Final

### Servidor de Desenvolvimento
```bash
npm run dev
# ✅ Rodando sem erros
# ✅ HMR funcionando
# ✅ URL: http://localhost:5173
```

### Correções Aplicadas
- ✅ 2 arquivos corrigidos (imports de supabase)
- ✅ 2 arquivos corrigidos (imports de ActiveRideWidget)
- ✅ 1 arquivo corrigido (barrel export de notifications)
- ✅ 1 arquivo corrigido (useAuthorization em useProfileLocation)
- ✅ Total: 6 arquivos corrigidos

### Validação
- ✅ Servidor iniciado com sucesso
- ✅ Sem erros de compilação
- ✅ Hot Module Replacement funcionando
- ✅ Aplicação carregando corretamente

---

## 📝 Lições Aprendidas

### 1. Barrel Exports
- Evitar re-exportar de módulos que importam de volta (circular)
- Sempre exportar diretamente dos arquivos fonte

### 2. Localização de Componentes
- Componentes de UI específicos devem ficar em `modules`
- `core` deve conter apenas lógica de negócio e services

### 3. Imports de Supabase
- Usar sempre `@/core/supabase` para acessar o cliente
- Não importar de services específicos

---

## 🎯 Próximas Ações

### Imediato
- [x] Servidor rodando sem erros
- [x] Aplicação funcional
- [ ] Testar funcionalidades principais

### Curto Prazo
- [ ] Adicionar testes para prevenir regressões
- [ ] Documentar padrões de import
- [ ] Revisar outros barrel exports

---

**Status**: ✅ SERVIDOR RODANDO SEM ERROS  
**Data**: 2026-03-23  
**Próxima Ação**: Testar aplicação
