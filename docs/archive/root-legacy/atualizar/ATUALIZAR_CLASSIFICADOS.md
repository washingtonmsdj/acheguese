# Atualização dos Classificados no Banco

## Problema Identificado

Os classificados reais no banco estão com dados incompletos:
- ❌ Títulos genéricos ou vazios
- ❌ Categorias não padronizadas
- ❌ Subcategorias ausentes
- ❌ Slugs não gerados

Enquanto os mocks têm dados completos:
- ✅ "Sofá 3 Lugares Novo" - Móveis
- ✅ "iPhone 12 Pro 128GB" - Eletrônicos

## Solução

Criadas 2 migrations para resolver:

### 1. `20250130_update_classifieds_data.sql`
Atualiza classificados existentes:
- Padroniza categorias (beleza_saude, moveis, eletronicos, etc.)
- Gera category_slug e subcategory_slug
- Preenche subcategorias vazias com "geral"
- Gera slugs a partir dos títulos
- Melhora títulos genéricos baseado na categoria e preço

### 2. `20250130_seed_better_classifieds.sql`
Adiciona 14 classificados de exemplo com dados completos:

**Móveis (3):**
- Sofá 3 Lugares Retrátil Cinza - R$ 1.200
- Mesa de Jantar 6 Lugares Madeira Maciça - R$ 2.500
- Guarda-Roupa 6 Portas com Espelho - R$ 1.800

**Eletrônicos (3):**
- iPhone 13 Pro 256GB Azul Sierra - R$ 4.200
- Notebook Dell Inspiron i5 11ª Geração - R$ 2.800
- Smart TV Samsung 55" 4K Crystal UHD - R$ 2.200

**Veículos (2):**
- Honda Civic 2018 Automático Completo - R$ 85.000
- Yamaha Fazer 250 2020 Vermelha - R$ 12.500

**Moda (2):**
- Tênis Nike Air Max 90 Branco Tam 42 - R$ 450
- Bolsa Michael Kors Original Caramelo - R$ 890

**Esportes (2):**
- Bicicleta Speed Caloi 10 Marchas - R$ 1.400
- Esteira Ergométrica Dream Fitness - R$ 1.800

**Beleza e Saúde (2):**
- Kit Shampoo e Condicionador Profissional - R$ 180
- Perfume Importado 212 VIP Men 100ml - R$ 320

## Como Aplicar

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar manualmente
supabase db execute -f supabase/migrations/20250130_update_classifieds_data.sql
supabase db execute -f supabase/migrations/20250130_seed_better_classifieds.sql
```

### Opção 2: Via Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Copie o conteúdo de `20250130_update_classifieds_data.sql`
4. Execute
5. Copie o conteúdo de `20250130_seed_better_classifieds.sql`
6. Execute

### Opção 3: Via SQL Direto

```sql
-- Conecte ao banco e execute os arquivos em ordem:
\i supabase/migrations/20250130_update_classifieds_data.sql
\i supabase/migrations/20250130_seed_better_classifieds.sql
```

## Verificação

Após aplicar as migrations, verifique:

```sql
-- Ver classificados atualizados
SELECT 
  titulo,
  category,
  category_slug,
  subcategory,
  subcategory_slug,
  price,
  slug
FROM classifieds
ORDER BY created_at DESC
LIMIT 10;

-- Contar por categoria
SELECT 
  category,
  COUNT(*) as total
FROM classifieds
GROUP BY category
ORDER BY total DESC;

-- Verificar se há dados incompletos
SELECT COUNT(*) as incompletos
FROM classifieds
WHERE 
  titulo IS NULL 
  OR titulo = ''
  OR category IS NULL
  OR subcategory IS NULL
  OR slug IS NULL;
```

## Resultado Esperado

Após aplicar as migrations, a página `/cidade` deve exibir:

**Classificados Recentes (6 cards):**
- 📋 MOCK - Sofá 3 Lugares Novo (Móveis, R$ 1.200)
- 📋 MOCK - iPhone 12 Pro 128GB (Eletrônicos, R$ 2.800)
- ✅ REAL - iPhone 13 Pro 256GB (Eletrônicos, R$ 4.200)
- ✅ REAL - Notebook Dell Inspiron i5 (Computadores, R$ 2.800)
- ✅ REAL - Smart TV Samsung 55" (TV e Áudio, R$ 2.200)
- ✅ REAL - Honda Civic 2018 (Carros, R$ 85.000)

Todos com:
- ✅ Título descritivo
- ✅ Categoria e subcategoria
- ✅ Preço formatado
- ✅ Slug para URL canônica

## Estrutura de Categorias

```
moveis/
  ├── sala
  ├── sala_jantar
  ├── quarto
  └── geral

eletronicos/
  ├── celulares
  ├── computadores
  ├── tv_audio
  └── geral

veiculos/
  ├── carros
  ├── motos
  └── geral

moda/
  ├── calcados
  ├── bolsas_acessorios
  ├── roupas
  └── geral

esportes/
  ├── ciclismo
  ├── fitness
  └── geral

beleza_saude/
  ├── cabelos
  ├── perfumaria
  ├── maquiagem
  └── geral
```

## Manutenção Futura

Para adicionar novos classificados com dados completos:

```sql
INSERT INTO classifieds (
  titulo,
  descricao,
  price,
  category,
  category_slug,
  subcategory,
  subcategory_slug,
  slug,
  status,
  user_id,
  geographic_path
) VALUES (
  'Título Descritivo do Produto',
  'Descrição detalhada...',
  1500,
  'categoria',
  'categoria-slug',
  'subcategoria',
  'subcategoria-slug',
  'titulo-produto-slug',
  'active',
  'user-uuid',
  '/br/ba/salvador'
);
```

## Troubleshooting

### Erro: "relation classifieds does not exist"
- Verifique se a tabela existe: `\dt classifieds`
- Aplique migrations anteriores primeiro

### Erro: "column does not exist"
- Verifique a estrutura da tabela: `\d classifieds`
- Ajuste os nomes das colunas na migration

### Dados não aparecem na página
- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique o console do navegador por erros
- Confirme que os dados estão no banco: `SELECT * FROM classifieds LIMIT 5;`

## Próximos Passos

1. ✅ Aplicar migrations
2. ✅ Verificar dados no banco
3. ✅ Testar página `/cidade`
4. ⏳ Adicionar fotos aos classificados
5. ⏳ Implementar busca por categoria
6. ⏳ Adicionar filtros de preço
