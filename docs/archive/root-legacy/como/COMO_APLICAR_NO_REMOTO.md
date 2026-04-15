# Como Aplicar a Migration no Banco Remoto

## Opção 1: Via Supabase Studio (Mais Fácil) ⭐

### Passo 1: Acessar o SQL Editor

1. Abra o navegador
2. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
3. Faça login (se necessário)
4. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o SQL

1. Clique em **New Query** (ou use uma query existente)
2. Copie TODO o conteúdo do arquivo `APLICAR_MIGRATION_ROLLOUTS.sql`
3. Cole no editor
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar o Resultado

Você deve ver uma tabela com 9 linhas mostrando todos os módulos:

```
module_key   | status
-------------|--------
ads          | active
business     | active
classifieds  | active
community    | active
events       | active  ← NOVO
gastronomy   | active  ← NOVO
jobs         | active  ← NOVO
mobility     | active
services     | active
```

Se aparecer isso, **SUCESSO!** ✅

---

## Opção 2: Via Supabase CLI

### Passo 1: Configurar Link com Projeto Remoto

```bash
# Fazer login no Supabase
supabase login

# Linkar com o projeto remoto
supabase link --project-ref xhdowzacfujckjelqhtd
```

### Passo 2: Aplicar Migration

```bash
# Aplicar todas as migrations pendentes
supabase db push
```

---

## Opção 3: Via psql (Linha de Comando)

Se você tiver o `psql` instalado:

```bash
# Conectar ao banco remoto
psql "postgresql://postgres:[PASSWORD]@db.xhdowzacfujckjelqhtd.supabase.co:5432/postgres"

# Copiar e colar o conteúdo de APLICAR_MIGRATION_ROLLOUTS.sql
```

---

## Validação Após Aplicar

### 1. Verificar no Banco

Execute no SQL Editor:

```sql
SELECT module_key, status 
FROM module_rollouts 
WHERE location_id = '00000000-0000-0000-0000-000000000010'
ORDER BY module_key;
```

**Esperado**: 9 linhas com todos os módulos ativos

### 2. Testar no App

1. Acesse: https://seu-app.com/ba/salvador/complexo-do-nordeste-de-amaralina
2. Clique em "Gastronomia" na sidebar
3. **ANTES**: Seletor mudava para Salvador ❌
4. **DEPOIS**: Seletor permanece no Complexo ✅

### 3. Verificar Logs do Console (F12)

**ANTES** (errado):
```
[useTerritoryFilter] GROUP: {activeMemberIds: Array(0), scope: 'none'}
```

**DEPOIS** (correto):
```
[useTerritoryFilter] GROUP: {activeMemberIds: Array(4), scope: 'group'}
```

---

## Troubleshooting

### Erro: "constraint already exists"

Ignore, significa que o constraint já foi atualizado.

### Erro: "duplicate key value violates unique constraint"

Ignore, significa que os rollouts já existem no banco.

### Erro: "permission denied"

Você precisa estar conectado com permissões de admin. Use o SQL Editor do Supabase Studio.

---

## Arquivos Criados

- ✅ `APLICAR_MIGRATION_ROLLOUTS.sql` - SQL para executar
- ✅ `COMO_APLICAR_NO_REMOTO.md` - Este arquivo (instruções)
- ✅ `supabase/migrations/20260402000001_add_gastronomy_events_jobs_modules.sql` - Migration oficial

---

## Próximos Passos Após Aplicar

1. ✅ Testar navegação entre módulos
2. ✅ Verificar que seletor permanece estável
3. ✅ Corrigir os 16 problemas de hardcoded pendentes (ver `AUDITORIA_COMPLETA_HARDCODED_SSOT.md`)

---

**Recomendação**: Use a **Opção 1** (Supabase Studio) - é a mais fácil e segura! 🎯
