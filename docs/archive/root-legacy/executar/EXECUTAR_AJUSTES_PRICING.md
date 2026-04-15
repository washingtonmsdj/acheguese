# EXECUTAR AJUSTES PRICING - GUIA OPERACIONAL

## CONTEXTO

ETAPA 4.1 está 84.6% completa (11/13 testes passando).

Ajustes necessários:
1. Re-habilitar RLS com policies corretas
2. Reexecutar testes com valores ajustados
3. Validar operação real

---

## MÉTODO 1: SQL EDITOR DO SUPABASE DASHBOARD (RECOMENDADO)

### Passo 1: Aplicar RLS com Policies
1. Acesse: https://supabase.com/dashboard/project/[seu-project-id]/sql/new
2. Cole o conteúdo de `ENABLE_RLS_WITH_POLICIES.sql`
3. Execute (Run)
4. Confirme: "RLS re-habilitado com policies corretas"

### Passo 2: Verificar Estado do Banco
1. No SQL Editor, cole o conteúdo de `VERIFICAR_ESTADO_PRICING.sql`
2. Execute (Run)
3. Confirme:
   - 4 tabelas pricing_* criadas
   - RLS habilitado em todas
   - 4 regras ativas (ride, delivery, mototaxi, motoboy)
   - 5 multiplicadores ativos
   - 3 triggers ativos
   - 8 policies criadas

### Passo 3: Reexecutar Testes
```bash
npm run test src/core/pricing/__tests__/PricingService.runtime.test.ts
```

**Expectativa**: 13/13 testes passando (100%)

---

## MÉTODO 2: CLI DO SUPABASE (ALTERNATIVO)

### Pré-requisitos
```bash
# Verificar se está linkado ao projeto remoto
npx supabase status
```

### Passo 1: Aplicar RLS com Policies
```bash
npx supabase db query --linked -f ENABLE_RLS_WITH_POLICIES.sql
```

### Passo 2: Verificar Estado do Banco
```bash
npx supabase db query --linked -f VERIFICAR_ESTADO_PRICING.sql
```

### Passo 3: Reexecutar Testes
```bash
npm run test src/core/pricing/__tests__/PricingService.runtime.test.ts
```

---

## VALIDAÇÃO OPERACIONAL MÍNIMA

Após testes passarem, validar operação real:

### 1. Criar Regra Nova
```typescript
import { pricingService } from '@/core/pricing/services/PricingService';

const ruleId = await pricingService.createRule({
  mode: 'custom',
  name: 'Teste Operacional',
  baseFare: 10.0,
  pricePerKm: 3.0,
  pricePerMinute: 0.6,
  minimumFare: 15.0,
  isActive: false,
}, profileId);

console.log('Regra criada:', ruleId);
```

### 2. Testar Conflito
```typescript
// Tentar criar segunda regra ativa para 'ride'
try {
  await pricingService.createRule({
    mode: 'ride',
    name: 'Conflitante',
    baseFare: 6.0,
    pricePerKm: 2.0,
    pricePerMinute: 0.4,
    minimumFare: 9.0,
    isActive: true,
  }, profileId);
} catch (error) {
  console.log('Conflito detectado corretamente:', error.message);
}
```

### 3. Ativar/Desativar Regra
```typescript
// Ativar regra
await pricingService.updateRule(ruleId, { isActive: true }, profileId);

// Desativar regra
await pricingService.updateRule(ruleId, { isActive: false }, profileId);
```

### 4. Verificar Auditoria
```sql
SELECT 
  action,
  entity_type,
  performed_by,
  created_at,
  old_values,
  new_values
FROM pricing_audit_log
WHERE entity_id = '[ruleId]'
ORDER BY created_at DESC;
```

### 5. Listar Regras Ativas
```typescript
const activeRules = await pricingService.listRules(false);
console.log('Regras ativas:', activeRules.length);

const allRules = await pricingService.listRules(true);
console.log('Todas as regras:', allRules.length);
```

### 6. Verificar Cache
```typescript
// Primeira busca (do banco)
const rule1 = await pricingService.getRule('ride');

// Segunda busca (do cache)
const rule2 = await pricingService.getRule('ride');

// Limpar cache
pricingService.clearCache();

// Próxima busca (do banco novamente)
const rule3 = await pricingService.getRule('ride');
```

---

## CRITÉRIO DE ACEITE FINAL

### ✅ ETAPA 4.1 COMPLETA SE:
1. RLS habilitado com policies corretas
2. 13/13 testes passando (100%)
3. Operação real validada:
   - Criação de regra funciona
   - Conflito é detectado
   - Ativação/desativação funciona
   - Auditoria registra mudanças
   - Listagem retorna regras corretas
   - Cache funciona e invalida corretamente

### ⏭️ PRÓXIMA ETAPA
**ETAPA 4.2 - Migrar CreateRideModal para usePriceEstimate direto**

---

## ARQUIVOS ENVOLVIDOS

### Criados nesta etapa:
- `ENABLE_RLS_WITH_POLICIES.sql` - Re-habilita RLS
- `VERIFICAR_ESTADO_PRICING.sql` - Verifica estado
- `ETAPA_4_1_AJUSTES_FINAIS.md` - Relatório de ajustes
- `EXECUTAR_AJUSTES_PRICING.md` - Este guia

### Alterados nesta etapa:
- `src/core/pricing/__tests__/PricingService.runtime.test.ts` - Testes ajustados

### Aplicados anteriormente:
- `supabase/migrations/20260406000002_create_pricing_tables.sql` - Schema
- `src/core/pricing/services/PricingService.ts` - Service atualizado

---

## TROUBLESHOOTING

### Problema: Testes ainda falhando após ajustes
**Solução**: Verificar se RLS foi re-habilitado corretamente
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'pricing_%';
```

### Problema: Policies não funcionando
**Solução**: Verificar se policies foram criadas
```sql
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename LIKE 'pricing_%';
```

### Problema: Conflito não sendo detectado
**Solução**: Verificar se trigger está ativo
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'pricing_rules';
```

### Problema: Auditoria não registrando
**Solução**: Verificar se trigger de auditoria está ativo
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%audit%';
```
