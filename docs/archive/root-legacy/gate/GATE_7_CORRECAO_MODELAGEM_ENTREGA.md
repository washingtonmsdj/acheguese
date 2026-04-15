# GATE 7: CORREÇÃO - MODELAGEM REAL DA ENTREGA

**Data:** 08/04/2026

---

## PRECEDÊNCIA REAL DA ENTREGA (V1)

### O que existe de verdade:

**A) Admin Global:**
- **Fonte:** Variável de ambiente `REQUIRE_PIN_FOR_ALL_DELIVERIES`
- **Tipo:** boolean
- **Localização:** process.env
- **Status:** ✅ IMPLEMENTADO

**B) Remetente:**
- **Fonte:** Campo `requires_pin_for_deliveries` em `profiles`
- **Tipo:** boolean
- **Localização:** Tabela `profiles`
- **Status:** ✅ IMPLEMENTADO

**C) Operação:**
- **Fonte:** NÃO EXISTE
- **Código:** Comentado com TODO
- **Status:** ❌ NÃO IMPLEMENTADO (v1)

### Precedência Real v1:

```
admin global (env var) > remetente (profiles.requires_pin_for_deliveries)
```

**Regra:** Se qualquer nível exigir, a entrega exige PIN.

---

## CORREÇÃO DA DOCUMENTAÇÃO

### Antes (ERRADO):

"Precedência da entrega: admin global > operação/remetente/empresa"

### Depois (CORRETO):

"Precedência da entrega v1: admin global > remetente"

**Nota:** Operação/empresa não está implementada na v1. Será implementada em versão futura quando houver tabela de operações.

---

## CÓDIGO REAL

```typescript
static async resolveDeliveryPINRequirement(params: {
  senderId: string;
  operationId?: string;
}): Promise<{
  isRequired: boolean;
  requiredBy: 'admin' | 'sender' | 'operation' | null;
  reason: string;
}> {
  // 1. Admin global (env var)
  const adminRequires = process.env.REQUIRE_PIN_FOR_ALL_DELIVERIES === 'true';
  if (adminRequires) {
    return { isRequired: true, requiredBy: 'admin', ... };
  }

  // 2. Operação (NÃO IMPLEMENTADO v1)
  if (params.operationId) {
    // TODO: Implementar quando houver tabela de operações
  }

  // 3. Remetente (profiles)
  const { data: sender } = await supabase
    .from('profiles')
    .select('requires_pin_for_deliveries')
    .eq('id', params.senderId)
    .single();

  if (sender?.requires_pin_for_deliveries === true) {
    return { isRequired: true, requiredBy: 'sender', ... };
  }

  return { isRequired: false, requiredBy: null, ... };
}
```

---

## FONTES REAIS

| Nível | Fonte | Tipo | Status |
|-------|-------|------|--------|
| Admin Global | `process.env.REQUIRE_PIN_FOR_ALL_DELIVERIES` | env var | ✅ Implementado |
| Remetente | `profiles.requires_pin_for_deliveries` | boolean | ✅ Implementado |
| Operação | N/A | N/A | ❌ Não implementado v1 |

---

## VEREDITO

✅ **V1 SUPORTA:**
- Admin global (env var)
- Remetente (campo em profiles)

❌ **V1 NÃO SUPORTA:**
- Operação/empresa (não existe tabela)

**Precedência real v1:** `admin > remetente`
