# Legacy Tests - DEPRECATED

**Data de Arquivamento:** 08/04/2026  
**Status:** DEPRECATED - NÃO USAR

---

## Aviso

Os arquivos nesta pasta são **DEPRECATED** e foram superseded por testes E2E com runtime real.

**NÃO USE** estes arquivos em novos desenvolvimentos.

---

## Estrutura

### gate6-primitives/

Testes primitivos antigos que validavam componentes isolados.

**Superseded por:**
- `tests/operational/gate6-runtime-with-drivers.test.ts`
- `tests/operational/gate6-runtime-no-drivers.test.ts`
- `tests/operational/gate6-motoboy-runtime.test.ts`

### debug/

Testes temporários criados durante debugging.

**Motivo do arquivamento:** Validação já coberta por testes E2E oficiais.

### helpers/

Helpers antigos superseded por helpers SSOT.

**Superseded por:**
- `tests/helpers/gate6-polling-helpers.ts`
- `tests/helpers/gate6-setup-helpers.ts`

---

## Por Que Foram Arquivados?

1. **Testes Primitivos:** Validavam componentes isolados, mas não o fluxo E2E real
2. **Testes de Debug:** Temporários, criados para debugging específico
3. **Helpers Antigos:** Não seguiam padrão SSOT, causavam confusão

---

## O Que Usar?

### Testes Críticos (SSOT)

```bash
# Passageiro E2E
npm test tests/operational/gate6-runtime-with-drivers.test.ts
npm test tests/operational/gate6-runtime-no-drivers.test.ts

# Motoboy E2E
npm test tests/operational/gate6-motoboy-runtime.test.ts
```

### Helpers Críticos (SSOT)

```typescript
import { authenticateAsProfile, signOut } from '../helpers/auth-helper';
import { waitForRideStatus, getRideAuditTrail } from '../helpers/gate6-polling-helpers';
import { setupDriverAvailable, cleanupMultipleDrivers } from '../helpers/gate6-setup-helpers';
```

---

## Documentação Oficial

- `MOBILIDADE_SSOT_FINAL.md` - Verdade oficial do módulo
- `MOBILIDADE_EVIDENCIAS_FINAIS.md` - Evidências de validação
- `MOBILIDADE_TESTES_OBRIGATORIOS.md` - Testes obrigatórios

---

## Histórico

**08/04/2026:** Arquivamento inicial
- Movidos testes primitivos (gate6-primitives/)
- Movidos testes de debug (debug/)
- Movidos helpers antigos (helpers/)

