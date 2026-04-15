# 🚀 Aplicar Migration de Alcance de Classificados - MANUAL

## ⚠️ IMPORTANTE
A migration precisa ser aplicada MANUALMENTE no Supabase Dashboard porque não há função RPC disponível para execução automática via script.

## 📋 Passo a Passo

### 1. Acesse o Supabase Dashboard
Abra o link direto para o SQL Editor:
```
https://xhdowzacfujckjelqhtd.supabase.co/project/xhdowzacfujckjelqhtd/sql
```

### 2. Crie uma Nova Query
- Clique no botão **"New Query"** no canto superior direito
- Ou use o atalho: **Ctrl + Enter**

### 3. Cole o SQL Abaixo

```sql
-- Migration: Add reach fields to classifieds
-- Permite classificados com alcance global (cidade inteira) ou local (bairro específico)

-- Adicionar campo de alcance
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS reach TEXT DEFAULT 'district' 
  CHECK (reach IN ('district', 'city', 'state'));

-- Adicionar campo de destaque
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Comentários
COMMENT ON COLUMN classifieds.reach IS 'Alcance do anúncio: district (bairro), city (cidade inteira), state (estado inteiro)';
COMMENT ON COLUMN classifieds.is_featured IS 'Anúncio em destaque (aparece em toda a cidade/estado)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_classifieds_reach ON classifieds(reach) WHERE reach != 'district';
CREATE INDEX IF NOT EXISTS idx_classifieds_featured ON classifieds(is_featured) WHERE is_featured = TRUE;

-- Atualizar anúncios existentes para ter alcance de bairro
UPDATE classifieds 
SET reach = 'district' 
WHERE reach IS NULL;
```

### 4. Execute a Query
- Clique no botão **"Run"** (ou pressione **Ctrl + Enter**)
- Aguarde a mensagem: **"Success. No rows returned"**

### 5. Verifique se Foi Aplicada

Execute esta query para confirmar:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'classifieds'
  AND column_name IN ('reach', 'is_featured');
```

Deve retornar 2 linhas:
- `reach` | `text` | `'district'::text`
- `is_featured` | `boolean` | `false`

## ✅ Após Aplicar

1. **Teste a aplicação**: Navegue para `/classificados` e verifique se não há mais erros
2. **Remova rotas temporárias**: Delete a rota `/admin/apply-migration` do `App.tsx`
3. **Teste funcionalidades**:
   - Navegue para um bairro sem anúncios → deve mostrar aviso
   - Crie um anúncio com `reach='city'` → deve aparecer em todos os bairros
   - Verifique que anúncios normais aparecem apenas no bairro específico

## 🔧 Funcionalidades Ativadas

### 1. Alcance Global
- Anúncios com `reach='city'` aparecem em todos os bairros da cidade
- Anúncios com `reach='state'` aparecem em todas as cidades do estado
- Anúncios com `reach='district'` (padrão) aparecem apenas no bairro

### 2. Aviso de Bairro Vazio
- Quando um bairro não tem anúncios, mostra card com:
  - Mensagem explicativa
  - Botão para ver anúncios da cidade inteira
  - Botão para criar o primeiro anúncio

### 3. Anúncios em Destaque
- Campo `is_featured` permite marcar anúncios especiais
- Pode ser usado futuramente para destacar anúncios pagos

## 🐛 Troubleshooting

### Erro: "column already exists"
✅ A migration já foi aplicada! Pode ignorar.

### Erro: "permission denied"
❌ Você precisa estar logado como admin no Supabase Dashboard.

### Erro: "relation does not exist"
❌ A tabela `classifieds` não existe. Verifique se as migrations anteriores foram aplicadas.

## 📁 Arquivos Relacionados

- Migration SQL: `supabase/migrations/20240102000000_add_classified_reach_fields.sql`
- Service atualizado: `src/core/classifieds/services/ClassifiedService.ts`
- Página atualizada: `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`
- Script Node.js (não funcionou): `scripts/apply-classified-reach-migration.mjs`

## 🎯 Próximos Passos

Após aplicar a migration:

1. Remova arquivos temporários:
   - `src/scripts/ApplyClassifiedReachMigration.tsx`
   - Rota `/admin/apply-migration` do `App.tsx`

2. Teste a funcionalidade:
   ```bash
   npm run dev
   ```

3. Navegue para um bairro e teste:
   - `/classificados/ba/salvador/barra` (deve funcionar)
   - Mude para um bairro sem anúncios (deve mostrar aviso)

4. Crie anúncios de teste com diferentes alcances no Supabase Dashboard:
   ```sql
   -- Anúncio global (aparece em toda a cidade)
   UPDATE classifieds 
   SET reach = 'city', is_featured = true 
   WHERE id = 'algum-id-aqui';
   ```
