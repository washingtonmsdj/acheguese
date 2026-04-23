# 🚀 EXECUTAR SEED AGORA - 3 Opções

---

## ⚡ Opção 1: Script Automatizado (RECOMENDADO)

### Windows (PowerShell)
```powershell
.\executar_seed.ps1
```

### Linux/Mac (Bash)
```bash
bash executar_seed.sh
```

**O script vai:**
1. ✅ Verificar se Supabase CLI está instalado
2. ✅ Verificar se você está logado
3. ✅ Perguntar se quer limpar dados antigos
4. ✅ Executar o seed
5. ✅ Mostrar próximos passos

---

## 🔧 Opção 2: Supabase CLI Manual

### 1. Verificar se está logado
```bash
supabase login
```

### 2. (Opcional) Limpar dados antigos
```bash
supabase db execute --file LIMPAR_DADOS_MOCK.sql
```

### 3. Executar o seed
```bash
supabase db execute --file supabase/seed_gastronomy_mock.sql
```

### 4. Validar
```bash
supabase db execute --sql "
SELECT 
  business_name,
  rating,
  (SELECT COUNT(*) FROM menus WHERE business_id = bd.id) as menus
FROM business_data bd
WHERE bd.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
)
ORDER BY business_name;
"
```

**Resultado esperado:**
```
business_name          | rating | menus
-----------------------|--------|-------
Acarajé da Dinha       | 4.80   | 1
Burger Station         | 4.60   | 1
Cantina da Nonna       | 4.90   | 1
Pizzaria Bella Napoli  | 4.90   | 1
Sushi House Salvador   | 4.70   | 1
```

---

## 🌐 Opção 3: Supabase Dashboard (Manual)

### 1. Abrir Dashboard
```
https://supabase.com/dashboard
```

### 2. Selecionar Projeto
- Clique no seu projeto

### 3. Ir para SQL Editor
- Menu lateral → **SQL Editor**
- Ou: `https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql`

### 4. Nova Query
- Clique em **"New Query"**

### 5. Colar Seed
- Abra: `supabase/seed_gastronomy_mock.sql`
- Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
- Cole no editor (Ctrl+V)

### 6. Executar
- Clique em **"Run"** (ou Ctrl+Enter)
- Aguarde ~30 segundos

### 7. Validar
- Cole e execute a query de validação acima

---

## ✅ Após Executar

### 1. Teste no Frontend
```
http://localhost:5173/gastronomia/pizzaria-bella-napoli
```

### 2. Você Deve Ver:
- ✅ Nome: "Pizzaria Bella Napoli"
- ✅ Rating: 4.9 ⭐ (243 avaliações)
- ✅ Cardápio com 3 categorias
- ✅ 4 pizzas (Margherita, Calabresa, Quattro Formaggi, Camarão Premium)
- ✅ Promoção: "Happy Hour - 20% OFF"
- ✅ Fotos do restaurante

### 3. Teste Outros Restaurantes:
```
/gastronomia/acaraje-da-dinha
/gastronomia/sushi-house-salvador
/gastronomia/burger-station
/gastronomia/cantina-da-nonna
```

---

## 🐛 Problemas?

### ❌ "Supabase CLI não encontrado"
**Instale:**
```bash
npm install -g supabase
# ou
brew install supabase/tap/supabase  # Mac
# ou
scoop install supabase              # Windows
```

### ❌ "Você não está logado"
```bash
supabase login
```

### ❌ "column does not exist"
**Causa**: Migrations não foram executadas  
**Solução**:
```bash
supabase db reset
```

### ❌ "duplicate key value"
**Causa**: Dados já existem  
**Solução**:
```bash
supabase db execute --file LIMPAR_DADOS_MOCK.sql
```

### ❌ Frontend mostra "Cardápio ainda não publicado"
**Causa**: Seed não foi executado ou falhou  
**Solução**:
1. Execute a query de validação
2. Verifique se retorna 5 restaurantes
3. Re-execute o seed se necessário

---

## 📊 Checklist

- [ ] Supabase CLI instalado
- [ ] Logado no Supabase
- [ ] Migrations executadas (`supabase db reset`)
- [ ] Seed executado sem erros
- [ ] Query de validação retorna 5 restaurantes
- [ ] Frontend mostra "Pizzaria Bella Napoli" corretamente
- [ ] Cardápio aparece com categorias e itens

---

## 🎉 Sucesso!

Se tudo funcionou:
- ✅ 5 restaurantes criados
- ✅ 5 menus completos
- ✅ 30+ itens de cardápio
- ✅ Variações e adicionais
- ✅ Fotos e promoções
- ✅ Frontend funcionando

**Parabéns! Seu módulo de gastronomia está pronto!** 🚀
