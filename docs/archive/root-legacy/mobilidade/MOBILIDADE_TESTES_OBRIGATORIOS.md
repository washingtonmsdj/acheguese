# MOBILIDADE: TESTES OBRIGATÓRIOS

**Data:** 08/04/2026  
**Objetivo:** Definir suíte mínima para CI/CD

---

## SMOKE TESTS (OBRIGATÓRIOS)

### Executar Sempre Antes de Deploy

```bash
# Testes críticos E2E
npm test tests/operational/gate6-runtime-with-drivers.test.ts
npm test tests/operational/gate6-motoboy-runtime.test.ts
```

**Tempo Total:** ~1 minuto  
**Cobertura:** Fluxos completos passageiro e motoboy

---

## SUÍTE COMPLETA (CI/CD)

### Nível 1: Crítico (Bloqueante)

**Passageiro E2E:**
```bash
npm test tests/operational/gate6-runtime-with-drivers.test.ts
npm test tests/operational/gate6-runtime-no-drivers.test.ts
```

**Resultado Esperado:** 6/6 testes passando
- A.1. Fluxo completo
- A.2. Cancelamento
- B.1. Expiração sem motoristas
- B.2. Múltiplas expiram

**Motoboy E2E:**
```bash
npm test tests/operational/gate6-motoboy-runtime.test.ts
```

**Resultado Esperado:** 3/3 testes passando
- M.1. Fluxo completo
- M.2. Falha na entrega
- M.3. Expiração sem motoboy

**Total Nível 1:** 9 testes | ~2 minutos

---

### Nível 2: Validação (Importante)

**Cancelamento:**
```bash
npm test tests/operational/gate3-cancellation-validation.test.ts
npm test tests/operational/gate3-simple-test.test.ts
```

**Disponibilidade:**
```bash
npm test tests/operational/gate5-availability-test.test.ts
```

**Failed Delivery:**
```bash
npm test tests/operational/gate3-failed-delivery-metadata.test.ts
```

**Total Nível 2:** ~15 testes | ~1 minuto

---

### Nível 3: Complementar (Opcional)

**Localização:**
```bash
npm test tests/operational/gate2-operational-authenticated.test.ts
```

**Concorrência:**
```bash
npm test tests/operational/gate3-concurrency-validation.test.ts
```

**Reconexão:**
```bash
npm test tests/operational/gate4-reconnection-test.test.ts
```

**Realtime:**
```bash
npm test tests/operational/gate3-realtime-validation.test.ts
```

**Total Nível 3:** ~20 testes | ~2 minutos

---

## CONFIGURAÇÃO CI/CD

### GitHub Actions (Exemplo)

```yaml
name: Mobility Tests

on:
  push:
    paths:
      - 'src/modules/mobility/**'
      - 'tests/operational/gate*.test.ts'
      - 'supabase/functions/auto-dispatch-ride/**'
  pull_request:
    paths:
      - 'src/modules/mobility/**'
      - 'tests/operational/gate*.test.ts'

jobs:
  smoke-tests:
    name: Smoke Tests (Critical)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Run Critical E2E Tests
        run: |
          npm test tests/operational/gate6-runtime-with-drivers.test.ts
          npm test tests/operational/gate6-motoboy-runtime.test.ts
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

  full-suite:
    name: Full Test Suite
    runs-on: ubuntu-latest
    needs: smoke-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Run All Mobility Tests
        run: npm test tests/operational/gate*.test.ts
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## CRITÉRIOS DE SUCESSO

### Smoke Tests

✅ **PASS:** 9/9 testes passando  
❌ **FAIL:** Qualquer teste falhando → BLOQUEIA DEPLOY

### Full Suite

✅ **PASS:** >95% testes passando  
⚠️ **WARNING:** 90-95% passando → REVISAR  
❌ **FAIL:** <90% passando → BLOQUEIA MERGE

---

## TESTES POR FUNCIONALIDADE

### Auto-Dispatch

**Testes:**
- `gate6-runtime-with-drivers.test.ts` → A.1, A.2
- `gate6-runtime-no-drivers.test.ts` → B.1, B.2
- `gate6-motoboy-runtime.test.ts` → M.1, M.3

**Cobertura:** 6 testes

### Proof of Delivery

**Testes:**
- `gate6-motoboy-runtime.test.ts` → M.1

**Cobertura:** 1 teste

### Failed Delivery

**Testes:**
- `gate6-motoboy-runtime.test.ts` → M.2
- `gate3-failed-delivery-metadata.test.ts`

**Cobertura:** 2+ testes

### Disponibilidade

**Testes:**
- `gate5-availability-test.test.ts`
- `gate6-runtime-with-drivers.test.ts` → A.1, A.2
- `gate6-motoboy-runtime.test.ts` → M.1, M.2

**Cobertura:** 5+ testes

### Cancelamento

**Testes:**
- `gate6-runtime-with-drivers.test.ts` → A.2
- `gate3-cancellation-validation.test.ts`
- `gate3-simple-test.test.ts`

**Cobertura:** 3+ testes

---

## EXECUÇÃO LOCAL

### Smoke Tests (Rápido)

```bash
npm test tests/operational/gate6-runtime-with-drivers.test.ts tests/operational/gate6-motoboy-runtime.test.ts
```

**Tempo:** ~1 minuto

### Suíte Completa

```bash
npm test tests/operational/gate*.test.ts
```

**Tempo:** ~5 minutos

### Teste Específico

```bash
npm test tests/operational/gate6-runtime-with-drivers.test.ts
```

---

## MONITORAMENTO

### Métricas Críticas

**Performance:**
- Auto-dispatch: <500ms (alerta se >1s)
- Liberação motorista: <500ms
- Expiração: <500ms

**Confiabilidade:**
- Taxa de sucesso: >99%
- Falsos positivos: <1%

**Cobertura:**
- Passageiro: 100% (4/4 testes)
- Motoboy: 100% (3/3 testes)

### Alertas

**Crítico:**
- Qualquer teste smoke falhando
- Auto-dispatch >2s
- Taxa de sucesso <95%

**Warning:**
- Auto-dispatch >1s
- Taxa de sucesso <99%
- Testes intermitentes

---

## MANUTENÇÃO

### Adicionar Novo Teste

1. Criar em `tests/operational/`
2. Seguir padrão `gate*-*.test.ts`
3. Usar helpers SSOT (`gate6-*-helpers.ts`)
4. Adicionar a este documento se crítico
5. Atualizar CI/CD se bloqueante

### Deprecar Teste

1. Mover para `tests/legacy/`
2. Remover de CI/CD
3. Atualizar este documento
4. Adicionar nota em `tests/legacy/README.md`

---

## TROUBLESHOOTING

### Teste Falhando Localmente

1. Verificar variáveis de ambiente (`.env`)
2. Verificar banco remoto (Supabase)
3. Verificar edge function deployada
4. Limpar dados de teste antigos

### Teste Falhando no CI

1. Verificar secrets do GitHub
2. Verificar timeout (aumentar se necessário)
3. Verificar concorrência (isolar se necessário)
4. Verificar estado do banco remoto

### Performance Degradada

1. Verificar latência do banco
2. Verificar edge function (logs)
3. Verificar número de motoristas disponíveis
4. Verificar queries N+1

---

## RESUMO

**Smoke Tests:** 9 testes | ~1 min | BLOQUEANTE  
**Suíte Completa:** ~40 testes | ~5 min | RECOMENDADO  
**Cobertura:** Passageiro 100% | Motoboy 100%  
**Performance:** Auto-dispatch <500ms | Liberação <500ms

**Executar antes de:**
- Deploy para produção
- Merge de PR
- Release de versão
- Modificação em core services

