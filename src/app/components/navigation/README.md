# 🧭 Navigation Components

Componentes de navegação global da aplicação.

---

## 📁 Estrutura

```
navigation/
├── navigation.config.ts    # ✅ SSOT - Configuração de todos os itens
├── AppSidebar.tsx          # Desktop sidebar (colapsável)
├── AppBottomNav.tsx        # Mobile bottom navigation
├── index.ts                # Barrel export
└── README.md               # Este arquivo
```

---

## 🎯 Princípios

### 1. Single Source of Truth (SSOT)
Todos os itens de navegação são definidos em `navigation.config.ts`.

**Para adicionar um novo item**:
1. Edite `navigation.config.ts`
2. Adicione na seção apropriada (`explore`, `community`, `tools`)
3. Se for importante para mobile, adicione em `MOBILE_NAV_ITEMS`
4. Pronto! Aparecerá automaticamente em todos os componentes

### 2. Separação de Responsabilidades
- `AppSidebar` = Navegação desktop (sidebar colapsável)
- `AppBottomNav` = Navegação mobile (bottom nav)
- Sidebars de módulos = Widgets/filtros específicos do módulo

### 3. Sem Duplicação
- Um componente por responsabilidade
- Configuração compartilhada
- Reutilização via composição

---

## 📖 Uso

### Importar Componentes

```typescript
import { AppSidebar, AppBottomNav } from '@/app/components/navigation';
```

### Usar no Layout

```typescript
function AppLayout() {
  return (
    <div className="flex h-screen">
      {/* Desktop */}
      <AppSidebar />
      
      {/* Conteúdo */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Mobile */}
      <AppBottomNav />
    </div>
  );
}
```

### Adicionar Novo Item

```typescript
// navigation.config.ts

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'explore',
    label: 'Explorar',
    items: [
      // ... itens existentes
      { 
        id: 'novo-modulo',
        icon: NovoIcon,
        label: 'Novo Módulo',
        href: '/novo-modulo',
        description: 'Descrição do novo módulo'
      },
    ],
  },
];

// Se for importante para mobile:
export const MOBILE_NAV_ITEMS: NavItem[] = [
  // ... itens existentes
  { 
    id: 'novo-modulo',
    icon: NovoIcon,
    label: 'Novo',
    href: '/novo-modulo',
    description: 'Novo Módulo'
  },
];
```

---

## 🔧 Configuração

### NavItem Interface

```typescript
interface NavItem {
  id: string;              // Identificador único
  icon: LucideIcon;        // Ícone do lucide-react
  label: string;           // Label exibido
  href: string;            // Rota
  description?: string;    // Descrição (tooltip)
  requiresAuth?: boolean;  // Requer autenticação?
  badge?: string;          // Badge (ex: "Novo", "Beta")
}
```

### NavSection Interface

```typescript
interface NavSection {
  id: string;              // Identificador único
  label: string;           // Label da seção
  items: NavItem[];        // Itens da seção
}
```

---

## 🎨 Customização

### Alterar Ordem dos Itens
Edite a ordem em `NAV_SECTIONS` ou `MOBILE_NAV_ITEMS`.

### Adicionar Badge
```typescript
{ 
  id: 'novo-modulo',
  icon: NovoIcon,
  label: 'Novo Módulo',
  href: '/novo-modulo',
  badge: 'Novo'  // ✅ Badge
},
```

### Restringir por Autenticação
```typescript
{ 
  id: 'mensagens',
  icon: MessageCircle,
  label: 'Mensagens',
  href: '/mensagens',
  requiresAuth: true  // ✅ Só aparece se logado
},
```

---

## 🧪 Testes

### Testar Navegação
1. Adicione item em `navigation.config.ts`
2. Verifique se aparece em desktop (sidebar)
3. Verifique se aparece em mobile (bottom nav)
4. Teste navegação (clique no item)
5. Teste indicador de página ativa

### Testar Autenticação
1. Adicione `requiresAuth: true`
2. Teste sem login (não deve aparecer)
3. Faça login
4. Teste com login (deve aparecer)

---

## 📊 Benefícios

### Antes (Fragmentado)
```
❌ 3 arquivos para editar
❌ Código duplicado
❌ Difícil de encontrar
❌ Inconsistências possíveis
❌ Navegação em módulos
```

### Depois (Centralizado)
```
✅ 1 arquivo para editar (config)
✅ Zero duplicação
✅ Fácil de encontrar (app/components/navigation/)
✅ Consistência garantida
✅ Navegação em app/
```

---

## 🔗 Referências

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [Component-Driven Development](https://www.componentdriven.org/)

---

**Criado**: 2026-04-01  
**Versão**: 1.0.0  
**Status**: ✅ ATIVO
