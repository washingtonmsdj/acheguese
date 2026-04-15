# 📦 Módulo [Nome]

## 📋 Contrato Arquitetural

Este módulo é a **única fonte de verdade** para [domínio] no sistema.

### ✅ Permitido

- Usar `use[Nome]` para consumir [itens]
- Usar `[nome]Service` para operações
- Usar helpers para casos específicos
- Importar tipos de `@/modules/[nome]`

### ❌ PROIBIDO

- Acessar `supabase.from('[tabela]')` diretamente
- Criar hooks alternativos de [nome]
- Criar services alternativos de [nome]
- Duplicar lógica de [nome]
- Criar channels Realtime fora do hook oficial

---

## 🚀 Como Usar

### 1. Consumir [Itens] (Frontend)

```typescript
import { use[Nome] } from '@/modules/[nome]';

function MeuComponente() {
  const { 
    items, 
    loading, 
    error,
    refresh 
  } = use[Nome]({
    enableRealtime: true,
  });

  return (
    <div>
      {loading && <p>Carregando...</p>}
      {error && <p>Erro: {error}</p>}
      {items.map(item => (
        <div key={item.id}>{item.type}</div>
      ))}
    </div>
  );
}
```

### 2. Criar [Item] (Backend/Actions)

```typescript
import { [nome]Service, [Nome]Type } from '@/modules/[nome]';

await [nome]Service.create[Item]({
  user_id: 'uuid',
  type: [Nome]Type.TYPE_1,
  status: [Nome]Status.ACTIVE,
});
```

### 3. Atualizar [Item]

```typescript
import { [nome]Service } from '@/modules/[nome]';

await [nome]Service.update[Item]('item-id', {
  status: [Nome]Status.INACTIVE,
});
```

### 4. Deletar [Item]

```typescript
import { [nome]Service } from '@/modules/[nome]';

await [nome]Service.delete[Item]('item-id');
```

---

## 📁 Estrutura do Módulo

```
src/modules/[nome]/
├── index.ts                    # Exports públicos (ÚNICO ponto de entrada)
├── README.md                   # Este arquivo
├── .eslintrc.json             # Regras de bloqueio
│
├── hooks/
│   └── use[Nome].ts           # Hook oficial (ÚNICO permitido)
│
├── services/
│   └── [nome].service.ts      # Service oficial (ÚNICO permitido)
│
├── types/
│   └── [nome].types.ts        # Tipos centralizados
│
├── helpers/                    # (opcional)
│   └── [nome].helpers.ts      # Helpers específicos
│
└── components/                 # (opcional)
    └── [ComponentName].tsx     # Componentes do módulo
```

---

## 📊 API do Hook

### Dados
```typescript
items: [Nome][]                // Lista de [itens]
```

### Estado
```typescript
loading: boolean               // Carregando
error: string | null           // Erro
```

### Ações
```typescript
refresh(): void                // Recarregar [itens]
```

---

## 📊 API do Service

### Métodos
```typescript
fetch[Itens](userId, filters): Promise<[Nome][]>
fetch[Item]ById(id): Promise<[Nome] | null>
create[Item](params): Promise<[Nome]>
update[Item](id, updates): Promise<boolean>
delete[Item](id): Promise<boolean>
```

---

## 🎯 Tipos Disponíveis

### Enums
- `[Nome]Type` - Tipos de [item]
- `[Nome]Status` - Status de [item]

### Interfaces
- `[Nome]` - Interface principal
- `[Nome]Filters` - Filtros de busca
- `Create[Nome]Params` - Parâmetros de criação
- `Update[Nome]Params` - Parâmetros de atualização
- `[Nome]Stats` - Estatísticas

---

## 🔒 Segurança (RLS)

O sistema possui Row Level Security (RLS) ativo:

- Usuários veem apenas seus próprios [itens]
- Usuários podem criar seus [itens]
- Usuários podem atualizar seus [itens]
- Usuários podem deletar seus [itens]

---

## 🛠️ Adicionar Nova Funcionalidade

1. **Novo Tipo:**
   - Adicionar em `types/[nome].types.ts`
   - Exportar em `index.ts`

2. **Novo Método no Service:**
   - Adicionar em `services/[nome].service.ts`
   - Manter padrão de nomenclatura

3. **Novo Helper:**
   - Criar em `helpers/[nome].helpers.ts`
   - Exportar em `index.ts`

4. **Novo Componente:**
   - Criar em `components/`
   - Exportar em `index.ts` (se público)

---

## 📝 Checklist de Code Review

- [ ] Usa `use[Nome]` (não cria hook alternativo)
- [ ] Usa `[nome]Service` (não acessa banco direto)
- [ ] Importa de `@/modules/[nome]`
- [ ] Não cria channels Realtime adicionais
- [ ] Não duplica lógica de [nome]
- [ ] Segue tipos centralizados
- [ ] Não acessa `supabase.from('[tabela]')`

---

## 🎓 Princípios Arquiteturais

1. **Single Source of Truth (SSOT)**
   - Um único módulo para [domínio]
   - Um único hook para consumir
   - Um único service para operações

2. **Separation of Concerns**
   - Hooks: lógica de estado e Realtime
   - Service: lógica de negócio e API
   - Types: contratos e interfaces

3. **Encapsulation**
   - Acesso ao banco apenas via service
   - Lógica complexa escondida
   - API simples e clara

4. **Consistency**
   - Mesma API em todo o app
   - Mesmo comportamento
   - Mesmos tipos

---

**Baseado no padrão:** `src/modules/notifications/`
**Versão:** 1.0.0
**Data:** 2024-03-16
