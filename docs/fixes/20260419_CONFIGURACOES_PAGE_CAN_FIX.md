# Correção: ConfiguracoesPage - can is not a function

**Data:** 2026-04-19  
**Tipo:** Bug Fix  
**Severidade:** High (quebrava a página)  
**Status:** ✅ Resolvido

---

## 🐛 Problema

Console exibia erro ao acessar a página de configurações:

```
TypeError: can is not a function
  at ConfiguracoesPage (ConfiguracoesPage.tsx:37:33)
```

A página quebrava completamente, impedindo o usuário de acessar as configurações.

---

## 🔍 Causa Raiz

Uso incorreto do hook `useSessionContext()`:

```typescript
// ❌ ANTES - Tentando usar 'can' do SessionContext
const {
  activeProfile,
  isLoading: activeProfileLoading,
  can,  // ❌ Não existe no SessionContext
} = useSessionContext();

const isProfessionalProfile = can("manage", "service_areas");  // ❌ Erro!
```

**Problema:** O `SessionContext` não exporta o método `can`. Esse método faz parte do sistema de autorização, não do sistema de sessão.

### SessionContext Interface

```typescript
export interface SessionContext {
  user: User | null;
  activeProfile: Profile | null;
  profiles: Profile[];
  isLoading: boolean;
  error: Error | null;
  switchProfile: (profileId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  // ❌ NÃO TEM: can()
}
```

---

## ✅ Solução

Usar o hook correto de autorização `usePermission()` para checagens em render:

```typescript
// ✅ DEPOIS - Usando hook de autorização correto
import { usePermission } from "@/core/authorization";

const {
  activeProfile,
  isLoading: activeProfileLoading,
} = useSessionContext();

const { allowed: canManageServiceAreas } = usePermission("manage", { 
  businessId: activeProfile?.id 
});

const isProfessionalProfile = canManageServiceAreas;
```

---

## 📝 Mudanças

### Arquivo Modificado

**`src/modules/profile/pages/ConfiguracoesPage.tsx`**

1. **Linha 17:** Adicionado import do hook de autorização
   ```typescript
   + import { usePermission } from "@/core/authorization";
   ```

2. **Linhas 32-36:** Removido `can` do useSessionContext e adicionado usePermission
   ```typescript
   - const {
   -   activeProfile,
   -   isLoading: activeProfileLoading,
   -   can,
   - } = useSessionContext();
   + const {
   +   activeProfile,
   +   isLoading: activeProfileLoading,
   + } = useSessionContext();
   + const { allowed: canManageServiceAreas } = usePermission("manage", { 
   +   businessId: activeProfile?.id 
   + });
   ```

3. **Linha 39:** Atualizada lógica de verificação
   ```typescript
   - const isProfessionalProfile = can("manage", "service_areas");
   + const isProfessionalProfile = canManageServiceAreas;
   ```

---

## 🧪 Validação

- ✅ TypeScript compila sem erros
- ✅ Import correto do hook de autorização
- ✅ Página de configurações carrega sem erros
- ✅ Verificação de permissões funciona corretamente

---

## 📚 Contexto Técnico

### Hooks de Autorização Disponíveis

#### 1. `usePermission()` - Para checagens em render/UI

```typescript
import { usePermission } from "@/core/authorization";

const { allowed, isLoading } = usePermission('createPost');
return isLoading ? <Spinner /> : allowed ? <PostButton /> : null;
```

**Quando usar:**
- Checagens reativas para mostrar/ocultar UI
- Retorna `{ allowed, isLoading, error }`
- Usa React Query com cache

#### 2. `useAuthorization()` - Para checagens imperativas

```typescript
import { useAuthorization } from "@/core/authorization";

const { canPerform } = useAuthorization();

const handlePost = async () => {
  if (await canPerform('createPost')) {
    // Criar post
  }
};
```

**Quando usar:**
- Event handlers
- Mutations
- Checagens assíncronas

### Diferença entre Session e Authorization

| Hook | Propósito | Exports |
|------|-----------|---------|
| `useSessionContext()` | Dados de sessão e perfil | `user`, `activeProfile`, `profiles`, `isLoading`, `switchProfile`, `refreshSession` |
| `usePermission()` | Checagens de permissão (render) | `allowed`, `isLoading`, `error` |
| `useAuthorization()` | Checagens de permissão (handlers) | `canPerform()` |

---

## 🎯 Impacto

- ✅ Página de configurações funciona corretamente
- ✅ Verificação de permissões para service areas funciona
- ✅ Tabs de residência e áreas de serviço aparecem corretamente
- ✅ Console limpo, sem erros TypeError

---

## 📋 Checklist

- [x] Erro identificado
- [x] Causa raiz diagnosticada
- [x] Hook correto identificado
- [x] Import adicionado
- [x] Código refatorado
- [x] TypeScript validado
- [x] Documentação criada

---

## 💡 Lições Aprendidas

1. **Separação de responsabilidades:** Session e Authorization são sistemas separados
2. **Hooks específicos:** Usar o hook correto para cada propósito
3. **Checagens em render:** `usePermission()` é o hook correto para UI
4. **Checagens em handlers:** `useAuthorization()` é o hook correto para lógica

---

**Correção aplicada com sucesso! 🎉**
