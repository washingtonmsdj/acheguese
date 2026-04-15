# 📋 Guia: Aplicar Migrações Manualmente no Supabase

## ✅ Status das Correções

### Código TypeScript
- ✅ **Mock IDs**: Validação permite IDs mock em DEV (`src/shared/validation/validators/common.validators.ts`)
- ✅ **Coordenadas MapLibre**: Validação robusta com `isNaN()` e `isFinite()` (`src/modules/gastronomy/services/menu.queries.ts`)

### SQL Migrations
- ✅ **RPC Functions**: `get_business_reviews` e `can_user_review_business` criadas
- ✅ **Locations**: Todos os campos obrigatórios incluídos (`full_name`, `slug`, `status`, `geographic_path`)

## 🎯 Passo a Passo para Aplicar

### 1. Acessar Supabase Dashboard
```
1. Abra https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "SQL Editor" no menu lateral
```

### 2. Aplicar o SQL Consolidado
```
1. Abra o arquivo: APLICAR_NO_SUPABASE_SQL_EDITOR.sql
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em "Run" (ou Ctrl+Enter)
```

### 3. Verificar Sucesso
Execute o script de verificação: `VERIFICAR_LOCATIONS.sql`

**Resultado esperado:**
```sql
-- Deve retornar 6 locations:
id                                   | name         | full_name                      | type     | geographic_path
-------------------------------------|--------------|--------------------------------|----------|---------------------------
00000000-0000-0000-0000-000000000001 | Bahia        | Bahia                          | state    | /bahia
00000000-0000-0000-0000-000000000002 | Salvador     | Salvador, Bahia                | city     | /bahia/salvador
00000000-0000-0000-0000-000000000003 | Itaigara     | Itaigara, Salvador, Bahia      | district | /bahia/salvador/itaigara
00000000-0000-0000-0000-000000000004 | Pelourinho   | Pelourinho, Salvador, Bahia    | district | /bahia/salvador/pelourinho
00000000-0000-0000-0000-000000000005 | Barra        | Barra, Salvador, Bahia         | district | /bahia/salvador/barra
00000000-0000-0000-0000-000000000006 | Rio Vermelho | Rio Vermelho, Salvador, Bahia  | district | /bahia/salvador/rio-vermelho
```

### 4. Testar na Aplicação
```bash
# Reiniciar o servidor de desenvolvimento
npm run dev
```

**Verificar no console do navegador:**
- ❌ Antes: Erros de RPC functions não encontradas
- ❌ Antes: Erros de locations não encontradas
- ✅ Agora: Console limpo, sem erros

## 📁 Arquivos Criados/Modificados

### Código TypeScript (já aplicado)
- `src/shared/validation/validators/common.validators.ts`
- `src/modules/gastronomy/services/menu.queries.ts`

### SQL Migrations (precisa aplicar manualmente)
- `supabase/migrations/20260413000001_fix_review_rpc_functions.sql`
- `supabase/migrations/20260413000002_seed_locations.sql`
- `APLICAR_NO_SUPABASE_SQL_EDITOR.sql` ⭐ **USAR ESTE**

### Documentação
- `CORRECOES_APLICADAS.md` - Histórico de correções
- `CORRECAO_FINAL_LOCATIONS.md` - Detalhes da correção de locations
- `VERIFICAR_LOCATIONS.sql` - Script de verificação
- `APLICAR_MIGRACOES_MANUAL.md` - Este guia

## 🔍 Troubleshooting

### Erro: "function get_business_reviews does not exist"
**Solução:** Execute `APLICAR_NO_SUPABASE_SQL_EDITOR.sql` novamente

### Erro: "relation locations does not exist"
**Causa:** Tabela locations não foi criada
**Solução:** Execute a migration `20260324000001_create_locations_table.sql` primeiro

### Erro: "null value in column violates not-null constraint"
**Causa:** Versão antiga do SQL sem todos os campos
**Solução:** Use a versão mais recente de `APLICAR_NO_SUPABASE_SQL_EDITOR.sql`

## ✨ Resultado Final

Após aplicar todas as correções:

1. ✅ Mock IDs aceitos em desenvolvimento
2. ✅ Coordenadas MapLibre validadas corretamente
3. ✅ RPC functions de reviews funcionando
4. ✅ Locations hierárquicas completas
5. ✅ Console do navegador limpo
6. ✅ Aplicação funcionando sem "gambiarras"

## 🚀 Próximos Passos (Opcional)

1. Adicionar mais locations conforme necessário
2. Implementar testes automatizados para validações
3. Configurar CI/CD para aplicar migrations automaticamente
4. Documentar processo de seed de dados para outros ambientes
