# 🎭 Instruções: Popular Dados Mock de Gastronomia

**Objetivo**: Ver o resultado da página de gastronomia gerada pelo Lovable sem alterar código

---

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard
https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor

### 2. Abra o SQL Editor
- Clique em "SQL Editor" no menu lateral
- Clique em "New Query"

### 3. Copie e Execute o Seed
- Abra o arquivo: `supabase/seed_gastronomy_mock.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor
- Clique em "Run" (ou pressione Ctrl+Enter)

### 4. Aguarde a Execução
- O script vai criar 5 restaurantes
- Com perfis gastronômicos completos
- 3 com cardápios detalhados
- Promoções ativas

### 5. Verifique os Dados
Execute esta query para confirmar:

```sql
SELECT 
  bd.business_name,
  gp.cuisine_type,
  gp.price_range,
  COUNT(DISTINCT mi.id) as total_items
FROM business_data bd
JOIN gastronomy_profiles gp ON gp.business_id = bd.id
LEFT JOIN menus m ON m.business_id = bd.id
LEFT JOIN menu_categories mc ON mc.menu_id = m.id
LEFT JOIN menu_items mi ON mi.category_id = mc.id
GROUP BY bd.business_name, gp.cuisine_type, gp.price_range
ORDER BY bd.business_name;
```

Resultado esperado:
```
business_name          | cuisine_type | price_range | total_items
-----------------------|--------------|-------------|------------
Acarajé da Dinha       | brasileira   | $           | 5
Burger Station         | americana    | $$          | 0
Cantina da Nonna       | italiana     | $$          | 0
Pizzaria Bella Napoli  | italiana     | $$          | 4
Sushi House Salvador   | japonesa     | $$$         | 4
```

---

## 🎨 O Que Foi Criado

### 5 Restaurantes Mock

1. **Acarajé da Dinha** 🇧🇷
   - Culinária: Brasileira/Baiana
   - Preço: $
   - 5 itens no cardápio
   - Delivery disponível
   - Rating: 4.8 ⭐

2. **Pizzaria Bella Napoli** 🇮🇹
   - Culinária: Italiana
   - Preço: $$
   - 4 pizzas no cardápio
   - Promoção: Happy Hour 20% OFF
   - Rating: 4.9 ⭐

3. **Sushi House Salvador** 🇯🇵
   - Culinária: Japonesa
   - Preço: $$$
   - 4 itens no cardápio
   - Rodízio premium
   - Rating: 4.7 ⭐

4. **Burger Station** 🍔
   - Culinária: Americana
   - Preço: $$
   - Sem cardápio ainda
   - Rating: 4.6 ⭐

5. **Cantina da Nonna** 🍝
   - Culinária: Italiana
   - Preço: $$
   - Sem cardápio ainda
   - Rating: 4.9 ⭐

---

## 🌐 Teste no Browser

Após executar o seed, acesse:

```
http://localhost:8080/gastronomia/ba/salvador
```

### O Que Você Deve Ver

✅ **Hero Section**: Banner de gastronomia  
✅ **Filtros**: Tipo de culinária, preço, delivery  
✅ **Cards de Restaurantes**: 5 restaurantes listados  
✅ **Badges**: Premium, Verified, Delivery  
✅ **Ratings**: Estrelas e número de avaliações  
✅ **Informações**: Horário, telefone, endereço  
✅ **CTAs**: Botões de ação (ver cardápio, delivery, etc)  

---

## 🔍 Detalhes dos Dados Mock

### Características Incluídas

- ✅ Nomes realistas de restaurantes
- ✅ Descrições atrativas
- ✅ Endereços em Salvador
- ✅ Coordenadas GPS reais
- ✅ Telefones e WhatsApp
- ✅ Instagram handles
- ✅ Horários de funcionamento completos
- ✅ Ratings e reviews
- ✅ Tipos de culinária variados
- ✅ Faixas de preço diferentes
- ✅ Recursos (delivery, wifi, estacionamento, etc)
- ✅ Cardápios com categorias
- ✅ Itens com preços e descrições
- ✅ Informações nutricionais
- ✅ Promoções ativas

---

## 🎯 Próximos Passos

Após visualizar a página:

1. **Avaliar o Design**: Ver como o Lovable estruturou a UI
2. **Testar Filtros**: Verificar se funcionam corretamente
3. **Testar Navegação**: Clicar nos cards dos restaurantes
4. **Ver Detalhes**: Verificar página de detalhe (se existir)
5. **Feedback**: Anotar o que gostou e o que precisa ajustar

---

## 🗑️ Limpar Dados Mock (Opcional)

Se quiser remover os dados de teste depois:

```sql
-- Deletar em ordem (respeitando FKs)
DELETE FROM menu_promotions WHERE business_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

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

---

## 📞 Suporte

Se encontrar algum erro ao executar o seed:

1. Verifique se a migration de gastronomia foi aplicada
2. Verifique se existe pelo menos 1 profile na tabela `profiles`
3. Verifique se existe location para Salvador
4. Consulte os logs de erro no Supabase Dashboard

---

**Aproveite para ver o trabalho do Lovable! 🎨**
