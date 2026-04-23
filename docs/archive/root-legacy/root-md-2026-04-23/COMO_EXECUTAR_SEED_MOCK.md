# 🚀 Como Executar o Seed Mock de Gastronomia

**Problema**: Você está vendo "Cardápio ainda não publicado" porque o seed mock não foi executado no banco de dados.

**Solução**: Execute o arquivo SQL no Supabase Dashboard.

---

## 📋 Passo a Passo

### 1. Abrir Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Abrir SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New Query"** (ou "+ New query")

### 3. Copiar o Seed SQL

1. Abra o arquivo: `supabase/seed_gastronomy_mock.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase

### 4. Executar o SQL

1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
2. Aguarde a execução (pode levar alguns segundos)
3. Verifique se não há erros na saída

### 5. Verificar Dados

Execute esta query para confirmar que os dados foram inseridos:

```sql
SELECT 
  bd.business_name,
  gp.cuisine_type,
  gp.price_range,
  COUNT(DISTINCT m.id) as total_menus,
  COUNT(DISTINCT mc.id) as total_categories,
  COUNT(DISTINCT mi.id) as total_items
FROM business_data bd
JOIN gastronomy_profiles gp ON gp.business_id = bd.id
LEFT JOIN menus m ON m.business_id = bd.id
LEFT JOIN menu_categories mc ON mc.menu_id = m.id
LEFT JOIN menu_items mi ON mi.category_id = mc.id
WHERE bd.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
GROUP BY bd.business_name, gp.cuisine_type, gp.price_range
ORDER BY bd.business_name;
```

**Resultado Esperado:**
```
Acarajé da Dinha      | brasileira | $   | 1 | 2 | 5
Burger Station        | americana  | $   | 1 | 3 | 7
Cantina da Nonna      | italiana   | $$  | 1 | 3 | 7
Pizzaria Bella Napoli | italiana   | $$  | 1 | 3 | 4
Sushi House Salvador  | japonesa   | $$$ | 1 | 3 | 4
```

---

## 🔍 Verificar no Frontend

Após executar o seed, acesse:

### 1. Listagem de Restaurantes
```
http://localhost:8080/gastronomia
http://localhost:8080/gastronomia/br/ba/salvador
```

### 2. Página de Detalhe (Pizzaria Bella Napoli)
```
http://localhost:8080/gastronomia/br/ba/salvador/itaigara/pizzaria-bella-napoli
```

**Você deve ver:**
- ✅ Cardápio com categorias
- ✅ Itens do menu com preços
- ✅ Imagens dos pratos
- ✅ Botão "Adicionar ao carrinho"
- ✅ Promoção "Happy Hour - 20% OFF"

---

## ⚠️ Problemas Comuns

### Erro: "relation does not exist"

**Causa**: Tabelas de gastronomia não foram criadas  
**Solução**: Execute as migrations primeiro

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%gastronomy%' 
OR table_name LIKE '%menu%';
```

Se não retornar nada, você precisa executar as migrations:
1. Vá em **Database > Migrations**
2. Execute as migrations pendentes

### Erro: "duplicate key value violates unique constraint"

**Causa**: Dados já foram inseridos anteriormente  
**Solução**: Limpar dados antigos antes de reinserir

```sql
-- Limpar dados mock antigos
DELETE FROM menu_items WHERE category_id IN (
  SELECT id FROM menu_categories WHERE menu_id IN (
    SELECT id FROM menus WHERE business_id IN (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555'
    )
  )
);

DELETE FROM menu_categories WHERE menu_id IN (
  SELECT id FROM menus WHERE business_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  )
);

DELETE FROM menus WHERE business_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

DELETE FROM gastronomy_profiles WHERE business_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

DELETE FROM business_data WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);
```

Depois execute o seed novamente.

### Cardápio ainda aparece vazio

**Causa**: Cache do React Query  
**Solução**: Limpar cache do navegador

1. Abra DevTools (F12)
2. Vá em **Application > Storage**
3. Clique em **"Clear site data"**
4. Recarregue a página (Ctrl+R)

---

## 🎯 Checklist de Sucesso

Após executar o seed, você deve ter:

- [ ] 5 restaurantes criados
- [ ] 5 perfis gastronômicos
- [ ] 5 menus completos
- [ ] 15 categorias
- [ ] 27 itens de menu
- [ ] 2 promoções ativas
- [ ] Imagens em todos os restaurantes
- [ ] Cardápio visível no frontend

---

## 🔄 Alternativa: Usar Mocks de Desenvolvimento

Se você não quiser executar o seed no banco, pode usar os mocks de desenvolvimento:

### 1. Ativar Mocks

No arquivo `.env.local`:

```env
VITE_USE_DEV_MOCKS=true
```

### 2. Reiniciar o servidor

```bash
npm run dev
```

### 3. Verificar

Os mocks estão em:
- `src/modules/business/gastronomy/__mocks__/gastronomyMocks.ts`
- `src/modules/business/gastronomy/__mocks__/gastronomyDetailMocks.ts`

**Nota**: Os mocks são apenas para desenvolvimento local e não persistem dados.

---

## 📚 Arquivos Relacionados

- **Seed SQL**: `supabase/seed_gastronomy_mock.sql`
- **Documentação**: `SEED_GASTRONOMY_ATUALIZADO.md`
- **Mocks**: `src/modules/business/gastronomy/__mocks__/`
- **Página de Detalhe**: `src/modules/business/gastronomy/pages/GastronomyDetailPage.tsx`

---

## 🆘 Ainda com Problemas?

### Verificar Logs

1. Abra DevTools (F12)
2. Vá em **Console**
3. Procure por erros relacionados a "menu" ou "gastronomy"

### Verificar Network

1. Abra DevTools (F12)
2. Vá em **Network**
3. Filtre por "menu" ou "gastronomy"
4. Verifique se as requisições estão retornando dados

### Verificar Banco de Dados

```sql
-- Verificar se o restaurante existe
SELECT * FROM business_data 
WHERE slug = 'pizzaria-bella-napoli';

-- Verificar se tem perfil gastronômico
SELECT * FROM gastronomy_profiles 
WHERE business_id = '22222222-2222-2222-2222-222222222222';

-- Verificar se tem menu
SELECT * FROM menus 
WHERE business_id = '22222222-2222-2222-2222-222222222222';

-- Verificar se tem categorias
SELECT mc.* FROM menu_categories mc
JOIN menus m ON m.id = mc.menu_id
WHERE m.business_id = '22222222-2222-2222-2222-222222222222';

-- Verificar se tem itens
SELECT mi.* FROM menu_items mi
JOIN menu_categories mc ON mc.id = mi.category_id
JOIN menus m ON m.id = mc.menu_id
WHERE m.business_id = '22222222-2222-2222-2222-222222222222';
```

---

**Criado por**: Guia de Troubleshooting  
**Data**: 2026-04-23  
**Status**: ✅ PRONTO PARA USO
