# Relatório Fase 2.1 - Migração de Links Internos para Central

**Data**: 2025-01-04  
**Status**: ✅ CONCLUÍDA

---

## Objetivo

Fazer com que os links internos do sistema passem a apontar para rotas da Central quando forem fluxos de gestão, mantendo compatibilidade com rotas legadas durante a transição.

---

## Arquivos Alterados

### 1. src/core/business/utils/businessManagementRoutes.ts
**Alterações:**
- Adicionado interface `BusinessRouteTarget` com opção `target?: "central" | "legacy"`
- Todas as rotas agora usam `/central/empresas/:businessId` por padrão
- Opção `target: "legacy"` retorna `/perfil/empresas/:businessId`

**Rotas atualizadas:**
- overview, dados, gastronomia, planos, linkPremium, analytics, configuracoes
- gastronomySetup, gastronomyCardapio, gastronomyHorarios, gastronomyAreaEntrega
- gastronomyPedidos, gastronomyEntregas, gastronomyAnalytics, gastronomyPromocoes

**Antes:**
```typescript
overview: (businessId: string) => `/perfil/empresas/${businessId}`
```

**Depois:**
```typescript
overview: (businessId: string, opts?: BusinessRouteTarget) => 
  opts?.target === "legacy" ? `/perfil/empresas/${businessId}` : `/central/empresas/${businessId}`
```

---

### 2. src/core/business/hooks/useBusinessUrls.ts
**Alterações:**
- Interface `BusinessUrls.dashboard` atualizada com parâmetro `opts?: { target?: "central" | "legacy" }`
- Implementação usa `/central/empresas/${businessId}` por padrão
- Opção `target: "legacy"` retorna `/perfil/empresas/${businessId}`

**Antes:**
```typescript
dashboard: (businessId: string) => string;
// ...
dashboard: (businessId: string) => `/perfil/empresas/${businessId}`
```

**Depois:**
```typescript
dashboard: (businessId: string, opts?: { target?: "central" | "legacy" }) => string;
// ...
dashboard: (businessId: string, opts?: { target?: "central" | "legacy" }) => 
  opts?.target === "legacy" ? `/perfil/empresas/${businessId}` : `/central/empresas/${businessId}`
```

---

### 3. src/core/business/services/BusinessUrlService.ts
**Alterações:**
- Adicionado interface `BusinessUrlOptions` com opção `target?: "central" | "legacy"`
- Interface `ResolvedBusinessUrl.dashboard` atualizada com documentação
- Método `buildUrls` atualizado para aceitar parâmetro `opts?: BusinessUrlOptions`
- Dashboard usa `/central/empresas/:id` por padrão
- Opção `target: "legacy"` retorna `/perfil/empresas/:id`

**Antes:**
```typescript
static buildUrls(ctx: BusinessUrlContext): ResolvedBusinessUrl {
  // ...
  return {
    // ...
    dashboard: `/perfil/empresas/${id}`,
  };
}
```

**Depois:**
```typescript
static buildUrls(ctx: BusinessUrlContext, opts?: BusinessUrlOptions): ResolvedBusinessUrl {
  // ...
  const dashboard = opts?.target === "legacy" ? `/perfil/empresas/${id}` : `/central/empresas/${id}`;
  return {
    // ...
    dashboard,
  };
}
```

---

### 4. src/core/routing/hooks/useAppUrls.ts
**Alterações:**
- `profile.central` atualizado de `/perfil` para `/central`
- `profile.businesses` atualizado de `/perfil/empresas` para `/central/empresas`
- `profile.mobilidade.motorista.home` atualizado de `/perfil/mobilidade/motorista` para `/central/motorista`
- `profile.mobilidade.motoboy.home` atualizado de `/perfil/mobilidade/motoboy` para `/central/motoboy`

**Rotas de mobilidade mantidas em /perfil (sub-rotas de cadastro/configuração):**
- cadastro, disponibilidade, corridas, ganhos, configuracoes (motorista)
- cadastro, disponibilidade, entregas, ganhos, configuracoes (motoboy)

**Antes:**
```typescript
profile: {
  central: '/perfil',
  businesses: '/perfil/empresas',
  mobilidade: {
    motorista: {
      home: '/perfil/mobilidade/motorista',
    },
    motoboy: {
      home: '/perfil/mobilidade/motoboy',
    },
  },
}
```

**Depois:**
```typescript
profile: {
  central: '/central',
  businesses: '/central/empresas',
  mobilidade: {
    motorista: {
      home: '/central/motorista',
    },
    motoboy: {
      home: '/central/motoboy',
    },
  },
}
```

---

### 5. src/core/mobility/hooks/useMobilityUrls.ts
**Alterações:**
- `driver` atualizado de `/perfil/mobilidade/motorista` para `/central/motorista`
- `motoboy` atualizado de `/perfil/mobilidade/motoboy` para `/central/motoboy`

**Antes:**
```typescript
driver: "/perfil/mobilidade/motorista",
motoboy: "/perfil/mobilidade/motoboy",
```

**Depois:**
```typescript
driver: "/central/motorista",
motoboy: "/central/motoboy",
```

---

### 6. src/modules/profile/utils/profileNavigation.ts
**Alterações:**
- Seção `empresas` atualizada de `/perfil/empresas` para `/central/empresas`

**Antes:**
```typescript
case "empresas":
  return "/perfil/empresas";
```

**Depois:**
```typescript
case "empresas":
  return "/central/empresas";
```

---

### 7. src/modules/profile/utils/profileMobilityNavigation.ts
**Alterações:**
- `motorista.home` atualizado de `/perfil/mobilidade/motorista` para `/central/motorista`
- `motoboy.home` atualizado de `/perfil/mobilidade/motoboy` para `/central/motoboy`

**Antes:**
```typescript
motorista: {
  home: "/perfil/mobilidade/motorista",
  // ...
},
motoboy: {
  home: "/perfil/mobilidade/motoboy",
  // ...
},
```

**Depois:**
```typescript
motorista: {
  home: "/central/motorista",
  // ...
},
motoboy: {
  home: "/central/motoboy",
  // ...
},
```

---

## Rotas Antigas Substituídas

| Contexto | Antes | Depois |
|----------|-------|--------|
| Gestão de empresas (overview) | `/perfil/empresas/:businessId` | `/central/empresas/:businessId` |
| Gestão de empresas (todas sub-rotas) | `/perfil/empresas/:businessId/*` | `/central/empresas/:businessId/*` |
| Hub Central | `/perfil` | `/central` |
| Lista de empresas | `/perfil/empresas` | `/central/empresas` |
| Motorista (home) | `/perfil/mobilidade/motorista` | `/central/motorista` |
| Motoboy (home) | `/perfil/mobilidade/motoboy` | `/central/motoboy` |

---

## Rotas Mantidas por Compatibilidade

| Contexto | Rota | Motivo |
|----------|------|--------|
| Perfil pessoal (resumo) | `/perfil` | Foco em informações pessoais |
| Planos/billing | `/perfil/planos` | Página pessoal |
| Mobilidade (hub) | `/perfil/mobilidade` | Wrapper legado |
| Cadastro motorista | `/perfil/mobilidade/motorista/cadastro` | Fluxo específico |
| Disponibilidade motorista | `/perfil/mobilidade/motorista/disponibilidade` | Fluxo específico |
| Corridas motorista | `/perfil/mobilidade/motorista/corridas` | Fluxo específico |
| Ganhos motorista | `/perfil/mobilidade/motorista/ganhos` | Fluxo específico |
| Configurações motorista | `/perfil/mobilidade/motorista/configuracoes` | Fluxo específico |
| Cadastro motoboy | `/perfil/mobilidade/motoboy/cadastro` | Fluxo específico |
| Disponibilidade motoboy | `/perfil/mobilidade/motoboy/disponibilidade` | Fluxo específico |
| Entregas motoboy | `/perfil/mobilidade/motoboy/entregas` | Fluxo específico |
| Ganhos motoboy | `/perfil/mobilidade/motoboy/ganhos` | Fluxo específico |
| Configurações motoboy | `/perfil/mobilidade/motoboy/configuracoes` | Fluxo específico |

---

## Compatibilidade com Rotas Legadas

**Parâmetro `target` disponível em:**
- `businessManagementRoutes` - todas as funções aceitam `opts?: BusinessRouteTarget`
- `useBusinessUrls().dashboard` - aceita `opts?: { target?: "central" | "legacy" }`
- `BusinessUrlService.buildUrls()` - aceita `opts?: BusinessUrlOptions`

**Uso:**
```typescript
// Default: usa Central
businessManagementRoutes.overview(businessId) // → /central/empresas/:businessId

// Legacy: usa /perfil
businessManagementRoutes.overview(businessId, { target: "legacy" }) // → /perfil/empresas/:businessId
```

---

## Validações

### CTAs de Gestão
- ✅ `useAppUrls().profile.central` → `/central`
- ✅ `useAppUrls().profile.businesses` → `/central/empresas`
- ✅ `useAppUrls().profile.mobilidade.motorista.home` → `/central/motorista`
- ✅ `useAppUrls().profile.motoboy.home` → `/central/motoboy`
- ✅ `useMobilityUrls().driver` → `/central/motorista`
- ✅ `useMobilityUrls().motoboy` → `/central/motoboy`
- ✅ `profileNavigation.getProfileSectionPath("empresas")` → `/central/empresas`
- ✅ `profileMobilityRoutes.motorista.home` → `/central/motorista`
- ✅ `profileMobilityRoutes.motoboy.home` → `/central/motoboy`

### Páginas Pessoais
- ✅ `/perfil` - continua focado em informações pessoais
- ✅ `/perfil/planos` - continua sendo página pessoal
- ✅ `/perfil/mobilidade` - wrapper legado mantido
- ✅ Sub-rotas de cadastro/configuração mantidas em `/perfil/mobilidade/*`

---

## Gates

**Resultados:**
- ✅ lint passou (sem warnings)
- ✅ typecheck passou
- ✅ build passou (4m 5s)

---

## Próximos Passos

### Fase 2.2 (Sugestão)
1. Atualizar CTAs específicos em páginas que ainda usam links hardcoded
2. Migrar sub-rotas de mobilidade (cadastro, disponibilidade, etc.) para Central
3. Criar sidebar/layout próprio para Central
4. Remover redirecionamentos para /perfil após migração completa
5. Remover rotas legadas após validação

### Notas Importantes
- Hooks centrais de URL agora apontam preferencialmente para /central
- Compatibilidade com rotas legadas mantida via parâmetro `target`
- Páginas pessoais continuam em /perfil conforme especificado
- SSOT de rotas preservado
- Sem quebra de funcionalidades existentes
