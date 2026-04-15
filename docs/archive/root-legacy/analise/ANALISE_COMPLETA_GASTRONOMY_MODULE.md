# 🔍 Análise Completa do Módulo de Gastronomia

## Problemas Identificados

### 1. **Inconsistência de IDs no GastronomyQueryService**

**Problema**: O módulo está confundindo `profile_id` com `business_data.id`

**SSOT Correto**:
- `business_data.id` = ID único do registro em business_data (UUID)
- `business_data.profile_id` = FK para profiles.id (UUID)
- `gastronomy_profiles.business_id` = FK para `business_data.id` (não profile_id!)

**Onde está errado**:
- `getGastronomyBusiness()` recebe um ID mas não sabe se é profile_id ou business_data.id
- URLs usam `profile_id` mas deveriam usar `slug` + `geographic_path`
- Mapeamento entre Business e GastronomyProfile está inconsistente

### 2. **Filtro Territorial Não Hierárquico**

**Problema**: Quando busca por cidade, não inclui empresas dos bairros

**Solução Implementada**: ✅ Filtro hierárquico já corrigido no `getGastronomyBusinessesList`

**Ainda falta**: Aplicar no `getGastronomyBusinesses` e `getFeaturedGastronomyBusinesses`

### 3. **URLs Usando profile_id ao invés de Slug**

**Problema**: URLs estão usando `/gastronomia/{profile_id}` como fallback

**SSOT Correto**: URLs devem SEMPRE usar slug + geographic_path
```
/gastronomia/:uf/:cidade/:bairro/:slug
```

**Nunca usar**: `/gastronomia/{uuid}`

### 4. **BusinessService.getBusinessById Espera business_data.id**

**Problema**: Estamos passando `profile_id` mas o service espera `business_data.id`

**Solução**: Sempre converter profile_id → business_data.id antes de chamar BusinessService

### 5. **Falta de Validação de Dados**

**Problema**: Não valida se empresa tem geographic_path antes de gerar URL

**Solução**: Adicionar validação e fallback apropriado

## Correções Necessárias

### Correção 1: Padronizar getGastronomyBusiness

```typescript
static async getGastronomyBusiness(identifier: string): Promise<GastronomyBusiness | null> {
  try {
    // identifier pode ser slug ou business_data.id
    // Tentar buscar por slug primeiro (mais comum)
    let businessDataId: string | null = null;
    
    // Tentar por slug
    const { data: bySlug } = await supabase
      .from('business_data')
      .select('id')
      .eq('slug', identifier)
      .eq('status', 'active')
      .maybeSingle();
    
    if (bySlug) {
      businessDataId = bySlug.id;
    } else {
      // Tentar como ID direto (UUID)
      businessDataId = identifier;
    }
    
    // Buscar dados completos
    const business = await BusinessService.getBusinessById(businessDataId);
    if (!business) return null;
    
    // Buscar perfil gastronômico
    const gastronomyProfile = await this.getGastronomyProfile(businessDataId);
    if (!gastronomyProfile) return null;
    
    return {
      ...business,
      gastronomy_profile: gastronomyProfile,
    };
  } catch (error) {
    logger.error('[GastronomyQueryService] Error:', error);
    return null;
  }
}
```

### Correção 2: Aplicar Filtro Hierárquico em Todos os Métodos

Criar função helper:

```typescript
private static async getLocationIdsHierarchical(
  territoryFilter: TerritoryFilter
): Promise<string[]> {
  if (territoryFilter.scope === 'location') {
    // Buscar descendentes
    const { data: children } = await supabase
      .from('locations')
      .select('id')
      .eq('parent_id', territoryFilter.location_id);
    
    const childIds = children?.map(c => c.id) || [];
    return [territoryFilter.location_id, ...childIds];
  }
  
  if (territoryFilter.scope === 'group') {
    return territoryFilter.location_ids;
  }
  
  return [];
}
```

Usar em todos os métodos que fazem filtro territorial.

### Correção 3: Remover Fallback de URL com UUID

No `GastronomyBusinessCard.tsx`:

```typescript
// ❌ ERRADO
const url = business.geographic_path && business.slug
  ? GastronomyUrlService.getCanonicalUrl(...)
  : `/gastronomia/${business.profile_id}`; // Fallback ruim

// ✅ CORRETO
const url = GastronomyUrlService.getCanonicalUrl({
  id: business.id,
  slug: business.slug,
  is_premium: business.is_premium,
  geographic_path: business.geographic_path,
});

// Se falhar, não renderizar o card ou mostrar erro
if (!url) {
  logger.error('[GastronomyBusinessCard] Cannot generate URL for business:', business.id);
  return null;
}
```

### Correção 4: Validar Dados Antes de Renderizar

```typescript
export function GastronomyBusinessCard({ business }: Props) {
  // Validar dados obrigatórios
  if (!business.slug || !business.geographic_path) {
    logger.warn('[GastronomyBusinessCard] Missing required data:', business.id);
    return null;
  }
  
  // ... resto do código
}
```

### Correção 5: Corrigir Roteamento

No `App.tsx`, garantir que rotas usam slug:

```typescript
// ✅ CORRETO
<Route path="/gastronomia/:state/:city/:district/:slug" element={<GastronomyDetailPage />} />

// ❌ NUNCA USAR
<Route path="/gastronomia/:id" element={<GastronomyDetailPage />} />
```

### Correção 6: Hook useGastronomyDetail

Deve extrair slug da URL, não ID:

```typescript
export function useGastronomyDetail() {
  const { slug } = useParams(); // Não 'id'
  
  return useQuery({
    queryKey: ['gastronomy', 'detail', slug],
    queryFn: () => GastronomyQueryService.getGastronomyBusiness(slug!),
    enabled: !!slug,
  });
}
```

## Plano de Implementação

### Fase 1: Correções Críticas (Agora)
1. ✅ Filtro hierárquico no getGastronomyBusinessesList
2. ⏳ Corrigir getGastronomyBusiness para aceitar slug
3. ⏳ Remover fallback de URL com UUID
4. ⏳ Validar dados antes de renderizar cards

### Fase 2: Refatoração (Próximo)
1. Criar helper para filtro hierárquico
2. Aplicar filtro hierárquico em todos os métodos
3. Adicionar testes unitários
4. Documentar padrões de URL

### Fase 3: Otimização (Futuro)
1. Cache de queries hierárquicas
2. Prefetch de dados relacionados
3. Lazy loading de imagens
4. Otimização de bundle

## Checklist de Conformidade SSOT

- [ ] Todas as queries usam `business_data.id` (não profile_id)
- [ ] Todas as URLs usam slug + geographic_path
- [ ] Filtro territorial é hierárquico
- [ ] Validação de dados obrigatórios
- [ ] Tratamento de erros consistente
- [ ] Logs informativos em pontos críticos
- [ ] Sem fallbacks que quebram o padrão
- [ ] Documentação atualizada

## Arquitetura Correta

```
┌─────────────────────────────────────────────────────────┐
│                    SSOT: business_data                   │
│  - id (PK)                                               │
│  - profile_id (FK → profiles.id)                         │
│  - slug (unique)                                         │
│  - location_id (FK → locations.id) [DEVE SER DISTRICT]  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ 1:1
                            ▼
┌─────────────────────────────────────────────────────────┐
│              gastronomy_profiles (extensão)              │
│  - id (PK)                                               │
│  - business_id (FK → business_data.id)                   │
│  - cuisine_type, price_range, etc.                       │
└─────────────────────────────────────────────────────────┘

URLs Geradas:
/gastronomia/{uf}/{cidade}/{bairro}/{slug}
              ↑      ↑        ↑       ↑
              └──────┴────────┴───────┴─── Extraído de locations.geographic_path + business_data.slug
```

## Próximos Passos

1. Implementar correções da Fase 1
2. Testar cada correção individualmente
3. Validar com dados reais
4. Documentar mudanças
5. Commit com mensagem descritiva
