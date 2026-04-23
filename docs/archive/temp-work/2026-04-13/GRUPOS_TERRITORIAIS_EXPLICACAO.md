# 📍 Grupos Territoriais vs Hierarquia de Locations

## 🎯 Conceito

### Hierarquia de Locations (Geográfica)
```
Brasil (country)
└── Bahia (state)
    └── Salvador (city)
        ├── Nordeste de Amaralina (district)
        ├── Santa Cruz (district)
        ├── Chapada do Rio Vermelho (district)
        ├── Vale das Pedrinhas (district)
        ├── Itaigara (district)
        ├── Pelourinho (district)
        ├── Barra (district)
        └── Rio Vermelho (district)
```

**Hierarquia = Relação geográfica pai-filho**
- País contém estados
- Estado contém cidades
- Cidade contém bairros

### Grupos Territoriais (Agrupamento Lógico)
```
Complexo do Nordeste de Amaralina (grupo)
├── Nordeste de Amaralina (district)
├── Santa Cruz (district)
├── Chapada do Rio Vermelho (district)
└── Vale das Pedrinhas (district)
```

**Grupo = Agrupamento lógico de bairros**
- NÃO é hierarquia geográfica
- É uma entidade separada
- Agrupa bairros da mesma cidade
- Usado para fins operacionais/administrativos

## 📊 Schema

### Tabela: `territorial_groups`
```sql
CREATE TABLE territorial_groups (
  id             UUID PRIMARY KEY,
  slug           TEXT NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  anchor_city_id UUID NOT NULL REFERENCES locations(id),  -- Salvador
  status         TEXT NOT NULL DEFAULT 'active',
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (slug, anchor_city_id)
);
```

### Tabela: `territorial_group_members`
```sql
CREATE TABLE territorial_group_members (
  group_id    UUID NOT NULL REFERENCES territorial_groups(id),
  location_id UUID NOT NULL REFERENCES locations(id),  -- district
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (group_id, location_id)
);
```

## 🔍 Validações

### Constraint: Membros devem ser districts da cidade âncora
```sql
CREATE OR REPLACE FUNCTION check_territorial_group_member()
RETURNS TRIGGER AS $
DECLARE
  v_location_type   TEXT;
  v_location_parent UUID;
  v_anchor_city_id  UUID;
BEGIN
  -- Verificar se location é district
  SELECT type, parent_id INTO v_location_type, v_location_parent
  FROM locations WHERE id = NEW.location_id;
  
  IF v_location_type <> 'district' THEN
    RAISE EXCEPTION 'Location must be a district';
  END IF;
  
  -- Verificar se parent do district é a cidade âncora
  SELECT anchor_city_id INTO v_anchor_city_id
  FROM territorial_groups WHERE id = NEW.group_id;
  
  IF v_location_parent <> v_anchor_city_id THEN
    RAISE EXCEPTION 'District parent must match anchor_city_id';
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

## 📝 Exemplo: Complexo do Nordeste

### 1. Criar o Grupo
```sql
INSERT INTO territorial_groups (
  id,
  slug,
  name,
  description,
  anchor_city_id,
  status
)
VALUES (
  'fc322564-17cf-4de0-95f1-d78672750e8d',
  'complexo-do-nordeste-de-amaralina',
  'Complexo do Nordeste de Amaralina',
  'Agrupamento territorial dos bairros Nordeste de Amaralina, Santa Cruz, Chapada do Rio Vermelho e Vale das Pedrinhas.',
  '<salvador_id>',
  'active'
);
```

### 2. Adicionar Membros
```sql
INSERT INTO territorial_group_members (group_id, location_id)
VALUES
  ('<complexo_id>', '<nordeste_amaralina_id>'),
  ('<complexo_id>', '<santa_cruz_id>'),
  ('<complexo_id>', '<chapada_rio_vermelho_id>'),
  ('<complexo_id>', '<vale_das_pedrinhas_id>');
```

## 🎯 Para o Nosso Caso

### O Que Temos Agora
```sql
-- 7 locations na hierarquia
Brasil (country)
└── Bahia (state)
    └── Salvador (city)
        ├── Itaigara (district)
        ├── Pelourinho (district)
        ├── Barra (district)
        └── Rio Vermelho (district)
```

### O Que Falta (Se Necessário)

**Opção 1: Adicionar apenas os 4 bairros do Complexo**
```sql
-- Nordeste de Amaralina
INSERT INTO locations (name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  'Nordeste de Amaralina',
  'Nordeste de Amaralina, Salvador, Bahia, Brasil',
  'nordeste-de-amaralina',
  'district',
  '<salvador_id>',
  'active',
  '{}'::jsonb
);

-- Santa Cruz
-- Chapada do Rio Vermelho
-- Vale das Pedrinhas
```

**Opção 2: Criar o grupo depois**
```sql
-- Primeiro: Inserir os 4 bairros como locations (districts)
-- Depois: Criar o grupo territorial
-- Depois: Adicionar os 4 bairros como membros do grupo
```

## 🚀 Decisão

### Para Corrigir os Erros do Console AGORA

**NÃO precisamos criar grupos territoriais!**

Os erros do console são sobre:
1. ✅ Mock IDs - CORRIGIDO
2. ✅ Coordenadas null - CORRIGIDO
3. ✅ RPC functions - CORRIGIDO
4. ⏳ Locations não encontradas - CORRIGINDO

**Solução atual:**
- Inserir 7 locations básicas (Brasil → Bahia → Salvador → 4 bairros)
- Isso resolve os erros do console
- Grupos territoriais são **opcionais** e podem ser adicionados depois

### Para Adicionar Grupos Territoriais DEPOIS

Se no futuro precisar do "Complexo do Nordeste":

1. **Adicionar os 4 bairros faltantes** como locations (districts de Salvador)
2. **Criar o grupo** na tabela `territorial_groups`
3. **Adicionar membros** na tabela `territorial_group_members`

## 📋 Resumo

| Conceito | Tabela | Propósito | Obrigatório? |
|----------|--------|-----------|--------------|
| Hierarquia Geográfica | `locations` | País → Estado → Cidade → Bairro | ✅ SIM |
| Grupos Territoriais | `territorial_groups` | Agrupamento lógico de bairros | ❌ OPCIONAL |
| Membros do Grupo | `territorial_group_members` | Relação grupo ↔ bairros | ❌ OPCIONAL |

## ✅ Status Atual

**Para resolver os erros do console:**
- ✅ Inserir 7 locations básicas
- ❌ NÃO precisa criar grupos territoriais agora

**Grupos territoriais são uma feature adicional**, não relacionada aos erros do console!

## 📁 Migrations Existentes

Se quiser ver como criar grupos:
- `supabase/migrations/20260324000008_create_territorial_groups.sql` - Schema
- `supabase/migrations/20260324000009_seed_complexo_nordeste.sql` - Seed do Complexo

**Mas isso é para DEPOIS de resolver os erros do console!**
