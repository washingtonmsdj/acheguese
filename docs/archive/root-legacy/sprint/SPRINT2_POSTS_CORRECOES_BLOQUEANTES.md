# CORREÇÕES BLOQUEANTES - SPRINT 2 POSTS

**Data**: 2026-04-05  
**Status**: 🔴 Bloqueantes Identificados  
**Referência**: SPRINT2_POSTS_PLANO_V2.md

---

## CORREÇÕES OBRIGATÓRIAS ANTES DA FASE 1

### 1. NOT NULL Exige 100% de Cobertura ✅

**Problema no Plano Original**:
```sql
-- Gate 1: Cobertura >= 95%  ❌ ERRADO
```

**Correção**:
```sql
-- Gate 1: Cobertura = 100%  ✅ CORRETO

DO $$
DECLARE
  coverage NUMERIC;
  posts_sem_location INTEGER;
BEGIN
  -- Verificar cobertura
  SELECT 
    COUNT(*) - COUNT(location_id)
  INTO posts_sem_location
  FROM posts;
  
  IF posts_sem_location > 0 THEN
    RAISE EXCEPTION 'Ainda existem % posts sem location_id. NOT NULL requer 100%% de cobertura.', posts_sem_location;
  END IF;
  
  -- Aplicar NOT NULL
  ALTER TABLE posts
    ALTER COLUMN location_id SET NOT NULL;
    
  RAISE NOTICE 'location_id agora é obrigatório (100%% de cobertura)';
END $$;
```

**Impacto**:
- Backfill deve migrar 100% dos posts
- Posts sem match devem ser tratados manualmente
- Não pode haver posts órfãos

---

### 2. MATCH_AMBIGUO Não Pode Ser Resolvido Automaticamente ✅

**Problema no Plano Original**:
```sql
-- ❌ ERRADO: Usar heurística automática
UPDATE posts p
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.type = 'district'
    AND l.name = p.neighborhood
  ORDER BY l.population DESC NULLS LAST  -- ❌ Heurística automática
  LIMIT 1
)
WHERE match_type = 'MATCH_AMBIGUO';
```

**Correção**:
```sql
-- ✅ CORRETO: Marcar para revisão manual

-- Criar tabela de revisão manual
CREATE TABLE IF NOT EXISTS posts_ambiguous_location (
  post_id UUID PRIMARY KEY REFERENCES posts(id),
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  possible_locations JSONB NOT NULL, -- Array de {id, name, parent_name, population}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  chosen_location_id UUID REFERENCES locations(id)
);

-- Inserir posts ambíguos para revisão
INSERT INTO posts_ambiguous_location (post_id, city, neighborhood, possible_locations)
SELECT 
  p.id,
  p.city,
  p.neighborhood,
  jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'name', l.name,
      'parent_name', parent.name,
      'population', l.population,
      'geographic_path', l.geographic_path
    )
  ) as possible_locations
FROM posts p
JOIN locations l ON (
  l.type = 'district'
  AND l.name = p.neighborhood
  AND l.parent_id IN (
    SELECT id FROM locations 
    WHERE type = 'city' AND name = p.city
  )
  AND l.status = 'active'
)
JOIN locations parent ON l.parent_id = parent.id
WHERE p.location_id IS NULL
  AND (
    SELECT COUNT(*) 
    FROM locations l2
    WHERE l2.type = 'district'
      AND l2.name = p.neighborhood
      AND l2.parent_id IN (
        SELECT id FROM locations 
        WHERE type = 'city' AND name = p.city
      )
      AND l2.status = 'active'
  ) > 1
GROUP BY p.id, p.city, p.neighborhood;

-- Criar interface de revisão manual (admin)
-- Administrador escolhe o location_id correto para cada post
```

**Processo de Revisão Manual**:
1. Admin acessa interface de revisão
2. Para cada post ambíguo, vê:
   - Conteúdo do post
   - Opções de bairros possíveis
   - Informações de cada bairro (população, path)
3. Admin escolhe o bairro correto
4. Sistema atualiza `posts.location_id`
5. Registro marcado como resolvido

**Impacto**:
- Backfill não pode ser 100% automático
- Requer intervenção humana
- Pode levar mais tempo

---

### 3. SEM_MATCH → Cidade Depende da Decisão da Fase 0 ✅

**Problema no Plano Original**:
```sql
-- ❌ ERRADO: Sempre usar cidade como fallback
UPDATE posts p
SET location_id = (
  SELECT id FROM locations
  WHERE type = 'city' AND name = p.city
  LIMIT 1
)
WHERE match_type = 'SEM_MATCH';
```

**Correção**:
```sql
-- ✅ CORRETO: Depende da decisão da Fase 0

-- SE Fase 0 decidir: "Opção B - Suporte a Grupos (Cidade)"
-- ENTÃO: Permitir location_id de cidade
UPDATE posts p
SET location_id = (
  SELECT id FROM locations
  WHERE type = 'city' AND name = p.city AND status = 'active'
  LIMIT 1
)
WHERE p.location_id IS NULL
  AND p.city IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM locations l
    WHERE l.type = 'district'
      AND l.name = p.neighborhood
      AND l.parent_id IN (
        SELECT id FROM locations WHERE type = 'city' AND name = p.city
      )
  );

-- SE Fase 0 decidir: "Opção A - Apenas Bairros"
-- ENTÃO: Marcar para revisão manual (não pode usar cidade)
INSERT INTO posts_pending_location (post_id, city, neighborhood, reason)
SELECT 
  id,
  city,
  neighborhood,
  'Bairro não encontrado no SSOT - Requer revisão manual'
FROM posts
WHERE location_id IS NULL
  AND city IS NOT NULL;
```

**Impacto**:
- Estratégia de backfill depende da Fase 0
- Não pode ser definida antes da aprovação
- Plano deve ter duas versões (A e B)

---

### 4. Expansão Territorial Deve Incluir Cidade + Distritos ✅

**Problema no Plano Original**:
```typescript
// ❌ ERRADO: Expande cidade PARA distritos (substitui)
if (location.type === 'city') {
  const { data: districts } = await supabase
    .from('locations')
    .select('id')
    .eq('parent_id', location.id)
    .eq('type', 'district');
  
  if (districts && districts.length > 0) {
    expanded.push(...districts.map(d => d.id));
  } else {
    expanded.push(location.id);  // ❌ Só adiciona cidade se não houver distritos
  }
}
```

**Correção**:
```typescript
// ✅ CORRETO: Inclui cidade + distritos (ambos)
if (location.type === 'city') {
  // Adicionar a própria cidade
  expanded.push(location.id);
  
  // Adicionar todos os distritos
  const { data: districts } = await supabase
    .from('locations')
    .select('id')
    .eq('parent_id', location.id)
    .eq('type', 'district')
    .eq('status', 'active');
  
  if (districts && districts.length > 0) {
    expanded.push(...districts.map(d => d.id));
  }
}
```

**Exemplo**:
```
Usuário seleciona: Salvador (cidade)

Antes (errado):
location_ids = [barra_id, pelourinho_id, pituba_id, ...]  // Apenas distritos

Depois (correto):
location_ids = [salvador_id, barra_id, pelourinho_id, pituba_id, ...]  // Cidade + distritos
```

**Impacto**:
- Posts com `location_id = salvador_id` aparecem no feed de Salvador
- Posts com `location_id = barra_id` também aparecem no feed de Salvador
- Consistente com a decisão da Fase 0 (se permitir posts de cidade)

---

### 5. Testes de Regressão Devem Cobrir modules/community e profile ✅

**Problema no Plano Original**:
```typescript
// ❌ ERRADO: Apenas src/core/posts
const POSTS_MODULE_PATH = join(process.cwd(), 'src/core/posts');
```

**Correção**:
```typescript
// ✅ CORRETO: Múltiplos módulos
const PATHS_TO_CHECK = [
  join(process.cwd(), 'src/core/posts'),
  join(process.cwd(), 'src/modules/community'),
  join(process.cwd(), 'src/modules/profile'),
];

describe('Regression: Legacy Field Usage - All Modules', () => {
  it('should not use city/neighborhood filters in any module', () => {
    const violations: string[] = [];
    
    for (const basePath of PATHS_TO_CHECK) {
      const files = readTsFiles(basePath);
      
      for (const file of files) {
        // Ignorar services principais (podem ter fallback temporário)
        if (file.path.includes('PostService.ts')) continue;
        
        const lines = file.content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes('.eq(\'city\'') || line.includes('.eq("city"')) {
            violations.push(`${file.path}:${i + 1}: Uses .eq('city') filter`);
          }
          if (line.includes('.eq(\'neighborhood\'') || line.includes('.eq("neighborhood"')) {
            violations.push(`${file.path}:${i + 1}: Uses .eq('neighborhood') filter`);
          }
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Legacy territorial filters found in ${violations.length} locations!\n\n` +
        violations.join('\n')
      );
    }
  });
});

describe('Regression: Component Rendering - Real Components', () => {
  it('should not render neighborhood without fallback in community components', () => {
    const communityPath = join(process.cwd(), 'src/modules/community');
    const files = readTsFiles(communityPath).filter(f => f.path.endsWith('.tsx'));
    const violations: string[] = [];
    
    for (const file of files) {
      const lines = file.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Procurar renderização de neighborhood sem fallback
        if (line.includes('{post.neighborhood}') || line.includes('{post?.neighborhood}')) {
          // Verificar se tem fallback nas linhas próximas
          const context = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
          if (!context.includes('??') && !context.includes('||') && !context.includes('location?.name')) {
            violations.push(`${file.path}:${i + 1}: Renders neighborhood without fallback`);
          }
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Direct neighborhood rendering found!\n\n` +
        violations.join('\n')
      );
    }
  });
});
```

**Impacto**:
- Cobertura mais ampla
- Detecta problemas em todos os módulos
- Garante consistência em toda a aplicação

---

### 6. Validar textSearch no Banco Antes de Adotar ✅

**Problema no Plano Original**:
```typescript
// ❌ ERRADO: Assumir que textSearch funciona
const { data, error } = await supabase
  .from('posts')
  .select(SELECT_PUBLIC)
  .textSearch('content', searchTerm)  // ❌ Pode não existir
```

**Correção**:
```sql
-- PASSO 1: Validar se índice existe
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'posts'
  AND indexdef LIKE '%gin%'
  AND indexdef LIKE '%content%';

-- PASSO 2: Se não existir, criar
CREATE INDEX IF NOT EXISTS idx_posts_content_search 
  ON posts 
  USING gin(to_tsvector('portuguese', content));

-- PASSO 3: Testar performance
EXPLAIN ANALYZE
SELECT *
FROM posts
WHERE to_tsvector('portuguese', content) @@ to_tsquery('portuguese', 'teste')
LIMIT 20;

-- Deve usar idx_posts_content_search
-- Execution time deve ser < 50ms
```

**Código TypeScript**:
```typescript
// Usar query manual se textSearch não estiver disponível
static async searchPosts(
  locationIds: string[],
  searchTerm: string,
  limit: number = 20
): Promise<Post[]> {
  if (!locationIds.length || !searchTerm) return [];

  try {
    const expandedIds = await this.expandLocationIds(locationIds);

    // Tentar usar textSearch
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(SELECT_PUBLIC)
        .in('location_id', expandedIds)
        .eq('is_published', true)
        .textSearch('content', searchTerm)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) return data as Post[];
    } catch (textSearchError) {
      // Fallback para ILIKE se textSearch não funcionar
      console.warn('[PostQueryService.searchPosts] textSearch not available, using ILIKE', {
        error: textSearchError,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback: usar ILIKE
    const { data, error } = await supabase
      .from('posts')
      .select(SELECT_PUBLIC)
      .in('location_id', expandedIds)
      .eq('is_published', true)
      .ilike('content', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error('[PostQueryService.searchPosts] Search error', {
        error: error?.message,
        searchTerm,
        timestamp: new Date().toISOString(),
      });
      return [];
    }
    
    return data as Post[];
  } catch (err) {
    console.error('[PostQueryService.searchPosts] Unexpected error', {
      error: err instanceof Error ? err.message : String(err),
      searchTerm,
      timestamp: new Date().toISOString(),
    });
    return [];
  }
}
```

**Impacto**:
- Validação antes de usar
- Fallback se não disponível
- Não quebra funcionalidade

---

### 7. Não Esconder Falhas Silenciosamente - Logs Estruturados ✅

**Problema no Plano Original**:
```typescript
// ❌ ERRADO: Falhas silenciosas
try {
  const { data, error } = await query;
  if (error || !data) return [];  // ❌ Sem log
  return data;
} catch {
  return [];  // ❌ Sem log
}
```

**Correção**:
```typescript
// ✅ CORRETO: Logs estruturados

// Criar logger estruturado
class StructuredLogger {
  static error(service: string, method: string, message: string, context: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
      stack: context.error?.stack,
    }));
  }

  static warn(service: string, method: string, message: string, context: any) {
    console.warn(JSON.stringify({
      level: 'WARN',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }

  static info(service: string, method: string, message: string, context: any) {
    console.info(JSON.stringify({
      level: 'INFO',
      service,
      method,
      message,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}

// Usar em PostQueryService
static async listPublished(filters: PostQueryFilters): Promise<Post[]> {
  if (!filters.location_ids.length) {
    StructuredLogger.warn('PostQueryService', 'listPublished', 'Empty location_ids', { filters });
    return [];
  }

  try {
    let query = supabase
      .from('posts')
      .select(SELECT_PUBLIC)
      .in('location_id', filters.location_ids)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) {
      StructuredLogger.error('PostQueryService', 'listPublished', 'Query error', {
        error: error.message,
        code: error.code,
        filters,
      });
      return [];
    }
    
    if (!data) {
      StructuredLogger.warn('PostQueryService', 'listPublished', 'No data returned', { filters });
      return [];
    }
    
    StructuredLogger.info('PostQueryService', 'listPublished', 'Success', {
      count: data.length,
      filters,
    });
    
    return data as Post[];
  } catch (err) {
    StructuredLogger.error('PostQueryService', 'listPublished', 'Unexpected error', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      filters,
    });
    return [];
  }
}
```

**Benefícios**:
- Logs estruturados em JSON
- Fácil de parsear e analisar
- Rastreabilidade completa
- Debugging facilitado

---

## RESUMO DAS CORREÇÕES

| # | Correção | Status | Impacto |
|---|----------|--------|---------|
| 1 | NOT NULL = 100% cobertura | ✅ Corrigido | Alto |
| 2 | MATCH_AMBIGUO → revisão manual | ✅ Corrigido | Alto |
| 3 | SEM_MATCH depende Fase 0 | ✅ Corrigido | Médio |
| 4 | Expansão inclui cidade + distritos | ✅ Corrigido | Médio |
| 5 | Testes cobrem todos os módulos | ✅ Corrigido | Alto |
| 6 | Validar textSearch antes | ✅ Corrigido | Médio |
| 7 | Logs estruturados | ✅ Corrigido | Alto |

---

## PRÓXIMOS PASSOS

1. ✅ Atualizar SPRINT2_POSTS_PLANO_V2.md com correções
2. ⏳ Aguardar aprovação das decisões da Fase 0
3. ⏳ Completar auditoria de componentes
4. ⏳ Aguardar aprovação final para iniciar Fase 1

---

**Status**: ✅ Correções Bloqueantes Documentadas  
**Aguardando**: Aprovação para atualizar plano e prosseguir
