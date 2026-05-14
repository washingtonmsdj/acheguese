/**
 * Ã°Å¸Å½Â¯ EXEMPLO DE ROTA PARA EVENTOS V2
 * 
 * Copie este cÃƒÂ³digo para o arquivo de rotas principal para testar a V2
 * 
 * LocalizaÃƒÂ§ÃƒÂ£o sugerida: src/app/routes/index.tsx
 */

import { lazy } from 'react';

// Lazy load da pÃƒÂ¡gina V2
const EventDetailPage = lazy(() => import('@/features/events/pages/EventDetailPage'));

// ============================================================================
// ADICIONAR AO ARRAY DE ROTAS
// ============================================================================

export const eventsV2DemoRoute = {
  path: '/eventos-v2/demo',
  element: <EventDetailPage />,
  // Opcional: adicionar metadata
  meta: {
    title: 'Evento V2 - Demo',
    description: 'DemonstraÃƒÂ§ÃƒÂ£o da nova interface de eventos'
  }
};

// ============================================================================
// EXEMPLO DE USO NO ROUTER
// ============================================================================

/*
import { createBrowserRouter } from 'react-router-dom';
import { eventsV2DemoRoute } from './demo-route.example';

const router = createBrowserRouter([
  // ... outras rotas
  eventsV2DemoRoute,
  // ... mais rotas
]);
*/

// ============================================================================
// ACESSO
// ============================================================================

/*
ApÃƒÂ³s adicionar a rota, acesse:
http://localhost:5173/eventos-v2/demo

Ou adicione um link em qualquer pÃƒÂ¡gina:
<Link to="/eventos-v2/demo">Ver Evento V2 Demo</Link>
*/

// ============================================================================
// INTEGRAÃƒâ€¡ÃƒÆ’O COM DADOS REAIS
// ============================================================================

/*
Para integrar com dados reais, modifique EventDetailPage.tsx:

1. Remova o MOCK_EVENT
2. Adicione um hook para buscar dados:

import { useParams } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const { data: event, isLoading, error } = useEvent(eventId);
  
  if (isLoading) return <EventSkeleton />;
  if (error) return <EventError error={error} />;
  if (!event) return <EventNotFound />;
  
  return (
    // ... resto do componente
  );
}

3. Crie a rota dinÃƒÂ¢mica:
{
  path: '/eventos-v2/:eventId',
  element: <EventDetailPage />
}
*/
