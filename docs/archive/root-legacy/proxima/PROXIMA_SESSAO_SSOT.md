# 🚀 Próxima Sessão SSOT - Guia Rápido

**Data prevista**: 2026-04-02  
**Tempo estimado**: 2-3 horas  
**Objetivo**: Completar Fase 1 e iniciar Fase 2

---

## 📊 Status Atual

- **Violações**: 125
- **Compliance**: 79%
- **Fase 1**: 84% completa

---

## 🎯 Objetivos da Próxima Sessão

### 1. Completar Fase 1 (1 hora)
- [ ] Refatorar ProfessionalIdentityAdapter (2 violações)
- [ ] Refatorar ProfileIdentityAdapter (2 violações)
- [ ] Meta: Fase 1 100% completa

### 2. Iniciar Fase 2 (1-2 horas)
- [ ] Refatorar GastronomyQueryService (10 violações)
- [ ] Refatorar MenuQueryService (15 violações)
- [ ] Meta: Reduzir 25+ violações

---

## 📋 Checklist de Início

### Antes de Começar
- [ ] Ler SSOT_SESSAO_COMPLETA_01ABR2026.md
- [ ] Executar `npm run check:ssot` para baseline
- [ ] Verificar que não há novos commits

### Ferramentas Prontas
- ✅ Script de compliance melhorado
- ✅ ProfileService expandido (6 métodos)
- ✅ BusinessService expandido (4 métodos)
- ✅ Padrões estabelecidos

---

## 🔧 Tarefas Detalhadas

### Tarefa 1: ProfessionalIdentityAdapter
**Arquivo**: `src/core/public-identity/adapters/ProfessionalIdentityAdapter.ts`  
**Violações**: 2  
**Tempo**: 30 min

**Abordagem**:
1. Verificar se ProfessionalService tem métodos necessários
2. Se não, adicionar métodos ao ProfessionalService
3. Refatorar adapter para usar ProfessionalService
4. Validar com diagnósticos

### Tarefa 2: ProfileIdentityAdapter
**Arquivo**: `src/core/public-identity/adapters/ProfileIdentityAdapter.ts`  
**Violações**: 2  
**Tempo**: 30 min

**Abordagem**:
1. Seguir mesmo padrão do BusinessIdentityAdapter
2. Usar ProfileService para queries
3. Validar com diagnósticos

### Tarefa 3: GastronomyQueryService
**Arquivo**: `src/modules/gastronomy/services/GastronomyQueryService.ts`  
**Violações**: 10  
**Tempo**: 45 min

**Abordagem**:
1. Verificar se é SSOT ou deve delegar
2. Se SSOT, adicionar ao TABLE_SSOTS
3. Se não, refatorar para usar BusinessService
4. Validar com diagnósticos

### Tarefa 4: MenuQueryService
**Arquivo**: `src/modules/gastronomy/services/MenuQueryService.ts`  
**Violações**: 15  
**Tempo**: 45 min

**Abordagem**:
1. Verificar se MenuService é SSOT
2. Se sim, adicionar ao TABLE_SSOTS
3. Se não, refatorar para usar MenuService
4. Validar com diagnósticos

---

## 📈 Metas de Sucesso

### Mínimo Aceitável
- [ ] Fase 1: 100% completa
- [ ] Violações: < 120
- [ ] Compliance: > 80%

### Meta Ideal
- [ ] Fase 1: 100% completa
- [ ] Violações: < 100
- [ ] Compliance: > 85%
- [ ] Fase 2: 50% completa

---

## 🛠️ Comandos Úteis

```bash
# Verificar compliance
npm run check:ssot

# Verificar diagnósticos
# (usar getDiagnostics tool)

# Commit com pre-commit hook
git add .
git commit -m "refactor: complete SSOT Phase 1"
```

---

## 📚 Referências Rápidas

- **Padrões**: SSOT_ADMIN_BUSINESS_REFACTOR.md
- **Registry**: SSOT_REGISTRY.md
- **Status**: SSOT_PROJECT_STATUS.md
- **Sessão anterior**: SSOT_SESSAO_COMPLETA_01ABR2026.md

---

**Criado**: 2026-04-01  
**Próxima revisão**: 2026-04-02
