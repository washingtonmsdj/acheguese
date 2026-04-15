# Instruções: Aplicar Migration de Alcance de Classificados

## ⚠️ IMPORTANTE: Migration Pendente

A funcionalidade de alcance global de classificados requer uma migration no banco de dados que ainda não foi aplicada.

## Opção 1: Aplicar via Interface (Recomendado)

1. Acesse a aplicação como administrador
2. Navegue para: `/admin/apply-migration`
3. Clique no botão "Aplicar Migration"
4. Aguarde a confirmação de sucesso

## Opção 2: Aplicar Manualmente no Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o SQL abaixo:

```sql
-- Migration: Add reach fields to classifieds
ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS reach TEXT DEFAULT 'district' 
  CHECK (reach IN ('district', 'city', 'state'));

ALTER TABLE classifieds 
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_classifieds_reach ON classifieds(reach) WHERE reach != 'district';
CREATE INDEX IF NOT EXISTS idx_classifieds_featured ON classifieds(is_featured) WHERE is_featured = TRUE;

UPDATE classifieds 
SET reach = 'district' 
WHERE reach IS NULL;
```

5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Verifique se apareceu "Success. No rows returned"

## O que a Migration Faz

### Campos Adicionados

1. **reach** (TEXT)
   - Valores: 'district', 'city', 'state'
   - Default: 'district'
   - Define o alcance do anúncio

2. **is_featured** (BOOLEAN)
   - Default: false
   - Marca anúncios em destaque

### Índices Criados

- `idx_classifieds_reach`: Para queries de anúncios com reach != 'district'
- `idx_classifieds_featured`: Para queries de anúncios em destaque

### Dados Atualizados

- Todos os anúncios existentes recebem `reach = 'district'`

## Verificar se a Migration Foi Aplicada

Execute no SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'classifieds'
  AND column_name IN ('reach', 'is_featured');
```

Deve retornar 2 linhas mostrando as colunas.

## Após Aplicar a Migration

1. A funcionalidade de alcance global estará ativa
2. Anúncios com `reach='city'` aparecerão em todos os bairros da cidade
3. O aviso de "bairro sem anúncios" funcionará corretamente
4. Você pode remover a rota temporária `/admin/apply-migration` do código

## Remover Rota Temporária (Após Aplicar)

Em `src/App.tsx`, remova:

```typescript
// Remover estas linhas:
const ApplyClassifiedReachMigration = lazy(() => import("./scripts/ApplyClassifiedReachMigration").then(m => ({ default: m.ApplyClassifiedReachMigration })));

// E também:
<Route path="apply-migration" element={<ApplyClassifiedReachMigration />} />
```

## Troubleshooting

### Erro: "column already exists"
- A migration já foi aplicada anteriormente
- Verifique se as colunas existem com a query de verificação acima

### Erro: "permission denied"
- Use o service_role key no Supabase Dashboard
- Ou execute como superusuário do PostgreSQL

### Erro: "relation does not exist"
- Verifique se a tabela `classifieds` existe
- Pode ser necessário aplicar migrations anteriores primeiro

## Arquivos Relacionados

- Migration SQL: `supabase/migrations/20240102000000_add_classified_reach_fields.sql`
- Componente de aplicação: `src/scripts/ApplyClassifiedReachMigration.tsx`
- Service atualizado: `src/core/classifieds/services/ClassifiedService.ts`
- Página atualizada: `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`
