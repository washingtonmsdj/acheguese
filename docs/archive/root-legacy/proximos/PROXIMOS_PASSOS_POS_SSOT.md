# 🚀 PRÓXIMOS PASSOS PÓS-REFATORAÇÃO SSOT

## 📊 SITUAÇÃO ATUAL

A refatoração SSOT está 100% concluída. O projeto agora segue rigorosamente o padrão:

**Database → Service → Hook → Component**

---

## 🎯 OPORTUNIDADES DE MELHORIA IDENTIFICADAS

### 1. 🔴 CRÍTICO - Integração com Serviços de Monitoramento

**Arquivos Afetados**:
- `src/shared/utils/logger.ts`
- `src/shared/utils/errorTracking.ts`
- `src/shared/utils/webVitals.ts`

**TODOs Encontrados**:
```typescript
// TODO: Integrar com Sentry
// TODO: Integrar com LogRocket
// TODO: Enviar para backend próprio
// TODO: Integrar com analytics
// TODO: Integrar com serviço de performance
```

**Impacto**: ALTO - Sem monitoramento, erros em produção não são rastreados

**Ação Recomendada**:
1. Escolher serviço de monitoramento (Sentry recomendado)
2. Configurar integração
3. Implementar envio de logs
4. Configurar alertas

**Estimativa**: 2-3 horas

---

### 2. 🟡 IMPORTANTE - Migração de Types para Generated

**Arquivos Afetados**:
- `src/modules/mobility/types/index.ts` (tipos manuais)
- Múltiplos components com comentário: `// TODO: Migrar para mobility.generated.ts`

**TODOs Encontrados**:
```typescript
// TODO: Migrar para mobility.generated.ts
import type { RideRequest, RideStatus, DriverRoute } from "@/modules/mobility/types";
```

**Impacto**: MÉDIO - Types manuais podem ficar desatualizados

**Ação Recomendada**:
1. Gerar types do Supabase automaticamente
2. Substituir imports manuais por generated
3. Remover types duplicados

**Estimativa**: 3-4 horas

---

### 3. 🟡 IMPORTANTE - Implementar Hooks Reais (Substituir Mocks)

**Arquivos Afetados**:
- `src/shared/hooks/useAppointments.ts`
- `src/shared/hooks/usePushNotifications.ts`
- `src/modules/mobility/components/DriverRoutesPanel.tsx`
- `src/modules/mobility/components/NeighborRankingPanel.tsx`
- `src/modules/vagas/data/mock-vagas.ts`

**TODOs Encontrados**:
```typescript
// TODO: Implementar query real do Supabase
// TODO: Implementar carregamento do Supabase
// TODO: Implementar hook para buscar rotas reais do Supabase
// TODO: Substituir por VagasService quando backend estiver pronto
```

**Impacto**: MÉDIO - Funcionalidades usando dados mockados

**Ação Recomendada**:
1. Criar services para cada funcionalidade
2. Implementar queries reais
3. Criar hooks usando React Query
4. Remover dados mockados

**Estimativa**: 6-8 horas

---

### 4. 🟢 BAIXA PRIORIDADE - Implementar Realtime Updates

**Arquivos Afetados**:
- `src/modules/mobility/pages/TrackRidePage.tsx`

**TODOs Encontrados**:
```typescript
// TODO: Implementar realtime updates via MobilityService
// Temporariamente desabilitado para eliminar dependência direta do supabase
```

**Impacto**: BAIXO - Funcionalidade funciona sem realtime

**Ação Recomendada**:
1. Adicionar método de subscription no MobilityService
2. Implementar listener no hook
3. Atualizar UI em tempo real

**Estimativa**: 2-3 horas

---

### 5. 🟢 BAIXA PRIORIDADE - Remover Campos Legados

**Arquivos Afetados**:
- `src/shared/schemas/business/businessSchemas.ts`

**TODOs Encontrados**:
```typescript
// TODO: Campos legados - remover em versão futura
instagram: z.string().optional(),
facebook: z.string().optional(),
```

**Impacto**: BAIXO - Campos não usados

**Ação Recomendada**:
1. Verificar se campos são usados
2. Criar migration para remover do banco
3. Remover do schema

**Estimativa**: 1 hora

---

### 6. 🟢 BAIXA PRIORIDADE - Implementar Filtros Territoriais

**Arquivos Afetados**:
- `src/modules/vagas/hooks/useVagas.ts`
- `src/modules/services/pages/ServicosLandingPage.tsx`

**TODOs Encontrados**:
```typescript
// TODO: Quando backend existir, passar territoryFilter para a query SQL
// TODO: useTopRatedProfessionals não aceita `resolved` — exibe os melhores globais
```

**Impacto**: BAIXO - Filtros funcionam no client-side

**Ação Recomendada**:
1. Adicionar filtro territorial nos services
2. Implementar query SQL com filtro
3. Remover filtro client-side

**Estimativa**: 2-3 horas

---

### 7. 🟢 BAIXA PRIORIDADE - Implementar Funcionalidades Sociais

**Arquivos Afetados**:
- `src/modules/profile/hooks/useUserPosts.ts`
- `src/modules/classifieds/hooks/useVendedorPerfil.ts`

**TODOs Encontrados**:
```typescript
// TODO: Implementar verificação de curtida
// TODO: Implementar verificação de salvamento
// TODO: calcular taxa de resposta real
// TODO: calcular média de avaliações reais
// TODO: buscar avaliações reais do banco
```

**Impacto**: BAIXO - Funcionalidades básicas funcionam

**Ação Recomendada**:
1. Criar SocialService
2. Implementar likes/saves
3. Implementar cálculo de métricas
4. Implementar sistema de avaliações

**Estimativa**: 8-10 horas

---

## 📋 PLANO DE AÇÃO RECOMENDADO

### FASE 1: Monitoramento e Observabilidade (CRÍTICO)
**Tempo**: 2-3 horas  
**Prioridade**: 🔴 ALTA

1. Configurar Sentry
2. Implementar error tracking
3. Implementar performance monitoring
4. Configurar alertas

**Benefício**: Rastreamento de erros em produção

---

### FASE 2: Migração de Types (IMPORTANTE)
**Tempo**: 3-4 horas  
**Prioridade**: 🟡 MÉDIA

1. Gerar types do Supabase
2. Substituir imports manuais
3. Remover duplicações

**Benefício**: Types sempre atualizados com o banco

---

### FASE 3: Substituir Mocks por Implementações Reais (IMPORTANTE)
**Tempo**: 6-8 horas  
**Prioridade**: 🟡 MÉDIA

1. Implementar AppointmentsService
2. Implementar NotificationsService
3. Implementar VagasService
4. Remover dados mockados

**Benefício**: Funcionalidades completas e reais

---

### FASE 4: Melhorias Incrementais (BAIXA PRIORIDADE)
**Tempo**: 13-17 horas  
**Prioridade**: 🟢 BAIXA

1. Implementar realtime updates
2. Remover campos legados
3. Implementar filtros territoriais server-side
4. Implementar funcionalidades sociais completas

**Benefício**: Experiência do usuário aprimorada

---

## 🎯 PRIORIZAÇÃO SUGERIDA

### Curto Prazo (1-2 semanas)
1. ✅ Refatoração SSOT - CONCLUÍDO
2. 🔴 Fase 1: Monitoramento (2-3 horas)
3. 🟡 Fase 2: Migração de Types (3-4 horas)

### Médio Prazo (3-4 semanas)
4. 🟡 Fase 3: Substituir Mocks (6-8 horas)
5. 🟢 Implementar realtime updates (2-3 horas)

### Longo Prazo (1-2 meses)
6. 🟢 Remover campos legados (1 hora)
7. 🟢 Filtros territoriais server-side (2-3 horas)
8. 🟢 Funcionalidades sociais completas (8-10 horas)

---

## 📊 ESTIMATIVA TOTAL

| Fase | Tempo | Prioridade |
|------|-------|------------|
| Fase 1: Monitoramento | 2-3h | 🔴 ALTA |
| Fase 2: Types | 3-4h | 🟡 MÉDIA |
| Fase 3: Mocks | 6-8h | 🟡 MÉDIA |
| Fase 4: Melhorias | 13-17h | 🟢 BAIXA |
| **TOTAL** | **24-32h** | - |

---

## 🎓 RECOMENDAÇÕES

### 1. Não Quebrar o SSOT
Ao implementar qualquer melhoria, SEMPRE seguir o padrão:
**Database → Service → Hook → Component**

### 2. Documentar Decisões
Criar documentos de decisão arquitetural (ADR) para mudanças importantes.

### 3. Testes Automatizados
Considerar adicionar testes para services críticos:
- Unit tests para services
- Integration tests para hooks
- E2E tests para fluxos críticos

### 4. Code Review
Estabelecer processo de code review para garantir conformidade SSOT.

### 5. CI/CD
Adicionar validações automáticas:
- Lint de imports (detectar violações SSOT)
- TypeScript check
- Testes automatizados

---

## 🚀 PRÓXIMA AÇÃO IMEDIATA

### Recomendação: Implementar Monitoramento (Fase 1)

**Por quê?**
- Crítico para produção
- Rápido de implementar (2-3 horas)
- Alto impacto (rastreamento de erros)
- Não depende de outras tarefas

**Como começar?**
1. Criar conta no Sentry
2. Instalar SDK: `npm install @sentry/react`
3. Configurar em `src/main.tsx`
4. Implementar em `errorTracking.ts`
5. Testar com erro intencional

---

## 📚 RECURSOS ÚTEIS

### Sentry
- Docs: https://docs.sentry.io/platforms/javascript/guides/react/
- Setup: https://docs.sentry.io/platforms/javascript/guides/react/configuration/

### Supabase Type Generation
- Docs: https://supabase.com/docs/guides/api/rest/generating-types
- CLI: `npx supabase gen types typescript`

### React Query
- Docs: https://tanstack.com/query/latest/docs/framework/react/overview
- Best Practices: https://tkdodo.eu/blog/practical-react-query

---

## ✅ CHECKLIST DE QUALIDADE

Antes de considerar qualquer fase concluída:

- [ ] TypeScript sem erros
- [ ] Conformidade SSOT 100%
- [ ] Documentação atualizada
- [ ] Testes passando (se existirem)
- [ ] Code review aprovado
- [ ] Testado em ambiente de staging

---

**Data**: 2026-04-04  
**Status**: 📋 PLANO CRIADO  
**Próxima Ação**: Implementar Fase 1 (Monitoramento)
