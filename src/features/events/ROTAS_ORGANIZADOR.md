# ðŸ›£ï¸ Rotas do Dashboard do Organizador

Guia completo de rotas e navegaÃ§Ã£o para o sistema de eventos.

## ðŸ“ Estrutura de Rotas

```typescript
// App.tsx ou routes.tsx

import { Routes, Route } from 'react-router-dom';
import EventsOrganizerDashboard from '@/features/events-v2/pages/EventsOrganizerDashboard';
import EventsOrganizerForm from '@/features/events-v2/pages/EventsOrganizerForm';
import EventDetailPageV2 from '@/features/events-v2/pages/EventDetailPageV2';
import EventsListPage from '@/features/events-v2/pages/EventsListPage';
import EventsCalendarPage from '@/features/events-v2/pages/EventsCalendarPage';
import EventsMapPage from '@/features/events-v2/pages/EventsMapPage';
import EventsFavoritesPage from '@/features/events-v2/pages/EventsFavoritesPage';

function EventsRoutes() {
  return (
    <Routes>
      {/* Rotas PÃºblicas */}
      <Route path="/eventos" element={<EventsListPage />} />
      <Route path="/eventos/:eventId" element={<EventDetailPageV2 />} />
      <Route path="/eventos/calendario" element={<EventsCalendarPage />} />
      <Route path="/eventos/mapa" element={<EventsMapPage />} />
      <Route path="/eventos/favoritos" element={<EventsFavoritesPage />} />

      {/* Rotas do Organizador (Protegidas) */}
      <Route 
        path="/eventos/organizer" 
        element={
          <ProtectedRoute>
            <EventsOrganizerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/eventos/organizer/new" 
        element={
          <ProtectedRoute>
            <EventsOrganizerForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/eventos/organizer/edit/:eventId" 
        element={
          <ProtectedRoute>
            <EventsOrganizerForm />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

---

## ðŸ” ProteÃ§Ã£o de Rotas

### Componente ProtectedRoute

```typescript
// components/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'organizer' | 'admin';
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'organizer' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirecionar para login, salvando a rota atual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    // UsuÃ¡rio nÃ£o tem permissÃ£o
    return <Navigate to="/eventos" replace />;
  }

  return <>{children}</>;
}
```

---

## ðŸ§­ NavegaÃ§Ã£o

### Menu do Organizador

```tsx
// components/OrganizerMenu.tsx

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/eventos/organizer',
    icon: LayoutDashboard,
  },
  {
    label: 'Meus Eventos',
    href: '/eventos/organizer',
    icon: Calendar,
  },
  {
    label: 'Participantes',
    href: '/eventos/organizer/participants',
    icon: Users,
  },
  {
    label: 'Analytics',
    href: '/eventos/organizer/analytics',
    icon: BarChart3,
  },
  {
    label: 'ConfiguraÃ§Ãµes',
    href: '/eventos/organizer/settings',
    icon: Settings,
  },
];

export function OrganizerMenu() {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## ðŸ”— Links e NavegaÃ§Ã£o ProgramÃ¡tica

### Usando Link

```tsx
import { Link } from 'react-router-dom';

// Link para dashboard
<Link to="/eventos/organizer">
  Meus Eventos
</Link>

// Link para criar evento
<Link to="/eventos/organizer/new">
  Criar Evento
</Link>

// Link para editar evento
<Link to={`/eventos/organizer/edit/${eventId}`}>
  Editar
</Link>

// Link para visualizar evento (pÃºblico)
<Link to={`/eventos/${eventId}`}>
  Ver Evento
</Link>
```

### Usando useNavigate

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleCreateEvent = () => {
    navigate('/eventos/organizer/new');
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/eventos/organizer/edit/${eventId}`);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/eventos/${eventId}`);
  };

  const handleBack = () => {
    navigate(-1); // Voltar
  };

  return (
    <div>
      <Button onClick={handleCreateEvent}>Criar</Button>
      <Button onClick={handleBack}>Voltar</Button>
    </div>
  );
}
```

---

## ðŸ“± Breadcrumbs

### Componente de Breadcrumbs

```tsx
// components/Breadcrumbs.tsx

import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

const routeLabels: Record<string, string> = {
  'eventos-v2': 'Eventos',
  'organizer': 'Organizador',
  'new': 'Novo Evento',
  'edit': 'Editar Evento',
  'calendario': 'CalendÃ¡rio',
  'mapa': 'Mapa',
  'favoritos': 'Favoritos',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link 
        to="/" 
        className="flex items-center gap-1 transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">InÃ­cio</span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = routeLabels[name] || name;

        return (
          <div key={routeTo} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link 
                to={routeTo}
                className="transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
```

---

## ðŸŽ¯ Query Parameters

### Filtros na URL

```tsx
import { useSearchParams } from 'react-router-dom';

function EventsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Ler parÃ¢metros
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const search = searchParams.get('q');

  // Atualizar parÃ¢metros
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div>
      <Input
        value={search || ''}
        onChange={(e) => handleFilterChange('q', e.target.value)}
        placeholder="Buscar..."
      />
      
      <Select
        value={category || 'all'}
        onValueChange={(value) => handleFilterChange('category', value)}
      >
        <SelectItem value="all">Todas</SelectItem>
        <SelectItem value="cultural">Cultural</SelectItem>
        <SelectItem value="esportivo">Esportivo</SelectItem>
      </Select>
    </div>
  );
}

// URL resultante: /eventos/organizer?category=cultural&status=publicado&q=festa
```

---

## ðŸ”„ Redirecionamentos

### ApÃ³s Criar Evento

```tsx
function EventsOrganizerForm() {
  const navigate = useNavigate();

  const handlePublish = async () => {
    try {
      const newEvent = await createEvent(formData);
      
      // OpÃ§Ã£o 1: Redirecionar para dashboard
      navigate('/eventos/organizer', {
        state: { message: 'Evento criado com sucesso!' }
      });

      // OpÃ§Ã£o 2: Redirecionar para visualizaÃ§Ã£o do evento
      navigate(`/eventos/${newEvent.id}`);

      // OpÃ§Ã£o 3: Redirecionar para ediÃ§Ã£o
      navigate(`/eventos/organizer/edit/${newEvent.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button onClick={handlePublish}>
      Publicar
    </Button>
  );
}
```

### ApÃ³s Login

```tsx
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    await login(credentials);
    
    // Redirecionar para pÃ¡gina anterior ou dashboard
    const from = location.state?.from?.pathname || '/eventos/organizer';
    navigate(from, { replace: true });
  };

  return (
    <Button onClick={handleLogin}>
      Entrar
    </Button>
  );
}
```

---

## ðŸŽ¨ Layout com Sidebar

### Layout do Organizador

```tsx
// layouts/OrganizerLayout.tsx

import { Outlet } from 'react-router-dom';
import { OrganizerMenu } from '@/components/OrganizerMenu';

export function OrganizerLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-4">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Organizador</p>
        </div>
        <OrganizerMenu />
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

// Usar no Routes
<Route path="/eventos/organizer" element={<OrganizerLayout />}>
  <Route index element={<EventsOrganizerDashboard />} />
  <Route path="new" element={<EventsOrganizerForm />} />
  <Route path="edit/:eventId" element={<EventsOrganizerForm />} />
</Route>
```

---

## ðŸ“Š Exemplo Completo

```tsx
// App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OrganizerLayout } from '@/layouts/OrganizerLayout';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import EventsListPage from '@/features/events-v2/pages/EventsListPage';
import EventDetailPageV2 from '@/features/events-v2/pages/EventDetailPageV2';
import EventsCalendarPage from '@/features/events-v2/pages/EventsCalendarPage';
import EventsMapPage from '@/features/events-v2/pages/EventsMapPage';
import EventsFavoritesPage from '@/features/events-v2/pages/EventsFavoritesPage';
import EventsOrganizerDashboard from '@/features/events-v2/pages/EventsOrganizerDashboard';
import EventsOrganizerForm from '@/features/events-v2/pages/EventsOrganizerForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Eventos PÃºblicos */}
        <Route path="/eventos">
          <Route index element={<EventsListPage />} />
          <Route path=":eventId" element={<EventDetailPageV2 />} />
          <Route path="calendario" element={<EventsCalendarPage />} />
          <Route path="mapa" element={<EventsMapPage />} />
          <Route path="favoritos" element={<EventsFavoritesPage />} />
        </Route>

        {/* Dashboard do Organizador */}
        <Route 
          path="/eventos/organizer" 
          element={
            <ProtectedRoute requiredRole="organizer">
              <OrganizerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EventsOrganizerDashboard />} />
          <Route path="new" element={<EventsOrganizerForm />} />
          <Route path="edit/:eventId" element={<EventsOrganizerForm />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## ðŸš€ Dicas de Performance

### 1. Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const EventsOrganizerDashboard = lazy(() => 
  import('@/features/events-v2/pages/EventsOrganizerDashboard')
);

<Route 
  path="/eventos/organizer" 
  element={
    <Suspense fallback={<LoadingScreen />}>
      <EventsOrganizerDashboard />
    </Suspense>
  } 
/>
```

### 2. Prefetch de Rotas

```tsx
import { Link } from 'react-router-dom';

<Link 
  to="/eventos/organizer/new"
  onMouseEnter={() => {
    // Prefetch da rota ao passar o mouse
    import('@/features/events-v2/pages/EventsOrganizerForm');
  }}
>
  Criar Evento
</Link>
```

---

**Ãšltima atualizaÃ§Ã£o:** 2024
**VersÃ£o:** 1.0.0
