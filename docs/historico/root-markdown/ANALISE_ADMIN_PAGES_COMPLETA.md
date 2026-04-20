# 📊 ANÁLISE COMPLETA: Páginas Admin e CRUD de Planos

**Data**: 2026-04-16  
**Contexto**: Task 5 - Verificação de páginas admin para gerenciar dados SSOT

---

## 🔍 DESCOBERTAS

### 1. AdminAssinaturas.tsx ✅
**Localização**: `src/modules/admin/pages/AdminAssinaturas.tsx`

**Funcionalidades**:
- ✅ Visualiza assinaturas de usuários (não planos)
- ✅ Estatísticas: MRR, receita total, tempo médio
- ✅ Filtros: plano, status, busca por email
- ✅ Ações: cancelar, reativar, upgrade, downgrade
- ✅ Analytics: churn rate, distribuição por plano
- ✅ Assinaturas expirando (próximos 7 dias)

**Serviço**: `adminSubscriptionsService`
- Gerencia **user_subscriptions** (assinaturas de usuários)
- NÃO gerencia **billing_plans** (definição dos planos)

**Conclusão**: Gerencia **uso** dos planos, não a **definição** dos planos.

---

### 2. AdminPlansPage.tsx ⚠️
**Localização**: `src/modules/admin/pages/AdminPlansPage.tsx`

**Funcionalidades**:
- ✅ Visualiza uso de planos por empresa
- ✅ Estatísticas: pedidos, receita, conversão
- ✅ Tabela detalhada por empresa
- ❌ NÃO permite criar/editar planos
- ❌ NÃO permite editar preços
- ❌ NÃO permite editar features/entitlements

**Conclusão**: Apenas visualização de **uso**, não CRUD de planos.

---

### 3. AdminVagas.tsx ⚠️
**Localização**: `src/modules/admin/pages/AdminVagas.tsx`

**Problema Identificado**:
- ❌ Usa `adminVagasService` (antigo)
- ❌ NÃO usa o novo `VagasService` criado na Fase 1.2
- ❌ Estrutura de dados desatualizada

**Serviço Antigo**: `src/core/admin/services/adminVagasService.ts`
- Acessa tabela `vagas` diretamente
- Estrutura antiga (sem enums novos)
- Não usa filtros territoriais

**Serviço Novo**: `src/modules/vagas/services/VagasService.ts`
- Usa migration 20260416110000
- 5 enums: categoria, tipo, modalidade, nivel, status
- Full-text search em português
- Filtros territoriais integrados

**Ação Necessária**: Atualizar AdminVagas para usar VagasService novo.

---

### 4. BillingPlanService.ts ✅
**Localização**: `src/core/billing/services/BillingPlanService.ts`

**Funcionalidades**:
- ✅ Buscar planos ativos
- ✅ Buscar por código
- ✅ Buscar entitlements
- ✅ Verificar se requer pagamento
- ✅ Buscar plano em destaque
- ✅ Cache inteligente (5 min TTL)
- ❌ NÃO tem métodos de CRUD (create, update, delete)

**Conclusão**: Service de **leitura** apenas, sem CRUD.

---

## 🎯 GAPS IDENTIFICADOS

### GAP 1: Falta CRUD de Billing Plans ❌
**Problema**: Não existe interface admin para criar/editar planos de billing.

**Impacto**:
- Administradores não conseguem criar novos planos
- Não conseguem editar preços
- Não conseguem editar features/entitlements
- Não conseguem ativar/desativar planos
- Não conseguem reordenar planos

**Solução Necessária**:
1. Criar `AdminBillingPlansEditor.tsx`
2. Criar métodos CRUD em `BillingPlanService`
3. Criar hooks React Query para CRUD
4. Adicionar rota no admin

---

### GAP 2: AdminVagas usa Service Antigo ⚠️
**Problema**: AdminVagas não usa o novo VagasService criado na Fase 1.2.

**Impacto**:
- Dados desatualizados
- Não usa enums novos
- Não usa filtros territoriais
- Inconsistência com migration aplicada

**Solução Necessária**:
1. Atualizar `AdminVagas.tsx` para usar `VagasService`
2. Adaptar interface para nova estrutura
3. Deprecar `adminVagasService.ts`

---

### GAP 3: Falta Seed de Vagas para Desenvolvimento 📦
**Problema**: Tabela vagas está vazia após migration.

**Impacto**:
- Desenvolvedores não têm dados para testar
- UI de vagas aparece vazia
- Dificulta desenvolvimento e QA

**Solução Necessária**:
1. Criar migration de seed com 10-15 vagas exemplo
2. Cobrir todas as categorias e tipos
3. Distribuir por diferentes territórios

---

## 📋 PLANO DE AÇÃO

### PRIORIDADE 1: CRUD de Billing Plans (2-3h)
**Arquivos a Criar**:
1. `src/core/billing/services/BillingPlanService.ts` (adicionar métodos CRUD)
2. `src/core/billing/hooks/useBillingPlansCRUD.ts` (hooks admin)
3. `src/modules/admin/pages/AdminBillingPlansEditor.tsx` (UI)
4. `src/modules/admin/components/BillingPlanForm.tsx` (formulário)

**Funcionalidades**:
- Listar todos os planos (incluindo inativos)
- Criar novo plano
- Editar plano existente
- Ativar/desativar plano
- Reordenar planos (display_order)
- Editar features (array de strings)
- Editar entitlements (objeto JSON)
- Validação de dados
- Preview de plano

---

### PRIORIDADE 2: Atualizar AdminVagas (1-2h)
**Arquivos a Modificar**:
1. `src/modules/admin/pages/AdminVagas.tsx`
2. `src/core/admin/services/adminVagasService.ts` (deprecar)

**Mudanças**:
- Substituir `adminVagasService` por `VagasService`
- Adaptar interface para novos enums
- Adicionar filtros territoriais
- Usar full-text search
- Atualizar tipos TypeScript

---

### PRIORIDADE 3: Seed de Vagas (30min)
**Arquivos a Criar**:
1. `supabase/migrations/20260416120000_seed_vagas.sql`

**Conteúdo**:
- 10-15 vagas exemplo
- Todas as categorias: tecnologia, saude, educacao, comercio, servicos
- Todos os tipos: clt, pj, estagio, temporario, freelance
- Diferentes modalidades: presencial, remoto, hibrido
- Diferentes níveis: junior, pleno, senior, especialista
- Distribuir por territórios diferentes

---

## 🔄 ORDEM DE EXECUÇÃO

```
1. CRUD de Billing Plans (PRIORIDADE 1)
   ├─ Adicionar métodos CRUD ao BillingPlanService
   ├─ Criar hooks useBillingPlansCRUD
   ├─ Criar componente BillingPlanForm
   ├─ Criar página AdminBillingPlansEditor
   └─ Adicionar rota no admin

2. Atualizar AdminVagas (PRIORIDADE 2)
   ├─ Modificar AdminVagas.tsx
   ├─ Usar VagasService
   ├─ Adaptar interface
   └─ Deprecar adminVagasService

3. Seed de Vagas (PRIORIDADE 3)
   ├─ Criar migration de seed
   ├─ Aplicar migration
   └─ Verificar dados no banco
```

---

## 📊 RESUMO EXECUTIVO

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| AdminAssinaturas | ✅ OK | Nenhuma |
| AdminPlansPage | ⚠️ Limitado | Adicionar CRUD de planos |
| AdminVagas | ❌ Desatualizado | Usar VagasService novo |
| BillingPlanService | ⚠️ Read-only | Adicionar métodos CRUD |
| Seed de Vagas | ❌ Faltando | Criar migration de seed |

**Total de Gaps**: 3  
**Tempo Estimado**: 4-6 horas  
**Impacto**: Alto (bloqueia gestão de planos)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Análise completa (CONCLUÍDO)
2. ⏳ Implementar CRUD de Billing Plans
3. ⏳ Atualizar AdminVagas
4. ⏳ Criar seed de vagas
5. ⏳ Testar tudo end-to-end
6. ⏳ Continuar Fase 1.3 - Mobility Pricing

---

**Autor**: Kiro AI  
**Revisão**: Pendente
