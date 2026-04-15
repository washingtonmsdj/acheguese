# 📝 Como Inserir Classificado Manualmente no Banco

## Passo 1: Buscar IDs Necessários

### 1.1 Buscar ID de Localidade

Execute no SQL Editor do Supabase:

```sql
SELECT id, name, type, geographic_path 
FROM locations 
WHERE type IN ('neighborhood', 'city')
ORDER BY name
LIMIT 10;
```

Copie o `id` de uma localidade (ex: Pituba, Barra, etc.)

### 1.2 Buscar ID de Usuário Vendedor

```sql
SELECT id, name, email 
FROM profiles 
LIMIT 5;
```

Copie o `id` de um usuário para ser o vendedor.

---

## Passo 2: Inserir Classificado

Substitua os valores entre `{}` pelos IDs reais:

```sql
INSERT INTO classifieds (
  title,
  description,
  price,
  category,
  condition,
  photos,
  seller_id,
  location_id,
  status
) VALUES (
  'iPhone 14 Pro Max 256GB - Seminovo',
  'iPhone 14 Pro Max 256GB na cor Deep Purple. Aparelho em perfeito estado, sem arranhões, com caixa original, carregador e nota fiscal. Bateria com 98% de saúde. Aceito propostas.',
  4500.00,
  'eletrônicos',
  'usado',
  ARRAY[
    'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop&sat=-100'
  ],
  '{SELLER_ID}',      -- ⚠️ Substituir pelo ID do usuário
  '{LOCATION_ID}',    -- ⚠️ Substituir pelo ID da localidade
  'active'
);
```

---


## Passo 3: Verificar Inserção

```sql
SELECT 
  c.id,
  c.title,
  c.price,
  c.category,
  c.status,
  l.name as location_name,
  p.name as seller_name,
  c.created_at
FROM classifieds c
LEFT JOIN locations l ON c.location_id = l.id
LEFT JOIN profiles p ON c.seller_id = p.id
ORDER BY c.created_at DESC
LIMIT 5;
```

---

## Exemplo Completo (com IDs fictícios)

```sql
-- Exemplo com IDs fictícios - AJUSTE PARA SEUS IDs REAIS!

INSERT INTO classifieds (
  title, description, price, category, condition, photos, seller_id, location_id, status
) VALUES 
(
  'iPhone 14 Pro Max 256GB',
  'iPhone seminovo em perfeito estado.',
  4500.00,
  'eletrônicos',
  'usado',
  ARRAY['https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=800&h=600&fit=crop'],
  '123e4567-e89b-12d3-a456-426614174000',  -- ID do vendedor
  '987fcdeb-51a2-43f7-8765-ba9876543210',  -- ID da localidade
  'active'
),
(
  'Sofá 3 Lugares Retrátil',
  'Sofá confortável, cor cinza, 1 ano de uso.',
  1200.00,
  'móveis',
  'usado',
  ARRAY['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
  '123e4567-e89b-12d3-a456-426614174000',  -- ID do vendedor
  '987fcdeb-51a2-43f7-8765-ba9876543210',  -- ID da localidade
  'active'
),
(
  'Notebook Dell Inspiron 15',
  'Notebook i7, 16GB RAM, SSD 512GB.',
  3200.00,
  'eletrônicos',
  'usado',
  ARRAY['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=600&fit=crop'],
  '123e4567-e89b-12d3-a456-426614174000',  -- ID do vendedor
  '987fcdeb-51a2-43f7-8765-ba9876543210',  -- ID da localidade
  'active'
);
```

---

## Categorias Válidas

Use uma destas categorias no campo `category`:

- `eletrônicos`
- `móveis`
- `veículos`
- `imóveis`
- `roupas`
- `games`
- `outros`

---

## Condições Válidas

Use uma destas condições no campo `condition`:

- `novo`
- `usado`
- `seminovo`

---

## Status Válidos

Use um destes status no campo `status`:

- `active` - Anúncio ativo e visível
- `inactive` - Anúncio inativo
- `sold` - Produto vendido

---

## ✅ Após Inserir

1. Acesse a página de classificados no app
2. Os anúncios devem aparecer automaticamente
3. Teste o filtro territorial
4. Teste os filtros de categoria
5. Clique em um anúncio para ver os detalhes

