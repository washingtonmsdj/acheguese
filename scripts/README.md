# Scripts de Seed

## Seed de Classificados

Este script popula o banco de dados com classificados de teste.

### Pré-requisitos

1. Ter localidades (`locations`) cadastradas no banco
2. Ter pelo menos um usuário (`profiles`) cadastrado
3. Variáveis de ambiente configuradas (`.env.local`)

### Como executar

```bash
# Instalar tsx se necessário
npm install -D tsx

# Executar o script
npx tsx scripts/seed-classifieds.ts
```

### O que o script faz

1. Busca localidades existentes no banco
2. Busca um usuário vendedor
3. Insere 3 classificados de teste:
   - iPhone 14 Pro Max (R$ 4.500)
   - Sofá 3 Lugares (R$ 1.200)
   - Notebook Dell (R$ 3.200)

### Alternativa: SQL Direto

Se preferir usar SQL direto no Supabase:

1. Abra o SQL Editor no Supabase Dashboard
2. Use o arquivo `supabase/seed_classifieds.sql`
3. Substitua os placeholders pelos IDs reais:
   - `{SELLER_ID}`: ID de um usuário
   - `{LOCATION_ID_PITUBA}`: ID de uma localidade
   - `{LOCATION_ID_BARRA}`: ID de outra localidade

### Verificar dados inseridos

```sql
SELECT 
  c.id,
  c.title,
  c.price,
  c.category,
  l.name as location_name,
  p.name as seller_name
FROM classifieds c
LEFT JOIN locations l ON c.location_id = l.id
LEFT JOIN profiles p ON c.seller_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;
```
