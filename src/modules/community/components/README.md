# Community Components

Componentes da seção de Comunidade do aplicativo.

## 📁 Estrutura

```
community/
├── CommunityLeftSidebar.tsx          # Sidebar esquerda (eager loading)
├── CommunityLeftSidebar.lazy.tsx     # Sidebar esquerda (lazy loading)
├── CommunityRightSidebar.tsx         # Sidebar direita (eager loading)
├── CommunityRightSidebar.lazy.tsx    # Sidebar direita (lazy loading)
├── widgets/
│   ├── RankingWidget.tsx             # Widget de ranking de vizinhos
│   ├── GroupsWidget.tsx              # Widget de grupos favoritos
│   ├── TrendingWidget.tsx            # Widget de tendências do bairro
│   ├── SponsoredWidget.tsx           # Widget de anúncios patrocinados
│   ├── WidgetSkeleton.tsx            # Loading state para widgets
│   └── index.ts                      # Barrel export
└── README.md                         # Esta documentação
```

## 🎯 Widgets Disponíveis

### RankingWidget

Exibe o ranking dos vizinhos mais ativos da comunidade.

- **Hook**: `useRankingUsers(limit)`
- **Props**: Nenhuma (usa hook interno)
- **Loading**: Skeleton automático

### GroupsWidget

Mostra os grupos favoritos do usuário.

- **Hook**: `useFavoriteGroups()`
- **Props**: Nenhuma (usa hook interno)
- **Loading**: Skeleton automático

### TrendingWidget

Lista as tendências mais populares do bairro.

- **Hook**: `useTrendingTopics(limit)`
- **Props**: Nenhuma (usa hook interno)
- **Loading**: Skeleton automático

### SponsoredWidget

Exibe anúncio patrocinado com targeting por localização.

- **Hook**: `useSponsoredAds()`
- **Props**: Nenhuma (usa hook interno)
- **Loading**: Skeleton automático

## 🚀 Performance

### Eager Loading (Padrão)

```tsx
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar";
```

- Carrega todos os widgets imediatamente
- Melhor para páginas onde sidebars são sempre visíveis
- Usado atualmente em ComunidadePage

### Lazy Loading (Otimizado)

```tsx
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar.lazy";
```

- Code splitting automático
- Widgets carregados sob demanda
- Reduz bundle inicial
- Suspense boundaries com skeleton loaders

## 🎨 Design System

Todos os widgets seguem o mesmo padrão visual:

- **Background**: `bg-white/5`
- **Border**: `border-white/10`
- **Hover**: `hover:bg-white/10`
- **Títulos**: `text-[0.65rem]` (10.4px)
- **Subtítulos**: `text-[0.55rem]` (8.8px)
- **Badges**: `text-[9px]`
- **Padding**: `p-2`
- **Gap**: `gap-1.5`, `space-y-1`

## 📊 Hooks

Cada widget possui um hook dedicado:

```tsx
// Ranking de usuários
const { data, isLoading } = useRankingUsers(3);

// Grupos favoritos
const { data, isLoading } = useFavoriteGroups();

// Tendências
const { data, isLoading } = useTrendingTopics(3);

// Anúncios
const { data, isLoading } = useSponsoredAds();
```

### Cache Strategy

- **Ranking**: 5min stale, 10min gc
- **Grupos**: 5min stale, 10min gc
- **Tendências**: 10min stale, 15min gc
- **Anúncios**: 30min stale, 60min gc

## 🔄 Estado de Loading

Todos os widgets usam `WidgetSkeleton` durante carregamento:

```tsx
if (isLoading) {
  return <WidgetSkeleton hasHeader itemCount={3} />;
}
```

## 📝 Pendencias

- [ ] Implementar queries reais no backend
- [ ] Adicionar sistema de grupos
- [ ] Implementar tracking de tendências
- [ ] Criar sistema de anúncios com targeting
- [ ] Adicionar testes unitários
- [ ] Criar Storybook stories
- [ ] Implementar analytics de cliques
- [ ] Adicionar A/B testing para anúncios

## 🧪 Testes

```bash
# Rodar testes unitários
npm test src/components/community

# Rodar testes com coverage
npm test -- --coverage src/components/community
```

## 📚 Exemplos

### Uso Básico

```tsx
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar";

function MyPage() {
  return (
    <aside className="w-64">
      <CommunityLeftSidebar />
    </aside>
  );
}
```

### Com Lazy Loading

```tsx
import { CommunityLeftSidebar } from "@/components/community/CommunityLeftSidebar.lazy";

function MyPage() {
  return (
    <aside className="w-64">
      <CommunityLeftSidebar />
    </aside>
  );
}
```

### Widget Individual

```tsx
import { RankingWidget } from "@/components/community/widgets";

function CustomSidebar() {
  return (
    <div>
      <RankingWidget />
    </div>
  );
}
```
