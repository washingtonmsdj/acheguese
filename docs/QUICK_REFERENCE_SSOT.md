# Guia Rápido SSOT - Referência Rápida

**Versão**: 1.0  
**Para**: Desenvolvedores  
**Tempo de leitura**: 5 minutos

---

## 🚦 Regra de Ouro

> **Se o dado pode mudar por decisão de negócio → BANCO DE DADOS**  
> **Se é decisão técnica de implementação → CONSTANTE CENTRALIZADA**

---

## ✅ Checklist Rápido

Antes de commitar código, pergunte:

- [ ] Tem preços, tarifas ou comissões hardcoded? → ❌ Mover para banco
- [ ] Tem IDs de localização hardcoded? → ❌ Buscar por slug
- [ ] Tem categorias ou status hardcoded? → ❌ Buscar do banco
- [ ] Tem import de mock fora de test/fixtures? → ❌ Remover
- [ ] Tem números mágicos em regras de negócio? → ❌ Centralizar
- [ ] É constante técnica (timeout, retry, limite UI)? → ✅ OK

---

## 📋 Padrões Rápidos

### ✅ Buscar Dados do Banco

```typescript
// Service
export class PricingService {
  static async getPrice(id: string) {
    const { data } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
}

// Hook
export function usePrice(id: string) {
  return useQuery({
    queryKey: ['price', id],
    queryFn: () => PricingService.getPrice(id),
  });
}

// Componente
function PriceDisplay({ id }: Props) {
  const { data: price } = usePrice(id);
  return <div>{formatPrice(price)}</div>;
}
```

---

### ✅ Enum Centralizado

```typescript
// src/shared/types/enums.ts
export const PROFILE_TYPES = {
  PERSONAL: 'personal',
  DRIVER: 'driver',
  BUSINESS: 'business',
} as const;

export type ProfileType = typeof PROFILE_TYPES[keyof typeof PROFILE_TYPES];

// Uso
import { PROFILE_TYPES } from '@/shared/types/enums';

if (profile.type === PROFILE_TYPES.DRIVER) {
  // ...
}
```

---

### ✅ Constante Técnica

```typescript
// src/shared/constants/pagination.ts
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  SMALL_LIMIT: 10,
} as const;

// Uso
import { PAGINATION } from '@/shared/constants/pagination';

const limit = PAGINATION.DEFAULT_LIMIT;
```

---

### ✅ Mock Isolado

```typescript
// tests/fixtures/vagas.fixtures.ts
export const MOCK_VAGAS = [/* ... */];

// Uso em teste
import { MOCK_VAGAS } from '@/tests/fixtures/vagas.fixtures';

describe('VagasService', () => {
  it('should filter', () => {
    const filtered = filter(MOCK_VAGAS);
    expect(filtered).toHaveLength(2);
  });
});
```

---

## ❌ Anti-Padrões Rápidos

### ❌ Preço Hardcoded
```typescript
// ERRADO
const price = 29.90;

// CORRETO
const price = await PricingService.getPrice(planId);
```

---

### ❌ ID Hardcoded
```typescript
// ERRADO
const locationId = '384add59-4e53-489d-a7b5-97dea2b3f442';

// CORRETO
const location = await LocationService.getBySlug('pituba');
```

---

### ❌ Categoria Hardcoded
```typescript
// ERRADO
const categories = ['show', 'feira', 'festa'];

// CORRETO
const categories = await CategoryService.getActive();
```

---

### ❌ Mock em Produção
```typescript
// ERRADO
import { MOCK_VAGAS } from '../data/mock-vagas';
const vagas = MOCK_VAGAS;

// CORRETO
const { data: vagas } = useVagas();
```

---

## 🛠️ Comandos Úteis

```bash
# Validar hardcodes
npm run validate:hardcodes

# Lint SSOT
npm run lint:ssot

# Testes SSOT
npm run test:ssot

# Validar arquitetura
npm run validate:architecture:governance
```

---

## 📚 Documentação Completa

- **Auditoria**: [docs/audits/AUDITORIA_HARDCODES_COMPLETA.md](./audits/AUDITORIA_HARDCODES_COMPLETA.md)
- **Plano**: [docs/audits/PLANO_MIGRACAO_HARDCODES.md](./audits/PLANO_MIGRACAO_HARDCODES.md)
- **Padrões**: [docs/SSOT_PATTERNS.md](./SSOT_PATTERNS.md)
- **Exemplos**: [docs/audits/EXEMPLOS_REFATORACAO_HARDCODES.md](./audits/EXEMPLOS_REFATORACAO_HARDCODES.md)

---

## 🚨 Quando em Dúvida

1. **Pergunte**: "Este dado pode mudar por decisão de negócio?"
2. **Se SIM** → Banco de dados
3. **Se NÃO** → Constante centralizada
4. **Consulte**: [SSOT_PATTERNS.md](./SSOT_PATTERNS.md)

---

**Última Atualização**: 2026-04-16
