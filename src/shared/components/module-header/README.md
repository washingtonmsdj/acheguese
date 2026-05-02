# ModuleHeader — SSOT

Header sticky reutilizável para todos os módulos da plataforma.

## 🎯 Propósito

Componente SSOT (Single Source of Truth) que padroniza headers de módulos, garantindo:
- ✅ Consistência visual em todos os módulos
- ✅ Manutenção centralizada
- ✅ Comportamento territorial automático
- ✅ Busca integrada
- ✅ Favoritos opcionais

## 📦 Uso Básico

```tsx
import { ModuleHeader } from '@/shared/components/module-header';
import { Store } from 'lucide-react';

function MyModulePage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <>
      <ModuleHeader
        moduleName="Meu Módulo"
        moduleIcon={Store}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      {/* Resto da página */}
    </>
  );
}
```

## 🎨 Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `moduleName` | `string` | ✅ | Nome do módulo (ex: "Gastronomia") |
| `moduleIcon` | `LucideIcon` | ✅ | Ícone do módulo |
| `searchQuery` | `string` | ✅ | Query de busca atual |
| `onSearchChange` | `(value: string) => void` | ✅ | Callback quando busca muda |
| `searchPlaceholder` | `string` | ❌ | Placeholder customizado |
| `taglines` | `((place: string) => string)[]` | ❌ | Taglines territoriais customizadas |
| `favoritesLink` | `string` | ❌ | Link para favoritos |
| `showFavorites` | `boolean` | ❌ | Mostrar botão de favoritos (default: false) |

## 📚 Exemplos

### Exemplo 1: Header Simples

```tsx
<ModuleHeader
  moduleName="Serviços"
  moduleIcon={Briefcase}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
/>
```

### Exemplo 2: Com Favoritos

```tsx
<ModuleHeader
  moduleName="Gastronomia"
  moduleIcon={UtensilsCrossed}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  favoritesLink="/gastronomia/favoritos"
  showFavorites={true}
/>
```

### Exemplo 3: Taglines Customizadas

```tsx
const CUSTOM_TAGLINES = [
  (place: string) => `Encontre serviços em ${place}`,
  (place: string) => `Profissionais de ${place}`,
];

<ModuleHeader
  moduleName="Serviços"
  moduleIcon={Briefcase}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  taglines={CUSTOM_TAGLINES}
/>
```

### Exemplo 4: Placeholder Customizado

```tsx
<ModuleHeader
  moduleName="Classificados"
  moduleIcon={Tag}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Buscar anúncios, produtos..."
/>
```

## 🏗️ Wrappers Específicos

Para manter compatibilidade e customizações específicas, crie wrappers:

```tsx
// GastronomyHeader.tsx
import { ModuleHeader } from '@/shared/components/module-header';
import { UtensilsCrossed } from 'lucide-react';

const GASTRONOMY_TAGLINES = [
  (place: string) => `Sabores que fazem ${place} especial`,
  // ...
];

export function GastronomyHeader({ searchQuery, onSearchChange }) {
  return (
    <ModuleHeader
      moduleName="Gastronomia"
      moduleIcon={UtensilsCrossed}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      taglines={GASTRONOMY_TAGLINES}
      favoritesLink="/gastronomia/favoritos"
      showFavorites={true}
    />
  );
}
```

## 🎯 Módulos que Usam

- ✅ **Gastronomia** (`GastronomyHeader`)
- ✅ **Empresas** (`EmpresasHeader`)
- 🔜 **Serviços**
- 🔜 **Classificados**
- 🔜 **Mobilidade**
- 🔜 **Eventos**

## 🔧 Comportamento Automático

### Território
- Detecta automaticamente via `useTerritorialContext()`
- Adapta tagline baseado no território atual
- Placeholder de busca territorial

### Usuário
- Detecta autenticação via `useSessionContext()`
- Mostra favoritos apenas se `showFavorites={true}` e usuário logado

### Responsividade
- Mobile: Apenas ícone e busca
- Tablet (sm+): Ícone, nome e busca
- Desktop (md+): Ícone, nome, tagline e busca

## 🎨 Estilo

- **Sticky**: Fica fixo no topo ao rolar
- **Backdrop blur**: Efeito de desfoque no fundo
- **z-index**: 40 (acima do conteúdo, abaixo de modals)
- **Altura**: 12 (mobile) → 13 (sm) → 14 (md)

## 🚀 Próximos Passos

Para adicionar um novo módulo:

1. Importe o `ModuleHeader`
2. Defina taglines customizadas (opcional)
3. Configure props específicas
4. Crie wrapper se necessário

```tsx
// NovoModuloHeader.tsx
import { ModuleHeader } from '@/shared/components/module-header';
import { MyIcon } from 'lucide-react';

export function NovoModuloHeader({ searchQuery, onSearchChange }) {
  return (
    <ModuleHeader
      moduleName="Novo Módulo"
      moduleIcon={MyIcon}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
    />
  );
}
```
