# Testes Unitários

> Testes automatizados para o Ordax
> 
> Cobertura atual: **110 testes** adicionados na expansão de Abril 2026

---

## Estrutura de Testes

```
tests/                          # Testes de integração e E2E
  ├── operational/              # Testes operacionais (Gate 2-7)
  ├── e2e/                      # Testes end-to-end
  └── legacy/                   # Testes antigos (arquivados)

src/                            # Testes unitários (co-localizados)
  ├── shared/utils/
  │   ├── dateUtils.test.ts     # 22 testes - datas
  │   ├── validation.test.ts    # 35 testes - validação
  │   ├── formatters.test.ts    # 14 testes - formatação
  │   └── currency.test.ts      # 13 testes - moeda
  ├── core/session/services/
  │   └── SessionService.test.ts # Testes de sessão
  └── core/location/services/
      └── LocationService.test.ts # 26 testes - serviço de localização
```

---

## Testes Criados na Expansão

### 1. dateUtils.test.ts (22 testes)

| Função | Testes |
|--------|--------|
| `formatRelativeTime` | 8 testes (agora, minutos, horas, dias, semanas, meses, anos) |
| `formatTime` | 2 testes |
| `formatShortDate` | 2 testes |
| `formatDateTime` | 2 testes |
| `isToday` | 3 testes |
| `isTomorrow` | 3 testes |
| `getDaysDifference` | 4 testes |

### 2. validation.test.ts (35 testes)

| Função | Testes |
|--------|--------|
| `isValidEmail` | 6 testes |
| `isValidCNPJ` | 4 testes |
| `isValidCPF` | 4 testes |
| `isValidPhone` | 4 testes |
| `isValidCEP` | 3 testes |
| `isValidUUID` | 4 testes |
| `isValidURL` | 3 testes |
| `isValidLength` | 4 testes |
| `isInRange` | 4 testes |
| `isInFuture` | 2 testes |
| `isInPast` | 2 testes |
| `isNotEmpty` | 2 testes |
| `isObjectNotEmpty` | 2 testes |

### 3. formatters.test.ts (14 testes)

| Função | Testes |
|--------|--------|
| `getInitials` | 4 testes |
| `getRelativeTime` | 5 testes |
| `formatNumber` | 4 testes |
| `truncateText` | 4 testes |

### 4. currency.test.ts (13 testes)

| Função | Testes |
|--------|--------|
| `formatBrl` | 5 testes |
| `formatBrlCompact` | 6 testes |

### 5. LocationService.test.ts (26 testes)

| Método | Testes |
|--------|--------|
| `getLocationById` | 3 testes |
| `getLocationByPath` | 3 testes |
| `getLocationBySlugWithinParent` | 4 testes |
| `getAncestors` | 3 testes |
| `getDescendants` | 3 testes |
| `getChildren` | 3 testes |
| `validateLocation` | 4 testes |
| `getLocationTree` | 2 testes |
| Error handling | 1 teste |

---

## Executando Testes

### Todos os testes unitários
```bash
npm run test
```

### Testes específicos
```bash
# Apenas utilitários
npx vitest run src/shared/utils/

# Apenas um arquivo
npx vitest run src/shared/utils/dateUtils.test.ts

# Watch mode
npx vitest watch src/shared/utils/
```

### Com cobertura
```bash
npx vitest run --coverage
```

---

## Convenções

### Nomenclatura
- Arquivos: `*.test.ts` ou `*.test.tsx`
- Descrições: `deve [comportamento esperado]`
- Agrupamento: por função ou módulo

### Boas Práticas
1. **Isolamento**: Cada teste deve ser independente
2. **Determinismo**: Mesmo input = mesmo output
3. **Cobertura**: Testar casos de sucesso e falha
4. **Performance**: Evitar operações assíncronas desnecessárias

### Exemplo
```typescript
describe('minhaFuncao', () => {
  it('deve retornar resultado esperado para input válido', () => {
    expect(minhaFuncao('valido')).toBe('resultado');
  });

  it('deve lançar erro para input inválido', () => {
    expect(() => minhaFuncao(null)).toThrow();
  });
});
```

---

## Próximos Passos

- [x] Expandir testes para `core/session` (SessionService já possui testes)
- [x] Expandir testes para `core/location` (LocationService - 26 testes criados)
- [ ] Criar testes para hooks de UI
- [ ] Criar testes para outros services de negócio (business, alerts, etc.)
- [ ] Criar testes para repositories
- [ ] Atingir meta de 85%+ de cobertura

---

## Métricas

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Testes unitários | 45 | 110 | 150+ |
| Cobertura (est.) | ~40% | ~55% | 85%+ |
| Arquivos testados | 18 | 24 | 50+ |

---

*Documento atualizado em Abril 2026*
