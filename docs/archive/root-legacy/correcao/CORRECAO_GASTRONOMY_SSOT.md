# Correção Gastronomia - Seguindo SSOT

## Problema Identificado

O erro ocorre porque:

1. O seed antigo (`seed_insert_only.sql`) insere dados em `gastronomy_businesses` (tabela que não existe)
2. A arquitetura correta usa `business_data` (SSOT) + `gastronomy_profiles` (extensão)
3. O `BusinessUrlService` exige `geographic_path` com 4 segmentos (país/estado/cidade/bairro)
4. Os dados precisam estar em `business_data` com `location_id` apontando para bairros (districts)

## Erro Original

```
Error: [BusinessUrlService] Empresa a4444444-4444-4444-4444-444444444444 
com geographic_path inválido: "/br/ba/salvador". 
Esperado formato: /br/:uf/:cidade/:bairro
```

## Solução

Aplicar o seed correto que segue a arquitetura SSOT:

### Passo 1: Limpar dados antigos (se existirem)

```sql
-- Limpar dados de gastronomia antigos
DELETE FROM gastronomy_profiles WHERE business_id IN (
  SELECT id FROM business_data WHERE slug LIKE 'restaurante-barra-mar%'
  OR slug LIKE 'bar-do-rio%'
  OR slug LIKE 'casa-da-moqueca%'
  OR slug LIKE 'pizzaria-bella-napoli%'
  OR slug LIKE 'sushi-house-pituba%'
);

DELETE FROM business_data WHERE slug LIKE 'restaurante-barra-mar%'
  OR slug LIKE 'bar-do-rio%'
  OR slug LIKE 'casa-da-moqueca%'
  OR slug LIKE 'pizzaria-bella-napoli%'
  OR slug LIKE 'sushi-house-pituba%';

DELETE FROM addresses WHERE id IN (
  'e1111111-1111-1111-1111-111111111111',
  'e2222222-2222-2222-2222-222222222222',
  'e3333333-3333-3333-3333-333333333333',
  'e4444444-4444-4444-4444-444444444444',
  'e5555555-5555-5555-5555-555555555555'
);

DELETE FROM profiles WHERE id IN (
  'p1111111-1111-1111-1111-111111111111',
  'p2222222-2222-2222-2222-222222222222',
  'p3333333-3333-3333-3333-333333333333',
  'p4444444-4444-4444-4444-444444444444',
  'p5555555-5555-5555-5555-555555555555'
);
```

### Passo 2: Aplicar seed correto

Execute o arquivo `seed_gastronomy_ssot.sql` no SQL Editor do Supabase.

## Arquitetura Correta

```
profiles (identidade pública)
    ↓
business_data (SSOT empresarial)
    ├── location_id → locations (bairro/district)
    ├── address_id → addresses
    └── profile_id → profiles
        ↓
gastronomy_profiles (extensão gastronômica)
    └── business_id → business_data.id
```

## Validação

Após aplicar o seed, execute:

```sql
SELECT 
  bd.id,
  bd.business_name,
  bd.slug,
  l.geographic_path,
  gp.cuisine_type,
  gp.price_range
FROM business_data bd
JOIN gastronomy_profiles gp ON gp.business_id = bd.id
JOIN locations l ON l.id = bd.location_id
WHERE bd.slug IN (
  'restaurante-barra-mar',
  'bar-do-rio',
  'casa-da-moqueca',
  'pizzaria-bella-napoli',
  'sushi-house-pituba'
);
```

Resultado esperado:
- Todos os `geographic_path` devem ter 4 segmentos: `/br/ba/salvador/{bairro}`
- Exemplo: `/br/ba/salvador/barra`, `/br/ba/salvador/rio-vermelho`, etc.

## Próximos Passos

Após aplicar o seed:

1. Recarregar a página no navegador
2. O erro deve desaparecer
3. Os cards de gastronomia devem exibir corretamente
4. As URLs devem seguir o padrão: `/gastronomia/ba/salvador/{bairro}/{slug}`
