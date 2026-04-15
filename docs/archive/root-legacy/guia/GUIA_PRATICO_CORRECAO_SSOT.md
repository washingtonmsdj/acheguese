# 🛠️ GUIA PRÁTICO - Correção SSOT Territorial

**Objetivo:** Guia passo-a-passo para corrigir cada módulo  
**Baseado em:** Caso de sucesso `tourist_points`

---

## 📋 CHECKLIST POR MÓDULO

Para cada módulo, seguir esta ordem:

1. [ ] Criar migração SQL
2. [ ] Aplicar migração no banco
3. [ ] Atualizar tipos TypeScript
4. [ ] Atualizar Service com validações
5. [ ] Atualizar formulários (UI)
6. [ ] Testar manualmente
7. [ ] Verificar diagnósticos
8. [ ] Documentar mudanças

---

## 🔧 PASSO 1 - Migração SQL

### Template de Migração

```sql
-- ============================================
-- Migração: Enforce SSOT Territorial em [TABELA]
-- Data: YYYY-MM-DD
-- Descrição: Torna location_id obrigatório
-- ============================================

DO $$ 
BEGIN
  -- 1. Adicionar coluna location_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = '[TABELA]' 
    AND column_name = 'location_id'
  ) THEN
    ALTER TABLE [TABELA] ADD COLUMN location_id UUID;
    RAISE NOTICE 'Coluna location_id adicionada.';
  END IF;

  -- 2. Migrar dados existentes (exemplo: Salvador/Barra)
  -- IMPORTANTE: Ajustar lógica conforme dados reais
  UPDATE [TABELA]
  SET location_id = (
    SELECT id FROM locations 
    WHERE type = 'district' 
    AND name ILIKE neighborhood
    AND parent_id = (
      SELECT id FROM locations 
      WHERE type = 'city' 
      AND name ILIKE city
    )
    LIMIT 1
  )
  WHERE location_id IS NULL
  AND neighborhood IS NOT NULL
  AND city IS NOT NULL;

  -- 3. Para registros sem match, usar cidade como fallback
  UPDATE [TABELA]
  SET location_id = (
    SELECT id FROM locations 
    WHERE type = 'city' 
    AND name ILIKE city
    LIMIT 1
  )
  WHERE location_id IS NULL
  AND city IS NOT NULL;

  -- 4. Adicionar foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = '[TABELA]_location_id_fkey'
  ) THEN
    ALTER TABLE [TABELA]
    ADD CONSTRAINT [TABELA]_location_id_fkey
    FOREIGN KEY (location_id)
    REFERENCES locations(id)
    ON DELETE RESTRICT;
    
    RAISE NOTICE 'Foreign key criada.';
  END IF;

  -- 5. Criar índice
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_[TABELA]_location_id'
  ) THEN
    CREATE INDEX idx_[TABELA]_location_id ON [TABELA](location_id);
    RAISE NOTICE 'Índice criado.';
  END IF;

  -- 6. Tornar NOT NULL (após migração de dados)
  -- DESCOMENTAR após verificar que todos os registros têm location_id
  -- ALTER TABLE [TABELA] ALTER COLUMN location_id SET NOT NULL;

  -- 7. Adicionar comentários
  COMMENT ON COLUMN [TABELA].location_id IS 'FK obrigatório para locations. SSOT territorial.';
  COMMENT ON COLUMN [TABELA].neighborhood IS 'DEPRECATED: Use location.name via join.';
  COMMENT ON COLUMN [TABELA].city IS 'DEPRECATED: Use location via join.';

END $$;

-- Verificação
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id
FROM [TABELA];
```

### Aplicar Migração

```bash
npx supabase db query --linked -f supabase/migrations/[ARQUIVO].sql
```

---

## 🎨 PASSO 2 - Tipos TypeScript

### Antes (Incorreto)
```typescript
export interface MyEntity {
  id: string;
  name: string;
  neighborhood: string;  // ❌ String solta
  city: string;          // ❌ String solta
  state: string;         // ❌ String solta
}
```

### Depois (Correto)
```typescript
export interface MyEntity {
  id: string;
  name: string;
  
  // ── SSOT Territorial ──────────────────────────────────
  /** FK obrigatório para locations (type=district) */
  location_id: string;
  
  /** Relação carregada via join com locations */
  location?: {
    id: string;
    name: string;
    full_name: string;
    geographic_path: string;
    type: string;
  } | null;
  
  // ── Legado (mantido para compatibilidade) ────────────
  /** @deprecated Use location.name */
  neighborhood?: string | null;
  /** @deprecated Use location via join */
  city?: string | null;
  /** @deprecated Use location via join */
  state?: string | null;
}

export interface CreateMyEntityInput {
  name: string;
  /** SSOT territorial — obrigatório */
  location_id: string;
  // Não aceitar campos legados
}
```

---

## 🔧 PASSO 3 - Service com Validações

### Antes (Incorreto)
```typescript
async create(input: CreateInput): Promise<Entity> {
  const { data, error } = await supabase
    .from('my_table')
    .insert({
      name: input.name,
      neighborhood: input.neighborhood,  // ❌ String solta
      city: input.city,                  // ❌ String solta
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

### Depois (Correto)
```typescript
async create(input: CreateInput): Promise<Entity> {
  // ✅ VALIDAÇÃO 1: location_id obrigatório
  if (!input.location_id) {
    throw new Error('location_id é obrigatório. Use o seletor territorial.');
  }

  // ✅ VALIDAÇÃO 2: Rejeitar campos legados
  if (input.neighborhood || input.city) {
    throw new Error('Campos legados não são mais aceitos. Use location_id.');
  }

  // ✅ VALIDAÇÃO 3: Verificar que location_id existe
  const { data: locationExists, error: locationError } = await supabase
    .from('locations')
    .select('id')
    .eq('id', input.location_id)
    .eq('type', 'district')
    .eq('status', 'active')
    .single();

  if (locationError || !locationExists) {
    throw new Error(`location_id inválido: ${input.location_id} não existe ou não é um bairro ativo.`);
  }

  // ✅ INSERIR com location_id
  const { data, error } = await supabase
    .from('my_table')
    .insert({
      name: input.name,
      location_id: input.location_id,
    })
    .select(`
      *,
      location:locations!location_id(
        id, name, full_name, geographic_path, type
      )
    `)
    .single();
    
  if (error) throw error;
  return data as Entity;
}
```

### Filtros (Antes - Incorreto)
```typescript
async list(filters: Filters): Promise<Entity[]> {
  let query = supabase.from('my_table').select('*');
  
  // ❌ Filtro por string
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.neighborhood) {
    query = query.eq('neighborhood', filters.neighborhood);
  }
  
  const { data } = await query;
  return data || [];
}
```

### Filtros (Depois - Correto)
```typescript
async list(
  territoryFilter?: TerritoryFilter
): Promise<Entity[]> {
  let query = supabase
    .from('my_table')
    .select(`
      *,
      location:locations!location_id(
        id, name, full_name, geographic_path, type
      )
    `);
  
  // ✅ Filtro territorial canônico
  if (territoryFilter) {
    const { applyTerritoryFilter } = await import('@/core/location/utils/applyTerritoryFilter');
    query = applyTerritoryFilter(query, territoryFilter);
  }
  
  const { data } = await query;
  return data || [];
}
```

---

## 🎨 PASSO 4 - Formulários (UI)

### Antes (Incorreto)
```tsx
function MyForm() {
  return (
    <form onSubmit={handleSubmit}>
      <Label htmlFor="neighborhood">Bairro</Label>
      <Input 
        id="neighborhood" 
        name="neighborhood"  // ❌ Texto livre
      />
      
      <Label htmlFor="city">Cidade</Label>
      <Input 
        id="city" 
        name="city"  // ❌ Texto livre
      />
      
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

### Depois (Correto)
```tsx
import { TerritorialSelector } from '@/shared/components/TerritorialSelector';

function MyForm() {
  const [locationData, setLocationData] = useState<any>(null);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationData) {
      toast({ 
        title: 'Erro', 
        description: 'Selecione o território',
        variant: 'destructive' 
      });
      return;
    }
    
    const payload = {
      name: formData.name,
      location_id: locationData.neighborhoodId,  // ✅ UUID válido
    };
    
    onSubmit(payload);
  };
  
  return (
    <form onSubmit={handleFormSubmit}>
      <Label htmlFor="name">Nome</Label>
      <Input id="name" name="name" required />
      
      {/* ✅ Seletor territorial hierárquico */}
      <TerritorialSelector
        onLocationChange={(locationId, data) => setLocationData(data)}
        allowCityOnly={false}
      />
      
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

---

## ✅ PASSO 5 - Verificação

### Verificar Migração
```sql
-- Verificar cobertura
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  ROUND(COUNT(location_id)::NUMERIC / COUNT(*) * 100, 2) as cobertura_percent
FROM [TABELA];

-- Verificar integridade
SELECT COUNT(*) as location_id_invalidos
FROM [TABELA] t
WHERE t.location_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM locations l
  WHERE l.id = t.location_id
);
```

### Verificar TypeScript
```bash
npm run type-check
```

### Verificar Diagnósticos
```typescript
// No código TypeScript
getDiagnostics({ paths: ['src/path/to/file.ts'] })
```

---

## 📊 EXEMPLO COMPLETO - Profiles

### 1. Migração SQL
```sql
-- supabase/migrations/20260406000001_enforce_profiles_ssot.sql
DO $$ 
BEGIN
  -- Migrar dados de Salvador
  UPDATE profiles
  SET location_id = (
    SELECT id FROM locations 
    WHERE type = 'district' 
    AND name ILIKE neighborhood
    AND parent_id = (
      SELECT id FROM locations 
      WHERE type = 'city' 
      AND name = 'Salvador'
    )
    LIMIT 1
  )
  WHERE location_id IS NULL
  AND city ILIKE 'salvador'
  AND neighborhood IS NOT NULL;

  -- Foreign key
  ALTER TABLE profiles
  ADD CONSTRAINT profiles_location_id_fkey
  FOREIGN KEY (location_id)
  REFERENCES locations(id)
  ON DELETE RESTRICT;

  -- Índice
  CREATE INDEX idx_profiles_location_id ON profiles(location_id);

  -- Tornar NOT NULL
  ALTER TABLE profiles ALTER COLUMN location_id SET NOT NULL;
END $$;
```

### 2. Tipos
```typescript
// src/core/profiles/types/Profile.ts
export interface Profile {
  id: string;
  name: string;
  location_id: string;  // ✅ Obrigatório
  location?: {
    id: string;
    name: string;
    full_name: string;
  };
  /** @deprecated */
  neighborhood?: never;
  /** @deprecated */
  city?: never;
}
```

### 3. Service
```typescript
// src/core/profiles/services/ProfileService.ts
async updateProfile(id: string, input: UpdateProfileInput) {
  if (!input.location_id) {
    throw new Error('location_id é obrigatório');
  }

  // Validar location_id
  const { data: loc } = await supabase
    .from('locations')
    .select('id')
    .eq('id', input.location_id)
    .single();

  if (!loc) {
    throw new Error('location_id inválido');
  }

  // Atualizar
  const { data, error } = await supabase
    .from('profiles')
    .update({ location_id: input.location_id })
    .eq('id', id)
    .select(`*, location:locations!location_id(*)`)
    .single();

  if (error) throw error;
  return data;
}
```

### 4. Formulário
```tsx
// src/modules/profile/components/EditProfileForm.tsx
<TerritorialSelector
  initialLocationId={profile.location_id}
  onLocationChange={(id, data) => setLocationData(data)}
/>
```

---

## 🎯 DICAS E BOAS PRÁTICAS

### ✅ DO
- Sempre validar `location_id` em 3 camadas (UI, Service, Banco)
- Usar `TerritorialSelector` em TODOS os formulários
- Carregar `location` via join para exibição
- Documentar campos legados como `@deprecated`
- Criar índices em `location_id`
- Testar com dados reais antes de tornar NOT NULL

### ❌ DON'T
- Nunca aceitar `neighborhood`, `city`, `state` como string
- Nunca fazer `.eq('city', ...)` em queries
- Nunca usar `<Input>` para campos territoriais
- Nunca assumir que location_id existe sem validar
- Nunca remover colunas legadas antes de migrar dados

---

## 🔍 TROUBLESHOOTING

### Erro: "location_id inválido"
**Causa:** UUID não existe na tabela `locations`  
**Solução:** Verificar se o bairro está cadastrado em `locations`

### Erro: "column location_id does not exist"
**Causa:** Migração não foi aplicada  
**Solução:** Executar migração SQL

### Erro: "cannot use subquery in check constraint"
**Causa:** PostgreSQL não permite subqueries em CHECK  
**Solução:** Usar foreign key ao invés de CHECK

### Erro: "column reference is ambiguous"
**Causa:** Nome de coluna conflita com variável PL/pgSQL  
**Solução:** Qualificar com nome da tabela: `table_name.column_name`

---

**Próximo Passo:** Escolher um módulo da Fase 1 e seguir este guia passo-a-passo.
