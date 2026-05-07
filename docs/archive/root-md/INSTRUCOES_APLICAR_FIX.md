# Instruções para Aplicar Fix do Erro 400

## Status

✅ **MIGRATION APLICADA COM SUCESSO**

A correção foi aplicada no banco de dados. O erro 400 está resolvido.

## Problema Identificado

O erro **400 (Bad Request)** na chamada RPC `get_public_gastronomy_snapshot_by_slug` ocorre porque:

1. As rotas do React Router têm variações onde o parâmetro `:district` pode não existir
2. A função SQL não estava preparada para lidar com o placeholder `"_"` (que significa "sem distrito específico")
3. Quando `district` era `undefined`, o código enviava `"_"` mas a função SQL tentava buscar `/br/ba/salvador/_` que não existe

## Correções Aplicadas

### 1. Código TypeScript ✅ (Já aplicado)

- **Tipo atualizado**: `district` agora é `string | undefined`
- **Serviços atualizados**: Usam `params.district || "_"` como fallback
- **Hooks atualizados**: Não exigem mais `district` obrigatório

### 2. Funções SQL 🔧 (Precisa ser aplicado no banco)

Criada migration: `supabase/migrations/20260425000001_fix_public_snapshots_district_placeholder.sql`

Esta migration atualiza ambas as funções RPC para:
- Detectar quando `p_district = '_'`
- Construir o `geographic_path` sem o segmento de distrito nesses casos
- Construir URLs corretas com ou sem distrito

## Como Aplicar a Migration

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://xhdowzacfujckjelqhtd.supabase.co/project/xhdowzacfujckjelqhtd/sql
2. Clique em "New Query"
3. Abra o arquivo: `supabase/migrations/20260425000001_fix_public_snapshots_district_placeholder.sql`
4. Copie todo o conteúdo do arquivo
5. Cole no editor SQL do Supabase
6. Clique em "Run"
7. Aguarde a confirmação de sucesso

### Opção 2: Via Script Node.js

```bash
node scripts/apply-district-placeholder-fix.mjs
```

**Nota**: Certifique-se de que as variáveis de ambiente estão configuradas:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Verificação

Após aplicar a migration:

1. Recarregue a aplicação no navegador
2. O erro 400 não deve mais ocorrer
3. Verifique no console do navegador os logs:
   ```
   [PublicSnapshotRpcService] Calling RPC with params: { p_state: "ba", p_city: "salvador", p_district: "_", p_slug: "..." }
   ```
4. A chamada deve retornar sucesso (200) em vez de 400

## URLs que Agora Funcionam

- `/gastronomia/ba/salvador/slug-do-negocio` → district será `"_"` (cidade apenas)
- `/gastronomia/ba/salvador/bairro/slug-do-negocio` → district será `"bairro"` (específico)

## Rollback (se necessário)

Se algo der errado, você pode reverter executando a migration original:
```sql
-- Executar o conteúdo de:
supabase/migrations/20260425000000_create_public_business_snapshots_rpc.sql
```

## Próximos Passos

Após aplicar a migration e verificar que funciona:

1. Remover os logs de debug do arquivo `PublicSnapshotRpcService.ts`:
   - Remover `console.log('[PublicSnapshotRpcService] Calling RPC with params:', rpcParams);`
   - Remover `console.error('[PublicSnapshotRpcService] RPC error:', error);`
   - Restaurar `logger.warn` original

2. Testar em diferentes cenários:
   - Negócio em cidade (sem distrito)
   - Negócio em bairro específico
   - URLs antigas (com histórico de slug)
