# Como Aplicar as Migrations de Pontos Turísticos

## Problema
A aplicação está tentando acessar a tabela `tourist_points_v2` que não existe no banco de dados, resultando em erro 404.

## Solução
As migrations já existem no projeto, mas precisam ser aplicadas no banco de dados Supabase.

## Migrations Necessárias

1. **20260331100001_create_guide_tourist_points_v2.sql**
   - Cria a tabela `tourist_points_v2` com modelo canônico territorial
   - Cria a tabela `tourist_point_media` para fotos
   - Configura RLS (Row Level Security)
   - Adiciona índices para performance

2. **20260331100002_seed_guide_tourist_points_salvador.sql**
   - Insere 10 pontos turísticos de Salvador como dados iniciais
   - Inclui fotos para cada ponto turístico

## Como Aplicar

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login no Supabase
supabase login

# 3. Linkar o projeto local com o projeto remoto
supabase link --project-ref xhdowzacfujckjelqhtd

# 4. Aplicar as migrations pendentes
supabase db push
```

### Opção 2: Via Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
2. Vá em **SQL Editor**
3. Copie e execute o conteúdo de cada migration na ordem:
   - Primeiro: `supabase/migrations/20260331100001_create_guide_tourist_points_v2.sql`
   - Depois: `supabase/migrations/20260331100002_seed_guide_tourist_points_salvador.sql`

### Opção 3: Via Script SQL Direto

Se preferir executar manualmente via SQL:

```sql
-- Execute o conteúdo completo de cada arquivo SQL no SQL Editor do Supabase
-- Ordem: 20260331100001 → 20260331100002
```

## Verificação

Após aplicar as migrations, verifique se funcionou:

```sql
-- No SQL Editor do Supabase, execute:
SELECT COUNT(*) FROM tourist_points_v2;
-- Deve retornar 10 (pontos turísticos de Salvador)

SELECT COUNT(*) FROM tourist_point_media;
-- Deve retornar 30 (3 fotos por ponto turístico)
```

## Resultado Esperado

Após aplicar as migrations:
- ✅ A página de pontos turísticos carregará sem erro 404
- ✅ 10 pontos turísticos de Salvador estarão disponíveis
- ✅ Cada ponto terá 3 fotos
- ✅ O filtro territorial funcionará corretamente

## Arquivos das Migrations

- `supabase/migrations/20260331100001_create_guide_tourist_points_v2.sql`
- `supabase/migrations/20260331100002_seed_guide_tourist_points_salvador.sql`
