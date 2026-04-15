# MOBILIDADE: LIMPEZA FINAL

**Data:** 08/04/2026  
**Objetivo:** Consolidar SSOT e deprecar legado

---

## ARQUIVOS CRÍTICOS (SSOT)

### Core Services ✅

```
src/modules/mobility/core/
├── RideOperationalService.ts      ✅ SSOT - Orquestrador principal
├── RideDispatchService.ts         ✅ SSOT - Dispatch e aceite
├── RideStateMachine.ts            ✅ SSOT - State machine
└── DriverAvailabilityService.ts   ✅ SSOT - Disponibilidade
```

### Types ✅

```
src/modules/mobility/types/
└── FailedDeliveryMetadata.ts      ✅ SSOT - Types oficiais
```

### Constants ✅

```
src/modules/mobility/constants/
└── index.ts                       ✅ SSOT - RIDE_STATUS oficial
```

### Testes Críticos ✅

```
tests/operational/
├── gate6-runtime-with-drivers.test.ts    ✅ CRÍTICO - Passageiro E2E
├── gate6-runtime-no-drivers.test.ts      ✅ CRÍTICO - Passageiro sem motoristas
└── gate6-motoboy-runtime.test.ts         ✅ CRÍTICO - Motoboy E2E
```

### Helpers Críticos ✅

```
tests/helpers/
├── auth-helper.ts                 ✅ CRÍTICO - Autenticação
├── gate6-polling-helpers.ts       ✅ CRÍTICO - Polling determinístico
└── gate6-setup-helpers.ts         ✅ CRÍTICO - Setup de testes
```

### Edge Functions ✅

```
supabase/functions/
└── auto-dispatch-ride/
    └── index.ts                   ✅ CRÍTICO - Auto-dispatch
```

---

## ARQUIVOS LEGADOS (DEPRECATED)

### Testes Primitivos ⚠️ DEPRECATED

**Motivo:** Superseded por testes E2E com runtime real

```
tests/operational/gate6-primitives/
├── gate6-dispatch-primitives.test.ts      ⚠️ DEPRECATED - Validação primitiva
├── gate6-e2e-passenger-old.test.ts        ⚠️ DEPRECATED - Versão antiga
└── gate6-operational-cases-old.test.ts    ⚠️ DEPRECATED - Casos antigos
```

**Ação:** Mover para `tests/legacy/gate6-primitives/`

### Testes de Debug ⚠️ DEPRECATED

```
tests/operational/
├── debug-createRide.test.ts               ⚠️ DEPRECATED - Debug temporário
├── test-gate6-createRide-minimal.test.ts  ⚠️ DEPRECATED - Teste minimal
├── test-gate6-expire-source.test.ts       ⚠️ DEPRECATED - Debug expiração
└── test-gate6-setAvailable-minimal.test.ts ⚠️ DEPRECATED - Teste minimal
```

**Ação:** Mover para `tests/legacy/debug/`

### Helpers Antigos ⚠️ DEPRECATED

```
tests/helpers/
├── dispatch-test-helpers.ts               ⚠️ DEPRECATED - Superseded por gate6-*
└── supabase-test-client.ts                ⚠️ REVIEW - Verificar uso
```

**Ação:** 
- `dispatch-test-helpers.ts`: Mover para `tests/legacy/helpers/`
- `supabase-test-client.ts`: Verificar importações antes de mover

---

## TESTES VALIDAÇÃO ESPECÍFICA (MANTER)

### Gate 2 - Localização ✅

```
tests/operational/
├── gate2-operational-authenticated.test.ts  ✅ MANTER - Validação autenticada
├── gate2-operational-validation.test.ts     ✅ MANTER - Validação operacional
└── gate2-real-auth-validation.test.ts       ✅ MANTER - Validação auth real
```

### Gate 3 - Cancelamento ✅

```
tests/operational/
├── gate3-cancellation-validation.test.ts    ✅ MANTER - Validação cancelamento
├── gate3-concurrency-validation.test.ts     ✅ MANTER - Validação concorrência
├── gate3-failed-delivery-metadata.test.ts   ✅ MANTER - Validação metadata
├── gate3-realtime-validation.test.ts        ✅ MANTER - Validação realtime
└── gate3-simple-test.test.ts                ✅ MANTER - Testes simples
```

### Gate 4 - Reconexão ✅

```
tests/operational/
└── gate4-reconnection-test.test.ts          ✅ MANTER - Validação reconexão
```

### Gate 5 - Disponibilidade ✅

```
tests/operational/
└── gate5-availability-test.test.ts          ✅ MANTER - Validação disponibilidade
```

---

## ESTRUTURA FINAL PROPOSTA

```
tests/
├── operational/                    ✅ Testes operacionais (manter)
│   ├── gate2-*.test.ts            ✅ Validação localização
│   ├── gate3-*.test.ts            ✅ Validação cancelamento
│   ├── gate4-*.test.ts            ✅ Validação reconexão
│   ├── gate5-*.test.ts            ✅ Validação disponibilidade
│   ├── gate6-runtime-with-drivers.test.ts    ✅ CRÍTICO
│   ├── gate6-runtime-no-drivers.test.ts      ✅ CRÍTICO
│   └── gate6-motoboy-runtime.test.ts         ✅ CRÍTICO
│
├── helpers/                        ✅ Helpers SSOT (manter)
│   ├── auth-helper.ts             ✅ CRÍTICO
│   ├── gate6-polling-helpers.ts   ✅ CRÍTICO
│   └── gate6-setup-helpers.ts     ✅ CRÍTICO
│
└── legacy/                         ⚠️ Arquivos deprecated (criar)
    ├── gate6-primitives/          ⚠️ Testes primitivos antigos
    ├── debug/                     ⚠️ Testes de debug temporários
    └── helpers/                   ⚠️ Helpers superseded
```

---

## AÇÕES DE LIMPEZA

### 1. Criar Pasta Legacy

```bash
mkdir -p tests/legacy/gate6-primitives
mkdir -p tests/legacy/debug
mkdir -p tests/legacy/helpers
```

### 2. Mover Testes Primitivos

```bash
mv tests/operational/gate6-primitives/* tests/legacy/gate6-primitives/
rmdir tests/operational/gate6-primitives
```

### 3. Mover Testes de Debug

```bash
mv tests/operational/debug-createRide.test.ts tests/legacy/debug/
mv tests/operational/test-gate6-createRide-minimal.test.ts tests/legacy/debug/
mv tests/operational/test-gate6-expire-source.test.ts tests/legacy/debug/
mv tests/operational/test-gate6-setAvailable-minimal.test.ts tests/legacy/debug/
```

### 4. Mover Helpers Antigos

```bash
mv tests/helpers/dispatch-test-helpers.ts tests/legacy/helpers/
```

### 5. Adicionar README em Legacy

Criar `tests/legacy/README.md` explicando que são arquivos deprecated.

---

## VERIFICAÇÃO DE IMPORTAÇÕES

### Antes de Mover

Verificar se algum arquivo ativo importa:
- `dispatch-test-helpers.ts`
- `supabase-test-client.ts`
- Qualquer arquivo em `gate6-primitives/`

**Comando:**
```bash
grep -r "dispatch-test-helpers" tests/operational/
grep -r "supabase-test-client" tests/operational/
grep -r "gate6-primitives" tests/operational/
```

Se houver importações ativas, atualizar para usar helpers SSOT.

---

## DOCUMENTOS TEMPORÁRIOS (LIMPAR)

### Relatórios de Progresso ⚠️

Mover para pasta `docs/archive/`:

```
GATE_2_*.md (exceto GATE_2_FECHAMENTO_FINAL.md)
GATE_3_*.md (exceto GATE_3_FECHAMENTO_FINAL.md)
GATE_5_*.md (exceto GATE_5_FECHAMENTO_FINAL.md)
GATE_6_*.md (exceto GATE_6_FECHAMENTO_FINAL.md)
GATE_6_MOTOBOY_*.md (exceto relatório final)
APLICAR_*.sql (scripts já aplicados)
DIAGNOSTICO_*.md
VALIDAR_*.sql
CORRIGIR_*.sql
```

### Documentos Finais ✅ MANTER

```
MOBILIDADE_SSOT_FINAL.md           ✅ CRÍTICO - Verdade oficial
MOBILIDADE_EVIDENCIAS_FINAIS.md    ✅ CRÍTICO - Evidências
MOBILIDADE_LIMPEZA_FINAL.md        ✅ CRÍTICO - Este arquivo
GATE_6_FECHAMENTO_FINAL.md         ✅ MANTER - Fechamento passageiro
```

---

## RESULTADO ESPERADO

### Estrutura Limpa

```
src/modules/mobility/
├── core/                          ✅ Services SSOT
├── types/                         ✅ Types oficiais
├── constants/                     ✅ Constantes oficiais
└── [outros arquivos UI]

tests/
├── operational/                   ✅ Testes operacionais ativos
├── helpers/                       ✅ Helpers SSOT
└── legacy/                        ⚠️ Arquivos deprecated

docs/
├── MOBILIDADE_SSOT_FINAL.md       ✅ Verdade oficial
├── MOBILIDADE_EVIDENCIAS_FINAIS.md ✅ Evidências
└── archive/                       ⚠️ Relatórios históricos
```

### Benefícios

1. **Clareza:** Separação clara entre SSOT e legado
2. **Manutenção:** Fácil identificar o que é crítico
3. **Onboarding:** Novos devs sabem o que usar
4. **Regressão:** Testes críticos bem definidos
5. **Histórico:** Legado preservado mas isolado

---

## PRÓXIMOS PASSOS

1. ✅ Criar estrutura `tests/legacy/`
2. ✅ Mover arquivos deprecated
3. ✅ Verificar importações quebradas
4. ✅ Atualizar imports se necessário
5. ✅ Criar `tests/legacy/README.md`
6. ✅ Mover documentos temporários para `docs/archive/`
7. ✅ Executar testes críticos para validar
8. ✅ Commit com mensagem: "chore(mobility): cleanup and consolidate SSOT"

