# 🎯 INSTRUÇÕES: Aplicar Seed Manualmente no Supabase

## ⚠️ IMPORTANTE
O seed está pronto em `seed_final.sql` mas precisa ser executado manualmente no Supabase Dashboard.

## 📋 PASSO A PASSO

### 1. Abrir SQL Editor
1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
2. No menu lateral, clique em **SQL Editor**

### 2. Copiar o SQL
Abra o arquivo `seed_final.sql` e copie TODO o conteúdo (Ctrl+A, Ctrl+C)

### 3. Colar e Executar
1. No SQL Editor, cole o conteúdo completo
2. Clique em **Run** (ou pressione Ctrl+Enter)
3. Aguarde a execução (deve levar ~2-3 segundos)

### 4. Verificar Resultado
Ao final da execução, você verá uma tabela com 5 restaurantes:

| business_name | cuisine_type | price_range | delivery_enabled | rating | is_premium | is_verified |
|---------------|--------------|-------------|------------------|--------|------------|-------------|
| Acarajé da Dinha | brasileira | $ | true | 4.8 | false | false |
| Burger Station | americana | $ | true | 4.6 | false | false |
| Cantina da Nonna | italiana | $$ | true | 4.9 | true | true |
| Pizzaria Bella Napoli | italiana | $$ | true | 4.9 | true | true |
| Sushi House Salvador | japonesa | $$$ | true | 4.7 | false | true |

### 5. Testar no Browser
Após executar o seed, acesse:
```
http://localhost:5173/gastronomia/ba/salvador
```

Você deve ver os 5 restaurantes listados na página!

## 🔍 O QUE O SEED FAZ

1. **Desabilita triggers temporariamente** para permitir inserção direta
2. **Cria 5 profiles** do tipo 'business'
3. **Cria 5 business_data** vinculados aos profiles
4. **Cria 5 gastronomy_profiles** com dados de gastronomia
5. **Atualiza recursos adicionais** (wifi, estacionamento, reservas)
6. **Reabilita triggers**
7. **Executa query de validação** para mostrar os dados criados

## ✅ VALIDAÇÃO ADICIONAL

Se quiser validar manualmente, execute no SQL Editor:

```sql
-- Ver todos os restaurantes
SELECT 
  bd.business_name,
  gp.cuisine_type,
  gp.price_range,
  gp.delivery_enabled,
  bd.rating,
  bd.is_premium,
  bd.is_verified
FROM business_data bd
JOIN gastronomy_profiles gp ON gp.business_id = bd.id
ORDER BY bd.business_name;

-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE profile_type = 'business') as profiles_count,
  (SELECT COUNT(*) FROM business_data) as business_count,
  (SELECT COUNT(*) FROM gastronomy_profiles) as gastronomy_count;
```

Deve retornar:
- profiles_count: 5
- business_count: 5
- gastronomy_count: 5

## 🚨 TROUBLESHOOTING

### Erro: "business_data can only be created for business profiles"
- **Causa**: Trigger está validando tipo de profile
- **Solução**: O seed já desabilita triggers com `SET session_replication_role = replica`

### Erro: "duplicate key value violates unique constraint"
- **Causa**: Dados já existem no banco
- **Solução**: Execute antes:
```sql
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

DELETE FROM profiles WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333',
  'a4444444-4444-4444-4444-444444444444',
  'a5555555-5555-5555-5555-555555555555'
);
```

## 📝 PRÓXIMOS PASSOS

Após aplicar o seed:
1. ✅ Testar página `/gastronomia/ba/salvador`
2. ✅ Verificar se os 5 restaurantes aparecem
3. ✅ Testar filtros (tipo de culinária, faixa de preço)
4. ✅ Testar busca por nome
5. ✅ Clicar em um restaurante e ver detalhes

---

**Tempo estimado**: 2 minutos
**Dificuldade**: Fácil (copiar e colar)
