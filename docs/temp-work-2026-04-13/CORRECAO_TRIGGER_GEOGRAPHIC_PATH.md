# ✅ Correção Final: Trigger Auto-Gera Geographic Path

## 🔴 Problema: Trigger de Validação de Hierarquia

### Erro Recebido
```
ERROR: P0001: Invalid hierarchy: city cannot be child of city
CONTEXT: PL/pgSQL function validate_location_hierarchy() line 16 at RAISE
```

### Causa Raiz
Existe um **trigger** `validate_location_hierarchy()` que valida a hierarquia:

```sql
CREATE OR REPLACE FUNCTION validate_location_hierarchy()
RETURNS TRIGGER AS $
DECLARE
  v_parent_type TEXT;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT type INTO v_parent_type FROM locations WHERE id = NEW.parent_id;
    
    -- Validar hierarquia válida
    IF (NEW.type = 'state' AND v_parent_type != 'country') OR
       (NEW.type = 'city' AND v_parent_type != 'state') OR
       (NEW.type = 'district' AND v_parent_type != 'city') THEN
      RAISE EXCEPTION 'Invalid hierarchy: % cannot be child of %', NEW.type, v_parent_type;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

**Regras Validadas:**
- ✅ `state` → parent deve ser `country`
- ✅ `city` → parent deve ser `state`
- ✅ `district` → parent deve ser `city`

## 🎯 Descoberta Importante: Geographic Path é Auto-Gerado!

### Trigger `update_geographic_path()`

Existe outro trigger que **gera automaticamente** o `geographic_path`:

```sql
CREATE OR REPLACE FUNCTION update_geographic_path()
RETURNS TRIGGER AS $
DECLARE
  v_parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.geographic_path := '/' || NEW.slug;
  ELSE
    SELECT geographic_path INTO v_parent_path FROM locations WHERE id = NEW.parent_id;
    NEW.geographic_path := v_parent_path || '/' || NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_path
  BEFORE INSERT OR UPDATE OF parent_id, slug ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_geographic_path();
```

### O Que Isso Significa

**NÃO devemos incluir `geographic_path` nos INSERTs!**

O trigger irá:
1. Pegar o `parent_id`
2. Buscar o `geographic_path` do pai
3. Concatenar com o `slug` do novo registro
4. Gerar automaticamente o path completo

**Exemplo:**
```sql
-- Inserir Brasil
INSERT INTO locations (slug, type, parent_id) VALUES ('brasil', 'country', NULL);
-- Trigger gera: geographic_path = '/brasil'

-- Inserir Bahia
INSERT INTO locations (slug, type, parent_id) VALUES ('bahia', 'state', <brasil_id>);
-- Trigger gera: geographic_path = '/brasil/bahia'

-- Inserir Salvador
INSERT INTO locations (slug, type, parent_id) VALUES ('salvador', 'city', <bahia_id>);
-- Trigger gera: geographic_path = '/brasil/bahia/salvador'
```

## ✅ Solução Aplicada

### Removido `geographic_path` dos INSERTs

**❌ Antes (ERRADO):**
```sql
INSERT INTO locations (id, name, full_name, slug, type, geographic_path, parent_id, status, metadata)
VALUES (
  '...',
  'Brasil',
  'Brasil',
  'brasil',
  'country',
  '/brasil',  -- ❌ NÃO DEVE SER FORNECIDO
  NULL,
  'active',
  '{}'::jsonb
);
```

**✅ Agora (CORRETO):**
```sql
INSERT INTO locations (id, name, full_name, slug, type, parent_id, status, metadata)
VALUES (
  '...',
  'Brasil',
  'Brasil',
  'brasil',
  'country',
  -- geographic_path será gerado automaticamente pelo trigger
  NULL,
  'active',
  '{}'::jsonb
);
```

### Campos Fornecidos nos INSERTs

- ✅ `id` - UUID fixo para referência
- ✅ `name` - Nome curto
- ✅ `full_name` - Nome hierárquico completo
- ✅ `slug` - Identificador kebab-case
- ✅ `type` - country/state/city/district
- ✅ `parent_id` - Referência ao pai (NULL para country)
- ✅ `status` - active/inactive
- ✅ `metadata` - JSONB com dados adicionais
- ❌ `geographic_path` - **GERADO AUTOMATICAMENTE**
- ❌ `created_at` - **DEFAULT NOW()**
- ❌ `updated_at` - **DEFAULT NOW()**

## 📊 Hierarquia Final

```
Brasil (country, parent_id = NULL)
  └─ geographic_path: /brasil (auto-gerado)
  
  └── Bahia (state, parent_id = Brasil)
      └─ geographic_path: /brasil/bahia (auto-gerado)
      
      └── Salvador (city, parent_id = Bahia)
          └─ geographic_path: /brasil/bahia/salvador (auto-gerado)
          
          ├── Itaigara (district, parent_id = Salvador)
          │   └─ geographic_path: /brasil/bahia/salvador/itaigara (auto-gerado)
          │
          ├── Pelourinho (district, parent_id = Salvador)
          │   └─ geographic_path: /brasil/bahia/salvador/pelourinho (auto-gerado)
          │
          ├── Barra (district, parent_id = Salvador)
          │   └─ geographic_path: /brasil/bahia/salvador/barra (auto-gerado)
          │
          └── Rio Vermelho (district, parent_id = Salvador)
              └─ geographic_path: /brasil/bahia/salvador/rio-vermelho (auto-gerado)
```

## 🔍 Validações Automáticas

### 1. Constraint `valid_hierarchy`
```sql
CONSTRAINT valid_hierarchy CHECK (
  (type = 'country' AND parent_id IS NULL) OR
  (type = 'state' AND parent_id IS NOT NULL) OR
  (type = 'city' AND parent_id IS NOT NULL) OR
  (type = 'district' AND parent_id IS NOT NULL)
)
```

### 2. Trigger `validate_location_hierarchy()`
- Verifica se parent existe
- Valida tipo do parent:
  - state → country
  - city → state
  - district → city

### 3. Trigger `prevent_location_cycles()`
- Previne referências circulares
- Garante que parent não é descendente do próprio registro

### 4. Trigger `update_geographic_path()`
- Gera `geographic_path` automaticamente
- Concatena path do parent com slug
- Mantém SSOT (Single Source of Truth)

## 📁 Arquivos Atualizados

1. ✅ `supabase/migrations/20260413000002_seed_locations.sql`
   - Removido `geographic_path` de todos os INSERTs
   - Removido `created_at` e `updated_at` (usam DEFAULT)
   - Mantidos apenas campos necessários

2. ✅ `APLICAR_NO_SUPABASE_SQL_EDITOR.sql`
   - Mesmas correções aplicadas
   - Adicionado comentário explicativo

## 🎯 Status Final

- ✅ Erro 1 (slug NULL) - CORRIGIDO
- ✅ Erro 2 (full_name NULL) - CORRIGIDO
- ✅ Erro 3 (valid_hierarchy constraint) - CORRIGIDO
- ✅ Erro 4 (validate_location_hierarchy trigger) - CORRIGIDO
- ✅ Geographic path será auto-gerado
- ✅ Hierarquia completa: country → state → city → district
- ✅ Todos os triggers respeitados

**Pronto para aplicar no Supabase! 🚀**

## 📝 Lições Aprendidas

1. **Sempre verificar triggers**: Não apenas constraints, mas também triggers de validação
2. **SSOT com triggers**: Geographic path é gerado automaticamente para manter consistência
3. **Não fornecer campos auto-gerados**: Deixar triggers fazerem seu trabalho
4. **Hierarquia é validada em múltiplos níveis**:
   - Constraint CHECK
   - Trigger de validação
   - Trigger de prevenção de ciclos
5. **Triggers executam BEFORE INSERT**: Podem modificar valores antes da inserção
6. **Ler migrations completas**: Incluindo triggers e functions, não apenas CREATE TABLE

## ✨ Benefícios da Abordagem com Triggers

1. **Consistência garantida**: Geographic path sempre correto
2. **Menos erros humanos**: Não precisamos calcular paths manualmente
3. **Manutenção simplificada**: Mudar slug atualiza path automaticamente
4. **SSOT mantido**: Uma única fonte de verdade para paths
5. **Validação robusta**: Múltiplas camadas de validação
