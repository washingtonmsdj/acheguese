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
- Adicionado interface `rotas centrais canonicas` com opção `rota central canonica`
- Todas as rotas agora usam `/central/empresas/:businessId` por padrão
- Opção `sem rota legada` retorna `/central/empresas/:businessId`

**Rotas atualizadas:**
- overview, dados, gastronomia, planos, linkPremium, analytics, configuracoes
- gastronomySetup, gastronomyCardapio, gastronomyHorarios, gastronomyAreaEntrega
- gastronomyPedidos, gastronomyEntregas, gastronomyAnalytics, gastronomyPromocoes

**Antes:**
```typescript
overview: (businessId: string) => `/central/empresas/${businessId}`
```

**Depois:**
```typescript
overview: (businessId: string, opts?: rotas centrais canonicas) => 
  opts?.target === "legacy" ? `/central/empresas/${businessId}` : `/central/empresas/${businessId}`
```

---

### 2. src/core/business/hooks/useBusinessUrls.ts
**Alterações:**
- Interface `BusinessUrls.dashboard` atualizada com parâmetro `opts?: { rota central canonica }`
- Implementação usa `/central/empresas/${businessId}` por padrão
- Opção `sem rota legada` retorna `/central/empresas/${businessId}`

**Antes:**
```typescript
dashboard: (businessId: string) => string;
// ...
dashboard: (businessId: string) => `/central/empresas/${businessId}`
```

**Depois:**
```typescript
dashboard: (businessId: string, opts?: { rota central canonica }) => string;
// ...
dashboard: (businessId: string, opts?: { rota central canonica }) => 
  opts?.target === "legacy" ? `/central/empresas/${businessId}` : `/central/empresas/${businessId}`
```

---

### 3. src/core/business/services/BusinessUrlService.ts
**Alterações:**
- Adicionado interface `opcoes canonicas removidas` com opção `rota central canonica`
- Interface `ResolvedBusinessUrl.dashboard` atualizada com documentação
- Método `buildUrls` atualizado para aceitar parâmetro `opts?: opcoes canonicas removidas`
- Dashboard usa `/central/empresas/:id` por padrão
- Opção `sem rota legada` retorna `/central/empresas/:id`

**Antes:**
```typescript
static buildUrls(ctx: BusinessUrlContext): ResolvedBusinessUrl {
  // ...
  return {
    // ...
    dashboard: `/central/empresas/${id}`,
  };
}
```

**Depois:**
```typescript
static buildUrls(ctx: BusinessUrlContext, opts?: opcoes canonicas removidas): ResolvedBusinessUrl {
  // ...
  const dashboard = opts?.target === "legacy" ? `/central/empresas/${id}` : `/central/empresas/${id}`;
  return {
    // ...
    dashboard,
  };
}
```

---

### 4. src/core/routing/hooks/useAppUrls.ts
**Alterações:**
- `profile.home` atualizado de `/perfil` para `/central`
- `profile.businesses` atualizado de `/central/empresas` para `/central/empresas`
- `profile.mobilidade.motorista.home` atualizado de `/central/motorista` para `/central/motorista`
- `profile.mobilidade.motoboy.home` atualizado de `/central/motoboy` para `/central/motoboy`

**Rotas de mobilidade mantidas em /perfil (sub-rotas de cadastro/configuração):**
- cadastro, disponibilidade, corridas, ganhos, configuracoes (motorista)
- cadastro, disponibilidade, entregas, ganhos, configuracoes (motoboy)

**Antes:**
```typescript
profile: {
  central: '/perfil',
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
- `driver` atualizado de `/central/motorista` para `/central/motorista`
- `motoboy` atualizado de `/central/motoboy` para `/central/motoboy`

**Antes:**
```typescript
driver: "/central/motorista",
motoboy: "/central/motoboy",
```

**Depois:**
```typescript
driver: "/central/motorista",
motoboy: "/central/motoboy",
```

---

### 6. src/modules/profile/utils/profileNavigation.ts
**Alterações:**
- Seção `empresas` atualizada de `/central/empresas` para `/central/empresas`

**Antes:**
```typescript
case "empresas":
  return "/central/empresas";
```

**Depois:**
```typescript
case "empresas":
  return "/central/empresas";
```

---

### 7. src/modules/profile/utils/profileMobilityNavigation.ts
**Alterações:**
- `motorista.home` atualizado de `/central/motorista` para `/central/motorista`
- `motoboy.home` atualizado de `/central/motoboy` para `/central/motoboy`

**Antes:**
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
| Gestão de empresas (overview) | `/central/empresas/:businessId` | `/central/empresas/:businessId` |
| Gestão de empresas (todas sub-rotas) | `/central/empresas/:businessId/*` | `/central/empresas/:businessId/*` |
| Hub Central | `/perfil` | `/central` |
| Lista de empresas | `/central/empresas` | `/central/empresas` |
| Motorista (home) | `/central/motorista` | `/central/motorista` |
| Motoboy (home) | `/central/motoboy` | `/central/motoboy` |

---

## Rotas Mantidas por Compatibilidade

| Contexto | Rota | Motivo |
|----------|------|--------|
| Perfil pessoal (resumo) | `/perfil` | Foco em informações pessoais |
| Planos/billing | `/perfil/planos` | Página pessoal |
| Mobilidade (hub) | `/central` | Wrapper legado |
| Cadastro motorista | `/central/motorista/cadastro` | Fluxo específico |
| Disponibilidade motorista | `/central/motorista/disponibilidade` | Fluxo específico |
| Corridas motorista | `/central/motorista/corridas` | Fluxo específico |
| Ganhos motorista | `/central/motorista/ganhos` | Fluxo específico |
| Configurações motorista | `/central/motorista/configuracoes` | Fluxo específico |
| Cadastro motoboy | `/central/motoboy/cadastro` | Fluxo específico |
| Disponibilidade motoboy | `/central/motoboy/disponibilidade` | Fluxo específico |
| Entregas motoboy | `/central/motoboy/entregas` | Fluxo específico |
| Ganhos motoboy | `/central/motoboy/ganhos` | Fluxo específico |
| Configurações motoboy | `/central/motoboy/configuracoes` | Fluxo específico |

---

## Compatibilidade com Rotas Legadas

**Parâmetro `target` disponível em:**
- `businessManagementRoutes` - todas as funções aceitam `opts?: rotas centrais canonicas`
- `useBusinessUrls().dashboard` - aceita `opts?: { rota central canonica }`
- `BusinessUrlService.buildUrls()` - aceita `opts?: opcoes canonicas removidas`

**Uso:**
```typescript
// Default: usa Central
businessManagementRoutes.overview(businessId) // → /central/empresas/:businessId

// Legacy: usa /perfil
businessManagementRoutes.overview(businessId, { sem rota legada }) // → /central/empresas/:businessId
```

---

## Validações

### CTAs de Gestão
- ✅ `useAppUrls().profile.home` → `/central`
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
- ✅ `/central` - wrapper legado mantido
- ✅ Sub-rotas de cadastro/configuração mantidas em `/central/*`

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
