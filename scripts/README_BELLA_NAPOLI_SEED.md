# 🍕 Seed Pizzaria Bella Napoli

Este documento explica como aplicar o seed da Pizzaria Bella Napoli no banco de dados Supabase.

## 📁 Arquivos

- `supabase/seed_bella_napoli_mock.sql` - O seed SQL completo
- `scripts/apply-bella-napoli-seed.js` - Script Node.js para aplicar o seed
- `scripts/apply-seed-cli.ps1` - Script PowerShell para tentar vários métodos

## 🚀 Métodos de Execução

### Método 1: Supabase Dashboard (Mais Fácil)

1. Acesse: https://app.supabase.com/project/_/sql
2. Abra o arquivo `supabase/seed_bella_napoli_mock.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor do Supabase
5. Clique em "Run"

### Método 2: Supabase CLI

```bash
supabase sql -f supabase/seed_bella_napoli_mock.sql
```

### Método 3: PowerShell Script

```powershell
# No Windows PowerShell
.\scripts\apply-seed-cli.ps1

# Ele tentará automaticamente:
# 1. Supabase CLI
# 2. Node.js
# 3. psql
# Se falhar, mostrará instruções manuais
```

### Método 4: Node.js

```bash
# Certifique-se de ter as variáveis de ambiente:
# VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local

node scripts/apply-bella-napoli-seed.js
```

## ✅ O que o seed faz?

O seed **ATUALIZA** a Pizzaria Bella Napoli existente (ou cria se não existir):

1. **Gastronomy Profile**: Adiciona `niche_key = 'pizza'`
2. **Cardápio**: 9 categorias com 56 itens
3. **Nicho Pizzaria**:
   - Config: `highest_price`, permite 2/3/4 sabores
   - 5 tamanhos (Broto a Família)
   - 18 sabores (salgados e doces)
   - 5 bordas recheadas
   - 5 tipos de massa

## 🔍 Verificação

Após aplicar o seed, valide no SQL Editor:

```sql
SELECT
  bd.business_name,
  gp.niche_key,
  COUNT(DISTINCT ps.id) as tamanhos,
  COUNT(DISTINCT pf.id) as sabores,
  COUNT(DISTINCT pe.id) as bordas,
  COUNT(DISTINCT pd.id) as massas
FROM business_data bd
LEFT JOIN gastronomy_profiles gp ON gp.business_id = bd.id
LEFT JOIN pizza_sizes ps ON ps.business_id = bd.id
LEFT JOIN pizza_flavors pf ON pf.business_id = bd.id
LEFT JOIN pizza_edges pe ON pe.business_id = bd.id
LEFT JOIN pizza_doughs pd ON pd.business_id = bd.id
WHERE bd.slug = 'pizzaria-bella-napoli'
GROUP BY bd.id, bd.business_name, gp.niche_key;
```

Resultado esperado:
- `business_name`: Pizzaria Bella Napoli
- `niche_key`: pizza
- `tamanhos`: 5
- `sabores`: 18
- `bordas`: 5
- `massas`: 5
