# Troubleshooting - Eliminação de Hardcodes

**Guia de Resolução de Problemas Comuns**

---

## 🔍 Índice de Problemas

1. [Erros de Validação](#1-erros-de-validação)
2. [Erros de Migration](#2-erros-de-migration)
3. [Erros de Service](#3-erros-de-service)
4. [Erros de Hooks](#4-erros-de-hooks)
5. [Erros de Testes](#5-erros-de-testes)
6. [Erros de Build](#6-erros-de-build)
7. [Erros de Runtime](#7-erros-de-runtime)
8. [Problemas de Performance](#8-problemas-de-performance)

---

## 1. Erros de Validação

### Problema: Script de validação não executa

**Erro:**
```bash
npm run validate:hardcodes
# Error: Cannot find module 'tsx'
```

**Solução:**
```bash
# Instalar dependências
npm install

# Ou instalar tsx globalmente
npm install -g tsx

# Executar novamente
npm run validate:hardcodes
```

---

### Problema: Falsos positivos na validação

**Erro:**
```
🔴 Preço hardcoded detectado
   src/shared/constants/ui.ts:5
   Código: ANIMATION_DURATION = 300
```

**Solução:**
```typescript
// Adicionar comentário de exceção
// eslint-disable-next-line ssot/no-hardcoded-prices
const ANIMATION_DURATION = 300; // UI constant, not business rule

// Ou mover para arquivo de constantes de UI
// src/shared/constants/ui-constants.ts
```

---

### Problema: Validação muito lenta

**Sintoma:** Script demora mais de 5 minutos

**Solução:**
```bash
# Validar apenas diretórios específicos
npm run validate:hardcodes -- --dir src/modules/mobility

# Ou adicionar ao .gitignore arquivos grandes
echo "node_modules/" >> .gitignore
echo "dist/" >> .gitignore
```

---

## 2. Erros de Migration

### Problema: Migration falha ao aplicar

**Erro:**
```sql
ERROR: relation "billing_plans" already exists
```

**Solução:**
```sql
-- Usar IF NOT EXISTS
CREATE TABLE IF NOT EXISTS billing_plans (
  -- ...
);

-- Ou fazer rollback e recriar
DROP TABLE IF EXISTS billing_plans CASCADE;
CREATE TABLE billing_plans (
  -- ...
);
```

---

### Problema: RLS Policy já existe

**Erro:**
```sql
ERROR: policy "billing_plans_public_read" already exists
```

**Solução:**
```sql
-- Usar DROP IF EXISTS antes
DROP POLICY IF EXISTS "billing_plans_public_read" ON billing_plans;

CREATE POLICY "billing_plans_public_read"
  ON billing_plans
  FOR SELECT
  USING (is_active = true);
```

---

### Problema: Dados seed duplicados

**Erro:**
```sql
ERROR: duplicate key value violates unique constraint
```

**Solução:**
```sql
-- Usar ON CONFLICT
INSERT INTO billing_plans (tier, name, price_cents)
VALUES ('free', 'Free', 0)
ON CONFLICT (tier) DO UPDATE
SET name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents;

-- Ou usar UPSERT
INSERT INTO billing_plans (tier, name, price_cents)
VALUES ('free', 'Free', 0)
ON CONFLICT DO NOTHING;
```

---

## 3. Erros de Service

### Problema: Service não encontra dados

**Erro:**
```typescript
Error: Falha ao buscar planos: PGRST116
```

**Solução:**
```typescript
// Verificar se tabela existe
const { data, error } = await supabase
  .from('billing_plans')
  .select('count');

if (error) {
  console.error('Tabela não existe:', error);
  // Aplicar migration primeiro
}

// Verificar RLS policies
const { data: policies } = await supabase
  .rpc('get_policies', { table_name: 'billing_plans' });
```

---

### Problema: Cache não funciona

**Sintoma:** Dados sempre buscados do banco

**Solução:**
```typescript
// Verificar se cache está sendo limpo
static clearCache(): void {
  this.cache.clear();
  this.cacheTimestamp = 0;
  console.log('Cache cleared'); // Debug
}

// Verificar TTL
private static isCacheValid(): boolean {
  const isValid = Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  console.log('Cache valid:', isValid); // Debug
  return isValid;
}
```

---

### Problema: Erro de tipo TypeScript

**Erro:**
```typescript
Type 'unknown' is not assignable to type 'BillingPlan'
```

**Solução:**
```typescript
// Adicionar type assertion
const data = result.data as BillingPlanRow;

// Ou validar com Zod
import { z } from 'zod';

const BillingPlanSchema = z.object({
  id: z.string(),
  tier: z.string(),
  // ...
});

const validated = BillingPlanSchema.parse(data);
```

---

## 4. Erros de Hooks

### Problema: Hook não atualiza componente

**Sintoma:** Dados mudam no banco mas UI não atualiza

**Solução:**
```typescript
// Verificar query key
const { data } = useQuery({
  queryKey: ['billing-plans'], // Deve ser consistente
  queryFn: () => BillingPlanService.getAll(),
});

// Invalidar cache após mutação
const { mutate } = useMutation({
  mutationFn: BillingPlanService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
  },
});
```

---

### Problema: Hook causa loop infinito

**Erro:**
```
Warning: Maximum update depth exceeded
```

**Solução:**
```typescript
// ❌ ERRADO: Dependência faltando
useEffect(() => {
  fetchData();
}, []); // fetchData não está nas dependências

// ✅ CORRETO: Usar useCallback
const fetchData = useCallback(() => {
  // ...
}, [dependency]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

---

### Problema: Dados não carregam

**Sintoma:** `isLoading` sempre `true`

**Solução:**
```typescript
// Verificar enabled
const { data, isLoading } = useQuery({
  queryKey: ['plan', id],
  queryFn: () => BillingPlanService.getById(id),
  enabled: !!id, // Só executa se id existir
});

// Verificar erro
const { data, error, isLoading } = useQuery({
  // ...
});

if (error) {
  console.error('Query error:', error);
}
```

---

## 5. Erros de Testes

### Problema: Testes falham após migração

**Erro:**
```
Error: Cannot find table 'billing_plans'
```

**Solução:**
```typescript
// Criar fixtures de teste
beforeEach(async () => {
  await supabase
    .from('billing_plans')
    .insert(TEST_FIXTURES);
});

afterEach(async () => {
  await supabase
    .from('billing_plans')
    .delete()
    .in('id', TEST_IDS);
});
```

---

### Problema: Mock não funciona

**Erro:**
```
TypeError: Cannot read property 'from' of undefined
```

**Solução:**
```typescript
// Mock completo do Supabase
vi.mock('@/core/infrastructure/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  },
}));
```

---

### Problema: Testes lentos

**Sintoma:** Testes demoram mais de 30 segundos

**Solução:**
```typescript
// Usar mocks em vez de banco real
vi.mock('@/core/infrastructure/supabase');

// Reduzir timeout de testes
describe('BillingPlanService', () => {
  it('should fetch plans', async () => {
    // ...
  }, { timeout: 5000 }); // 5 segundos
});

// Executar testes em paralelo
npm test -- --reporter=verbose --threads
```

---

## 6. Erros de Build

### Problema: Build falha com erro de tipo

**Erro:**
```
TS2322: Type 'string' is not assignable to type 'PlanTier'
```

**Solução:**
```typescript
// Usar type assertion
const tier = data.tier as PlanTier;

// Ou validar em runtime
function isPlanTier(value: string): value is PlanTier {
  return ['free', 'pro', 'delivery'].includes(value);
}

if (isPlanTier(data.tier)) {
  // Usar data.tier
}
```

---

### Problema: Import circular

**Erro:**
```
Warning: Circular dependency detected
```

**Solução:**
```typescript
// ❌ ERRADO: Import circular
// ServiceA.ts
import { ServiceB } from './ServiceB';

// ServiceB.ts
import { ServiceA } from './ServiceA';

// ✅ CORRETO: Extrair interface
// types.ts
export interface IServiceA { /* ... */ }

// ServiceA.ts
import type { IServiceB } from './types';

// ServiceB.ts
import type { IServiceA } from './types';
```

---

### Problema: Bundle muito grande

**Sintoma:** Build > 5MB

**Solução:**
```typescript
// Usar dynamic imports
const BillingPlanService = lazy(() => 
  import('./services/BillingPlanService')
);

// Code splitting por rota
const PricingPage = lazy(() => 
  import('./pages/PricingPage')
);

// Verificar bundle size
npm run build -- --analyze
```

---

## 7. Erros de Runtime

### Problema: Dados não aparecem na UI

**Sintoma:** Loading infinito ou tela vazia

**Solução:**
```typescript
// Adicionar logs de debug
const { data, isLoading, error } = useBillingPlans();

console.log('Data:', data);
console.log('Loading:', isLoading);
console.log('Error:', error);

// Verificar empty state
if (isLoading) return <Loading />;
if (error) return <Error error={error} />;
if (!data || data.length === 0) return <EmptyState />;

return <DataList data={data} />;
```

---

### Problema: Erro de permissão RLS

**Erro:**
```
Error: new row violates row-level security policy
```

**Solução:**
```sql
-- Verificar policies
SELECT * FROM pg_policies 
WHERE tablename = 'billing_plans';

-- Adicionar policy para insert
CREATE POLICY "billing_plans_admin_insert"
  ON billing_plans
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

---

### Problema: Dados desatualizados

**Sintoma:** Mudanças no banco não refletem na UI

**Solução:**
```typescript
// Invalidar cache manualmente
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

function handleUpdate() {
  // Após atualização
  queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
  
  // Ou refetch
  queryClient.refetchQueries({ queryKey: ['billing-plans'] });
}

// Ou reduzir staleTime
const { data } = useQuery({
  queryKey: ['billing-plans'],
  queryFn: () => BillingPlanService.getAll(),
  staleTime: 30 * 1000, // 30 segundos em vez de 5 minutos
});
```

---

## 8. Problemas de Performance

### Problema: Queries lentas

**Sintoma:** Tempo de resposta > 1 segundo

**Solução:**
```sql
-- Adicionar índices
CREATE INDEX idx_billing_plans_tier 
  ON billing_plans(tier);

CREATE INDEX idx_billing_plans_active 
  ON billing_plans(is_active) 
  WHERE is_active = true;

-- Verificar query plan
EXPLAIN ANALYZE
SELECT * FROM billing_plans
WHERE is_active = true;
```

---

### Problema: Muitas requisições ao banco

**Sintoma:** 100+ queries por página

**Solução:**
```typescript
// Usar cache agressivo
const { data } = useQuery({
  queryKey: ['billing-plans'],
  queryFn: () => BillingPlanService.getAll(),
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
});

// Prefetch dados
queryClient.prefetchQuery({
  queryKey: ['billing-plans'],
  queryFn: () => BillingPlanService.getAll(),
});

// Batch requests
const plans = await Promise.all([
  BillingPlanService.getById('free'),
  BillingPlanService.getById('pro'),
  BillingPlanService.getById('delivery'),
]);
```

---

### Problema: Cache muito grande

**Sintoma:** Memória > 500MB

**Solução:**
```typescript
// Limitar tamanho do cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000, // 5 minutos
      staleTime: 1 * 60 * 1000, // 1 minuto
    },
  },
});

// Limpar cache periodicamente
setInterval(() => {
  queryClient.clear();
}, 30 * 60 * 1000); // A cada 30 minutos
```

---

## 🆘 Quando Pedir Ajuda

### Antes de Pedir Ajuda

1. ✅ Consultei este guia de troubleshooting
2. ✅ Li a documentação relevante
3. ✅ Tentei as soluções sugeridas
4. ✅ Verifiquei logs de erro completos
5. ✅ Reproduzi o problema em ambiente limpo

### Como Pedir Ajuda

**Template de Issue:**
```markdown
## Problema
[Descrição breve do problema]

## Erro
```
[Cole o erro completo aqui]
```

## Contexto
- Arquivo: src/...
- Função: ...
- Tentativas: [O que já tentou]

## Reprodução
1. Passo 1
2. Passo 2
3. Erro ocorre

## Ambiente
- Node: v18.x
- npm: v9.x
- OS: Windows/Mac/Linux
```

### Canais de Suporte

- **Urgente:** `#tech-architecture` (Slack)
- **Normal:** GitHub Issues com tag `hardcode-audit`
- **Dúvidas:** Email architecture@empresa.com

---

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Docs](https://vitest.dev/)

---

**Última Atualização:** 2026-04-16  
**Contribua:** Adicione novos problemas e soluções conforme encontrar
