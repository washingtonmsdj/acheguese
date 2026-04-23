# 🧪 Guia de Teste - Correções SSOT

## Pré-requisitos

1. ✅ Código TypeScript atualizado (já aplicado)
2. ⏳ Migrations SQL aplicadas no Supabase
3. ⏳ Servidor de desenvolvimento rodando

## Passo 1: Aplicar Migrations SQL

### Opção A: Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql
2. Cole o conteúdo de `APLICAR_NO_SUPABASE_SQL_EDITOR.sql`
3. Clique em "Run"
4. Aguarde confirmação de sucesso

### Opção B: Via CLI (se configurado)

```bash
# Aplicar migrations
supabase db push

# Ou aplicar manualmente
psql $DATABASE_URL < supabase/migrations/20260413000001_fix_review_rpc_functions.sql
psql $DATABASE_URL < supabase/migrations/20260413000002_seed_locations.sql
```

## Passo 2: Verificar Migrations Aplicadas

Execute no SQL Editor:

```sql
-- Verificar RPC functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_business_reviews', 'can_user_review_business');

-- Deve retornar 2 linhas

-- Verificar localizações
SELECT geographic_path, name, type
FROM locations
WHERE geographic_path LIKE 'ba%'
ORDER BY geographic_path;

-- Deve retornar 6 linhas:
-- ba | Bahia | state
-- ba/salvador | Salvador | city
-- ba/salvador/barra | Barra | district
-- ba/salvador/itaigara | Itaigara | district
-- ba/salvador/pelourinho | Pelourinho | district
-- ba/salvador/rio-vermelho | Rio Vermelho | district
```

## Passo 3: Testar Aplicação

### 3.1 Iniciar Servidor

```bash
npm run dev
# ou
yarn dev
```

### 3.2 Abrir Console do Navegador

1. Abra DevTools (F12)
2. Vá para aba "Console"
3. Limpe o console (Ctrl+L)

### 3.3 Navegar para Página de Gastronomia

Acesse uma das URLs:
- http://localhost:5173/gastronomia
- http://localhost:5173/ba/salvador/itaigara/[algum-slug]

### 3.4 Verificar Console Limpo

✅ **Não deve aparecer**:
- ❌ `Invalid business ID provided: mock-biz-sushi`
- ❌ `Invalid menu ID provided: mock-menu-mock-biz-sushi`
- ❌ `Expected value to be of type number, but found null`
- ❌ `POST /rest/v1/rpc/get_business_reviews 400`
- ❌ `Location not found for path: ba/salvador/itaigara`

✅ **Deve aparecer apenas**:
- ✅ `✅ Supabase inicializado`
- ✅ `📍 URL: https://...supabase.co`
- ✅ `✅ TTFB: Xms (good)`
- ✅ `📊 FCP: Xms`

## Passo 4: Testes Funcionais

### 4.1 Teste de IDs Mock

```typescript
// No console do navegador
import { isValidId } from '@/shared/validation';

// Deve retornar true em DEV
console.log(isValidId('mock-biz-sushi')); // true

// Deve retornar true para UUID válido
console.log(isValidId('123e4567-e89b-12d3-a456-426614174000')); // true

// Deve retornar false para string inválida
console.log(isValidId('invalid')); // false
```

### 4.2 Teste de Coordenadas

Verifique no Network tab:
1. Busque por requisições para `/rest/v1/menu_items`
2. Verifique que `business_latitude` e `business_longitude` são:
   - `number` válido, ou
   - `undefined` (não `null`)

### 4.3 Teste de Reviews

```typescript
// No console do navegador
const { data, error } = await supabase.rpc('get_business_reviews', {
  p_business_profile_id: 'algum-uuid-valido',
  p_limit: 10,
  p_offset: 0
});

console.log('Reviews:', data);
console.log('Error:', error); // Deve ser null
```

### 4.4 Teste de Localizações

```typescript
// No console do navegador
const { data, error } = await supabase
  .from('locations')
  .select('*')
  .eq('geographic_path', 'ba/salvador/itaigara')
  .single();

console.log('Location:', data); // Deve retornar objeto
console.log('Error:', error); // Deve ser null
```

## Passo 5: Testes de Regressão

### 5.1 Navegação por Território

Teste estas URLs:
- `/ba/salvador/itaigara`
- `/ba/salvador/pelourinho`
- `/ba/salvador/barra`
- `/ba/salvador/rio-vermelho`

Todas devem carregar sem erros no console.

### 5.2 Busca de Negócios

1. Acesse página de gastronomia
2. Use filtro de busca
3. Verifique que resultados aparecem
4. Console deve estar limpo

### 5.3 Visualização de Detalhes

1. Clique em um negócio
2. Verifique que detalhes carregam
3. Verifique que mapa renderiza (se houver coordenadas)
4. Console deve estar limpo

## Checklist Final

- [ ] Migrations SQL aplicadas com sucesso
- [ ] RPC functions criadas e acessíveis
- [ ] Localizações inseridas no banco
- [ ] Servidor de desenvolvimento rodando
- [ ] Console limpo de erros
- [ ] IDs mock funcionando em DEV
- [ ] Coordenadas validadas corretamente
- [ ] Reviews carregando sem erro 400
- [ ] Localizações sendo encontradas
- [ ] Navegação por território funcionando
- [ ] Busca funcionando
- [ ] Detalhes de negócios carregando

## Troubleshooting

### Erro: RPC function não encontrada

```sql
-- Verificar se function existe
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_business_reviews';

-- Se não existir, reaplicar migration
-- supabase/migrations/20260413000001_fix_review_rpc_functions.sql
```

### Erro: Location not found

```sql
-- Verificar se localizações existem
SELECT * FROM locations WHERE geographic_path LIKE 'ba%';

-- Se não existir, reaplicar migration
-- supabase/migrations/20260413000002_seed_locations.sql
```

### Erro: Invalid ID em produção

Verifique que está usando `import.meta.env.DEV` corretamente:
```typescript
console.log('Environment:', import.meta.env.DEV ? 'DEV' : 'PROD');
```

## Sucesso! 🎉

Se todos os testes passaram:
1. ✅ Console limpo
2. ✅ Funcionalidades operacionais
3. ✅ SSOT mantido
4. ✅ Sem gambiarras

Pode fazer commit das alterações!
