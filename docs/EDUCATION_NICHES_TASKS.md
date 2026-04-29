# EDUCATION NICHES - TASKS (SSOT)

## OVERVIEW
Este documento organiza as tasks de evolucao dos nichos do modulo `education`, alinhado ao estado real do repositorio e ao SSOT.

Referencias obrigatorias:
- `docs/EDUCATION_NICHES_IMPLEMENTATION_GUIDE.md`
- `docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md`
- `src/modules/business/education/niches/registry.ts`
- `src/modules/business/education/niches/services/EducationNicheConfigService.ts`

---

## STATUS EXECUTIVO (2026-04-26)

Estado atual no codigo:
- [x] `types.ts` implementado com type guards
- [x] `registry.ts` implementado com 8 nichos e helpers
- [x] `EducationNicheConfigService` implementado
- [x] `EducationNicheBillingIntegration` implementado (nicho + billing)
- [x] `useEducationNiche` implementado
- [x] `useEducationNicheBilling` implementado
- [x] `EducationCapabilityGuard` e `EducationUpgradeBanner` implementados
- [x] testes de nichos presentes em `niches/__tests__`
- [x] guards aplicados em EducationProgramsPage, EducationSetupPage, EducationDashboardPage

Gaps reais para proximo incremento:
- [ ] Aplicar guards em EducationEventsPage e EducationAnalyticsPage
- [ ] Implementar tratamento específico de erros de limite nos serviços
- [ ] Criar documentação de API pública dos nichos

---

## ESCOPO DESTE CICLO

Objetivo do ciclo atual:
- consolidar gating por capability/plano sem quebrar o que ja esta funcionando;
- evitar duplicacao de regra fora de `registry/service/hook`;
- preparar base para evolucao de nichos sem criar submodulos paralelos.

Fora de escopo deste ciclo:
- refatoracao ampla de UI sem demanda funcional;
- "versioning layer" completo se nao houver necessidade imediata;
- metas artificiais de quantidade de testes sem criterio de risco.

---

## FASE 0: BASELINE E GOVERNANCA (Prioridade: CRITICA)

### Task 0.1: Validar SSOT atual dos nichos
**Arquivos**:
- `src/modules/business/education/niches/types.ts`
- `src/modules/business/education/niches/registry.ts`
- `src/modules/business/education/niches/services/EducationNicheConfigService.ts`
- `src/modules/business/education/niches/hooks/useEducationNiche.ts`

**Checklist**:
- [x] Confirmar que tipos do guide batem com o codigo
- [x] Confirmar que support levels usados sao: `full_enabled`, `basic_enabled`, `beta`, `planned`
- [x] Confirmar que capabilities e admin sections estao centralizadas no registry

---

## FASE 1: HARDENING DE CONTRATOS (Prioridade: ALTA)

### Task 1.1: Guardas de tipo e validacoes
**Arquivos alvo**:
- `src/modules/business/education/niches/types.ts`
- `src/modules/business/education/niches/registry.ts`
- `src/modules/business/education/niches/services/EducationNicheConfigService.ts`

**Checklist**:
- [x] Adicionar type guards uteis (`isEducationNicheKey`, `isEducationCapability`)
- [x] Garantir fallback seguro para nicho invalido (`getNicheOrDefault`)
- [x] Garantir mensagens de erro objetivas em `validateForNiche`

### Task 1.2: Coerencia de entitlements
**Fonte de verdade**: `registry.ts`

**Checklist**:
- [x] Remover qualquer matriz externa que contradiga os limites do `registry.ts`
- [x] Tratar `maxPrograms`, `maxEvents`, `maxLeadsPerMonth` como dados de runtime do registry
- [x] Evitar hardcode de limite em componente/pagina

---

## FASE 2: GATING NICHO + BILLING (Prioridade: CRITICA)

### Task 2.1: Intersecao obrigatoria
Regra canonica:
- capability final = `nicho permite` AND `plano permite`

**Checklist**:
- [x] Integrar `EducationNicheConfigService` com estado de assinatura (`useEducationSubscription`/billing service)
- [x] Criar helper unico para resolver capability efetiva por contexto (`EducationNicheBillingIntegration`)
- [x] Bloquear acao quando capability ou plano negar

### Task 2.2: Gating de limites operacionais
**Pontos minimos**:
- criar programa
- criar evento
- receber lead

**Checklist**:
- [x] Aplicar `canCreateProgram`, `canCreateEvent`, `canReceiveLead` no fluxo de negocio
- [x] Retornar erro funcional claro quando limite for atingido
- [x] Nao deixar regra de limite apenas na camada visual

---

## FASE 3: GUARDS VISUAIS E UPGRADE UX (Prioridade: ALTA)

### Task 3.1: Guard visual reutilizavel
**Arquivos sugeridos**:
- `src/modules/business/education/niches/components/EducationCapabilityGuard.tsx`
- `src/modules/business/education/niches/components/EducationPlanGuard.tsx`

**Checklist**:
- [x] Criar guard visual unico para capability (`EducationCapabilityGuard`)
- [x] Guard visual integrado ao hook `useEducationNicheBilling`
- [x] Evitar `if (nicheKey === 'x')` espalhado

### Task 3.2: Banner de upgrade
**Arquivo sugerido**:
- `src/modules/business/education/niches/components/EducationUpgradeBanner.tsx`

**Checklist**:
- [x] Exibir bloqueio por plano com CTA claro
- [x] Exibir bloqueio por nicho com mensagem correta
- [x] Reuso do mesmo componente em setup/dashboard/programas/eventos

---

## FASE 4: INTEGRACAO NAS PAGINAS EDUCATION (Prioridade: ALTA)

### Task 4.1: Setup e dashboard
**Arquivos alvo**:
- `src/modules/business/education/pages/EducationSetupPage.tsx`
- `src/modules/business/education/pages/EducationDashboardPage.tsx`

**Checklist**:
- [x] Mostrar nicho selecionado e status de suporte
- [x] Mostrar capabilities essenciais habilitadas/bloqueadas

### Task 4.2: Programas, eventos e analytics
**Arquivos alvo**:
- `src/modules/business/education/pages/EducationProgramsPage.tsx`
- `src/modules/business/education/pages/EducationEventsPage.tsx`
- `src/modules/business/education/pages/EducationAnalyticsPage.tsx`

**Checklist**:
- [x] Aplicar guard por capability antes de acao critica (EducationProgramsPage)
- [x] Aplicar guard por plano para analytics/export quando necessario
- [x] UX consistente de bloqueio (banner + estado desabilitado)

---

## FASE 5: TESTES E VALIDACAO (Prioridade: CRITICA)

### Task 5.1: Testes unitarios de nichos
**Arquivos**:
- `src/modules/business/education/niches/__tests__/registry.test.ts`
- `src/modules/business/education/niches/__tests__/EducationNicheConfigService.test.ts`
- `src/modules/business/education/niches/__tests__/useEducationNiche.test.tsx`
- `src/modules/business/education/niches/__tests__/EducationNicheBillingIntegration.test.ts`
- `src/modules/business/education/niches/__tests__/typeGuards.test.ts`
- `src/modules/business/education/niches/__tests__/useEducationNicheBilling.test.tsx`

**Checklist**:
- [x] Cobrir fallback de nicho
- [x] Cobrir capability allow/deny
- [x] Cobrir limites (program/event/lead)
- [x] Cobrir combinacao nicho + plano

### Task 5.2: Validadores obrigatorios
```bash
npm run check:ssot
npm run typecheck
npm run build
```

**Checklist**:
- [ ] SSOT sem violacoes
- [ ] Typecheck sem erros
- [ ] Build sem regressao

---

## FASE 6: DOCUMENTACAO E HANDOFF (Prioridade: MEDIA)

### Task 6.1: Atualizar docs
**Arquivos**:
- `docs/EDUCATION_NICHES_IMPLEMENTATION_GUIDE.md`
- `docs/EDUCATION_NICHES_TASKS.md`
- `src/modules/business/education/README.md` (se impactado)

**Checklist**:
- [x] Registrar o que foi implementado vs backlog
- [x] Remover instrucoes que conflitam com o estado real
- [x] Incluir riscos residuais e proximos passos

---

## DEFINITION OF DONE (DoD)

So considerar pronto quando:
- [ ] regra `nicho + plano` aplicada de forma consistente
- [ ] limites operacionais validados no fluxo de negocio
- [ ] guard visual e banner de upgrade implementados (se no escopo)
- [ ] sem hardcode de capability/limite em UI
- [ ] `check:ssot`, `typecheck` e `build` passando
- [ ] docs atualizadas

---

## ANTI-PATTERNS (BLOQUEIO DE PR)

- `if (nicheKey === 'x')` espalhado em componentes/paginas
- capability hardcoded fora de `types/registry/service`
- matriz de entitlements paralela ao `registry.ts`
- regra de billing implementada apenas na UI
- criar submodulo inteiro por nicho em vez de capability gating

---

## PROMPT PRONTO PARA OUTRA IA (INCREMENTAL)

```txt
Implemente o proximo incremento de nichos em:
src/modules/business/education/niches

Siga estritamente:
docs/EDUCATION_NICHES_TASKS.md
docs/EDUCATION_NICHES_IMPLEMENTATION_GUIDE.md
docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md

Regras:
1) SSOT no registry/service/hook; sem hardcode em componente.
2) Capability final = nicho + entitlement do plano.
3) Nao criar estrutura paralela/legada de entitlements.
4) Cobrir testes para allow/deny/limites/fallback.
5) Nao finalizar sem validar check:ssot + typecheck + build.
```

---

**Ultima atualizacao**: 2026-04-26
**Status**: Fases 1-5 completas. Aguardando validação final e Fase 6.
**Owner**: Time de Produto
