# SMOKE TEST: Migration Rede/Filiais

Executar OBRIGATORIAMENTE em staging após aplicar migration.

---

## PRÉ-REQUISITOS

- Migration `20260331000002_create_network_branches.sql` aplicada
- Dados de teste criados (pelo menos 3 empresas standalone)
- Acesso ao Supabase Dashboard e aplicação frontend

---

## 1. LISTAGEM TERRITORIAL

### Objetivo
Verificar que apenas `standalone` e `branch` aparecem em listagens territoriais.

### Passos

1. Acessar `/empresas/ba/salvador/pituba`
2. Verificar que lista carrega
3. Verificar que empresas exibidas têm `business_role IN ('standalone', 'branch')`

### Query de Validação
```sql
SELECT 
  business_name,
  business_role,
  location_id,
  slug
FROM business_data
WHERE status = 'active'
  AND business_role IN ('standalone', 'branch')
  AND location_id = (SELECT id FROM locations WHERE slug = 'pituba')
LIMIT 10;
```

### Critério de Sucesso
✅ Listagem carrega sem erro  
✅ Apenas standalone e branch aparecem  
✅ Nenhum brand_hub vaza para listagem territorial

---

## 2. DETALHE BAIRRO + SLUG

### Objetivo
Verificar que URL territorial resolve corretamente.

### Passos

1. Escolher uma empresa da listagem
2. Acessar `/empresas/ba/salvador/pituba/:slug`
3. Verificar que página de detalhe carrega
4. Verificar que dados estão corretos

### Query de Validação
```sql
SELECT 
  bd.business_name,
  bd.business_role,
  bd.slug,
  l.full_name as bairro,
  l.geographic_path
FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug = 'nome-da-empresa'
  AND bd.status = 'active';
```

### Critério de Sucesso
✅ Página carrega sem erro  
✅ Dados corretos exibidos  
✅ URL territorial funciona

---

## 3. CONVERSÃO STANDALONE → REDE

### Objetivo
Verificar que conversão preserva URL existente.

### Passos

1. Escolher uma empresa standalone
2. Anotar URL atual: `/empresas/ba/salvador/pituba/empresa-teste`
3. Executar conversão:

```sql
-- 1. Criar brand_hub
INSERT INTO business_data (
  profile_id,
  business_name,
  business_role,
  slug,
  status,
  category
) VALUES (
  gen_random_uuid(),
  'Empresa Teste Rede',
  'brand_hub',
  'empresa-teste-rede',
  'active',
  'outros'
) RETURNING profile_id;

-- 2. Converter empresa para branch (usar profile_id do brand_hub)
UPDATE business_data
SET 
  business_role = 'branch',
  parent_business_id = '<uuid_brand_hub>',
  is_headquarters = true,
  unit_name = 'Unidade Pituba',
  updated_at = NOW()
WHERE profile_id = '<uuid_empresa_original>';
```

4. Verificar que URL original ainda funciona: `/empresas/ba/salvador/pituba/empresa-teste`
5. Verificar que brand_hub é acessível: `/marcas/empresa-teste-rede` (após implementar rota)

### Query de Validação
```sql
-- Verificar estrutura da rede
SELECT 
  bd.business_name,
  bd.business_role,
  bd.slug,
  bd.is_headquarters,
  bd.unit_name,
  parent.business_name as marca_central
FROM business_data bd
LEFT JOIN business_data parent ON parent.profile_id = bd.parent_business_id
WHERE bd.profile_id = '<uuid_empresa_original>';
```

### Critério de Sucesso
✅ URL original permanece inalterada  
✅ Empresa agora é `branch`  
✅ `parent_business_id` aponta para `brand_hub`  
✅ `is_headquarters = true`  
✅ ZERO redirects necessários

---

## 4. CRIAÇÃO DE BRANCH

### Objetivo
Verificar que nova filial pode ser criada e que mesmo slug em bairros diferentes funciona.

### Passos

1. Usar brand_hub criado no teste anterior
2. Criar nova branch em bairro diferente COM MESMO SLUG:

```sql
INSERT INTO business_data (
  profile_id,
  business_name,
  business_role,
  parent_business_id,
  is_headquarters,
  unit_name,
  slug,
  location_id,
  status,
  category
) VALUES (
  gen_random_uuid(),
  'Empresa Teste',
  'branch',
  '<uuid_brand_hub>',
  false,
  'Unidade Barra',
  'empresa-teste',  -- MESMO SLUG, bairro diferente
  (SELECT id FROM locations WHERE slug = 'barra'),
  'active',
  'outros'
);
```

3. Verificar que ambas as branches são acessíveis:
   - Pituba: `/empresas/ba/salvador/pituba/empresa-teste`
   - Barra: `/empresas/ba/salvador/barra/empresa-teste`

4. **CASO CRÍTICO**: Verificar que não há colisão:
   - Acessar URL de Pituba → deve carregar empresa de Pituba
   - Acessar URL de Barra → deve carregar empresa de Barra
   - Listagem de Pituba → deve mostrar apenas empresa de Pituba
   - Listagem de Barra → deve mostrar apenas empresa de Barra

### Query de Validação
```sql
-- Listar todas as branches da marca
SELECT * FROM get_brand_branches('<uuid_brand_hub>');

-- CASO CRÍTICO: Verificar que mesmo slug em bairros diferentes coexiste
SELECT 
  bd.business_name,
  bd.slug,
  l.full_name as bairro,
  l.geographic_path,
  bd.business_role
FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug = 'empresa-teste'
  AND bd.status = 'active'
ORDER BY l.full_name;
-- Esperado: 2 linhas (Barra e Pituba)

-- Verificar resolução por bairro + slug
SELECT 
  bd.business_name,
  bd.slug,
  l.full_name as bairro
FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug = 'empresa-teste'
  AND l.slug = 'pituba'
  AND bd.status = 'active';
-- Esperado: 1 linha (apenas Pituba)

SELECT 
  bd.business_name,
  bd.slug,
  l.full_name as bairro
FROM business_data bd
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug = 'empresa-teste'
  AND l.slug = 'barra'
  AND bd.status = 'active';
-- Esperado: 1 linha (apenas Barra)
```

### Critério de Sucesso
✅ Branch criada sem erro  
✅ Mesmo slug em bairros diferentes funciona  
✅ Função `get_brand_branches` retorna ambas as unidades  
✅ URLs territoriais funcionam para ambas  
✅ **CRÍTICO**: Resolução por bairro + slug não colide  
✅ **CRÍTICO**: Listagem territorial filtra corretamente por bairro  
✅ **CRÍTICO**: Detalhe público resolve corretamente por bairro + slug

---

## 5. PÁGINA /marcas/:slug

### Objetivo
Verificar que brand_hub é acessível via rota dedicada.

### Passos

1. Implementar rota `/marcas/:slug` (se ainda não implementada)
2. Acessar `/marcas/empresa-teste-rede`
3. Verificar que página carrega
4. Verificar que lista todas as branches

### Query de Validação
```sql
-- Buscar brand_hub por slug
SELECT 
  profile_id,
  business_name,
  business_role,
  slug,
  location_id
FROM business_data
WHERE slug = 'empresa-teste-rede'
  AND business_role = 'brand_hub'
  AND status = 'active';

-- Listar branches
SELECT * FROM get_brand_branches('<uuid_brand_hub>');
```

### Critério de Sucesso
✅ Página carrega sem erro  
✅ brand_hub acessível via slug  
✅ Lista todas as branches  
✅ Links para branches funcionam

---

## 6. TESTE DE POLICIES

### Objetivo
Verificar que policies RLS funcionam corretamente.

### Passos

1. Criar usuário de teste
2. Adicionar como admin via profile_members:

```sql
INSERT INTO profile_members (profile_id, user_id, role)
VALUES ('<uuid_empresa>', '<uuid_user>', 'admin');
```

3. Fazer login com usuário de teste
4. Tentar editar empresa
5. Verificar que edição funciona

### Query de Validação
```sql
-- Verificar permissões do usuário
SELECT 
  bd.business_name,
  pm.role,
  pm.user_id
FROM business_data bd
JOIN profile_members pm ON pm.profile_id = bd.profile_id
WHERE pm.user_id = '<uuid_user>';
```

### Critério de Sucesso
✅ Admin pode editar empresa  
✅ Não-admin não pode editar  
✅ Policy "Profile members manage business" funciona

---

## 7. TESTE DE CONSTRAINTS

### Objetivo
Verificar que constraints impedem dados inválidos.

### Passos

Tentar criar dados inválidos e verificar que falham:

```sql
-- 1. Standalone sem location_id (deve falhar)
INSERT INTO business_data (
  profile_id, business_name, business_role, slug, status, category
) VALUES (
  gen_random_uuid(), 'Teste Inválido', 'standalone', 'teste-invalido', 'active', 'outros'
);
-- Esperado: ERROR - check_standalone_has_location

-- 2. Standalone com parent (deve falhar)
INSERT INTO business_data (
  profile_id, business_name, business_role, parent_business_id, location_id, slug, status, category
) VALUES (
  gen_random_uuid(), 'Teste Inválido', 'standalone', '<uuid_qualquer>', '<uuid_location>', 'teste-invalido', 'active', 'outros'
);
-- Esperado: ERROR - check_standalone_no_parent

-- 3. Branch sem parent (deve falhar)
INSERT INTO business_data (
  profile_id, business_name, business_role, location_id, slug, status, category
) VALUES (
  gen_random_uuid(), 'Teste Inválido', 'branch', '<uuid_location>', 'teste-invalido', 'active', 'outros'
);
-- Esperado: ERROR - check_branch_has_parent

-- 4. brand_hub com location_id (deve falhar)
INSERT INTO business_data (
  profile_id, business_name, business_role, location_id, slug, status, category
) VALUES (
  gen_random_uuid(), 'Teste Inválido', 'brand_hub', '<uuid_location>', 'teste-invalido', 'active', 'outros'
);
-- Esperado: ERROR - check_brand_hub_no_location

-- 5. Duas headquarters na mesma marca (deve falhar)
INSERT INTO business_data (
  profile_id, business_name, business_role, parent_business_id, is_headquarters, location_id, slug, status, category
) VALUES (
  gen_random_uuid(), 'Teste Inválido', 'branch', '<uuid_brand_hub>', true, '<uuid_location>', 'teste-invalido-2', 'active', 'outros'
);
-- Esperado: ERROR - idx_business_data_unique_headquarters
```

### Critério de Sucesso
✅ Todos os inserts inválidos falham  
✅ Mensagens de erro corretas  
✅ Constraints funcionam

---

## RESUMO

Após executar todos os testes:

- [ ] 1. Listagem territorial
- [ ] 2. Detalhe bairro + slug
- [ ] 3. Conversão standalone → rede
- [ ] 4. Criação de branch
- [ ] 5. Página /marcas/:slug
- [ ] 6. Teste de policies
- [ ] 7. Teste de constraints

### Critério de Aprovação

✅ **TODOS os testes passaram** → Migration aprovada para produção

❌ **Algum teste falhou** → Corrigir e re-testar

---

## ROLLBACK (se necessário)

Se algo der errado, executar:

```sql
-- Reverter migration
DROP TRIGGER IF EXISTS trigger_check_parent_is_brand_hub ON business_data;
DROP FUNCTION IF EXISTS check_parent_is_brand_hub();
DROP FUNCTION IF EXISTS get_brand_branches(UUID);

DROP POLICY IF EXISTS "Territorial businesses public read" ON business_data;
DROP POLICY IF EXISTS "Brand hubs public read" ON business_data;
DROP POLICY IF EXISTS "Profile members manage business" ON business_data;

DROP INDEX IF EXISTS idx_business_data_unique_headquarters;
DROP INDEX IF EXISTS idx_business_data_slug_per_location;
DROP INDEX IF EXISTS idx_business_data_brand_hub_slug;
DROP INDEX IF EXISTS idx_business_data_territorial;
DROP INDEX IF EXISTS idx_business_data_role;
DROP INDEX IF EXISTS idx_business_data_parent;

ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_unit_name_only_branch;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_headquarters_is_branch;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_branch_has_location;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_branch_has_parent;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_standalone_has_location;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_standalone_no_parent;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_brand_hub_no_location;
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS check_brand_hub_no_parent;

ALTER TABLE business_data DROP COLUMN IF EXISTS unit_name;
ALTER TABLE business_data DROP COLUMN IF EXISTS is_headquarters;
ALTER TABLE business_data DROP COLUMN IF EXISTS business_role;
ALTER TABLE business_data DROP COLUMN IF EXISTS parent_business_id;

-- Recriar policies antigas
CREATE POLICY "Active businesses viewable" ON business_data FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Owners manage own business" ON business_data FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
```
