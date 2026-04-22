# Arquitetura de Estado (State Management)

> Decisões arquiteturais sobre gerenciamento de estado no Ordax
>
> Data-base: Abril 2026
> Status: Ativo

---

## Visão Geral

O Ordax utiliza uma **arquitetura híbrida** de estado, onde cada ferramenta é usada para seu propósito específico:

| Ferramenta | Propósito | Uso |
|------------|-----------|-----|
| **TanStack Query** | Server State | Cache, sincronização, dados remotos |
| **SessionState** | Auth State | Sessão, perfis, identidade (SSOT) |
| **Zustand** | Client State | Estado local complexo (mínimo uso) |
| **React Context** | Prop Drilling | Tema, acessibilidade, layout |

---

## 1. TanStack Query (Server State)

### Quando Usar

- Dados que vêm do servidor (Supabase)
- Cache de requisições HTTP
- Sincronização em background
- Paginação e infinite scroll
- Mutations com optimistic updates

### Exemplos

```typescript
// Hook usando TanStack Query
export function useBusinesses(cityId: string) {
  return useQuery({
    queryKey: ['businesses', cityId],
    queryFn: () => fetchBusinesses(cityId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

### Por Que Não Zustand para Server State?

| Critério | TanStack Query | Zustand |
|----------|----------------|---------|
| Cache automático | ✅ | ❌ |
| Revalidação background | ✅ | ❌ |
| Deduping de requests | ✅ | ❌ |
| Optimistic updates | ✅ | Manual |
| DevTools | Excelente | Básico |

---

## 2. SessionState (Auth State - SSOT)

### Quando Usar

- Informações de autenticação
- Perfis de usuário
- Switch de perfil (multi-profile)
- Permissões e roles

### Arquitetura

```
SessionState (Zustand-like store)
    ↓
SessionService (lógica de negócio)
    ↓
SessionProvider (React Context)
    ↓
useSessionContext (hook)
```

### Por Que SessionState?

- **SSOT**: Single Source of Truth para identidade
- **Tipo seguro**: TypeScript strict
- **Reatividade**: Atualizações automáticas via subscribe
- **Cleanup**: Gerenciamento automático de listeners

### Exemplo

```typescript
// Em um componente
const { session, activeProfile, switchProfile } = useSessionContext();

// Acesso direto ao estado (fora de componentes)
const state = SessionState.getState();
```

---

## 3. Zustand (Client State)

### Quando Usar

- Estado local complexo que não pertence a um componente
- Estado compartilhado entre componentes distantes
- Casos onde Context é insuficiente (muitos re-renders)

### Uso Atual

```typescript
// Apenas em gastronomia/cart
src/modules/business/gastronomy/cart/useGastronomyCartStore.ts
```

### Por Uso Mínimo?

- **Simplicidade**: TanStack Query cobre 90% dos casos
- **Performance**: Server state já tem cache otimizado
- **Manutenção**: Menos stores = menos complexidade

---

## 4. React Context

### Quando Usar

- Tema (dark/light mode)
- Acessibilidade (preferências do usuário)
- Layout (sidebar, header)
- Dados que raramente mudam

### Exemplos

```typescript
// Contexts atuais
AccessibilityProvider
TooltipProvider
ThemeProvider
```

---

## Decisões Arquiteturais

### 1. Server State ≠ Client State

```typescript
// ❌ Errado: Guardar server state em Zustand
const useStore = create(() => ({
  businesses: [], // Vem do servidor!
  setBusinesses: (data) => set({ businesses: data }),
}));

// ✅ Correto: Usar TanStack Query
const { data: businesses } = useQuery({
  queryKey: ['businesses'],
  queryFn: fetchBusinesses,
});
```

### 2. Sessão é Caso Especial

A sessão é híbrida:
- **Server**: Autenticação via Supabase Auth
- **Client**: Perfil ativo, preferências locais

Por isso temos `SessionState` separado.

### 3. Evitar Prop Drilling

```typescript
// ❌ Errado: Passando props por 5 níveis
<Parent>
  <Child1 theme={theme}>
    <Child2 theme={theme}>
      <Child3 theme={theme} />
    </Child2>
  </Child1>
</Parent>

// ✅ Correto: Context
<ThemeProvider>
  <Parent>
    <Child1>
      <Child2>
        <Child3 /> // Usa useTheme()
      </Child2>
    </Child1>
  </Parent>
</ThemeProvider>
```

---

## Fluxo de Dados Recomendado

```
Database (Supabase)
    ↓
Service/Hook (TanStack Query)
    ↓
Componente (React)
```

### Exemplo Completo

```typescript
// 1. Service - acesso aos dados
export class BusinessService {
  static async getById(id: string) {
    return supabase.from('businesses').select('*').eq('id', id).single();
  }
}

// 2. Hook - cache e estado
export function useBusiness(id: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: () => BusinessService.getById(id),
  });
}

// 3. Componente - apenas UI
export function BusinessCard({ id }: { id: string }) {
  const { data, isLoading } = useBusiness(id);
  
  if (isLoading) return <Skeleton />;
  return <Card data={data} />;
}
```

---

## Anti-Padrões

### ❌ Não Faça

1. **Duplicar estado**: Ter o mesmo dado em Zustand e TanStack Query
2. **Sync manual**: Tentar sincronizar estado local com servidor manualmente
3. **Supabase em componentes**: Acessar `supabase.from()` diretamente em páginas
4. **Context para tudo**: Criar context para dados que poderiam ser props

### ✅ Faça

1. **TanStack Query para servidor**: Cache automático, revalidação, deduping
2. **SessionState para identidade**: SSOT de auth e perfis
3. **Props para dados locais**: Não use context se props são suficientes
4. **Services para acesso a dados**: Isolar Supabase em services

---

## Métricas de Decisão

| Cenário | Recomendação | Justificativa |
|---------|--------------|---------------|
| Dados do servidor | TanStack Query | Cache, revalidação, sync |
| Sessão/Auth | SessionState | SSOT, multi-profile |
| Tema/A11y | Context | Raramente muda, acessibilidade |
| Estado local complexo | Zustand | Compartilhamento, performance |
| Props são suficientes | Props | Simplicidade |

---

## Referências

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [React Context Docs](https://react.dev/reference/react/useContext)
- [docs/ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Histórico

| Data | Mudança |
|------|---------|
| 2026-04-16 | Documentação criada |
| 2026-04-16 | Definição de SessionState como SSOT |

---

*Documento mantido pela equipe de Arquitetura*

