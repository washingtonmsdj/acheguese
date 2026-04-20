# 🚀 Aplicar Migration Vagas Nível AAA

Guia rápido para aplicar a migration do módulo de vagas no Supabase.

---

## 📋 Pré-requisitos

1. **Supabase CLI instalado**:
   ```bash
   npm install -g supabase
   ```

2. **Projeto vinculado**:
   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   ```

3. **Login realizado**:
   ```bash
   supabase login
   ```

---

## 🎯 Método 1: Aplicar via Supabase CLI (Recomendado)

### Passo 1: Verificar status atual
```bash
supabase db status
```

### Passo 2: Aplicar migration específica
```bash
supabase db push --include-all
```

Ou, se quiser aplicar apenas esta migration:
```bash
psql $DATABASE_URL -f supabase/migrations/20260416170000_vagas_domain_aaa.sql
```

### Passo 3: Verificar se aplicou corretamente
```bash
supabase db dump --data-only --table vagas
```

---

## 🎯 Método 2: Aplicar via Dashboard do Supabase

1. Acesse: https://app.supabase.com/project/_/sql
2. Cole o conteúdo do arquivo `supabase/migrations/20260416170000_vagas_domain_aaa.sql`
3. Clique em **Run**

---

## 🌱 Passo 2: Popular com Dados de Exemplo (Seed)

Após aplicar a migration, execute o seed para ter vagas de exemplo:

```bash
psql $DATABASE_URL -f supabase/seed_vagas_aaa.sql
```

> ⚠️ **Importante**: O seed requer que você já tenha:
> - Empresas cadastradas na tabela `empresas`
> - Localizações na tabela `locations`
> - Perfis na tabela `profiles`

Se não tiver dados, crie-os primeiro ou modifique o seed para usar IDs fixos.

---

## ✅ Verificação

Após aplicar, verifique se tudo funcionou:

### 1. Verificar enums criados
```sql
SELECT typname FROM pg_type WHERE typname LIKE 'vaga_%';
```

Deve retornar:
- `vaga_status`
- `vaga_contrato`
- `vaga_modalidade`
- `vaga_nivel`
- `vaga_urgencia`
- `vaga_application_channel`
- `vaga_salary_mode`
- `vaga_highlight_type`

### 2. Verificar tabela criada
```sql
\dt vagas
\dt candidaturas
```

### 3. Verificar RLS policies
```sql
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'vagas';
```

Deve retornar 6 policies.

### 4. Verificar índices
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'vagas';
```

Deve retornar 13 índices.

---

## 🔧 Troubleshooting

### Erro: "relation already exists"
**Solução**: A migration já foi aplicada ou há conflito. Verifique:
```sql
SELECT * FROM pg_tables WHERE tablename = 'vagas';
```

### Erro: "type already exists"
**Solução**: Os enums já existem. Você pode:
1. Dropar tudo e recriar (CUIDADO: perde dados)
2. Ou pular a criação de enums na migration

### Erro: "permission denied"
**Solução**: Verifique se está logado com usuário admin ou service_role.

---

## 📚 Próximos Passos

Após aplicar a migration com sucesso:

1. ✅ **Executar seed** (se desejado dados de exemplo)
2. ✅ **Remover módulo jobs**: Execute `scripts/remove_jobs_module.ps1`
3. ✅ **Testar aplicação**: `npm run dev` e navegue para `/vagas/sp/sao-paulo`
4. ✅ **Publicar vaga**: Teste o fluxo de criação de vaga

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique os logs: `supabase db logs`
2. Consulte a documentação: `VAGAS_MODULO_AAA_ENTREGUE.md`
3. Verifique a integridade: Execute `supabase db lint`

---

**Status**: Pronto para aplicação ⏳  
**Migration**: `20260416170000_vagas_domain_aaa.sql`  
**Seed**: `seed_vagas_aaa.sql`
