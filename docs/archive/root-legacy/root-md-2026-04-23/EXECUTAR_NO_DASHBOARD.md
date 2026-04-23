# 🌐 EXECUTAR SEED NO SUPABASE DASHBOARD

**Motivo**: Sua versão do Supabase CLI (v2.39.2) não suporta `db execute --file`  
**Solução**: Usar o Dashboard (mais fácil e rápido)

---

## 📋 PASSO A PASSO (2 minutos)

### 1️⃣ Abrir Dashboard
```
https://supabase.com/dashboard
```

### 2️⃣ Selecionar Projeto
- Clique no seu projeto
- **ATENÇÃO**: Certifique-se de estar no projeto correto!

### 3️⃣ Ir para SQL Editor
- Menu lateral esquerdo → **SQL Editor**
- Ou acesse: `https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql`

### 4️⃣ Nova Query
- Clique em **"New Query"** (botão verde no canto superior direito)

### 5️⃣ Copiar o Seed
1. Abra o arquivo: `supabase/seed_gastronomy_mock.sql`
2. Selecione TODO o conteúdo: **Ctrl+A**
3. Copie: **Ctrl+C**

### 6️⃣ Colar no Editor
1. Volte para o Dashboard
2. Cole no editor SQL: **Ctrl+V**
3. Você verá ~1000 linhas de SQL

### 7️⃣ Executar
- Clique em **"Run"** (ou pressione **Ctrl+Enter**)
- Aguarde ~30 segundos
- Você verá mensagens de sucesso:
  ```
  INSERT 0 5  (business_data)
  INSERT 0 5  (gastronomy_profiles)
  INSERT 0 5  (menus)
  INSERT 0 15 (menu_categories)
  INSERT 0 30 (menu_items)
  UPDATE 5    (fotos)
  UPDATE 5    (campos adicionais)
  ```

### 8️⃣ Validar
1. Clique em **"New Query"** (nova aba)
2. Cole esta query:

```sql
SELECT 
  bd.business_name,
  bd.rating,
  bd.total_reviews,
  gp.cuisine_type,
  (SELECT COUNT(*) FROM menus WHERE business_id = bd.id) as menus,
  (SELECT COUNT(*) FROM menu_items mi 
   JOIN menu_categories mc ON mc.id = mi.category_id
   JOIN menus m ON m.id = mc.menu_id
   WHERE m.business_id = bd.id) as items
FROM business_data bd
JOIN gastronomy_profiles gp ON gp.business_id = bd.id
WHERE bd.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY bd.business_name;
```

3. Clique em **"Run"**

**Resultado esperado:**
```
business_name          | rating | reviews | cuisine_type | menus | items
-----------------------|--------|---------|--------------|-------|-------
Acarajé da Dinha       | 4.80   | 156     | brasileira   | 1     | 5
Burger Station         | 4.60   | 98      | americana    | 1     | 7
Cantina da Nonna       | 4.90   | 312     | italiana     | 1     | 7
Pizzaria Bella Napoli  | 4.90   | 243     | italiana     | 1     | 4
Sushi House Salvador   | 4.70   | 189     | japonesa     | 1     | 4
```

### 9️⃣ Testar no Frontend
1. Abra: `http://localhost:5173/gastronomia/pizzaria-bella-napoli`
2. Verifique se o cardápio aparece

---

## ✅ CHECKLIST

- [ ] Abri o Dashboard
- [ ] Selecionei o projeto correto
- [ ] Fui para SQL Editor
- [ ] Criei uma Nova Query
- [ ] Copiei o seed completo
- [ ] Colei no editor
- [ ] Executei (Run)
- [ ] Vi mensagens de sucesso
- [ ] Executei query de validação
- [ ] Validação retornou 5 restaurantes
- [ ] Testei no frontend
- [ ] Cardápio aparece corretamente

---

## 🐛 PROBLEMAS?

### ❌ "column does not exist"
**Causa**: Migrations não foram executadas  
**Solução**:
1. Vá para: Dashboard → Database → Migrations
2. Execute todas as migrations pendentes
3. Ou execute: `supabase db reset` (local)

### ❌ "duplicate key value"
**Causa**: Dados já existem  
**Solução**:
1. Execute `LIMPAR_DADOS_MOCK.sql` primeiro
2. Depois execute o seed novamente

### ❌ "relation does not exist"
**Causa**: Tabelas não foram criadas  
**Solução**: Execute as migrations primeiro

### ❌ Frontend mostra "Cardápio ainda não publicado"
**Causa**: Seed não foi executado ou falhou  
**Solução**:
1. Execute a query de validação
2. Verifique se retorna 5 restaurantes
3. Se não retornar, re-execute o seed

---

## 🎯 APÓS EXECUTAR COM SUCESSO

Você terá:
- ✅ 5 restaurantes mock completos
- ✅ 5 menus com categorias e itens
- ✅ 30+ itens de cardápio
- ✅ Variações (tamanhos de pizza)
- ✅ Adicionais (bordas, extras)
- ✅ 2 promoções ativas
- ✅ 25+ fotos
- ✅ Frontend funcionando perfeitamente

**Teste os restaurantes:**
```
/gastronomia/pizzaria-bella-napoli
/gastronomia/acaraje-da-dinha
/gastronomia/sushi-house-salvador
/gastronomia/burger-station
/gastronomia/cantina-da-nonna
```

---

## 💡 DICA: Atualizar Supabase CLI

Para usar o CLI no futuro:
```bash
npm install -g supabase@latest
```

Depois você poderá usar:
```bash
supabase db execute --file supabase/seed_gastronomy_mock.sql
```

---

**Tempo estimado**: 2-3 minutos  
**Dificuldade**: ⭐ Fácil  
**Recomendado**: ✅ SIM (método mais confiável)
