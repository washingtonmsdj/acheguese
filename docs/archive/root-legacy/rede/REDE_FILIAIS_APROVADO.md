# ARQUITETURA REDE/MARCA + FILIAIS - APROVADO

## A. ARQUITETURA CONSOLIDADA

### Expandir business_data

Adicionar 4 campos:
- `parent_business_id UUID` - FK para marca central
- `business_role TEXT` - standalone | brand_hub | branch
- `is_headquarters BOOLEAN` - filial matriz
- `unit_name TEXT` - nome da unidade

### Semântica

**business_role**:
- `standalone` - Empresa independente (COM location_id)
- `brand_hub` - Marca institucional (SEM location_id)
- `branch` - Filial operacional (COM location_id)

**parent_business_id**:
- NULL para standalone e brand_hub
- NOT NULL para branch (aponta para brand_hub)

**is_headquarters**:
- true para filial matriz (apenas uma por marca)
- false para demais filiais

**unit_name**:
- Nome da unidade (ex: "Unidade Pituba")
- NULL para standalone e brand_hub

---

## B. REGRAS FINAIS DE SLUG E UNICIDADE

### Unicidade no Escopo Territorial

Slug único por bairro (location_id), não global.

### Nomenclatura

Slug simples sem sufixo territorial.

Slug composto APENAS quando duas empresas diferentes colidirem no mesmo bairro.

### Exemplos

**Mesma marca, bairros diferentes** (slug repete):
```
Pituba: slug = 'sabor-da-bahia', URL: /empresas/ba/salvador/pituba/sabor-da-bahia
Barra:  slug = 'sabor-da-bahia', URL: /empresas/ba/salvador/barra/sabor-da-bahia
```

**Marcas diferentes, mesmo bairro** (colisão):
```
Pituba: slug = 'sabor-da-bahia' (primeira)
Pituba: slug = 'sabor-da-bahia-gourmet' (segunda, desambiguação)
```

### Implementação

```sql
-- Slug único por bairro
CREATE UNIQUE INDEX idx_business_data_slug_per_location
  ON business_data(location_id, slug)
  WHERE business_role IN ('standalone', 'branch') 
    AND location_id IS NOT NULL
    AND status != 'deleted';

-- Slug único global para brand_hub
CREATE UNIQUE INDEX idx_business_data_brand_hub_slug
  ON business_data(slug)
  WHERE business_role = 'brand_hub'
    AND status != 'deleted';
```

---

## C. REGRAS FINAIS DE CONVERSÃO STANDALONE → REDE

### Estratégia: Preservar URL Existente

Unidade existente mantém slug e URL.
Marca central recebe slug novo.
ZERO redirects.

### Conversão

**Antes**:
```
Empresa standalone
slug = 'sabor-da-bahia'
location_id = <id_pituba>
URL: /empresas/ba/salvador/pituba/sabor-da-bahia
```

**Depois**:
```
Marca central (nova)
business_role = 'brand_hub'
slug = 'sabor-da-bahia-rede'
location_id = NULL
URL: /marcas/sabor-da-bahia-rede

Filial matriz (existente)
business_role = 'branch'
parent_business_id = <id_marca>
is_headquarters = true
slug = 'sabor-da-bahia' (INALTERADO)
location_id = <id_pituba> (INALTERADO)
URL: /empresas/ba/salvador/pituba/sabor-da-bahia (INALTERADA)
```

### Adicionar Segunda Unidade

Bairro diferente, slug pode repetir:
```
business_role = 'branch'
parent_business_id = <id_marca>
slug = 'sabor-da-bahia'
location_id = <id_barra>
URL: /empresas/ba/salvador/barra/sabor-da-bahia
```

---

## D. REGRAS FINAIS DE RLS E BLINDAGEM

### Blindagem brand_hub

brand_hub NÃO participa do fluxo territorial.

### RLS

```sql
-- Queries territoriais: apenas standalone e branch
CREATE POLICY "Territorial businesses public" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role IN ('standalone', 'branch')
  );

-- brand_hub: acesso dedicado
CREATE POLICY "Brand hubs by slug" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role = 'brand_hub'
  );

-- Owners gerenciam
CREATE POLICY "Owners manage business" 
  ON business_data FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

### Queries de Serviço

**Territorial** (BusinessService):
```typescript
.in('business_role', ['standalone', 'branch'])
```

**Marca** (BrandService):
```typescript
.eq('business_role', 'brand_hub')
```

---

## E. MIGRATION SQL FINAL

```sql
-- ============================================================================
-- MIGRATION: Suporte a Rede/Marca + Filiais
-- ============================================================================

-- 1. COLUNAS
ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  parent_business_id UUID REFERENCES business_data(profile_id) ON DELETE SET NULL;

ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  business_role TEXT NOT NULL DEFAULT 'standalone'
    CHECK (business_role IN ('standalone', 'brand_hub', 'branch'));

ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  is_headquarters BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE business_data ADD COLUMN IF NOT EXISTS
  unit_name TEXT;

-- 2. ÍNDICES
CREATE INDEX idx_business_data_parent
  ON business_data(parent_business_id) 
  WHERE parent_business_id IS NOT NULL;

CREATE INDEX idx_business_data_role
  ON business_data(business_role) 
  WHERE business_role != 'standalone';

CREATE INDEX idx_business_data_territorial
  ON business_data(location_id, status, business_role)
  WHERE business_role IN ('standalone', 'branch') 
    AND location_id IS NOT NULL;

-- 3. UNICIDADE DE SLUG
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS business_data_slug_key;

CREATE UNIQUE INDEX idx_business_data_slug_per_location
  ON business_data(location_id, slug)
  WHERE business_role IN ('standalone', 'branch') 
    AND location_id IS NOT NULL
    AND status != 'deleted';

CREATE UNIQUE INDEX idx_business_data_brand_hub_slug
  ON business_data(slug)
  WHERE business_role = 'brand_hub'
    AND status != 'deleted';

-- 4. CONSTRAINTS
ALTER TABLE business_data ADD CONSTRAINT check_brand_hub_no_parent
  CHECK (business_role != 'brand_hub' OR parent_business_id IS NULL);

ALTER TABLE business_data ADD CONSTRAINT check_branch_has_parent
  CHECK (business_role != 'branch' OR parent_business_id IS NOT NULL);

ALTER TABLE business_data ADD CONSTRAINT check_headquarters_is_branch
  CHECK (NOT is_headquarters OR business_role = 'branch');

ALTER TABLE business_data ADD CONSTRAINT check_branch_has_location
  CHECK (business_role != 'branch' OR location_id IS NOT NULL);

ALTER TABLE business_data ADD CONSTRAINT check_brand_hub_no_location
  CHECK (business_role != 'brand_hub' OR location_id IS NULL);

-- 5. TRIGGER: parent → brand_hub
CREATE OR REPLACE FUNCTION check_parent_is_brand_hub()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_business_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM business_data
      WHERE profile_id = NEW.parent_business_id
        AND business_role = 'brand_hub'
    ) THEN
      RAISE EXCEPTION 'parent_business_id deve apontar para brand_hub';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_parent_is_brand_hub
  BEFORE INSERT OR UPDATE ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION check_parent_is_brand_hub();

-- 6. UNIQUE: uma headquarters por marca
CREATE UNIQUE INDEX idx_business_data_unique_headquarters
  ON business_data(parent_business_id)
  WHERE is_headquarters = true AND business_role = 'branch';

-- 7. RLS
DROP POLICY IF EXISTS "Active businesses viewable" ON business_data;

CREATE POLICY "Territorial businesses public" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role IN ('standalone', 'branch')
  );

CREATE POLICY "Brand hubs by slug" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role = 'brand_hub'
  );

DROP POLICY IF EXISTS "Owners manage own business" ON business_data;

CREATE POLICY "Owners manage business" 
  ON business_data FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 8. FUNÇÃO AUXILIAR
CREATE OR REPLACE FUNCTION get_brand_branches(p_brand_id UUID)
RETURNS TABLE (
  profile_id UUID,
  business_name TEXT,
  unit_name TEXT,
  slug TEXT,
  location_id UUID,
  location_name TEXT,
  is_headquarters BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bd.profile_id,
    bd.business_name,
    bd.unit_name,
    bd.slug,
    bd.location_id,
    l.full_name,
    bd.is_headquarters
  FROM business_data bd
  LEFT JOIN locations l ON l.id = bd.location_id
  WHERE bd.parent_business_id = p_brand_id
    AND bd.business_role = 'branch'
    AND bd.status = 'active'
  ORDER BY bd.is_headquarters DESC, l.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. COMENTÁRIOS
COMMENT ON COLUMN business_data.parent_business_id IS 
  'FK para marca central (apenas branch)';

COMMENT ON COLUMN business_data.business_role IS 
  'standalone (COM location_id), brand_hub (SEM location_id), branch (COM location_id)';

COMMENT ON COLUMN business_data.is_headquarters IS 
  'Filial matriz (uma por marca)';

COMMENT ON COLUMN business_data.unit_name IS 
  'Nome da unidade';
```

---

## F. ROLLOUT FINAL

### FASE 1: Fundação (1h)
- Aplicar migration
- Empresas existentes ficam standalone
- Nenhuma URL muda

### FASE 2: Services (4h)
- Criar BrandService
- Atualizar BusinessService com filtro territorial
- Atualizar tipos TypeScript

### FASE 3: URLs e Páginas (8h)
- Criar rota /marcas/:slug
- Criar BrandDetailPage
- Adicionar navegação entre unidades

### FASE 4: Admin (12h)
- Wizard de conversão (preserva URL)
- Painel multi-unidade
- Criação de filiais

### FASE 5: Premium (3h)
- Limites por plano
- Validação em services

**TOTAL: 28 horas**

---

## RESUMO

**Slug**: Único por bairro, simples, sem sufixo territorial.

**Conversão**: Preserva URL existente, ZERO redirects.

**Blindagem**: brand_hub fora do fluxo territorial.

**RLS**: Políticas separadas para territorial e brand_hub.

**Migration**: Única, consolidada, pronta para aplicar.
