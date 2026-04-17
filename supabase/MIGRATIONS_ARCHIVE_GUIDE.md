# Guia de Arquivamento de Migrations

> Documento de governança para migrations antigas
>
> Data-base: Abril 2026
> Status: Ativo

---

## Estrutura de Diretórios

```
supabase/
├── migrations/           # Migrations ativas (produção)
│   ├── 20260416190000_migrate_vaga_status_enum.sql
│   └── ... (últimas 24 migrations)
├── migrations_old/       # Migrations arquivadas (histórico)
│   └── ... (200+ migrations legadas)
└── migrations_menu_skip/ # Migrations específicas de skip
```

---

## Política de Arquivamento

### Quando Arquivar

Migrations devem ser movidas para `migrations_old/` quando:

1. **Já aplicadas em produção** há mais de 30 dias
2. **Não são mais referenciadas** por código atual
3. **Têm versões mais recentes** que as substituíram
4. **São de desenvolvimento/teste** concluídos

### Quando Manter em `migrations/`

1. **Pendentes de aplicação** em produção
2. **Referenciadas por código** (ex: scripts de setup)
3. **Últimas 20 migrations** (histórico recente)
4. **Migrations críticas** de segurança/estrutura

---

## Processo de Arquivamento

### 1. Verificar Status

```bash
# Verificar se migration já foi aplicada
supabase migration list

# Verificar no banco
SELECT * FROM supabase_migrations.schema_migrations 
WHERE version = '2026XXXXXXXXXXXX';
```

### 2. Mover para Archive

```bash
# Mover migration antiga
mv supabase/migrations/2026XXXXXXXXXXXX_nome.sql \
   supabase/migrations_old/2026XXXXXXXXXXXX_nome.sql
```

### 3. Atualizar Índice

Documentar no `migrations_old/README.md`:
- Data de arquivamento
- Motivo
- Migration substituta (se houver)

### 4. Commit

```bash
git add supabase/migrations_old/
git commit -m "chore: arquiva migrations antigas de [módulo]"
```

---

## Índice de Migrations Arquivadas

### Geographic Foundation (Março 2026)

| Migration | Data | Status | Notas |
|-----------|------|--------|-------|
| `20260324000001_create_locations_table.sql` | 2026-03-24 | ✅ Arquivada | Base territorial |
| `20260324000002_create_locations_triggers.sql` | 2026-03-24 | ✅ Arquivada | Triggers de validação |
| `20260324000003_create_service_areas_table.sql` | 2026-03-24 | ✅ Arquivada | Áreas de cobertura |
| `20260324000004_create_module_rollouts_table.sql` | 2026-03-24 | ✅ Arquivada | Rollout de módulos |
| `20260324000005_seed_initial_locations.sql` | 2026-03-24 | ✅ Arquivada | Seeds de cidades |

### Módulos de Negócio (Abril 2026)

| Migration | Data | Status | Notas |
|-----------|------|--------|-------|
| `20260413100000_create_business_subscriptions.sql` | 2026-04-13 | ✅ Arquivada | Sistema de assinaturas |
| `20260413130000_create_business_hours.sql` | 2026-04-13 | ✅ Arquivada | Horários comerciais |
| `20260413160000_create_delivery_system.sql` | 2026-04-13 | ✅ Arquivada | Sistema de entregas |

---

## Migrations Ativas (Não Arquivar)

As seguintes migrations **nunca devem ser arquivadas**:

1. **Migrations de segurança**: RLS, políticas de acesso
2. **Migrations de correção**: Hotfixes de produção
3. **Migrations de estrutura base**: Tabelas core (users, profiles)
4. **Últimas 10 migrations**: Histórico recente necessário

---

## Recuperação de Migrations Arquivadas

Se necessário, migrations arquivadas podem ser:

1. **Restauradas** para `migrations/` temporariamente
2. **Referenciadas** em scripts de rollback
3. **Consultadas** para documentação histórica

```bash
# Restaurar migration arquivada
cp supabase/migrations_old/2026XXXXXXXXXXXX_nome.sql \
   supabase/migrations/2026XXXXXXXXXXXX_nome_restored.sql
```

---

## Scripts de Manutenção

### Limpeza Automática (Planejado)

```bash
# Script para identificar migrations candidatas ao arquivamento
# (requer validação manual antes de execução)
node scripts/identify-stale-migrations.mjs
```

### Validação

```bash
# Validar integridade das migrations ativas
npm run validate:migrations
```

---

## Referências

- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [docs/MIGRATIONS.md](../docs/MIGRATIONS.md)
- `supabase/migrations/README.md`

---

## Histórico

| Data | Mudança | Autor |
|------|---------|-------|
| 2026-04-16 | Criação do guia de arquivamento | Cascade |
| 2026-04-16 | Reorganização de migrations_old/ | Cascade |

---

*Documento mantido pela equipe de DevOps*
