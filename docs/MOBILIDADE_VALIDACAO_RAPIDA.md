# MOBILIDADE (MOTOBOY) - VALIDAÇÃO RÁPIDA

**Objetivo**: Validar implementação em 15 minutos  
**Público**: Desenvolvedores, QA

---

## ✅ Checklist Rápido (15 minutos)

### 1. Verificar Arquivos Criados (2 min)

```bash
# Verificar se todos os arquivos existem
ls -la src/modules/mobility/services/MotoboyAuthorizationService.ts
ls -la src/modules/mobility/services/RideReportsService.ts
ls -la src/modules/mobility/components/RequestMotoboyButton.tsx
ls -la src/modules/mobility/components/RideHistoryUnified.tsx
ls -la src/modules/mobility/components/CreateReportModal.tsx
ls -la src/modules/mobility/hooks/useRideReports.ts
ls -la src/modules/admin/pages/AdminMotoboyOperations.tsx
ls -la src/modules/admin/pages/AdminReportsPassageirosV2.tsx
ls -la supabase/migrations/20260419000000_create_ride_reports.sql
```

**Esperado**: Todos os arquivos existem ✅

---

### 2. Verificar Migrações (3 min)

```bash
# Listar migrações
ls -la supabase/migrations/ | grep -E "(vagas|ride_reports)"
```

**Esperado**:
- `20260417100000_fix_vagas_urgencia_highlight.sql` ✅
- `20260417100001_backfill_vagas_highlight_type_from_destaque.sql` ✅
- `20260419000000_create_ride_reports.sql` ✅

```bash
# Aplicar migrações (se ainda não aplicadas)
cd supabase
supabase db push
```

---

### 3. Verificar Tabelas no Banco (3 min)

```sql
-- Verificar ride_requests
SELECT COUNT(*) FROM ride_requests;

-- Verificar ride_reports
SELECT COUNT(*) FROM ride_reports;

-- Verificar colunas de ride_reports
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ride_reports'
ORDER BY ordinal_position;
```

**Esperado**:
- Tabela `ride_requests` existe ✅
- Tabela `ride_reports` existe ✅
- Colunas corretas (id, ride_id, reporter_profile_id, etc.) ✅

---

### 4. Verificar RLS Policies (2 min)

```sql
-- Verificar policies de ride_requests
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ride_requests';

-- Verificar policies de ride_reports
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ride_reports';
```

**Esperado**:
- Policies de SELECT, INSERT, UPDATE existem ✅
- Policies incluem validação de auth.uid() ✅

---

### 5. Testar Imports (2 min)

```bash
# Verificar se não há erros de import
npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "error" | head -20
```

**Esperado**: Sem erros críticos de import ✅

---

### 6. Verificar Rotas (1 min)

```bash
# Verificar se rotas estão registradas
grep -r "motoboy-operations" src/app/routes/
grep -r "AdminReportsPassageiros" src/app/routes/
```

**Esperado**:
- Rota `/admin/motoboy-operations` existe ✅
- Rota `/admin/reports-passageiros` existe ✅

---

### 7. Verificar Documentação (2 min)

```bash
# Listar documentos criados
ls -la docs/MOBILIDADE_*.md
ls -la docs/architecture/ADR-001*.md
```

**Esperado**: 20 documentos existem ✅

---

## 🧪 Testes Manuais Rápidos (Opcional - 10 min)

### Teste 1: Solicitar Motoboy (UI)
1. Abrir dashboard de empresa
2. Verificar se botão "Solicitar Motoboy" aparece
3. Clicar no botão
4. Verificar se modal abre
5. Preencher formulário
6. Submeter

**Esperado**: Entrega criada com sucesso ✅

### Teste 2: Admin Operations
1. Abrir `/admin/motoboy-operations`
2. Verificar se lista carrega
3. Verificar se filtros funcionam
4. Verificar se métricas aparecem

**Esperado**: Página funcional ✅

### Teste 3: Reports
1. Abrir `/admin/reports-passageiros`
2. Verificar se lista carrega (pode estar vazia)
3. Verificar se filtros funcionam

**Esperado**: Página funcional ✅

---

## 🚨 Problemas Comuns

### Erro: "Tabela ride_reports não existe"
**Solução**: Aplicar migração
```bash
cd supabase
supabase db push
```

### Erro: "Cannot find module MotoboyAuthorizationService"
**Solução**: Verificar path do import
```typescript
import { MotoboyAuthorizationService } from '@/modules/mobility/services/MotoboyAuthorizationService';
```

### Erro: "RLS policy violation"
**Solução**: Verificar se policies foram aplicadas
```sql
SELECT * FROM pg_policies WHERE tablename = 'ride_reports';
```

---

## ✅ Critério de Aprovação

### Mínimo para Passar
- [ ] Todos os arquivos existem
- [ ] Migrações aplicadas sem erro
- [ ] Tabelas existem no banco
- [ ] RLS policies ativas
- [ ] Sem erros críticos de TypeScript
- [ ] Rotas registradas
- [ ] Documentação completa

### Aprovação Completa
- [ ] Todos os itens acima ✅
- [ ] Teste manual de solicitar motoboy funciona
- [ ] Admin operations funcional
- [ ] Admin reports funcional

---

## 📊 Resultado

**Data**: ___________  
**Validador**: ___________

### Status
- [ ] ✅ Aprovado - Tudo funcionando
- [ ] ⚠️ Aprovado com ressalvas (listar abaixo)
- [ ] ❌ Reprovado (listar bloqueadores abaixo)

### Observações
```
[Espaço para notas]
```

---

**Tempo total**: 15 minutos  
**Última atualização**: 2026-04-19
