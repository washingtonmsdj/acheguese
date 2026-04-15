# 🚀 Como Usar o Template de Módulo

## 📋 Pré-requisitos

- Ter definido o domínio do módulo (ex: empresas, usuários, produtos)
- Ter criado a tabela no banco de dados
- Ter configurado RLS (Row Level Security) na tabela

---

## 🎯 Passo a Passo

### 1. Copiar Template

```bash
# Copiar template para novo módulo
cp -r templates/module-template src/modules/[nome-do-modulo]

# Exemplo: módulo de empresas
cp -r templates/module-template src/modules/businesses
```

### 2. Renomear Arquivos

Renomear os arquivos com placeholders:

```bash
# Antes
hooks/use[Nome].ts
services/[nome].service.ts
types/[nome].types.ts

# Depois (exemplo: businesses)
hooks/useBusinesses.ts
services/business.service.ts
types/business.types.ts
```

### 3. Substituir Placeholders

Substituir os seguintes placeholders em TODOS os arquivos:

| Placeholder | Substituir por | Exemplo |
|-------------|----------------|---------|
| `[Nome]` | Nome do módulo (PascalCase) | `Business` |
| `[nome]` | nome do módulo (camelCase) | `business` |
| `[tabela]` | nome da tabela no banco | `businesses` |
| `[itens]` | plural do domínio | `Businesses` |
| `[item]` | singular do domínio | `Business` |
| `[domínio]` | descrição do domínio | `empresas` |

**Exemplo completo para módulo de empresas:**
- `[Nome]` → `Business`
- `[nome]` → `business`
- `[tabela]` → `businesses`
- `[itens]` → `Businesses`
- `[item]` → `Business`
- `[domínio]` → `empresas`

### 4. Implementar Lógica Específica

#### 4.1. Types (`types/business.types.ts`)

```typescript
// Definir enums específicos
export const BusinessType = {
  RESTAURANT: 'restaurant',
  STORE: 'store',
  SERVICE: 'service',
} as const;

// Definir interface principal
export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: BusinessType;
  created_at: string;
  updated_at: string;
}

// Definir filtros
export interface BusinessFilters {
  type?: BusinessType;
  city?: string;
  limit?: number;
}

// Definir params
export interface CreateBusinessParams {
  user_id: string;
  name: string;
  type: BusinessType;
}
```

#### 4.2. Service (`services/business.service.ts`)

```typescript
// Implementar métodos específicos
class BusinessService {
  private readonly TABLE = 'businesses';

  // Métodos básicos já estão no template
  // Adicionar métodos específicos se necessário
  
  async searchByName(name: string): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .ilike('name', `%${name}%`);

      if (error) throw error;

      return (data as Business[]) || [];
    } catch (error) {
      logger.error('Erro ao buscar empresas por nome:', error);
      throw error;
    }
  }
}
```

#### 4.3. Hook (`hooks/useBusinesses.ts`)

```typescript
// Adicionar métodos específicos se necessário
export function useBusinesses(options: UseBusinessesOptions = {}) {
  // ... código do template ...

  // Adicionar ações específicas
  const createBusiness = useCallback(async (params: CreateBusinessParams) => {
    try {
      const business = await businessService.createBusiness(params);
      setItems(prev => [business, ...prev]);
      return business;
    } catch (err) {
      logger.error('Erro ao criar empresa:', err);
      throw err;
    }
  }, []);

  return {
    items,
    loading,
    error,
    refresh,
    createBusiness, // Nova ação
  };
}
```

### 5. Atualizar index.ts

```typescript
// Exportar tudo que for público
export { useBusinesses } from './hooks/useBusinesses';
export { businessService } from './services/business.service';
export {
  BusinessType,
  type Business,
  type BusinessFilters,
  type CreateBusinessParams,
} from './types/business.types';
```

### 6. Atualizar .eslintrc.json

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.property.name='from'][arguments.0.value='businesses']",
        "message": "❌ PROIBIDO: Acesso direto à tabela 'businesses'. Use businessService de '@/modules/businesses'"
      }
    ]
  }
}
```

### 7. Atualizar README.md

- Substituir placeholders
- Adicionar exemplos específicos
- Documentar métodos customizados
- Adicionar regras de negócio específicas

---

## ✅ Checklist de Validação

### Estrutura
- [ ] Pasta criada em `src/modules/[nome]/`
- [ ] Todos os arquivos renomeados
- [ ] Todos os placeholders substituídos

### Código
- [ ] Types implementados
- [ ] Service implementado (CRUD básico)
- [ ] Hook implementado
- [ ] index.ts com exports corretos
- [ ] .eslintrc.json configurado

### Documentação
- [ ] README.md atualizado
- [ ] Exemplos de uso adicionados
- [ ] Contrato arquitetural documentado

### Testes
- [ ] Compilação sem erros
- [ ] ESLint sem warnings
- [ ] Imports funcionando
- [ ] Funcionalidade básica testada

---

## 📚 Exemplo Completo: Módulo de Empresas

### Estrutura Final

```
src/modules/businesses/
├── index.ts
├── README.md
├── .eslintrc.json
├── hooks/
│   └── useBusinesses.ts
├── services/
│   └── business.service.ts
└── types/
    └── business.types.ts
```

### Uso no Código

```typescript
// Importar do módulo
import { 
  useBusinesses, 
  businessService,
  BusinessType 
} from '@/modules/businesses';

// Usar no componente
function BusinessList() {
  const { items, loading } = useBusinesses({
    filters: { type: BusinessType.RESTAURANT }
  });

  return (
    <div>
      {items.map(business => (
        <div key={business.id}>{business.name}</div>
      ))}
    </div>
  );
}

// Criar empresa
await businessService.createBusiness({
  user_id: 'uuid',
  name: 'Minha Empresa',
  type: BusinessType.RESTAURANT,
});
```

---

## 🚫 Erros Comuns

### 1. Esquecer de Renomear Arquivos
❌ `hooks/use[Nome].ts`
✅ `hooks/useBusinesses.ts`

### 2. Placeholders Não Substituídos
❌ `[Nome]Service`
✅ `BusinessService`

### 3. Imports Diretos
❌ `import { businessService } from '@/modules/businesses/services/business.service'`
✅ `import { businessService } from '@/modules/businesses'`

### 4. Acesso Direto ao Banco
❌ `supabase.from('businesses').select('*')`
✅ `businessService.fetchBusinesses(userId)`

---

## 🎓 Próximos Passos

1. Implementar lógica específica do domínio
2. Adicionar helpers se necessário
3. Criar componentes específicos
4. Adicionar testes
5. Documentar casos de uso

---

## 📖 Referências

- **Padrão de Arquitetura:** `docs/architecture/PADRAO_MODULOS_SSOT.md`
- **Módulo de Referência:** `src/modules/notifications/`
- **Template:** `templates/module-template/`

---

**Versão:** 1.0.0
**Data:** 2024-03-16
