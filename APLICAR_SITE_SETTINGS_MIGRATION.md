# Como Aplicar a Migration do Site Settings

## Problema
A função RPC `get_all_site_settings` não existe no banco de dados, causando erro 404.

## Solução

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo: `supabase/migrations/20260422000000_create_site_settings.sql`
6. Clique em **Run** ou pressione `Ctrl+Enter`

### Opção 2: Via CLI Local

```bash
# Conectar ao banco remoto
npx supabase db push --include-all

# Se houver erro em migrations anteriores, aplicar manualmente via dashboard
```

### Opção 3: Via psql (se tiver acesso direto)

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < supabase/migrations/20260422000000_create_site_settings.sql
```

## O que a Migration Cria

### 1. Tabela `site_settings`
```sql
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  created_at TIMESTAMPTZ
);
```

### 2. Funções RPC

#### `get_all_site_settings()`
Retorna todas as configurações do site.

#### `get_site_setting(p_key TEXT)`
Retorna uma configuração específica por chave.

#### `upsert_site_setting(p_key TEXT, p_value JSONB, p_description TEXT)`
Insere ou atualiza uma configuração (apenas admins).

### 3. Políticas RLS

- **Leitura pública**: Qualquer um pode ler as configurações
- **Escrita admin**: Apenas admins podem modificar

### 4. Dados Iniciais (Seed)

```sql
INSERT INTO site_settings (key, value, description) VALUES
  ('logo_url', '""', 'URL da logo principal'),
  ('logo_mobile_url', '""', 'URL da logo mobile'),
  ('favicon_url', '""', 'URL do favicon'),
  ('primary_color', '"#3b82f6"', 'Cor primária'),
  ('secondary_color', '"#8b5cf6"', 'Cor secundária'),
  ('site_name', '"Achegue-se"', 'Nome do site'),
  ('site_tagline', '"Super App de Bairro"', 'Slogan');
```

## Verificar se Foi Aplicada

Execute no SQL Editor:

```sql
-- Verificar se a tabela existe
SELECT * FROM public.site_settings LIMIT 5;

-- Verificar se a função existe
SELECT * FROM public.get_all_site_settings();

-- Testar inserção (como admin)
SELECT public.upsert_site_setting(
  'test_key',
  '"test_value"'::jsonb,
  'Teste de configuração'
);
```

## Troubleshooting

### Erro: "relation site_settings does not exist"
- A tabela não foi criada
- Execute a migration novamente

### Erro: "function get_all_site_settings does not exist"
- A função não foi criada
- Execute a migration novamente

### Erro: "permission denied"
- Você não tem permissão de admin
- Verifique a tabela `user_roles`

### Erro em migrations anteriores
Se houver erro ao aplicar com `--include-all`, você tem 2 opções:

1. **Corrigir as migrations anteriores** (recomendado)
2. **Aplicar apenas esta migration via dashboard** (rápido)

## Após Aplicar

1. Recarregue a página `/admin/branding`
2. O erro 404 deve desaparecer
3. A página deve carregar normalmente
4. Você poderá fazer upload de logo e favicon

## Arquivo da Migration

Localização: `supabase/migrations/20260422000000_create_site_settings.sql`

Tamanho: ~4KB
Linhas: ~145

## Status

- ✅ Migration criada
- ❌ Migration não aplicada no banco
- ⏳ Aguardando aplicação manual

## Próximos Passos

1. Aplicar a migration via dashboard
2. Verificar se funcionou
3. Testar upload de logo
4. Confirmar que não há mais erros 404
