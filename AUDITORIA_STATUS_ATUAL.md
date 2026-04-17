# Status Atual da Auditoria de Hardcodes

**Data:** 2026-04-16  
**Status:** ✅ Auditoria Completa - 🔴 Execução Pendente  
**Última Validação:** 2026-04-16

---

## 📊 Situação Atual (Validação Automática)

### Números Atualizados

```
🔴 Críticas:  261 violações
🟡 Altas:     158 violações
🟢 Médias:      0 violações
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 TOTAL:     419 violações
```

### Distribuição por Tipo

| Tipo | Quantidade | % do Total |
|------|------------|------------|
| Preço hardcoded | 170 | 40.6% |
| Status hardcoded | 136 | 32.5% |
| Coordenada hardcoded | 53 | 12.6% |
| UUID hardcoded | 26 | 6.2% |
| Limite operacional | 22 | 5.2% |
| Import de mock | 12 | 2.9% |

---

## 🎯 Comparação: Auditoria Manual vs Automática

### Auditoria Manual (Inicial)
- **Total:** 262+ violações identificadas
- **Método:** Análise manual + grep patterns
- **Foco:** Violações conceituais e arquiteturais

### Validação Automática (Atual)
- **Total:** 419 violações detectadas
- **Método:** Script automatizado com regex
- **Foco:** Padrões sintáticos no código

### Análise da Diferença (+157 violações)

A validação automática encontrou **157 violações adicionais** porque:

1. **Falsos Positivos Esperados** (~40-50%)
   - Comparações numéricas legítimas (`rate === 100`)
   - Constantes técnicas de UI aceitáveis
   - Validações de threshold que não são regras de negócio

2. **Verdadeiros Positivos Não Catalogados** (~50-60%)
   - Hardcodes em arquivos não revisados manualmente
   - Padrões que passaram despercebidos
   - Violações em módulos secundários

**Ação Necessária:** Revisar as 419 violações e classificar em:
- ✅ Legítimo (constante técnica aceitável)
- ❌ Violação real (precisa correção)
- ⚠️ Ambíguo (requer análise de contexto)

---

## 🔴 Top 10 Arquivos Mais Problemáticos

Baseado na validação automática:

1. **src/modules/admin/components/DriverCancellationMetrics.tsx**
   - Múltiplas comparações de taxa hardcoded
   - Thresholds de cancelamento (10%, 25%, 30%)

2. **src/modules/admin/components/pricing/PricingRuleDialog.tsx**
   - UUID fallback hardcoded
   - Regras de pricing

3. **src/modules/admin/components/SSOTDashboard.tsx**
   - Thresholds de conformidade (95%, 100%)
   - Lógica de cores baseada em valores

4. **src/modules/admin/hooks/useAdminUserDetail.ts**
   - Status types hardcoded
   - Enums de investigação

5. **src/modules/business/components/AppointmentsPanel.tsx**
   - Status de agendamento hardcoded

---

## 📚 Documentação Completa Criada

### ✅ Documentos Executivos
- [x] `docs/audits/README.md` - Índice navegável
- [x] `docs/audits/RESUMO_EXECUTIVO_AUDITORIA.md` - Visão geral
- [x] `AUDITORIA_HARDCODES_SUMARIO.md` - Sumário na raiz

### ✅ Documentos Técnicos
- [x] `docs/audits/RELATORIO_HARDCODES_ENCONTRADOS.md` - Análise detalhada
- [x] `docs/audits/AUDITORIA_HARDCODES_SISTEMATICA.md` - Metodologia
- [x] `docs/audits/PLANO_MIGRACAO_HARDCODES.md` - Guia de implementação

### ✅ Guias Práticos
- [x] `docs/audits/EXEMPLOS_CODIGO_CORRETO.md` - Exemplos práticos
- [x] `docs/audits/GUIA_INICIO_RAPIDO.md` - Começar em 30 min
- [x] `docs/audits/CHECKLIST_EXECUCAO.md` - Acompanhamento

### ✅ Ferramentas
- [x] `scripts/validate-ssot-hardcodes.ts` - Validação automática
- [x] `scripts/generate-migration-template.ts` - Gerar migrations
- [x] `scripts/generate-service-template.ts` - Gerar services

### ✅ Scripts NPM
```json
{
  "validate:hardcodes": "tsx scripts/validate-ssot-hardcodes.ts",
  "generate:migration": "tsx scripts/generate-migration-template.ts",
  "generate:service": "tsx scripts/generate-service-template.ts"
}
```

---

## 🚀 Próximos Passos Imediatos

### 1. Revisar Validação Automática (1-2h)

**Objetivo:** Classificar as 419 violações em reais vs falsos positivos

**Ação:**
```bash
# Executar validação e salvar output
npm run validate:hardcodes > validation-output.txt 2>&1

# Revisar manualmente as violações críticas
# Criar lista de violações reais vs aceitáveis
```

**Entregável:** Lista refinada de violações reais

---

### 2. Iniciar Fase 1 - Crítico (Semana 1)

#### 2.1 Billing Plans (Prioridade #1)

**Status:** 🔴 Não Iniciado

**Checklist:**
- [ ] Criar migration `20260416000001_create_billing_plans.sql`
- [ ] Aplicar migration em dev
- [ ] Criar `BillingPlanService.ts`
- [ ] Criar hooks `useBillingPlans.ts`
- [ ] Migrar componentes
- [ ] Remover duplicações
- [ ] Testes
- [ ] Deploy staging

**Tempo Estimado:** 1-2 dias

---

#### 2.2 Mocks em Runtime (Prioridade #2)

**Status:** 🔴 Não Iniciado

**Violações Detectadas:**
- 12 imports de mocks em runtime

**Checklist:**
- [ ] Identificar todos os imports de mock
- [ ] Criar services reais (Vagas, Jobs, Tourist Points)
- [ ] Remover imports de mocks
- [ ] Mover mocks para `tests/fixtures/`
- [ ] Criar seeds para desenvolvimento
- [ ] Adicionar lint rule `no-mock-in-production`
- [ ] Testes

**Tempo Estimado:** 2-3 dias

---

#### 2.3 Mobility Pricing (Prioridade #3)

**Status:** 🔴 Não Iniciado

**Checklist:**
- [ ] Criar migration `20260416000002_create_mobility_pricing_rules.sql`
- [ ] Criar `MobilityPricingService.ts`
- [ ] Migrar regras de pricing
- [ ] Atualizar validações dinâmicas
- [ ] Remover hardcodes de `constants/index.ts`
- [ ] Testes
- [ ] Deploy staging

**Tempo Estimado:** 2-3 dias

---

### 3. Refinar Script de Validação (Opcional)

**Problema:** Muitos falsos positivos (comparações numéricas legítimas)

**Solução:** Melhorar regex patterns para reduzir falsos positivos

**Exemplos de Falsos Positivos:**
```typescript
// ❌ Detectado como "Preço hardcoded" mas é comparação legítima
if (rate === 100) return "text-success";
if (driver.cancellation_rate <= 30) { ... }
```

**Ação:**
- [ ] Adicionar contexto ao regex (evitar comparações)
- [ ] Adicionar whitelist de padrões aceitáveis
- [ ] Melhorar detecção de constantes de UI vs negócio

---

## 📊 Métricas de Progresso

### Baseline (Hoje)
```
Violações Totais:     419
Críticas:             261
Altas:                158
Médias:                 0

Conformidade SSOT:     0%
```

### Meta (4 Semanas)
```
Violações Totais:       0
Críticas:               0
Altas:                  0
Médias:                 0

Conformidade SSOT:   100%
```

### Progresso Semanal Esperado
```
Semana 1: [██░░░░░░░░] 20% (419 → 335)
Semana 2: [████░░░░░░] 40% (335 → 251)
Semana 3: [██████░░░░] 60% (251 → 167)
Semana 4: [████████░░] 80% (167 → 83)
Final:    [██████████] 100% (83 → 0)
```

---

## 🎯 Decisões Necessárias

### 1. Priorização de Execução

**Opção A: Sequencial (Recomendado)**
- Completar Fase 1 antes de iniciar Fase 2
- Validar cada correção antes de prosseguir
- Menor risco, mais tempo

**Opção B: Paralelo**
- Múltiplas fases simultaneamente
- Equipes diferentes em fases diferentes
- Maior risco, menos tempo

**Recomendação:** Opção A (Sequencial)

---

### 2. Tratamento de Falsos Positivos

**Opção A: Revisar Manualmente**
- Analisar cada violação individualmente
- Classificar como real ou falso positivo
- Mais preciso, mais tempo

**Opção B: Refinar Script Primeiro**
- Melhorar regex patterns
- Re-executar validação
- Menos trabalho manual

**Recomendação:** Opção B seguida de A

---

### 3. Escopo de Correção

**Opção A: Correção Total (419 violações)**
- Corrigir todas as violações detectadas
- Incluindo falsos positivos após revisão
- 100% de conformidade

**Opção B: Correção Focada (262 violações)**
- Focar nas violações da auditoria manual
- Ignorar falsos positivos conhecidos
- 95% de conformidade

**Recomendação:** Opção A (Correção Total)

---

## 📞 Ações Imediatas (Hoje)

### Para Tech Lead
1. [ ] Revisar este documento
2. [ ] Aprovar plano de execução
3. [ ] Alocar recursos para Fase 1
4. [ ] Definir responsáveis por tarefa

### Para Desenvolvedores
1. [ ] Ler `docs/audits/GUIA_INICIO_RAPIDO.md`
2. [ ] Executar `npm run validate:hardcodes`
3. [ ] Escolher primeira violação para corrigir
4. [ ] Seguir checklist de execução

### Para QA
1. [ ] Revisar `docs/audits/PLANO_MIGRACAO_HARDCODES.md`
2. [ ] Preparar casos de teste
3. [ ] Definir critérios de aceitação

### Para DevOps
1. [ ] Adicionar `npm run validate:hardcodes` ao CI/CD
2. [ ] Configurar alertas de violação
3. [ ] Preparar ambiente de staging

---

## 🔗 Links Rápidos

### Documentação
- [Índice Completo](./docs/audits/README.md)
- [Resumo Executivo](./docs/audits/RESUMO_EXECUTIVO_AUDITORIA.md)
- [Guia de Início Rápido](./docs/audits/GUIA_INICIO_RAPIDO.md)

### Ferramentas
```bash
# Validar hardcodes
npm run validate:hardcodes

# Gerar migration
npm run generate:migration <nome>

# Gerar service
npm run generate:service <nome>
```

### Suporte
- Canal: `#tech-architecture`
- Email: architecture@empresa.com
- Issues: GitHub com tag `hardcode-audit`

---

## ✅ Checklist de Aprovação

- [ ] **Tech Lead** - Revisão técnica e alocação de recursos
- [ ] **Arquiteto** - Validação de arquitetura e padrões
- [ ] **Product Owner** - Priorização de negócio e timeline
- [ ] **QA Lead** - Estratégia de testes e validação

---

**Última Atualização:** 2026-04-16  
**Próxima Revisão:** Após aprovações  
**Status:** 🟡 Aguardando Aprovação para Início

---

## 📈 Dashboard de Acompanhamento

```
╔════════════════════════════════════════════════════════════╗
║  AUDITORIA DE HARDCODES - DASHBOARD                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Status Geral:        🔴 CRÍTICO                           ║
║  Violações Totais:    419                                  ║
║  Conformidade SSOT:   0%                                   ║
║                                                            ║
║  ┌──────────────────────────────────────────────────┐     ║
║  │ Progresso: [░░░░░░░░░░] 0%                       │     ║
║  └──────────────────────────────────────────────────┘     ║
║                                                            ║
║  Fase 1 (Crítico):    🔴 Não Iniciado                      ║
║  Fase 2 (Alta):       ⚪ Não Iniciado                      ║
║  Fase 3 (Média):      ⚪ Não Iniciado                      ║
║  Fase 4 (Prevenção):  ⚪ Não Iniciado                      ║
║                                                            ║
║  Próxima Ação: Aprovar plano e iniciar Fase 1             ║
║  Prazo: 4 semanas                                          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

**🎯 Objetivo:** Eliminar 100% dos hardcodes indevidos e estabelecer conformidade total com SSOT em 4 semanas.
