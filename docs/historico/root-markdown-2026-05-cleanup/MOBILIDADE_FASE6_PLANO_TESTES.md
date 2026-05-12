# MOBILIDADE - FASE 6: PLANO DE TESTES

**Data**: 2026-04-19  
**Status**: EM EXECUÇÃO  
**Objetivo**: Validar implementação completa antes do lançamento

---

## 🎯 Objetivo da Fase 6

Executar testes críticos para garantir que o módulo de mobilidade (motoboy) está pronto para produção, validando:
- ✅ Permissões por ator
- ✅ Fluxos E2E críticos
- ✅ Admin operacional
- ✅ Segurança (RLS)
- ✅ Performance
- ✅ Logs e console

---

## 📋 Estrutura de Testes

### T6.1 - Testes de Permissão por Ator
**Objetivo**: Validar matriz de permissões do MotoboyAuthorizationService

**Cenários**:
1. Passenger pode solicitar motoboy
2. Business com plano adequado pode solicitar
3. Business sem plano não pode solicitar
4. Gastronomy com plano adequado pode solicitar
5. Usuário sem vínculo não pode solicitar
6. Território desabilitado bloqueia solicitação
7. Motorista suspenso não pode aceitar
8. Motorista sem can_do_delivery não pode aceitar

**Método**: Unit tests + Integration tests

### T6.2 - Testes de Fluxo E2E Crítico
**Objetivo**: Validar fluxo completo de ponta a ponta

**Cenários**:
1. **Fluxo Completo - Business → Motoboy → Conclusão**
   - Business solicita entrega
   - Motoboy aceita
   - Confirma coleta
   - Inicia entrega
   - Confirma entrega
   - Passageiro avalia

2. **Fluxo de Cancelamento**
   - Business solicita entrega
   - Business cancela antes de aceite
   - Motoboy aceita
   - Passageiro cancela após aceite

3. **Fluxo de Falha**
   - Motoboy aceita entrega
   - Falha na entrega
   - Admin visualiza falha

**Método**: E2E tests (Playwright/Cypress)

### T6.3 - Testes Admin de Override
**Objetivo**: Validar controle operacional do admin

**Cenários**:
1. Admin visualiza todas as entregas
2. Admin filtra por status
3. Admin filtra por território
4. Admin cancela entrega operacional
5. Admin visualiza métricas SLA
6. Admin gerencia reports
7. Admin atualiza status de report

**Método**: Manual + Integration tests

### T6.4 - Testes de Regressão Territorial
**Objetivo**: Validar rollout por território

**Cenários**:
1. Território com motoboy habilitado permite solicitação
2. Território com motoboy desabilitado bloqueia
3. Território sem mobilidade bloqueia tudo
4. Mudança de território atualiza permissões

**Método**: Integration tests

### T6.5 - Validação de Logs/Console
**Objetivo**: Garantir ambiente limpo

**Cenários**:
1. Console sem erros críticos
2. Logs de auditoria funcionando
3. Sem warnings de TypeScript
4. Sem memory leaks
5. Performance aceitável

**Método**: Manual + Automated

---

## 🧪 Testes Automatizados

### Unit Tests (Jest/Vitest)

#### MotoboyAuthorizationService.test.ts
```typescript
describe('MotoboyAuthorizationService', () => {
  describe('canRequestDelivery', () => {
    it('should allow passenger with valid profile', async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: 'passenger',
        locationId: 'valid-location',
        userId: 'valid-user',
      });
      expect(result.allowed).toBe(true);
    });

    it('should deny business without plan', async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: 'business',
        sourceId: 'business-id',
        locationId: 'valid-location',
        planTier: 'free',
        userId: 'valid-user',
      });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('PLAN_NOT_ALLOWED');
    });

    it('should deny when motoboy disabled', async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: 'passenger',
        locationId: 'disabled-location',
        userId: 'valid-user',
      });
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('MOTOBOY_DISABLED');
    });
  });

  describe('canOperateDelivery', () => {
    it('should allow verified driver with can_do_delivery', async () => {
      const result = await MotoboyAuthorizationService.canOperateDelivery('driver-id');
      expect(result.allowed).toBe(true);
    });

    it('should deny suspended driver', async () => {
      const result = await MotoboyAuthorizationService.canOperateDelivery('suspended-driver');
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('DRIVER_SUSPENDED');
    });
  });
});
```

#### RideReportsService.test.ts
```typescript
describe('RideReportsService', () => {
  describe('createReport', () => {
    it('should create report successfully', async () => {
      const result = await RideReportsService.createReport({
        rideId: 'ride-id',
        reporterProfileId: 'profile-id',
        reporterType: 'passenger',
        reportType: 'driver_behavior',
        severity: 'medium',
        title: 'Test Report',
        description: 'Test description',
      });
      expect(result.success).toBe(true);
      expect(result.reportId).toBeDefined();
    });
  });

  describe('updateReport', () => {
    it('should update report status', async () => {
      const result = await RideReportsService.updateReport('report-id', {
        status: 'resolved',
        resolutionNotes: 'Issue resolved',
      });
      expect(result.success).toBe(true);
    });
  });
});
```

### Integration Tests

#### ride-flow.integration.test.ts
```typescript
describe('Ride Flow Integration', () => {
  it('should complete full delivery flow', async () => {
    // 1. Business solicita entrega
    const delivery = await createDelivery({
      sourceType: 'business',
      sourceId: 'business-id',
      // ... outros campos
    });
    expect(delivery.status).toBe('pending');

    // 2. Motoboy aceita
    await acceptRide(delivery.id, 'driver-id');
    const accepted = await getRide(delivery.id);
    expect(accepted.status).toBe('driver_assigned');

    // 3. Confirma coleta
    await confirmPickup(delivery.id, 'driver-id');
    const pickedUp = await getRide(delivery.id);
    expect(pickedUp.status).toBe('in_progress');

    // 4. Confirma entrega
    await confirmDelivery(delivery.id, 'driver-id');
    const completed = await getRide(delivery.id);
    expect(completed.status).toBe('completed');
  });
});
```

---

## 🔍 Testes Manuais

### Checklist de Validação Manual

#### 1. Solicitação de Motoboy
- [ ] Abrir dashboard de empresa
- [ ] Clicar em "Solicitar Motoboy"
- [ ] Preencher formulário
- [ ] Verificar validação de campos
- [ ] Submeter solicitação
- [ ] Verificar toast de sucesso
- [ ] Verificar entrega criada no banco

#### 2. Painel do Motoboy
- [ ] Abrir painel do motoboy
- [ ] Verificar ofertas em tempo real
- [ ] Aceitar uma entrega
- [ ] Verificar status atualizado
- [ ] Confirmar coleta
- [ ] Iniciar entrega
- [ ] Confirmar entrega
- [ ] Verificar conclusão

#### 3. Admin Operacional
- [ ] Abrir AdminMotoboyOperations
- [ ] Verificar lista de entregas
- [ ] Aplicar filtros (status, território)
- [ ] Verificar métricas SLA
- [ ] Cancelar uma entrega
- [ ] Verificar auditoria

#### 4. Sistema de Reports
- [ ] Abrir AdminReportsPassageirosV2
- [ ] Verificar lista de reports
- [ ] Criar novo report
- [ ] Atualizar status (pending → under_review)
- [ ] Resolver report
- [ ] Verificar estatísticas

#### 5. Histórico e Avaliações
- [ ] Abrir HistoricoPage
- [ ] Verificar hero section com stats
- [ ] Filtrar por tipo/status
- [ ] Avaliar uma corrida
- [ ] Verificar avaliação salva

#### 6. Rastreamento
- [ ] Abrir TrackRidePage com token
- [ ] Verificar loading state
- [ ] Verificar dados da corrida
- [ ] Clicar em refresh manual
- [ ] Verificar atualização

---

## 🔒 Testes de Segurança

### RLS Policies

#### Validar ride_requests
```sql
-- Como passageiro, deve ver apenas suas corridas
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "passenger-user-id"}';
SELECT * FROM ride_requests;
-- Deve retornar apenas corridas do passageiro

-- Como motorista, deve ver corridas atribuídas
SET LOCAL request.jwt.claims TO '{"sub": "driver-user-id"}';
SELECT * FROM ride_requests WHERE driver_profile_id = 'driver-profile-id';
-- Deve retornar apenas corridas do motorista

-- Como admin, deve ver todas
SET LOCAL request.jwt.claims TO '{"sub": "admin-user-id", "role": "admin"}';
SELECT * FROM ride_requests;
-- Deve retornar todas as corridas
```

#### Validar ride_reports
```sql
-- Como passageiro, deve ver apenas seus reports
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "passenger-user-id"}';
SELECT * FROM ride_reports;
-- Deve retornar apenas reports do passageiro

-- Como admin, deve ver todos
SET LOCAL request.jwt.claims TO '{"sub": "admin-user-id", "role": "admin"}';
SELECT * FROM ride_reports;
-- Deve retornar todos os reports
```

### Validar Autorização Backend

#### Teste de Bypass
```bash
# Tentar criar entrega sem permissão
curl -X POST http://localhost:3000/api/rides \
  -H "Authorization: Bearer <token-sem-permissao>" \
  -d '{"sourceType": "business", "sourceId": "business-id", ...}'
# Deve retornar 403 Forbidden
```

---

## 📊 Testes de Performance

### Métricas Alvo

| Métrica | Target | Crítico |
|---------|--------|---------|
| **Tempo de carregamento** | < 2s | < 5s |
| **Tempo de resposta API** | < 500ms | < 2s |
| **Tamanho do bundle** | < 500KB | < 1MB |
| **Memory usage** | < 100MB | < 200MB |
| **FPS (animações)** | > 30fps | > 15fps |

### Ferramentas
- Lighthouse (Performance Score > 80)
- Chrome DevTools (Network, Performance)
- React DevTools Profiler

---

## 🐛 Testes de Regressão

### Cenários de Regressão

1. **Vagas não afetadas**
   - Criar vaga
   - Verificar campos highlight_type e urgencia
   - Confirmar sem erros 400

2. **Outros módulos não afetados**
   - Gastronomia continua funcionando
   - Perfis continuam funcionando
   - Admin geral continua funcionando

3. **Navegação não quebrada**
   - Todas as rotas acessíveis
   - Lazy loading funcionando
   - Sem erros 404

---

## ✅ Critérios de Aprovação

### Obrigatório (GO/NO-GO)

#### Funcionalidade
- [ ] Todos os fluxos E2E críticos passam
- [ ] Permissões validadas (100%)
- [ ] Admin operacional funcional
- [ ] Sistema de reports funcional

#### Segurança
- [ ] RLS policies validadas
- [ ] Autorização backend validada
- [ ] Sem bypass de permissões

#### Qualidade
- [ ] Zero erros críticos no console
- [ ] Zero erros TypeScript
- [ ] Performance aceitável (> 80 Lighthouse)
- [ ] Sem memory leaks

#### Documentação
- [ ] Documentação completa
- [ ] Guias operacionais prontos
- [ ] Troubleshooting documentado

### Recomendado (Qualidade)

- [ ] Cobertura de testes > 70%
- [ ] Todos os testes unitários passam
- [ ] Todos os testes de integração passam
- [ ] Logs de auditoria funcionando

---

## 📝 Relatório de Testes

### Template de Relatório

```markdown
# Relatório de Testes - Mobilidade (Motoboy)

**Data**: YYYY-MM-DD
**Executor**: Nome
**Ambiente**: Desenvolvimento/Staging/Produção

## Resumo Executivo
- Total de testes: X
- Passaram: Y
- Falharam: Z
- Bloqueadores: N

## Testes Executados

### T6.1 - Permissões
- [x] Passenger pode solicitar
- [x] Business com plano pode solicitar
- [ ] Business sem plano bloqueado (FALHOU - ver issue #123)
...

### T6.2 - Fluxo E2E
- [x] Fluxo completo business → motoboy
- [x] Cancelamento
...

## Issues Encontrados

### Issue #1 - Crítico
**Descrição**: Business sem plano consegue solicitar
**Passos**: ...
**Esperado**: Bloqueio com mensagem
**Obtido**: Solicitação criada
**Prioridade**: CRÍTICA

## Recomendações
1. Corrigir issue #1 antes do lançamento
2. Adicionar mais testes de edge cases
...

## Conclusão
- [ ] APROVADO para produção
- [ ] REPROVADO - corrigir issues críticos
```

---

## 🚀 Execução dos Testes

### Fase 1: Setup (10 min)
```bash
# Aplicar migrações
cd supabase
supabase db push

# Verificar ambiente
npm run typecheck
npm run lint

# Preparar dados de teste
npm run seed:test
```

### Fase 2: Testes Automatizados (30 min)
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Fase 3: Testes Manuais (1-2 horas)
- Seguir checklist de validação manual
- Documentar issues encontrados
- Capturar screenshots/vídeos

### Fase 4: Testes de Segurança (30 min)
- Validar RLS policies
- Testar bypass de autorização
- Verificar logs de auditoria

### Fase 5: Testes de Performance (30 min)
- Lighthouse audit
- Network analysis
- Memory profiling

### Fase 6: Relatório (30 min)
- Compilar resultados
- Documentar issues
- Gerar relatório final

**Tempo Total Estimado**: 3-4 horas

---

## 📞 Próximos Passos

### Se APROVADO
1. Gerar relatório final
2. Atualizar documentação
3. Preparar deploy
4. Comunicar stakeholders

### Se REPROVADO
1. Documentar issues críticos
2. Priorizar correções
3. Re-executar testes
4. Validar correções

---

**Data de criação**: 2026-04-19  
**Responsável**: QA Team  
**Status**: Pronto para execução  
**Próximo marco**: Relatório de testes → Lançamento

