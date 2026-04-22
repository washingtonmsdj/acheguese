# 🍽️ FLUXO COMPLETO: Vertical Gastronomia

**Versão:** 1.0.0  
**Data:** 2026-04-13  
**Status:** Implementado e Documentado

---

## 📋 VISÃO GERAL

O vertical **Gastronomia** é uma extensão opcional 1:1 de `business_data` que permite empresas de alimentação terem:
- Perfil gastronômico com tipo de culinária e faixa de preço
- Cardápio digital completo
- Gestão de delivery, retirada e atendimento presencial
- Aparição na listagem pública `/gastronomia`

---

## 🏗️ ARQUITETURA

### Entidades

```
business_data (entidade base canônica)
    ↓ 1:1 opcional
gastronomy_profiles (extensão vertical)
    ↓ 1:N
menus → menu_categories → menu_items
```

### Relacionamentos

- `gastronomy_profiles.business_id` → `business_data.id` (FK)
- `menus.business_id` → `business_data.id` (FK)
- **IMPORTANTE:** `category` em `business_data` NÃO substitui `cuisine_type` em `gastronomy_profiles`

---

## 🔄 FLUXO COMPLETO

### 1. Criação da Empresa

**Rota:** `/create-business`  
**Componente:** `CriarEmpresaPageV2`  
**Hook:** `useBusinessCreateMultiProfile`

```typescript
// Usuário preenche formulário
const form = useForm<CreateBusinessInput>({
  // ...
  category: 'restaurante', // ou 'lazer'
});

// Ao submeter
const { createBusiness } = useBusinessCreateMultiProfile({
  onSuccess: (result) => {
    // Verifica elegibilidade
    const eligibleVerticals = getEligibleVerticals(category);
    
    if (eligibleVerticals.length > 0) {
      // Redireciona para setup do vertical
      navigate(eligibleVerticals[0].setupRoute(result.business_data_id));
    } else {
      // Redireciona para dashboard normal
      navigate(`/dashboard/business/${result.profile_id}`);
    }
  },
});
```

**O que acontece:**
1. RPC `create_profile_with_extension` cria:
   - `profiles` (registro base)
   - `business_data` (extensão business)
2. Retorna `profile_id` e `business_data_id`
3. Verifica se `category` é elegível para gastronomia
4. Se sim → redireciona para `/dashboard/business/:id/gastronomy/setup`

---

### 2. Setup do Perfil Gastronômico

**Rota:** `/dashboard/business/:businessId/gastronomy/setup`  
**Componente:** `GastronomySetupPage`  
**Hook:** `useGastronomySetup`  
**Service:** `GastronomyProfileService`

```typescript
// Hook busca perfil existente e category da empresa
const { profile, businessCategory, isNew, save } = useGastronomySetup(businessId);

// Sugestão inteligente baseada em category
const suggestedCuisine = getCuisineSuggestionFromCategory(businessCategory);

// Formulário com valores sugeridos
const form = useForm({
  defaultValues: {
    cuisine_type: suggestedCuisine || '',
    price_range: '$',
    delivery_enabled: false,
    // ...
  },
});

// Ao submeter
await save({
  business_id: businessId,
  cuisine_type: 'brasileira',
  price_range: '$$',
  delivery_enabled: true,
  // ...
});
```

**O que acontece:**
1. Busca `business_data.category` para sugerir `cuisine_type`
2. Usuário preenche formulário
3. `GastronomyProfileService.createProfileForBusiness()` cria registro em `gastronomy_profiles`
4. Redireciona para `/dashboard/business/:id`

---

### 3. Dashboard da Empresa

**Rota:** `/dashboard/business/:businessId`  
**Componente:** `BusinessDashboard` (a ser integrado)  
**Widget:** `GastronomyVerticalStatus`

```typescript
<GastronomyVerticalStatus
  businessId={businessId}
  businessCategory={business.category}
/>
```

**Estados possíveis:**

#### A) Não elegível
- Widget não renderiza

#### B) Elegível mas não configurado
```
┌─────────────────────────────────────┐
│ 🍽️ Módulo Gastronomia              │
├─────────────────────────────────────┤
│ Ative o módulo gastronômico para    │
│ aparecer na listagem de gastronomia │
│                                     │
│ [Ativar Módulo Gastronomia]        │
└─────────────────────────────────────┘
```

#### C) Configurado e ativo
```
┌─────────────────────────────────────┐
│ 🍽️ Módulo Gastronomia    ✅ Ativo  │
├─────────────────────────────────────┤
│ Tipo: Brasileira    Preço: $$      │
│ Delivery: Sim       Retirada: Sim  │
│                                     │
│ [Configurar] [Gerenciar Cardápio]  │
└─────────────────────────────────────┘
```

---

### 4. Listagem Pública

**Rota:** `/gastronomia`  
**Componente:** `GastronomyLandingPage`  
**Service:** `gastronomy.queries.ts`

```typescript
// Query que busca apenas empresas com perfil gastronômico ativo
const { data } = useGastronomyList(filters);

// SQL simplificado
SELECT 
  bd.*,
  gp.*
FROM business_data bd
INNER JOIN gastronomy_profiles gp ON gp.business_id = bd.id
WHERE gp.status = 'active'
  AND bd.status = 'active'
```

**Filtros disponíveis:**
- `cuisine_type` (tipo de culinária)
- `price_range` (faixa de preço)
- `delivery_enabled` (tem delivery)
- `is_open_now` (aberto agora)
- `territoryFilter` (território ativo)

---

## 🎯 REGRAS DE NEGÓCIO

### Elegibilidade

**Categorias elegíveis:**
- `restaurante`
- `lazer` (inclui bares, cafeterias, sorveterias, etc.)

**Verificação:**
```typescript
import { isEligibleForVertical } from '@/core/verticals';

const canActivate = isEligibleForVertical(category, 'gastronomy');
```

### Sugestão de Cuisine Type

**Mapeamento:**
- `restaurante` → sugere `'brasileira'`
- `lazer` → sugere `'bar'`
- Outros → `null` (usuário escolhe livremente)

**Função:**
```typescript
import { getCuisineSuggestionFromCategory } from '@/core/verticals';

const suggestion = getCuisineSuggestionFromCategory('restaurante');
// → 'brasileira'
```

### Validação

**Frontend:**
- Zod schema valida campos obrigatórios
- `cuisine_type` deve ser um dos `CUISINE_TYPES`
- `price_range` deve ser `'$' | '$$' | '$$$' | '$$$$'`

**Backend:**
- RLS garante que apenas owner pode criar/editar
- Trigger valida elegibilidade (a ser implementado)

---

## 🔐 SEGURANÇA

### RLS (Row Level Security)

```sql
-- Leitura pública de perfis ativos
CREATE POLICY "Active gastronomy profiles viewable"
  ON gastronomy_profiles FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Owners gerenciam seus perfis
CREATE POLICY "Owners manage own gastronomy profile"
  ON gastronomy_profiles FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT bd.id FROM business_data bd
      WHERE bd.profile_id IN (
        SELECT id FROM profiles
        WHERE user_id = auth.uid()
      )
    )
  );
```

---

## 📊 QUERIES PRINCIPAIS

### Buscar perfil por business_id

```typescript
const result = await GastronomyProfileService.getByBusinessId(businessId);
if (result.data) {
  // Perfil existe
}
```

### Criar perfil

```typescript
const result = await GastronomyProfileService.createProfileForBusiness({
  business_id: businessId,
  cuisine_type: 'brasileira',
  price_range: '$$',
  delivery_enabled: true,
  // ...
});
```

### Listar empresas gastronômicas

```typescript
const { data } = useGastronomyList({
  cuisine_type: 'italiana',
  delivery_enabled: true,
  territoryFilter: { locationId: 'abc123' },
});
```

---

## 🧪 TESTES

### Unit Tests

```typescript
describe('GastronomyProfileService', () => {
  it('valida elegibilidade corretamente', () => {
    expect(GastronomyProfileService.validateEligibility('restaurante')).toBe(true);
    expect(GastronomyProfileService.validateEligibility('mercado')).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Fluxo completo de criação', () => {
  it('cria empresa → ativa gastronomia → aparece na listagem', async () => {
    // 1. Criar empresa
    const business = await createBusiness({ category: 'restaurante' });
    
    // 2. Ativar gastronomia
    await GastronomyProfileService.createProfileForBusiness({
      business_id: business.id,
      cuisine_type: 'brasileira',
      // ...
    });
    
    // 3. Verificar listagem
    const list = await getGastronomyBusinesses();
    expect(list).toContainEqual(expect.objectContaining({
      business_data_id: business.id,
    }));
  });
});
```

---

## 🚀 ESCALABILIDADE

Este padrão pode ser replicado para outros verticais:

### Tourism Vertical
```typescript
export const VERTICAL_CONFIGS = {
  gastronomy: { /* ... */ },
  tourism: {
    key: 'tourism',
    label: 'Turismo',
    eligibleCategories: ['lazer', 'servicos'],
    setupRoute: (id) => `/dashboard/business/${id}/tourism/setup`,
  },
};
```

### Delivery Vertical
```typescript
export const VERTICAL_CONFIGS = {
  gastronomy: { /* ... */ },
  delivery: {
    key: 'delivery',
    label: 'Delivery',
    eligibleCategories: ['restaurante', 'mercado', 'farmacia'],
    setupRoute: (id) => `/dashboard/business/${id}/delivery/setup`,
  },
};
```

---

## 📚 REFERÊNCIAS

- **Config:** `src/core/verticals/config.ts`
- **Service:** `src/modules/business/gastronomy/GastronomyProfileService.ts`
- **Setup Page:** `src/modules/business/gastronomy/pages/GastronomySetupPage.tsx`
- **Widget:** `src/modules/business/gastronomy/components/GastronomyVerticalStatus.tsx`
- **Queries:** `src/modules/business/gastronomy/services/gastronomy.queries.ts`
- **Migration:** `supabase/migrations/20260331000002_create_gastronomy_module.sql`

---

**Última atualização:** 2026-04-13  
**Mantido por:** Equipe de Arquitetura

