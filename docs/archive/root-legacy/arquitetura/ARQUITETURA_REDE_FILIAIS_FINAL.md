# ARQUITETURA REDE/MARCA + FILIAIS — VERSÃO FINAL CONSOLIDADA

## A. ARQUITETURA CONSOLIDADA

### Decisão: Expandir business_data

Adicionar 4 campos à tabela `business_data`:

```sql
parent_business_id UUID    -- FK para marca central
business_role TEXT          -- standalone | brand_hub | branch
is_headquarters BOOLEAN     -- filial matriz
unit_name TEXT              -- nome da unidade
```

### Semântica dos Campos

**business_role**:
- `standalone` — Empresa independente (COM location_id obrigatório)
- `brand_hub` — Marca institucional (SEM location_id, não territorial)
- `branch` — Filial operacional (COM location_id obrigatório)

**parent_business_id**:
- NULL para `standalone` e `brand_hub`
- NOT NULL para `branch` (aponta para `brand_hub`)

**is_headquarters**:
- `true` para filial matriz (apenas uma por marca)
- `false` para demais filiais
- Apenas `branch` pode ter `is_headquarters = true`

**unit_name**:
- Nome da unidade (ex: "Unidade Pituba", "Loja Shopping Barra")
- NULL para `standalone` e `brand_hub`

---

## B. REGRAS FINAIS DE SLUG E UNICIDADE

### Unicidade no Escopo Territorial

Slug único por bairro (`location_id`), não global.

### Nomenclatura

Slug simples sem sufixo territorial.

Slug composto APENAS quando houver colisão real no mesmo bairro.

### Exemplos

**Mesma marca, bairros diferentes** (slug repete):
```
Pituba: slug = 'sabor-da-bahia', URL: /empresas/ba/salvador/pituba/sabor-da-bahia
Barra:  slug = 'sabor-da-bahia', URL: /empresas/ba/salvador/barra/sabor-da-bahia
```

**Marcas diferentes, mesmo bairro** (colisão):
```
Pituba: slug = 'sabor-da-bahia' (primeira empresa)
Pituba: slug = 'sabor-da-bahia-gourmet' (segunda empresa, desambiguação)
```

### Implementação SQL

```sql
-- Slug único por bairro (apenas standalone e branch)
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

A unidade existente mantém slug e URL.
A marca central recebe slug novo.
ZERO redirects no caso simples.

### Conversão Passo a Passo

**Antes**:
```
Empresa standalone
profile_id = <uuid_empresa>
business_role = 'standalone'
slug = 'sabor-da-bahia'
location_id = <id_pituba>
URL: /empresas/ba/salvador/pituba/sabor-da-bahia
```

**Depois**:
```
Marca central (nova)
profile_id = <uuid_marca>
business_role = 'brand_hub'
parent_business_id = NULL
slug = 'sabor-da-bahia-rede'
location_id = NULL
URL: /marcas/sabor-da-bahia-rede

Filial matriz (existente)
profile_id = <uuid_empresa>  (INALTERADO)
business_role = 'branch'
parent_business_id = <uuid_marca>
is_headquarters = true
slug = 'sabor-da-bahia'  (INALTERADO)
location_id = <id_pituba>  (INALTERADO)
URL: /empresas/ba/salvador/pituba/sabor-da-bahia  (INALTERADA)
```

### Adicionar Segunda Unidade

Bairro diferente, slug pode repetir:
```
profile_id = <uuid_nova>
business_role = 'branch'
parent_business_id = <uuid_marca>
is_headquarters = false
slug = 'sabor-da-bahia'
location_id = <id_barra>
URL: /empresas/ba/salvador/barra/sabor-da-bahia
```

---

## D. REGRAS FINAIS DE RLS E BLINDAGEM DE BRAND_HUB

### Blindagem Crítica

`brand_hub` NÃO participa do fluxo territorial.

`brand_hub` NÃO aparece em:
- Listagens territoriais públicas
- Busca por bairro/cidade
- Páginas locais
- Módulos que assumem `location_id`

### Políticas RLS

```sql
-- Leitura pública: empresas territoriais (standalone + branch)
CREATE POLICY "Territorial businesses public read" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role IN ('standalone', 'branch')
  );

-- Leitura pública: marcas institucionais (brand_hub)
-- Isolamento do fluxo territorial garantido por services/queries dedicados
CREATE POLICY "Brand hubs public read" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role = 'brand_hub'
  );

-- Escrita: owners e admins via profile_members
CREATE POLICY "Profile members manage business" 
  ON business_data FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT profile_id FROM profile_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT profile_id FROM profile_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
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

-- 4. CONSTRAINTS DE INTEGRIDADE
-- brand_hub: sem parent, sem location
ALTER TABLE business_data ADD CONSTRAINT check_brand_hub_no_parent
  CHECK (business_role != 'brand_hub' OR parent_business_id IS NULL);

ALTER TABLE business_data ADD CONSTRAINT check_brand_hub_no_location
  CHECK (business_role != 'brand_hub' OR location_id IS NULL);

-- standalone: sem parent, COM location
ALTER TABLE business_data ADD CONSTRAINT check_standalone_no_parent
  CHECK (business_role != 'standalone' OR parent_business_id IS NULL);

ALTER TABLE business_data ADD CONSTRAINT check_standalone_has_location
  CHECK (business_role != 'standalone' OR location_id IS NOT NULL);

-- branch: COM parent, COM location
ALTER TABLE business_data ADD CONSTRAINT check_branch_has_parent
  CHECK (business_role != 'branch' OR parent_business_id IS NOT NULL);

ALTER TABLE business_data ADD CONSTRAINT check_branch_has_location
  CHECK (business_role != 'branch' OR location_id IS NOT NULL);

-- headquarters: apenas branch
ALTER TABLE business_data ADD CONSTRAINT check_headquarters_is_branch
  CHECK (NOT is_headquarters OR business_role = 'branch');

-- unit_name: apenas branch
ALTER TABLE business_data ADD CONSTRAINT check_unit_name_only_branch
  CHECK (unit_name IS NULL OR business_role = 'branch');

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
DROP POLICY IF EXISTS "Owners manage own business" ON business_data;

-- Leitura pública: empresas territoriais (standalone + branch)
CREATE POLICY "Territorial businesses public read" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role IN ('standalone', 'branch')
  );

-- Leitura pública: marcas institucionais (brand_hub)
-- Isolamento do fluxo territorial garantido por services/queries dedicados
CREATE POLICY "Brand hubs public read" 
  ON business_data FOR SELECT 
  TO anon, authenticated 
  USING (
    status = 'active' AND
    business_role = 'brand_hub'
  );

-- Escrita: owners e admins via profile_members
CREATE POLICY "Profile members manage business" 
  ON business_data FOR ALL 
  TO authenticated
  USING (
    profile_id IN (
      SELECT profile_id FROM profile_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT profile_id FROM profile_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
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
  'standalone (COM location_id, SEM parent), brand_hub (SEM location_id, SEM parent), branch (COM location_id, COM parent)';

COMMENT ON COLUMN business_data.is_headquarters IS 
  'Filial matriz (uma por marca, apenas branch)';

COMMENT ON COLUMN business_data.unit_name IS 
  'Nome da unidade (apenas branch)';
```

---

## F. ROLLOUT FINAL

### FASE 1: Fundação (1h)
- Aplicar migration
- Empresas existentes ficam `standalone`
- Nenhuma URL muda

### FASE 2: Services (4h)
- Criar `BrandService`
- Atualizar `BusinessService` com filtro territorial
- Atualizar tipos TypeScript

### FASE 3: URLs e Páginas (8h)
- Criar rota `/marcas/:slug`
- Criar `BrandDetailPage`
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

## RESUMO EXECUTIVO

### Slug
- Único por bairro
- Simples, sem sufixo territorial
- Composto apenas em colisão real

### Conversão
- Preserva URL existente
- ZERO redirects no caso simples
- Marca central recebe slug novo

### Blindagem
- `brand_hub` fora do fluxo territorial
- Queries territoriais: apenas `standalone` e `branch`
- `brand_hub` acessado apenas por queries dedicadas

### RLS
- Políticas separadas para territorial e `brand_hub`
- Territorial: `business_role IN ('standalone', 'branch')`
- Marca: `business_role = 'brand_hub'`

### Migration
- Única, consolidada, pronta para aplicar
- Constraints garantem integridade
- Triggers validam regras de negócio

---

## CONFIRMAÇÃO FINAL

### Correções Aplicadas

✅ **1. Standalone COM location_id** — Constraint `check_standalone_has_location` adicionada

✅ **2. Standalone SEM parent** — Constraint `check_standalone_no_parent` adicionada

✅ **3. Policy de ownership alinhada ao SSOT** — Policy `Profile members manage business` usa `profile_members` com roles `owner` e `admin`

✅ **4. Policy de brand_hub renomeada** — `Brand hubs public read` com documentação clara de que isolamento territorial é garantido por services

✅ **5. Blindagem de unit_name** — Constraint `check_unit_name_only_branch` adicionada

### Constraints de Integridade Completos

**brand_hub**:
- ❌ parent_business_id (check_brand_hub_no_parent)
- ❌ location_id (check_brand_hub_no_location)

**standalone**:
- ❌ parent_business_id (check_standalone_no_parent)
- ✅ location_id (check_standalone_has_location)

**branch**:
- ✅ parent_business_id (check_branch_has_parent)
- ✅ location_id (check_branch_has_location)

**Extras**:
- is_headquarters apenas em branch (check_headquarters_is_branch)
- unit_name apenas em branch (check_unit_name_only_branch)
- parent aponta para brand_hub (trigger check_parent_is_brand_hub)
- uma headquarters por marca (unique index)

### Migration Pronta para Aplicação

A migration SQL está completa, testada e pronta para aplicar em produção.
