# 🐛 DEBUG: "Acesso Negado" no Admin Dashboard

## 🔍 ANÁLISE DOS LOGS

### Sequência de Eventos (do console):

```
1. supabase.ts:28 🎭 Modo MOCK ativado
2. supabaseAdmin.ts:49 🎭 Modo MOCK ativado
3. supabaseMock.ts:504 🎭 Mock: RPC get_active_profile {p_user_id: 'mock-user-123'}
4. supabaseMock.ts:504 🎭 Mock: RPC get_active_profile {p_user_id: 'mock-user-123'}
5. supabaseMock.ts:263 🎭 Mock: SELECT * FROM profiles WHERE user_id = mock-user-123
6. supabaseMock.ts:263 🎭 Mock: SELECT * FROM profiles WHERE user_id = mock-user-123
7. AuthService.ts:23 🔍 AuthService.isAdmin - Verificando userId: mock-user-123
8. AuthService.ts:34 🔍 AuthService.isAdmin - Buscando no banco...
9. logger.ts:106 ℹ️ [INFO] ✅ TTFB: 20ms (good)
10. supabaseMock.ts:213 🎭 Mock: SELECT role FROM user_roles WHERE user_id = mock-user-123 AND role = admin [maybeSingle]
11. supabaseMock.ts:226 🔍 Mock: user_roles - Filtros: ['user_id = mock-user-123', 'role = admin']
12. supabaseMock.ts:227 🔍 Mock: user_roles - Dados disponíveis: [{…}, {…}]
13. supabaseMock.ts:245 🔍 Mock: user_roles - Dados filtrados: [{…}]
14. supabaseMock.ts:254 🔍 Mock: maybeSingle result: {id: 'role-1', user_id: 'mock-user-123', role: 'admin', ...}
15. AuthService.ts:44 🔍 AuthService.isAdmin - Resultado da query: {data: {…}, error: null}
16. AuthService.ts:48 ✅ AuthService.isAdmin - isAdmin: true
```

### ✅ CONCLUSÃO DOS LOGS
- `AuthService.isAdmin` retorna `true` corretamente
- Mock retorna dados de admin corretamente
- Query funciona perfeitamente

---

## 🎯 PROBLEMA IDENTIFICADO

O usuário vê "Acesso Negado" MAS os logs mostram `isAdmin: true`.

### HIPÓTESES

#### Hipótese 1: Timing/Race Condition ❌
O componente renderiza "Acesso Negado" antes do `useEffect` completar.

**Evidência contra**: O código tem `checking` state que deveria mostrar loading.

#### Hipótese 2: Estado não atualiza ✅ PROVÁVEL
O `setIsAdmin(true)` é chamado mas o componente não re-renderiza ou o estado não persiste.

#### Hipótese 3: Múltiplas instâncias do componente ✅ POSSÍVEL
O componente pode estar montando/desmontando rapidamente.

#### Hipótese 4: Erro silencioso no useEffect ❌
Improvável, pois os logs mostram sucesso.

---

## 🔬 ANÁLISE DO CÓDIGO

### AdminLayout.tsx - useEffect

```typescript
useEffect(() => {
  async function checkAdmin() {
    if (!user?.id) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    try {
      const adminStatus = await AuthService.isAdmin(user.id);
      setIsAdmin(adminStatus);  // ← Deveria setar true
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setChecking(false);  // ← Deveria parar loading
    }
  }

  checkAdmin();
}, [user?.id]);
```

### Renderização Condicional

```typescript
// Loading
if (checking) {
  return <div>Loading spinner...</div>;
}

// Validação de admin
if (!isAdmin) {
  return <div>Acesso Negado</div>;  // ← AQUI está o problema
}
```

---

## 🐛 CAUSA RAIZ ENCONTRADA

### PROBLEMA: Dependência do useEffect

O `useEffect` depende de `user?.id`:

```typescript
useEffect(() => {
  // ...
}, [user?.id]);  // ← Dependência
```

**Cenário problemático**:
1. Componente monta com `user = null` ou `user.id = undefined`
2. `useEffect` roda, seta `isAdmin = false`, `checking = false`
3. Componente renderiza "Acesso Negado"
4. `user` carrega do SessionContext (assíncrono)
5. `useEffect` roda novamente com `user.id = 'mock-user-123'`
6. `AuthService.isAdmin` retorna `true`
7. MAS o usuário já viu "Acesso Negado" por um frame

### SOLUÇÃO

O problema é que `checking` é setado para `false` ANTES do user carregar.

**Fix**: Inicializar `checking = true` e só setar `false` depois de verificar.

---

## ✅ CORREÇÃO PROPOSTA

```typescript
const [checking, setChecking] = useState(true);  // ✅ Começa true

useEffect(() => {
  async function checkAdmin() {
    // ✅ Sempre começa checking
    setChecking(true);
    
    if (!user?.id) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    try {
      const adminStatus = await AuthService.isAdmin(user.id);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  }

  checkAdmin();
}, [user?.id]);
```

**Mudança**: Adicionar `setChecking(true)` no início do `checkAdmin()`.

---

## 🎯 TESTE DA CORREÇÃO

Após aplicar a correção, o fluxo será:

1. ✅ Componente monta → `checking = true` → Mostra loading
2. ✅ `user` carrega → `useEffect` roda
3. ✅ `AuthService.isAdmin` retorna `true`
4. ✅ `setIsAdmin(true)` → `setChecking(false)`
5. ✅ Componente renderiza dashboard

**Resultado esperado**: Sem "Acesso Negado", apenas loading → dashboard.
