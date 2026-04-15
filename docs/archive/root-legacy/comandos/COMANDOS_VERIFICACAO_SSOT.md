# 🔍 COMANDOS DE VERIFICAÇÃO - SSOT TERRITORIAL

**Objetivo:** Scripts para verificar e auditar o estado do SSOT territorial

---

## 1. VERIFICAR COBERTURA POR TABELA

```bash
npx supabase db query --linked --sql "
SELECT 'profiles' as tabela,
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  ROUND(COUNT(location_id)::NUMERIC / COUNT(*) * 100, 2) as cobertura_percent
FROM profiles
UNION ALL
SELECT 'posts',
  COUNT(*),
  COUNT(location_id),
  COUNT(*) - COUNT(location_id),
  ROUND(COUNT(location_id)::NUMERIC / COUNT(*) * 100, 2)
FROM posts
UNION ALL
SELECT 'tourist_points',
  COUNT(*),
  COUNT(location_id),
  COUNT(*) - COUNT(location_id),
  ROUND(COUNT(location_id)::NUMERIC / COUNT(*) * 100, 2)
FROM tourist_points;
" -o table
```

---

## 2. VERIFICAR FOREIGN KEYS

```bash
npx supabase db query --linked --sql "
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND kcu.column_name = 'location_id'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
" -o table
```

---

## 3. VERIFICAR REGISTROS INVÁLIDOS

```bash
npx supabase db query --linked --sql "
SELECT 'profiles' as tabela, COUNT(*) as invalidos
FROM profiles p
WHERE p.location_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = p.location_id)
UNION ALL
SELECT 'posts', COUNT(*)
FROM posts p
WHERE p.location_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = p.location_id)
UNION ALL
SELECT 'tourist_points', COUNT(*)
FROM tourist_points t
WHERE t.location_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = t.location_id);
" -o table
```

---

## 4. BUSCAR FILTROS POR STRING NO CÓDIGO

```bash
# Buscar .eq('city')
grep -r "\.eq('city'" src/ --include="*.ts" --include="*.tsx"

# Buscar .eq('neighborhood')
grep -r "\.eq('neighborhood'" src/ --include="*.ts" --include="*.tsx"

# Buscar .eq('state')
grep -r "\.eq('state'" src/ --include="*.ts" --include="*.tsx"
```

---

## 5. BUSCAR TIPOS LEGADOS

```bash
# Buscar interfaces com campos territoriais como string
grep -r "neighborhood.*:.*string" src/ --include="*.ts"
grep -r "city.*:.*string" src/ --include="*.ts"
grep -r "state.*:.*string" src/ --include="*.ts"
```

---

## 6. VERIFICAR INPUTS DE TEXTO LIVRE

```bash
# Buscar Input components com id territorial
grep -r '<Input.*id="neighborhood"' src/ --include="*.tsx"
grep -r '<Input.*id="city"' src/ --include="*.tsx"
grep -r '<Input.*id="state"' src/ --include="*.tsx"
```

---

## 7. VERIFICAR DIAGNÓSTICOS TYPESCRIPT

```typescript
// No código TypeScript
import { getDiagnostics } from '@/tools';

const files = [
  'src/modules/admin/pages/AdminPontosTuristicos.tsx',
  'src/core/tourist-points/services/TouristPointService.ts',
  'src/shared/components/TerritorialSelector.tsx'
];

const diagnostics = await getDiagnostics({ paths: files });
console.log(diagnostics);
```

---

## 8. EXECUTAR AUDITORIA COMPLETA

```bash
npx supabase db query --linked -f supabase/migrations/20260405000006_audit_territorial_data.sql
```

---

## 9. VERIFICAR CASO DE SUCESSO (tourist_points)

```bash
# Verificar cobertura
npx supabase db query --linked --sql "
SELECT 
  COUNT(*) as total,
  COUNT(location_id) as com_location_id,
  COUNT(*) - COUNT(location_id) as sem_location_id,
  COUNT(CASE WHEN location_id IS NULL AND neighborhood IS NOT NULL THEN 1 END) as conflito
FROM tourist_points;
" -o table

# Verificar foreign key
npx supabase db query --linked --sql "
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'tourist_points'
  AND constraint_name LIKE '%location_id%';
" -o table

# Verificar índice
npx supabase db query --linked --sql "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tourist_points'
  AND indexname LIKE '%location_id%';
" -o table
```

---

## 10. MONITORAR PROGRESSO SEMANAL

```bash
# Criar script de monitoramento
cat > monitor_ssot.sh << 'EOF'
#!/bin/bash
echo "=== MONITORAMENTO SSOT TERRITORIAL ==="
echo "Data: $(date)"
echo ""

echo "=== COBERTURA POR TABELA ==="
npx supabase db query --linked --sql "
SELECT 
  'profiles' as tabela,
  ROUND(COUNT(location_id)::NUMERIC / COUNT(*) * 100, 2) as cobertura
FROM profiles
UNION ALL
SELECT 'posts', ROUND(COUNT(location_id)::NUMERIC / COUNT(*) * 100, 2)
FROM posts
UNION ALL
SELECT 'tourist_points', ROUND(COUNT(location_id)::NUMERIC / COUNT(*) * 100, 2)
FROM tourist_points;
" -o table

echo ""
echo "=== REGISTROS INVÁLIDOS ==="
npx supabase db query --linked --sql "
SELECT 
  SUM(CASE WHEN p.location_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = p.location_id) THEN 1 ELSE 0 END) as profiles_invalidos,
  (SELECT COUNT(*) FROM posts p WHERE p.location_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = p.location_id)) as posts_invalidos,
  (SELECT COUNT(*) FROM tourist_points t WHERE t.location_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = t.location_id)) as tourist_points_invalidos
FROM profiles p;
" -o table

echo ""
echo "=== FILTROS POR STRING NO CÓDIGO ==="
echo "Ocorrências de .eq('city'): $(grep -r "\.eq('city'" src/ --include="*.ts" --include="*.tsx" | wc -l)"
echo "Ocorrências de .eq('neighborhood'): $(grep -r "\.eq('neighborhood'" src/ --include="*.ts" --include="*.tsx" | wc -l)"
echo "Ocorrências de .eq('state'): $(grep -r "\.eq('state'" src/ --include="*.ts" --include="*.tsx" | wc -l)"
EOF

chmod +x monitor_ssot.sh
./monitor_ssot.sh
```

---

## 11. VALIDAR MIGRAÇÃO ANTES DE APLICAR

```bash
# Testar migração em dry-run (se disponível)
# Ou verificar sintaxe SQL
cat supabase/migrations/[ARQUIVO].sql | npx supabase db lint

# Backup antes de aplicar
npx supabase db dump --linked > backup_$(date +%Y%m%d).sql

# Aplicar migração
npx supabase db query --linked -f supabase/migrations/[ARQUIVO].sql

# Verificar resultado
npx supabase db query --linked --sql "SELECT * FROM [TABELA] LIMIT 5;" -o table
```

---

## 12. REVERTER MIGRAÇÃO (SE NECESSÁRIO)

```bash
# Criar migração de rollback
cat > supabase/migrations/[ARQUIVO]_rollback.sql << 'EOF'
-- Rollback: remover foreign key
ALTER TABLE [TABELA] DROP CONSTRAINT IF EXISTS [TABELA]_location_id_fkey;

-- Rollback: remover índice
DROP INDEX IF EXISTS idx_[TABELA]_location_id;

-- Rollback: tornar location_id nullable novamente
ALTER TABLE [TABELA] ALTER COLUMN location_id DROP NOT NULL;
EOF

# Aplicar rollback
npx supabase db query --linked -f supabase/migrations/[ARQUIVO]_rollback.sql
```

---

## 13. VERIFICAR PERFORMANCE

```bash
# Verificar uso de índices
npx supabase db query --linked --sql "
EXPLAIN ANALYZE
SELECT * FROM tourist_points
WHERE location_id = 'uuid-aqui';
" -o table

# Verificar tamanho de índices
npx supabase db query --linked --sql "
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_indexes.indexname = pg_class.relname
WHERE tablename IN ('profiles', 'posts', 'tourist_points')
  AND indexname LIKE '%location_id%';
" -o table
```

---

## 14. GERAR RELATÓRIO COMPLETO

```bash
# Criar script de relatório
cat > relatorio_ssot.sh << 'EOF'
#!/bin/bash
OUTPUT="relatorio_ssot_$(date +%Y%m%d_%H%M%S).md"

echo "# RELATÓRIO SSOT TERRITORIAL" > $OUTPUT
echo "Data: $(date)" >> $OUTPUT
echo "" >> $OUTPUT

echo "## 1. COBERTURA" >> $OUTPUT
npx supabase db query --linked -f temp_audit_counts.sql -o table >> $OUTPUT

echo "" >> $OUTPUT
echo "## 2. FOREIGN KEYS" >> $OUTPUT
npx supabase db query --linked --sql "SELECT table_name, constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%location_id%';" -o table >> $OUTPUT

echo "" >> $OUTPUT
echo "## 3. FILTROS NO CÓDIGO" >> $OUTPUT
echo "Total de .eq('city'): $(grep -r "\.eq('city'" src/ | wc -l)" >> $OUTPUT
echo "Total de .eq('neighborhood'): $(grep -r "\.eq('neighborhood'" src/ | wc -l)" >> $OUTPUT

echo "Relatório gerado: $OUTPUT"
EOF

chmod +x relatorio_ssot.sh
./relatorio_ssot.sh
```

---

**Uso:** Execute estes comandos para verificar o estado atual do SSOT territorial e monitorar o progresso das correções.
