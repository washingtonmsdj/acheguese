# BLUEPRINT OFICIAL - TOURIST_POINTS

**Versão**: 1.0.0  
**Data**: 2026-04-05  
**Status**: ✅ Aprovado como Piloto  
**Próximos Módulos**: Eventos, Vagas, Gastronomia, Classificados

---

## VISÃO GERAL

Este documento define o padrão oficial para implementação de módulos territoriais no SSOT. O módulo `tourist_points` serve como caso piloto e referência obrigatória para todos os próximos módulos.

**REGRA DE OURO**: Somente replique este padrão se for implementar TODOS os componentes: modelagem, resolução territorial, rota canônica, renderização, testes runtime e E2E.

---

## ARQUITETURA

### 1. MODELAGEM DE DADOS

#### Tabela Principal
```sql
CREATE TABLE tourist_points (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  
  -- SSOT Territorial
  location_id UUID NOT NULL REFERENCES locations(id),
  
  -- Conteúdo
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Metadados
  address_text TEXT,
  price_type TEXT NOT NULL CHECK (price_type IN ('free', 'paid', 'range', 'consult')),
  price_text TEXT,
  opening_hours TEXT,
  accessibility_notes TEXT,
  official_url TEXT,
  
  -- Destaque
  is_featured BOOLEAN DEFAULT false,
  
  -- Lifecycle
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(slug, location_id)
);
```

#### Índices Obrigatórios
```sql
CREATE INDEX idx_tourist_points_location_id 
  ON tourist_points(location_id) WHERE status = 'published';

CREATE INDEX idx_tourist_points_slug 
  ON tourist_points(slug) WHERE status = 'published';

CREATE INDEX idx_tourist_points_status 
  ON tourist_points(status);

CREATE INDEX idx_tourist_points_is_featured 
  ON tourist_points(is_featured) WHERE status = 'published';

CREATE INDEX idx_tourist_points_published_at 
  ON tourist_points(published_at DESC) WHERE status = 'published';
```

#### RLS (Row Level Security)
```sql
-- Leitura pública (apenas published)
CREATE POLICY "Public read published tourist points"
  ON tourist_points FOR SELECT
  USING (status = 'published');

-- Escrita apenas para autenticados
CREATE POLICY "Authenticated users can insert"
  ON tourist_points FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

### 2. SERVICE LAYER

#### Query Service (Leitura)
```typescript
// src/modules/guide/services/TouristPointQueryService.ts

export class TouristPointQueryService {
  /**
   * Lista pontos publicados para um conjunto de location_ids.
   * SSOT: Usa TerritoryFilter canônico.
   */
  static async listPublished(filters: TouristPointQueryFilters): Promise<TouristPoint[]> {
    if (!filters.location_ids.length) return [];

    const { data, error } = await supabase
      .from('tourist_points')
      .select(SELECT_PUBLIC)
      .in('location_id', filters.location_ids)
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false });

    if (error || !data) return [];
    return data as TouristPoint[];
  }

  /**
   * Detalhe por slug + location_id.
   * SSOT: Expande automaticamente cidade para distritos.
   */
  static async getPublishedBySlug(
    locationId: string,
    slug: string,
  ): Promise<TouristPoint | null> {
    // Verificar se location_id é de uma cidade
    const { data: location } = await supabase
      .from('locations')
      .select('id, type')
      .eq('id', locationId)
      .single();

    let locationIds: string[] = [locationId];

    // Se for cidade, expandir para todos os distritos
    if (location?.type === 'city') {
      const { data: districts } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_id', locationId)
        .eq('type', 'district')
        .eq('status', 'active');

      if (districts && districts.length > 0) {
        locationIds = districts.map(d => d.id);
      }
    }

    const { data, error } = await supabase
      .from('tourist_points')
      .select(SELECT_PUBLIC)
      .in('location_id', locationIds)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) return null;
    return data as TouristPoint;
  }
}
```

#### Mutation Service (Escrita)
```typescript
// src/modules/guide/services/TouristPointService.ts

export class TouristPointService {
  /**
   * Cria novo ponto turístico.
   * SSOT: location_id é obrigatório e validado.
   */
  static async create(input: CreateTouristPointInput): Promise<TouristPoint | null> {
    // Validar location_id
    const { data: location } = await supabase
      .from('locations')
      .select('id, type')
      .eq('id', input.location_id)
      .eq('status', 'active')
      .single();

    if (!location) {
      throw new Error('Invalid location_id');
    }

    // Gerar slug se não fornecido
    const slug = input.slug || generateSlug(input.title);

    const { data, error } = await supabase
      .from('tourist_points')
      .insert({
        ...input,
        slug,
        status: input.status || 'draft',
      })
      .select(SELECT_PUBLIC)
      .single();

    if (error || !data) return null;
    return data as TouristPoint;
  }
}
```

---

### 3. ROTEAMENTO

#### Rota Canônica
```
/pontos-turisticos/:state/:city/:district/:slug
```

**Exemplos**:
- `/pontos-turisticos/ba/salvador/barra/farol-da-barra`
- `/pontos-turisticos/ba/salvador/pelourinho/largo-do-pelourinho`

#### Redirecionamento Canônico
```typescript
// src/modules/guide/utils/canonicalRedirect.ts

export function shouldRedirect(currentPath: string, point: TouristPoint | null): {
  shouldRedirect: boolean;
  canonicalUrl: string | null;
} {
  if (!point) return { shouldRedirect: false, canonicalUrl: null };
  
  if (!isCanonicalUrl(currentPath, point)) {
    return {
      shouldRedirect: true,
      canonicalUrl: buildCanonicalUrl(point),
    };
  }
  
  return { shouldRedirect: false, canonicalUrl: null };
}
```

#### Uso na Página
```typescript
// src/modules/guide/pages/TouristPointDetailPage.tsx

const redirectCheck = shouldRedirect(location.pathname, point ?? null);
if (redirectCheck.shouldRedirect && redirectCheck.canonicalUrl) {
  return <Navigate to={redirectCheck.canonicalUrl} replace />;
}
```

---

### 4. HOOKS

#### useTouristPoints (Listagem)
```typescript
export function useTouristPoints(filter: TerritoryFilter) {
  return useQuery({
    queryKey: ['guide:tourist-points', filter.location_ids],
    queryFn: () => TouristPointQueryService.listPublished({
      location_ids: filter.location_ids,
    }),
    enabled: filter.location_ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
```

#### useTouristPoint (Detalhe)
```typescript
export function useTouristPoint(locationId: string | undefined, slug: string | undefined) {
  return useQuery({
    queryKey: ['guide:tourist-point', locationId, slug],
    queryFn: () => TouristPointQueryService.getPublishedBySlug(locationId!, slug!),
    enabled: !!locationId && !!slug,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
```

---

### 5. COMPONENTES

#### Card (Listagem)
```typescript
// Sempre usar location.name do SSOT
<span className="flex items-center gap-1">
  <MapPin className="h-3 w-3" />
  {point.location?.name ?? point.neighborhood}
</span>
```

#### URL Builder
```typescript
// Sempre usar buildTouristPointDetailUrl
import { buildTouristPointDetailUrl } from '../hooks/useGuideUrls';

const detailUrl = buildTouristPointDetailUrl(point.location, point.slug);
```

---

### 6. TESTES

#### Runtime Tests (Vitest)
```typescript
// tests/ssot-tourist-points.test.ts

describe('TouristPointQueryService', () => {
  it('should filter by location_ids', async () => {
    const result = await TouristPointQueryService.listPublished({
      location_ids: [BARRA_ID],
    });
    
    expect(result).toBeDefined();
    expect(result.every(p => p.location_id === BARRA_ID)).toBe(true);
  });
});
```

#### E2E Tests (Playwright)
```typescript
// tests/e2e/tourist-points.spec.ts

test('Detail Page - Farol da Barra', async ({ page }) => {
  await page.goto('/pontos-turisticos/ba/salvador');
  await page.getByRole('link').filter({ hasText: 'Farol da Barra' }).first().click();
  
  // Verificar URL canônica
  expect(page.url()).toContain('/pontos-turisticos/ba/salvador/barra/farol-da-barra');
  
  // Verificar bairro do SSOT
  const pageContent = await page.content();
  expect(pageContent).toContain('Barra');
});
```

#### Regression Tests
```typescript
// tests/regression-tourist-points.test.ts

it('should not have manual URL construction', () => {
  // Verifica que não há construção manual de URLs
  // Deve usar buildTouristPointDetailUrl
});

it('should not read neighborhood field directly', () => {
  // Verifica que não há leitura direta de campos legados
  // Deve usar point.location?.name
});
```

---

## CHECKLIST DE IMPLEMENTAÇÃO

Para replicar este padrão em um novo módulo, siga este checklist:

### ✅ Fase 1: Modelagem
- [ ] Criar tabela com location_id (SSOT)
- [ ] Criar índices obrigatórios
- [ ] Configurar RLS
- [ ] Criar migração idempotente
- [ ] Aplicar e validar no banco

### ✅ Fase 2: Services
- [ ] Criar QueryService (leitura)
- [ ] Criar MutationService (escrita)
- [ ] Implementar filtro por location_ids
- [ ] Implementar expansão cidade→distritos
- [ ] Validar com testes unitários

### ✅ Fase 3: Hooks
- [ ] Criar hook de listagem (useItems)
- [ ] Criar hook de detalhe (useItem)
- [ ] Usar TerritoryFilter
- [ ] Configurar React Query

### ✅ Fase 4: Roteamento
- [ ] Definir rota canônica
- [ ] Implementar redirecionamento
- [ ] Criar URL builder
- [ ] Validar com testes E2E

### ✅ Fase 5: Componentes
- [ ] Criar cards de listagem
- [ ] Criar página de detalhe
- [ ] Usar location.name (SSOT)
- [ ] Usar URL builder

### ✅ Fase 6: Testes
- [ ] Criar testes runtime (Vitest)
- [ ] Criar testes E2E (Playwright)
- [ ] Criar testes de regressão
- [ ] Adicionar ao CI

### ✅ Fase 7: Seed
- [ ] Criar seed reproduzível
- [ ] Documentar dados de teste
- [ ] Validar em ambiente local

### ✅ Fase 8: Documentação
- [ ] Documentar padrões específicos
- [ ] Criar guia de uso
- [ ] Atualizar este blueprint

---

## ANTI-PATTERNS (NÃO FAZER)

### ❌ Construção Manual de URLs
```typescript
// ERRADO
const url = `/pontos-turisticos/${state}/${city}/${slug}`;

// CORRETO
const url = buildTouristPointDetailUrl(point.location, point.slug);
```

### ❌ Leitura de Campos Legados
```typescript
// ERRADO
<span>{point.neighborhood}</span>

// CORRETO
<span>{point.location?.name ?? point.neighborhood}</span>
```

### ❌ Filtros Territoriais Indevidos
```typescript
// ERRADO
.eq('state', 'ba')
.eq('city', 'salvador')

// CORRETO
.in('location_id', filter.location_ids)
```

### ❌ Queries Diretas ao Supabase
```typescript
// ERRADO
const { data } = await supabase.from('tourist_points').select('*');

// CORRETO
const data = await TouristPointQueryService.listPublished(filter);
```

---

## EVIDÊNCIAS

### Banco de Dados
```sql
-- Verificar estrutura
\d tourist_points

-- Verificar dados
SELECT tp.id, tp.title, l.name as bairro, l.geographic_path
FROM tourist_points tp
LEFT JOIN locations l ON tp.location_id = l.id
WHERE tp.status = 'published';
```

### Testes
```bash
# Runtime
npm run test:ssot

# E2E
npm run test:e2e

# Regressão
npm run test:regression

# Todos
npm run test:all
```

### CI/CD
- Workflow: `.github/workflows/ssot-tests.yml`
- Executa em: push, pull_request
- Valida: runtime, E2E, regressão

---

## PRÓXIMOS MÓDULOS

Ordem de implementação sugerida:

1. **Eventos** (`events`)
   - Similar a tourist_points
   - Adiciona: data/hora do evento
   
2. **Vagas** (`jobs`)
   - Similar a tourist_points
   - Adiciona: empresa, salário, tipo

3. **Gastronomia** (`gastronomy`)
   - Similar a tourist_points
   - Adiciona: tipo de cozinha, faixa de preço

4. **Classificados** (`classifieds`)
   - Mais complexo
   - Adiciona: categorias, preço, negociação

---

## MANUTENÇÃO

### Atualizações do Blueprint
- Versionar mudanças
- Documentar breaking changes
- Comunicar ao time

### Revisão Periódica
- Trimestral: revisar padrões
- Anual: atualizar exemplos
- Contínuo: coletar feedback

---

## CONCLUSÃO

Este blueprint é a referência oficial para implementação de módulos territoriais. Siga-o rigorosamente para garantir consistência, qualidade e manutenibilidade do código.

**Lembre-se**: Somente replique se for implementar TODOS os componentes. Implementação parcial não é permitida.

---

**Aprovado por**: Sistema SSOT Territorial  
**Data de Aprovação**: 2026-04-05  
**Próxima Revisão**: 2026-07-05
