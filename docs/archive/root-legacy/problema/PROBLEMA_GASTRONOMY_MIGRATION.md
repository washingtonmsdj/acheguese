# Problema: Tabela gastronomy_profiles Não Existe

**Data**: 2026-04-01  
**Status**: ⚠️ Requer Ação Manual

## Erro Identificado

```
GET https://xhdowzacfujckjelqhtd.supabase.co/rest/v1/gastronomy_profiles?select=business_id&status=eq.active 404 (Not Found)
```

A tabela `gastronomy_profiles` não existe no banco de dados remoto, causando erro 404 ao tentar acessar a página de gastronomia.

## Causa Raiz

A migration `20260331000001_create_gastronomy_module.sql` não foi aplicada no banco remoto devido a:

1. **Conflito de Timestamp**: Existem duas migrations com timestamp `20260331000001`:
   - `20260331000001_create_gastronomy_module.sql` (não aplicada)
   - `20260331000001_create_tourist_points.sql` (já aplicada)

2. **Dessincronia**: Há migrations remotas que não existem localmente, impedindo `supabase db push`

## Status Atual das Migrations

```
Local: 20260331000001_create_gastronomy_module.sql
Local: 20260331000001_create_tourist_points.sql
Remote: 20260331000001 (aplicada - tourist_points)
```

## Solução Manual Necessária

### Opção 1: Aplicar via Supabase Dashboard (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
2. Vá em SQL Editor
3. Copie o conteúdo de `supabase/migrations/20260331000001_create_gastronomy_module.sql`
4. Execute o SQL
5. Marque a migration como aplicada:
   ```bash
   supabase migration repair --status applied 20260331000001
   ```

### Opção 2: Renomear Migration Localmente

1. Renomear arquivo:
   ```bash
   mv supabase/migrations/20260331000001_create_gastronomy_module.sql supabase/migrations/20260331000002_create_gastronomy_module.sql
   ```

2. Aplicar migration:
   ```bash
   supabase db push
   ```

### Opção 3: Usar psql Diretamente

```bash
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/20260331000001_create_gastronomy_module.sql
```

## Conteúdo da Migration

A migration cria 8 tabelas:

1. `gastronomy_profiles` - Perfil gastronômico (extensão de business_data)
2. `menus` - Containers de cardápio
3. `menu_categories` - Categorias do cardápio
4. `menu_items` - Itens do cardápio
5. `menu_item_variants` - Variações (tamanhos, sabores)
6. `menu_item_addons` - Adicionais
7. `menu_item_availability` - Disponibilidade temporal
8. `menu_promotions` - Promoções

## Impacto

Enquanto a migration não for aplicada:
- ❌ Página `/gastronomia/ba/salvador` retorna erro 404
- ❌ `GastronomyQueryService` falha ao buscar dados
- ❌ Navegação para gastronomia quebrada
- ✅ Resto do sistema funciona normalmente

## Arquivos Relacionados

- Migration: `supabase/migrations/20260331000001_create_gastronomy_module.sql`
- Service: `src/modules/gastronomy/services/GastronomyQueryService.ts`
- Page: `src/modules/gastronomy/pages/GastronomyLandingPage.tsx`

## Próximos Passos

1. Escolher uma das opções de solução acima
2. Aplicar a migration no banco remoto
3. Verificar que a tabela foi criada:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'gastronomy%';
   ```
4. Testar a página de gastronomia no browser

## Prevenção Futura

Para evitar conflitos de timestamp:
- Sempre verificar timestamps existentes antes de criar nova migration
- Usar timestamps com segundos: `YYYYMMDDHHMMSS` em vez de `YYYYMMDD000001`
- Executar `supabase migration list` antes de criar novas migrations
