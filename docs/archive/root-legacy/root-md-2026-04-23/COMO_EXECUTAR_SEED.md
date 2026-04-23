# 🎯 COMO EXECUTAR O SEED - Guia Definitivo

**Status**: ✅ Seed corrigido e pronto  
**Arquivo**: `supabase/seed_gastronomy_mock.sql`

---

## 🚨 IMPORTANTE: Escolha Seu Ambiente

Você tem **2 opções**:

### 1️⃣ Supabase Cloud (Produção/Staging)
- ✅ Mais fácil
- ✅ Não precisa de Docker
- ✅ Acesso via Dashboard
- ⚠️ Vai afetar banco de produção/staging

### 2️⃣ Supabase Local (Desenvolvimento)
- ✅ Seguro (não afeta produção)
- ⚠️ Precisa de Docker rodando
- ⚠️ Mais complexo

---

## 🌐 OPÇÃO 1: Supabase Cloud (RECOMENDADO)

### Passo 1: Abrir Dashboard
```
https://supabase.com/dashboard
```

### Passo 2: Selecionar Projeto
- Clique no projeto que você quer usar
- **ATENÇÃO**: Certifique-se de estar no projeto correto!

### Passo 3: Ir para SQL Editor
- Menu lateral esquerdo → **SQL Editor**
- Ou acesse diretamente:
  ```
  https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql
  ```

### Passo 4: (Opcional) Limpar Dados Antigos
Se você já executou o seed antes:

1. Clique em **"New Query"**
2. Abra o arquivo `LIMPAR_DADOS_MOCK.sql`
3. Copie TODO o conteúdo
4. Cole no editor
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Aguarde a confirmação

### Passo 5: Executar o Seed
1. Clique em **"New Query"** (nova aba)
2. Abra o arquivo `supabase/seed_gastronomy_mock.sql`
3. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
4. Cole no editor (Ctrl+V)
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Aguarde ~30 segundos

### Passo 6: Validar
1. Clique em **"New Query"** (nova aba)
2. Cole esta query:

```sql
SELECT 
  bd.business_name,
  bd.rating,
  bd.total_reviews,
  gp.cuisine_type,
  gp.delivery_enabled,
  (SELECT COUNT(*) FROM menus WHERE business_id = bd.id) as total_menus,
  (SELECT COUNT(*) FROM menu_items mi 
   JOIN menu_categories mc ON mc.id = mi.category_id
   JOIN menus m ON m.id = mc.menu_id
   WHERE m.business_id = bd.id) as total_items
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
business_name          | rating | reviews | cuisine_type | delivery | menus | items
-----------------------|--------|---------|--------------|----------|-------|-------
Acarajé da Dinha       | 4.80   | 156     | brasileira   | true     | 1     | 5
Burger Station         | 4.60   | 98      | americana    | true     | 1     | 7
Cantina da Nonna       | 4.90   | 312     | italiana     | true     | 1     | 7
Pizzaria Bella Napoli  | 4.90   | 243     | italiana     | true     | 1     | 4
Sushi House Salvador   | 4.70   | 189     | japonesa     | true     | 1     | 4
```

### Passo 7: Testar no Frontend
1. Abra seu navegador
2. Acesse: `http://localhost:5173/gastronomia/pizzaria-bella-napoli`
3. Verifique se o cardápio aparece

---

## 🐳 OPÇÃO 2: Supabase Local

### Pré-requisitos
- ✅ Docker Desktop instalado e **RODANDO**
- ✅ Supabase CLI instalado

### Passo 1: Iniciar Docker
1. Abra o Docker Desktop
2. Aguarde até estar completamente iniciado
3. Verifique se o ícone está verde

### Passo 2: Iniciar Supabase Local
```bash
supabase start
```

**Aguarde ~2-3 minutos** para todos os containers subirem.

### Passo 3: Verificar Status
```bash
supabase status
```

**Você deve ver:**
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
```

### Passo 4: (Opcional) Limpar Dados Antigos
```bash
supabase db execute --file LIMPAR_DADOS_MOCK.sql --local
```

### Passo 5: Executar o Seed
```bash
supabase db execute --file supabase/seed_gastronomy_mock.sql --local
```

### Passo 6: Validar
```bash
supabase db execute --local --sql "
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

### Passo 7: Testar no Frontend
1. Configure `.env.local` para usar Supabase local:
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=<sua_anon_key_local>
   ```
2. Reinicie o servidor de dev
3. Acesse: `http://localhost:5173/gastronomia/pizzaria-bella-napoli`

---

## 🤖 OPÇÃO 3: Script Automatizado

### Windows (PowerShell)
```powershell
.\executar_seed.ps1
```

### Linux/Mac (Bash)
```bash
bash executar_seed.sh
```

**O script vai:**
1. Verificar pré-requisitos
2. Perguntar se quer limpar dados antigos
3. Executar o seed
4. Validar automaticamente
5. Mostrar próximos passos

---

## ✅ Checklist de Sucesso

Após executar, verifique:

- [ ] Query de validação retorna 5 restaurantes
- [ ] Todos têm `menus = 1`
- [ ] Todos têm `items > 0`
- [ ] Frontend carrega sem erros
- [ ] Página `/gastronomia/pizzaria-bella-napoli` mostra:
  - [ ] Nome do restaurante
  - [ ] Rating 4.9 ⭐
  - [ ] Cardápio com categorias
  - [ ] Itens do menu com preços
  - [ ] Promoção "Happy Hour"
  - [ ] Fotos do restaurante

---

## 🐛 Troubleshooting

### ❌ "column does not exist"
**Causa**: Migrations não foram executadas  
**Solução Cloud**:
1. Vá para Dashboard → Database → Migrations
2. Execute todas as migrations pendentes

**Solução Local**:
```bash
supabase db reset --local
```

### ❌ "duplicate key value"
**Causa**: Dados já existem  
**Solução**: Execute `LIMPAR_DADOS_MOCK.sql` antes

### ❌ "relation does not exist"
**Causa**: Tabelas não foram criadas  
**Solução**: Execute as migrations primeiro

### ❌ Docker não está rodando
**Solução**:
1. Abra Docker Desktop
2. Aguarde inicializar completamente
3. Tente novamente

### ❌ Frontend mostra "Cardápio ainda não publicado"
**Causa**: Seed não foi executado ou falhou  
**Solução**:
1. Execute a query de validação
2. Verifique se retorna 5 restaurantes
3. Se não retornar, re-execute o seed

---

## 📊 Resumo das Opções

| Opção | Dificuldade | Pré-requisitos | Tempo | Recomendado |
|-------|-------------|----------------|-------|-------------|
| **Cloud Dashboard** | ⭐ Fácil | Conta Supabase | 2 min | ✅ SIM |
| **Local CLI** | ⭐⭐ Médio | Docker + CLI | 5 min | Para dev |
| **Script** | ⭐ Fácil | CLI instalado | 2 min | Se CLI funcionar |

---

## 🎯 Recomendação

**Use a Opção 1 (Cloud Dashboard)** se:
- ✅ Você tem acesso ao Dashboard
- ✅ Quer executar rapidamente
- ✅ Não se importa em usar o banco cloud

**Use a Opção 2 (Local)** se:
- ✅ Você quer testar localmente
- ✅ Docker está rodando
- ✅ Não quer afetar o banco cloud

---

## 🎉 Após Executar com Sucesso

Você terá:
- ✅ 5 restaurantes mock completos
- ✅ 5 menus com categorias e itens
- ✅ 30+ itens de cardápio
- ✅ Variações (tamanhos de pizza)
- ✅ Adicionais (bordas, extras)
- ✅ 2 promoções ativas
- ✅ 25+ fotos
- ✅ Frontend funcionando perfeitamente

**Parabéns! Seu módulo de gastronomia está pronto para desenvolvimento!** 🚀

---

**Precisa de ajuda?** Consulte:
- `README_SEED_GASTRONOMY.md` - Documentação completa
- `EXECUTAR_SEED_AGORA.md` - Guia detalhado
- `SEED_CORRIGIDO_FINAL.md` - Análise técnica
