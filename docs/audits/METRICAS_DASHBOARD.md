# Dashboard de Métricas - Eliminação de Hardcodes

**Atualização:** Diária  
**Responsável:** Tech Lead

---

## 📊 Visão Geral

```
╔════════════════════════════════════════════════════════════════╗
║                    PROGRESSO GERAL                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Hardcodes Eliminados:  [░░░░░░░░░░] 0/262 (0%)              ║
║                                                                ║
║  🔴 Críticos:           [░░░░░░░░░░] 0/160 (0%)              ║
║  🟡 Altos:              [░░░░░░░░░░] 0/80  (0%)              ║
║  🟢 Médios:             [░░░░░░░░░░] 0/22  (0%)              ║
║                                                                ║
║  Testes Passando:       [░░░░░░░░░░] 0/100 (0%)              ║
║  Cobertura:             [░░░░░░░░░░] 0%                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 📅 Progresso por Semana

### Semana 1: Crítico (16-22 Abr)
```
Billing Plans        [░░░░░░░░░░] 0%
Mocks em Runtime     [░░░░░░░░░░] 0%
Mobility Pricing     [░░░░░░░░░░] 0%

Total Semana 1:      [░░░░░░░░░░] 0/3 tarefas
```

### Semana 2: Alta (23-29 Abr)
```
Coordenadas          [░░░░░░░░░░] 0%
Status/Categorias    [░░░░░░░░░░] 0%
Limites              [░░░░░░░░░░] 0%

Total Semana 2:      [░░░░░░░░░░] 0/3 tarefas
```

### Semana 3: Média (30 Abr - 06 Mai)
```
UUIDs                [░░░░░░░░░░] 0%
Rollout/Flags        [░░░░░░░░░░] 0%

Total Semana 3:      [░░░░░░░░░░] 0/2 tarefas
```

### Semana 4: Prevenção (07-13 Mai)
```
Lint Rules           [░░░░░░░░░░] 0%
Documentação         [░░░░░░░░░░] 0%
Testes               [░░░░░░░░░░] 0%

Total Semana 4:      [░░░░░░░░░░] 0/3 tarefas
```

---

## 🎯 Métricas por Categoria

### Preços e Valores Monetários
```
Meta: 45 hardcodes eliminados
Atual: 0/45 (0%)
[░░░░░░░░░░]

Arquivos Afetados:
- src/core/billing/plans.ts
- src/shared/types/subscription.ts
- src/modules/mobility/constants/index.ts
- src/modules/gastronomy/__mocks__/foodItemMocks.ts
- src/modules/jobs/data/mock-jobs.ts
```

### Coordenadas Geográficas
```
Meta: 60 hardcodes eliminados
Atual: 0/60 (0%)
[░░░░░░░░░░]

Arquivos Afetados:
- src/core/tourist-points/data/salvador-mock.ts
- src/modules/guide/__mocks__/touristPointMocks.ts
- src/modules/admin/pages/AdminPontosEmbarque.tsx
- src/modules/gastronomy/__mocks__/gastronomyMocks.ts
```

### Mocks em Runtime
```
Meta: 15 hardcodes eliminados
Atual: 0/15 (0%)
[░░░░░░░░░░]

Arquivos Afetados:
- src/modules/vagas/hooks/useVagas.ts
- src/modules/jobs/services/JobService.ts
- src/modules/guide/pages/TouristPointsPage.tsx
- src/modules/mobility/components/BoardingPointsPanel.tsx
```

### Status e Categorias
```
Meta: 80 hardcodes eliminados
Atual: 0/80 (0%)
[░░░░░░░░░░]

Arquivos Afetados:
- src/modules/promotions/repositories/AdRepositoryMock.ts
- src/modules/profile/pages/PerfilIdentidadesPage.tsx
- src/modules/services/pages/CadastrarServicoPage.tsx
```

---

## 📈 Velocidade de Execução

### Hardcodes Eliminados por Dia
```
Dia 1:  0 hardcodes
Dia 2:  0 hardcodes
Dia 3:  0 hardcodes
Dia 4:  0 hardcodes
Dia 5:  0 hardcodes

Média: 0 hardcodes/dia
Meta:  13 hardcodes/dia (para completar em 20 dias)
```

### Commits por Dia
```
Dia 1:  0 commits
Dia 2:  0 commits
Dia 3:  0 commits
Dia 4:  0 commits
Dia 5:  0 commits

Média: 0 commits/dia
Meta:  3-5 commits/dia
```

---

## 🧪 Qualidade de Código

### Testes
```
Testes Unitários:     0/50   (0%)   [░░░░░░░░░░]
Testes Integração:    0/30   (0%)   [░░░░░░░░░░]
Testes E2E:           0/20   (0%)   [░░░░░░░░░░]

Total:                0/100  (0%)   [░░░░░░░░░░]
```

### Cobertura
```
Statements:           0%     [░░░░░░░░░░]
Branches:             0%     [░░░░░░░░░░]
Functions:            0%     [░░░░░░░░░░]
Lines:                0%     [░░░░░░░░░░]

Meta: 80% de cobertura
```

### Lint
```
Erros:                0
Warnings:             0
Violações SSOT:       262

Status: ❌ Não conforme
```

---

## 👥 Progresso por Desenvolvedor

### Dev 1
```
Hardcodes Eliminados: 0
Commits:              0
PRs Abertos:          0
PRs Merged:           0

Status: 🟡 Aguardando início
```

### Dev 2
```
Hardcodes Eliminados: 0
Commits:              0
PRs Abertos:          0
PRs Merged:           0

Status: 🟡 Aguardando início
```

### Dev 3
```
Hardcodes Eliminados: 0
Commits:              0
PRs Abertos:          0
PRs Merged:           0

Status: 🟡 Aguardando início
```

---

## 🚀 Velocidade de Deploy

### Deploys por Semana
```
Semana 1: 0 deploys
Semana 2: 0 deploys
Semana 3: 0 deploys
Semana 4: 0 deploys

Meta: 1 deploy por semana (após cada fase)
```

### Tempo Médio de PR
```
Tempo de Review:      0h
Tempo de Merge:       0h
Tempo Total:          0h

Meta: < 24h do PR ao merge
```

---

## 🎯 KPIs Principais

### Conformidade SSOT
```
Atual:  0% conforme (262 violações)
Meta:   100% conforme (0 violações)

Progresso: [░░░░░░░░░░] 0%
```

### Tempo de Resposta
```
Tempo para mudar preço:     Deploy necessário (horas)
Meta:                       Sem deploy (minutos)

Status: ❌ Não atingido
```

### Flexibilidade
```
Regras por território:      0
Regras por horário:         0
Regras dinâmicas:           0

Meta: 100% das regras configuráveis
```

---

## 📊 Gráficos de Tendência

### Hardcodes ao Longo do Tempo
```
300 |                                    
    |                                    
250 | ●                                  
    | |                                  
200 | |                                  
    | |                                  
150 | |                                  
    | |                                  
100 | |                                  
    | |                                  
 50 | |                                  
    | |                                  
  0 |_|________________________________
     Início  S1   S2   S3   S4   Fim

● = Atual (262)
Meta: Chegar a 0 em 4 semanas
```

### Testes ao Longo do Tempo
```
100 |                              ○
    |                              |
 80 |                              |
    |                              |
 60 |                              |
    |                              |
 40 |                              |
    |                              |
 20 |                              |
    |                              |
  0 | ●____________________________
     Início  S1   S2   S3   S4   Fim

● = Atual (0)
○ = Meta (100)
```

---

## 🔥 Hotspots (Áreas Críticas)

### Top 5 Arquivos com Mais Hardcodes
```
1. src/modules/mobility/constants/index.ts          (25 hardcodes)
2. src/modules/guide/__mocks__/touristPointMocks.ts (20 hardcodes)
3. src/core/tourist-points/data/salvador-mock.ts    (18 hardcodes)
4. src/modules/gastronomy/__mocks__/foodItemMocks.ts(15 hardcodes)
5. src/shared/types/subscription.ts                 (12 hardcodes)
```

### Top 5 Módulos com Mais Hardcodes
```
1. Mobility      (85 hardcodes)
2. Gastronomy    (52 hardcodes)
3. Guide         (48 hardcodes)
4. Billing       (24 hardcodes)
5. Jobs/Vagas    (18 hardcodes)
```

---

## ⚠️ Alertas e Riscos

### Alertas Ativos
```
🔴 CRÍTICO: 262 hardcodes detectados
🟡 ATENÇÃO: 6 mocks em runtime de produção
🟡 ATENÇÃO: 3 duplicações de dados críticos
🟢 INFO: Documentação completa disponível
```

### Riscos Identificados
```
1. Prazo apertado (4 semanas)           Risco: ALTO
2. Quebra de funcionalidades            Risco: MÉDIO
3. Performance após migração            Risco: BAIXO
4. Dados inconsistentes                 Risco: MÉDIO
```

---

## 📅 Próximas Milestones

```
[ ] 22 Abr - Fase 1 completa (Crítico)
[ ] 29 Abr - Fase 2 completa (Alta)
[ ] 06 Mai - Fase 3 completa (Média)
[ ] 13 Mai - Fase 4 completa (Prevenção)
[ ] 13 Mai - Projeto 100% conforme SSOT
```

---

## 🎉 Conquistas

```
Nenhuma conquista ainda.

Conquistas disponíveis:
🏆 Primeira Correção - Eliminar primeiro hardcode
🏆 Semana Produtiva - Eliminar 50+ hardcodes em uma semana
🏆 Fase Completa - Completar uma fase inteira
🏆 Teste Master - Adicionar 20+ testes
🏆 SSOT Champion - Eliminar todos os hardcodes críticos
```

---

## 📞 Comandos Úteis

### Atualizar Dashboard
```bash
# Executar validação
npm run validate:hardcodes > metrics.txt

# Executar testes
npm test > test-results.txt

# Gerar relatório
npm run generate:metrics-report
```

### Visualizar Progresso
```bash
# Dashboard simples
./scripts/show-progress.sh

# Dashboard completo
npm run dashboard
```

---

## 📝 Notas de Atualização

### 2026-04-16
- Dashboard criado
- Métricas iniciais registradas
- 262 hardcodes identificados
- Aguardando início da execução

---

**Última Atualização:** 2026-04-16 (Inicial)  
**Próxima Atualização:** Diária durante execução  
**Responsável:** Tech Lead

---

## 🎯 Como Usar Este Dashboard

1. **Atualizar Diariamente**
   - Execute `npm run validate:hardcodes`
   - Atualize os números manualmente
   - Ou use script de automação

2. **Compartilhar com Time**
   - Daily standup
   - Reuniões semanais
   - Relatórios para gestão

3. **Acompanhar Tendências**
   - Velocidade de execução
   - Qualidade de código
   - Riscos emergentes

4. **Celebrar Conquistas**
   - Marcar milestones
   - Reconhecer contribuições
   - Manter motivação alta
