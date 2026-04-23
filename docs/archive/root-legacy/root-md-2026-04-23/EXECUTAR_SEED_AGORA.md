# 🚀 EXECUTAR SEED - GUIA RÁPIDO

**Status**: ✅ Seed corrigido e pronto  
**Arquivo**: `supabase/seed_gastronomy_mock.sql`  
**Tempo estimado**: 2 minutos

---

## 📋 Passo a Passo

### 1️⃣ Abra o Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2️⃣ Selecione seu Projeto
- Clique no projeto que você está usando

### 3️⃣ Vá para SQL Editor
- Menu lateral esquerdo → **SQL Editor**
- Ou acesse diretamente: `https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql`

### 4️⃣ Crie uma Nova Query
- Clique no botão **"New Query"** (canto superior direito)

### 5️⃣ Cole o Seed
- Abra o arquivo `supabase/seed_gastronomy_mock.sql`
- Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
- Cole no editor SQL do Supabase (Ctrl+V)

### 6️⃣ Execute
- Clique em **"Run"** (ou pressione `Ctrl+Enter`)
- Aguarde a execução (deve levar ~10-30 segundos)

### 7️⃣ Verifique o Resultado
Você deve ver algo como:
```
✅ INSERT 0 5  (business_data)
✅ INSERT 0 5  (gastronomy_profiles)
✅ INSERT 0 5  (menus)
✅ INSERT 0 15 (menu_categories)
✅ INSERT 0 30 (menu_items)
✅ UPDATE 5    (fotos)
✅ UPDATE 5    (campos adicionais)
```

---

## ✅ Validação Rápida

Cole e execute esta query para confirmar:

```sql
SELECT 
  business_name,
  category,
  rating,
  total_reviews,
  (SELECT COUNT(*) FROM menus WHERE business_id = bd.id) as menus,
  (SELECT COUNT(*) FROM menu_items mi 
   JOIN menu_categories mc ON mc.id = mi.category_id
   JOIN menus m ON m.id = mc.menu_id
   WHERE m.business_id = bd.id) as items
FROM business_data bd
WHERE bd.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY business_name;
```

**Resultado esperado:**
```
business_name          | category    | rating | reviews | menus | items
-----------------------|-------------|--------|---------|-------|-------
Acarajé da Dinha       | alimentacao | 4.80   | 156     | 1     | 5
Burger Station         | alimentacao | 4.60   | 98      | 1     | 7
Cantina da Nonna       | alimentacao | 4.90   | 312     | 1     | 7
Pizzaria Bella Napoli  | alimentacao | 4.90   | 243     | 1     | 4
Sushi House Salvador   | alimentacao | 4.70   | 189     | 1     | 4
```

---

## 🎯 Teste no Frontend

### 1. Acesse a página de gastronomia
```
http://localhost:5173/gastronomia/pizzaria-bella-napoli
```

### 2. Você deve ver:
- ✅ Nome: "Pizzaria Bella Napoli"
- ✅ Descrição: "Pizzas artesanais com massa fermentada por 72h..."
- ✅ Rating: 4.9 ⭐ (243 avaliações)
- ✅ Cardápio com 3 categorias:
  - Pizzas Tradicionais (Margherita, Calabresa)
  - Pizzas Especiais (Quattro Formaggi, Camarão Premium)
  - Bebidas
- ✅ Promoção: "Happy Hour - 20% OFF"
- ✅ Fotos do restaurante

### 3. Teste outros restaurantes:
```
/gastronomia/acaraje-da-dinha
/gastronomia/sushi-house-salvador
/gastronomia/burger-station
/gastronomia/cantina-da-nonna
```

---

## 🐛 Problemas Comuns

### ❌ Erro: "relation does not exist"
**Causa**: Tabelas não foram criadas  
**Solução**: Execute as migrations primeiro:
```bash
supabase db reset
# ou
supabase migration up
```

### ❌ Erro: "column does not exist"
**Causa**: Seed desatualizado  
**Solução**: Use o arquivo `supabase/seed_gastronomy_mock.sql` corrigido (versão atual)

### ❌ Erro: "duplicate key value"
**Causa**: Dados já existem  
**Solução**: Limpe antes de executar:
```sql
DELETE FROM menu_item_addons WHERE item_id IN (
  SELECT mi.id FROM menu_items mi
  JOIN menu_categories mc ON mc.id = mi.category_id
  JOIN menus m ON m.id = mc.menu_id
  WHERE m.business_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  )
);

DELETE FROM menu_item_variants WHERE item_id IN (
  SELECT mi.id FROM menu_items mi
  JOIN menu_categories mc ON mc.id = mi.category_id
  JOIN menus m ON m.id = mc.menu_id
  WHERE m.business_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
  )
);

DELETE FROM menu_items WHERE category_id IN (
  SELECT mc.id FROM menu_categories mc
  JOIN menus m ON m.id = mc.menu_id
  WHERE m.business_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555'
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

DELETE FROM menu_promotions WHERE business_id IN (
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

### ❌ Frontend mostra "Cardápio ainda não publicado"
**Causa**: Seed não foi executado ou falhou  
**Solução**: 
1. Verifique se o seed foi executado com sucesso
2. Execute a query de validação acima
3. Confirme que `menus.is_active = true`

---

## 📊 Resumo

| Passo | Ação | Tempo |
|-------|------|-------|
| 1 | Abrir Supabase Dashboard | 10s |
| 2 | Ir para SQL Editor | 5s |
| 3 | Colar seed | 10s |
| 4 | Executar | 30s |
| 5 | Validar | 10s |
| 6 | Testar frontend | 30s |
| **TOTAL** | | **~2 min** |

---

## ✅ Checklist Final

- [ ] Seed executado sem erros
- [ ] Query de validação retorna 5 restaurantes
- [ ] Frontend mostra "Pizzaria Bella Napoli" corretamente
- [ ] Cardápio aparece com categorias e itens
- [ ] Promoção "Happy Hour" está visível
- [ ] Fotos carregam corretamente

**Tudo OK? Parabéns! 🎉 Seu módulo de gastronomia está funcionando!**
