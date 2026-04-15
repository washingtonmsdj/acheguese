# 📋 ANÁLISE ROUTING - TRABALHO PENDENTE

## 🎯 SITUAÇÃO ATUAL

A Fase 4 (Core Routing) está pendente e requer refatoração de 2 components que acessam Supabase diretamente.

**Data**: 2026-04-04  
**Status**: ⏳ PENDENTE  
**Estimativa**: 4 horas

---

## 📊 VIOLAÇÕES IDENTIFICADAS

### 1. BrasilShowcasePage.tsx

**Localização**: `src/core/routing/components/BrasilShowcasePage.tsx`  
**Tamanho**: 977 linhas  
**Complexidade**: ALTA

#### Queries Diretas ao Supabase

1. **Verificação de Admin** (linha ~180)
```typescript
const { data: profile } = await (supabase as any)
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
```

2. **Dados da Plataforma** (via hook `useNationalFeatured`)
- Hook busca estatísticas nacionais
- Busca territórios ativos
- Busca empresas verificadas

#### Características

- Página administrativa (requer role admin)
- Mostra vitrine nacional do Brasil
- Dados estáticos (BRASIL_INFO, STATS, PONTOS_TURISTICOS, etc)
- Dados dinâmicos (platformStats, territories, businesses)
- Banner de desenvolvimento
- Verificação de autenticação e autorização

---

### 2. CountryLandingPage.tsx

**Localização**: `src/core/routing/components/CountryLandingPage.tsx`  
**Tamanho**: 150 linhas  
**Complexidade**: MÉDIA

#### Queries Diretas ao Supabase

1. **Buscar País** (linha ~30)
```typescript
const { data: countryRow } = await (supabase as any)
  .from('locations')
  .select('*')
  .eq('geographic_path', countryPath)
  .eq('type', 'country')
  .single();
```

2. **Buscar Estados Ativos** (linha ~40)
```typescript
const { data: stateRows } = await (supabase as any)
  .from('locations')
  .select('*')
  .eq('type', 'state')
  .eq('status', 'active')
  .order('name');
```

3. **Contar Cidades por Estado** (linha ~50)
```typescript
const { count } = await (supabase as any)
  .from('locations')
  .select('*', { count: 'exact', head: true })
  .eq('parent_id', st.id)
  .eq('type', 'city')
  .eq('status', 'active');
```

#### Características

- Landing pública para nível país
- Lista estados ativos
- Conta cidades por estado
- Navegação para estados

---

## 🏗️ DECISÃO ARQUITETURAL

### Opção Escolhida: Criar módulo `modules/landing/`

**Justificativa**:
1. ✅ Landing pages são VERTICAIS, não transversais
2. ✅ Components não devem estar em `core/`
3. ✅ Funcionalidade específica (landing pages)
4. ✅ Pode ser desligada via feature flag
5. ✅ Tem UI própria

**Estrutura Planejada**:
```
src/modules/landing/
├── components/
│   ├── BrasilShowcase.tsx
│   └── CountryLanding.tsx
├── services/
│   ├── LandingService.impl.ts
│   ├── LandingService.ts
│   └── index.ts
├── hooks/
│   └── useLandingData.ts (se necessário)
├── pages/
│   ├── BrasilShowcasePage.tsx
│   └── CountryLandingPage.tsx
├── types/
│   └── index.ts
└── index.ts
```

---

## 📋 PLANO DE AÇÃO

### Etapa 1: Criar Estrutura do Módulo (30 min)

1. Criar pasta `src/modules/landing/`
2. Criar subpastas (components, services, pages, types)
3. Criar barrel exports

### Etapa 2: Criar LandingService (2 horas)

**Métodos Necessários**:

1. `getCountryData(countryCode: string)`
   - Buscar dados do país

2. `getActiveStates(countryCode: string)`
   - Buscar estados ativos
   - Filtrar por is_landing_enabled

3. `getCitiesByState(stateId: string)`
   - Contar cidades por estado

4. `getNationalStats()`
   - Buscar estatísticas da plataforma
   - Cidades ativas, bairros, negócios, profissionais

5. `getActiveTerritories()`
   - Buscar cidades ativas
   - Buscar grupos territoriais

6. `getVerifiedBusinesses(limit?: number)`
   - Buscar empresas verificadas
   - Filtrar por is_verified ou is_premium

7. `checkAdminRole(userId: string)`
   - Verificar se usuário é admin

**Características**:
- ✅ Error handling completo
- ✅ Logging implementado
- ✅ Documentação JSDoc
- ✅ Types exportados
- ✅ Fallback para dados mock quando apropriado

### Etapa 3: Mover Components (30 min)

1. Mover `BrasilShowcasePage.tsx` para `modules/landing/pages/`
2. Mover `CountryLandingPage.tsx` para `modules/landing/pages/`
3. Atualizar imports

### Etapa 4: Refatorar Components (1 hora)

1. Remover imports de `@/integrations/supabase`
2. Adicionar imports de `LandingService`
3. Refatorar queries para usar service
4. Adicionar comentário SSOT
5. Validar funcionalidade

### Etapa 5: Atualizar Routing (30 min)

1. Atualizar imports em `src/core/routing/`
2. Atualizar rotas se necessário
3. Validar navegação

### Etapa 6: Validação Final (30 min)

1. Validar TypeScript (zero erros)
2. Testar funcionalidade
3. Verificar 100% conformidade SSOT
4. Documentar conclusão

---

## 🎯 RESULTADO ESPERADO

### Antes (❌ Violação)

```typescript
// Component em core/ acessando Supabase
import { supabase } from '@/integrations/supabase';

const { data } = await supabase
  .from('locations')
  .select('*')
  .eq('type', 'state');
```

### Depois (✅ Correto)

```typescript
// Component em modules/landing/ usando Service
import { LandingService } from '../services/LandingService';

const data = await LandingService.getActiveStates('br');
```

### Fluxo Correto

```
Database (Supabase)
    ↓
Service (LandingService)
    ↓
Component (BrasilShowcase / CountryLanding)
    ↓
Page (BrasilShowcasePage / CountryLandingPage)
```

---

## 📊 ESTIMATIVA DETALHADA

| Etapa | Tempo | Complexidade |
|-------|-------|--------------|
| 1. Criar estrutura | 30 min | Baixa |
| 2. Criar LandingService | 2 horas | Alta |
| 3. Mover components | 30 min | Baixa |
| 4. Refatorar components | 1 hora | Média |
| 5. Atualizar routing | 30 min | Baixa |
| 6. Validação final | 30 min | Baixa |
| **TOTAL** | **5 horas** | **Média-Alta** |

---

## 🚨 PONTOS DE ATENÇÃO

### BrasilShowcasePage.tsx

1. ⚠️ Página administrativa (requer verificação de role)
2. ⚠️ Usa hook `useNationalFeatured` (precisa verificar se acessa Supabase)
3. ⚠️ Muitos dados estáticos (manter no component)
4. ⚠️ Verificação de autenticação no useEffect

### CountryLandingPage.tsx

1. ⚠️ Loop para contar cidades por estado (pode ser otimizado)
2. ⚠️ Filtro de metadata (is_landing_enabled)
3. ⚠️ Navegação para estados

### Geral

1. ⚠️ Atualizar imports em outros arquivos que usam esses components
2. ⚠️ Verificar se há rotas hardcoded
3. ⚠️ Testar navegação completa
4. ⚠️ Verificar se `useNationalFeatured` precisa refatoração

---

## 📚 DEPENDÊNCIAS

### Hooks a Verificar

1. `useNationalFeatured` - Precisa análise
   - Localização: `@/core/landing/useNationalFeatured`
   - Pode ter queries diretas ao Supabase

### Services Existentes

1. `TerritorialGroupService` - Pode ser reutilizado
2. `ProfileService` - Para verificação de role

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Estrutura

- [ ] Módulo `modules/landing/` criado
- [ ] Subpastas criadas
- [ ] Barrel exports configurados

### Service

- [ ] LandingService criado
- [ ] 7 métodos implementados
- [ ] Error handling completo
- [ ] Logging implementado
- [ ] Documentação JSDoc
- [ ] Types exportados

### Components

- [ ] BrasilShowcasePage movido
- [ ] CountryLandingPage movido
- [ ] Imports atualizados
- [ ] Zero imports de supabase
- [ ] Comentário SSOT adicionado

### Validação

- [ ] TypeScript sem erros
- [ ] Funcionalidade preservada
- [ ] Navegação funcionando
- [ ] 100% conformidade SSOT

---

## 🎯 CONCLUSÃO

A Fase 4 é a última fase da refatoração SSOT. Após conclusão, o projeto terá:

- ✅ 100% conformidade SSOT
- ✅ Zero violações
- ✅ Todos os services nas camadas corretas
- ✅ Código limpo e profissional
- ✅ Documentação completa

**Qualidade Final Esperada**: Nível AAA ⭐⭐⭐

---

**Data**: 2026-04-04  
**Status**: ⏳ ANÁLISE CONCLUÍDA  
**Próxima Ação**: Iniciar Etapa 1 - Criar estrutura do módulo
