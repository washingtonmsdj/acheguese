# DECISÃO ARQUITETURAL - POSTS

**Data**: 2026-04-05  
**Status**: ✅ APROVADA  
**Decisão**: Cenário D - Consolidação Híbrida

---

## DECISÃO TOMADA

**posts será a fonte de verdade final**

### Estratégia: Consolidação em Duas Etapas

**Etapa 1: Consolidação Estrutural do Domínio**
- Limpar duplicações em `posts`
- Migrar `community_posts` → `posts`
- Deprecar `community_posts`
- Estabelecer estrutura limpa

**Etapa 2: SSOT Territorial**
- Aplicar correções territoriais sobre domínio consolidado
- Backfill de location_id
- FK constraints
- NOT NULL enforcement

---

## BLOQUEIOS ANTES DE IMPLEMENTAÇÃO

### ✅ Bloqueio 1: Decisão Arquitetural
**Status**: RESOLVIDO

### ⏳ Bloqueio 2: Auditoria de Componentes
**Status**: EM ANDAMENTO

### ⏳ Bloqueio 3: Auditoria Quantitativa do Banco
**Status**: PENDENTE (circuit breaker)

### ⏳ Bloqueio 4: Recalcular Estimativa
**Status**: PENDENTE

---

## ESTIMATIVA

**Antiga**: 35h (DESCARTADA)  
**Nova Faixa**: 60h-70h  
**Aguardando**: Medição precisa após fechamentos

---

## PROIBIÇÕES ATÉ FECHAMENTOS

❌ Não iniciar backfill  
❌ Não adicionar FK  
❌ Não aplicar NOT NULL  
❌ Não refatorar services  

✅ Apenas auditoria e planejamento

---

**Próximo Passo**: Completar auditoria de componentes
