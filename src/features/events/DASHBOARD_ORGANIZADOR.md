# ðŸ“Š Dashboard do Organizador de Eventos

Sistema completo para organizadores gerenciarem seus eventos no Achegue-se.

## ðŸŽ¯ VisÃ£o Geral

O Dashboard do Organizador Ã© uma Ã¡rea administrativa completa onde os criadores de eventos podem:

- âœ… Criar e editar eventos
- âœ… Acompanhar mÃ©tricas e analytics
- âœ… Gerenciar ingressos e vendas
- âœ… Visualizar participantes
- âœ… Exportar relatÃ³rios

---

## ðŸ“ Arquivos Principais

### 1. **EventsOrganizerDashboard.tsx**
Dashboard principal com listagem de eventos e estatÃ­sticas.

**Funcionalidades:**
- ðŸ“Š Cards de estatÃ­sticas (eventos, participantes, visualizaÃ§Ãµes, receita)
- ðŸ” Busca e filtros por status
- ðŸ“‹ Listagem de eventos com aÃ§Ãµes rÃ¡pidas
- ðŸ“¥ ExportaÃ§Ã£o de dados
- ðŸŽ¨ Interface responsiva e animada

**Rotas:**
```typescript
/eventos/organizer          // Dashboard principal
/eventos/organizer/new      // Criar novo evento
/eventos/organizer/edit/:id // Editar evento existente
```

### 2. **EventsOrganizerForm.tsx**
FormulÃ¡rio multi-step para criar/editar eventos.

**Steps:**
1. **InformaÃ§Ãµes BÃ¡sicas** - TÃ­tulo, categoria, descriÃ§Ãµes
2. **Data e Local** - Datas, tipo (presencial/online/hÃ­brido), endereÃ§o
3. **Ingressos** - Gratuito/pago, capacidade, tipos de ingressos
4. **Detalhes** - Requisitos, o que levar, classificaÃ§Ã£o etÃ¡ria
5. **MÃ­dia** - Imagem de capa e galeria

**Funcionalidades:**
- âœ… ValidaÃ§Ã£o de formulÃ¡rio
- âœ… NavegaÃ§Ã£o entre steps
- âœ… Salvar como rascunho
- âœ… Preview do evento
- âœ… PublicaÃ§Ã£o

---

## ðŸ§© Componentes Auxiliares

### 1. **EventAnalyticsCard.tsx**
Card com analytics detalhados de um evento especÃ­fico.

**MÃ©tricas:**
- ðŸ‘ï¸ VisualizaÃ§Ãµes (total, tendÃªncia, Ãºltima semana)
- ðŸ‘¥ Participantes (total, % da capacidade)
- â¤ï¸ Engajamento (curtidas, compartilhamentos, comentÃ¡rios)
- ðŸ’° Receita (total, tendÃªncia, ingressos vendidos)
- ðŸ“Š Origem do trÃ¡fego (direto, redes sociais, busca, referÃªncia)
- ðŸŽ« Vendas por tipo de ingresso

**Uso:**
```tsx
import { EventAnalyticsCard } from '@/features/events-v2/components/EventAnalyticsCard';

<EventAnalyticsCard event={event} />
```

### 2. **EventImageUploader.tsx**
Componente para upload de imagens com drag & drop.

**Funcionalidades:**
- ðŸ“¸ Upload via clique ou drag & drop
- ðŸ–¼ï¸ Preview da imagem
- âœ… ValidaÃ§Ã£o de tipo e tamanho
- ðŸ”„ Loading state
- âŒ RemoÃ§Ã£o de imagem
- ðŸŽ¨ Suporte a diferentes aspect ratios

**Uso:**
```tsx
import { EventImageUploader } from '@/features/events-v2/components/EventImageUploader';

<EventImageUploader
  value={coverImage}
  onChange={setCoverImage}
  aspectRatio="video"
  maxSizeMB={5}
/>
```

**Props:**
- `value`: URL da imagem atual
- `onChange`: Callback quando imagem muda
- `aspectRatio`: 'video' | 'square' | 'portrait'
- `maxSizeMB`: Tamanho mÃ¡ximo em MB

### 3. **EventTicketManager.tsx**
Gerenciador completo de tipos de ingressos.

**Funcionalidades:**
- âž• Adicionar novos tipos de ingressos
- âœï¸ Editar ingressos existentes
- ðŸ—‘ï¸ Remover ingressos
- ðŸ“Š Visualizar progresso de vendas
- ðŸ’° Resumo de receita
- ðŸ“… PerÃ­odo de vendas por ingresso

**Uso:**
```tsx
import { EventTicketManager } from '@/features/events-v2/components/EventTicketManager';

<EventTicketManager
  tickets={tickets}
  onChange={setTickets}
/>
```

**Estrutura de Ticket:**
```typescript
interface Ticket {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  sale_start_date?: string;
  sale_end_date?: string;
}
```

---

## ðŸŽ¨ Interface e UX

### Design System
- âœ… Componentes do shadcn/ui
- âœ… AnimaÃ§Ãµes com Framer Motion
- âœ… Ãcones do Lucide React
- âœ… Tema dark/light mode
- âœ… Responsivo (mobile-first)

### PadrÃµes de Cores
```typescript
// Status dos eventos
publicado: 'bg-green-500'
rascunho: 'bg-gray-500'
cancelado: 'bg-red-500'
finalizado: 'bg-blue-500'
em_andamento: 'bg-amber-500'

// MÃ©tricas
views: 'text-blue-600'
participants: 'text-green-600'
engagement: 'text-pink-600'
revenue: 'text-amber-600'
```

### AnimaÃ§Ãµes
```typescript
// Fade in com delay
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.1 }}

// Slide entre steps
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
```

---

## ðŸ”§ IntegraÃ§Ã£o com Backend

### Endpoints NecessÃ¡rios

```typescript
// Eventos do organizador
GET    /api/events/organizer/me
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id

// Analytics
GET    /api/events/:id/analytics

// Ingressos
POST   /api/events/:id/tickets
PUT    /api/events/:id/tickets/:ticketId
DELETE /api/events/:id/tickets/:ticketId

// Upload de imagens
POST   /api/upload/image
```

### Exemplo de IntegraÃ§Ã£o

```typescript
// hooks/useOrganizerEvents.ts
export function useOrganizerEvents() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', userId)
        .order('created_at', { ascending: false });
      return data;
    },
  });

  return { events: data, isLoading, error };
}
```

---

## ðŸ“Š Fluxo de CriaÃ§Ã£o de Evento

```mermaid
graph TD
    A[Dashboard] --> B[Criar Evento]
    B --> C[Step 1: Info BÃ¡sicas]
    C --> D[Step 2: Data e Local]
    D --> E[Step 3: Ingressos]
    E --> F[Step 4: Detalhes]
    F --> G[Step 5: MÃ­dia]
    G --> H{AÃ§Ã£o}
    H -->|Salvar| I[Rascunho]
    H -->|Publicar| J[Evento Publicado]
    H -->|Preview| K[Visualizar]
    I --> A
    J --> A
    K --> G
```

---

## ðŸš€ PrÃ³ximos Passos

### Funcionalidades Pendentes

1. **Upload Real de Imagens**
   - IntegraÃ§Ã£o com Supabase Storage
   - OtimizaÃ§Ã£o automÃ¡tica de imagens
   - CDN para performance

2. **Analytics AvanÃ§ados**
   - GrÃ¡ficos interativos (Chart.js ou Recharts)
   - ComparaÃ§Ã£o entre perÃ­odos
   - ExportaÃ§Ã£o de relatÃ³rios PDF

3. **GestÃ£o de Participantes**
   - Lista de inscritos
   - Check-in QR Code
   - ComunicaÃ§Ã£o com participantes

4. **Pagamentos**
   - IntegraÃ§Ã£o com Stripe/Mercado Pago
   - GestÃ£o de reembolsos
   - RelatÃ³rios financeiros

5. **NotificaÃ§Ãµes**
   - Email para participantes
   - Lembretes automÃ¡ticos
   - AtualizaÃ§Ãµes do evento

---

## ðŸ“ Exemplos de Uso

### Criar Novo Evento

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const handleCreateEvent = () => {
    navigate('/eventos/organizer/new');
  };

  return (
    <Button onClick={handleCreateEvent}>
      Criar Evento
    </Button>
  );
}
```

### Editar Evento Existente

```tsx
import { useNavigate } from 'react-router-dom';

function EventCard({ event }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/eventos/organizer/edit/${event.id}`);
  };

  return (
    <Button onClick={handleEdit}>
      Editar
    </Button>
  );
}
```

### Visualizar Analytics

```tsx
import { EventAnalyticsCard } from '@/features/events-v2/components/EventAnalyticsCard';

function EventDashboard({ event }) {
  return (
    <div>
      <h1>{event.title}</h1>
      <EventAnalyticsCard event={event} />
    </div>
  );
}
```

---

## ðŸŽ¯ Checklist de ImplementaÃ§Ã£o

### âœ… ConcluÃ­do
- [x] Dashboard principal
- [x] FormulÃ¡rio multi-step
- [x] Componente de analytics
- [x] Upload de imagens
- [x] GestÃ£o de ingressos
- [x] Filtros e busca
- [x] AÃ§Ãµes em lote
- [x] Interface responsiva
- [x] AnimaÃ§Ãµes

### ðŸš§ Em Desenvolvimento
- [ ] IntegraÃ§Ã£o com backend real
- [ ] Upload para storage
- [ ] GrÃ¡ficos interativos
- [ ] ExportaÃ§Ã£o de relatÃ³rios
- [ ] Sistema de notificaÃ§Ãµes

### ðŸ“‹ Planejado
- [ ] GestÃ£o de participantes
- [ ] Check-in QR Code
- [ ] IntegraÃ§Ã£o de pagamentos
- [ ] Chat com participantes
- [ ] Certificados automÃ¡ticos

---

## ðŸ› Troubleshooting

### Problema: Imagens nÃ£o carregam
**SoluÃ§Ã£o:** Verificar se o storage estÃ¡ configurado corretamente no Supabase.

### Problema: FormulÃ¡rio nÃ£o salva
**SoluÃ§Ã£o:** Verificar se todos os campos obrigatÃ³rios estÃ£o preenchidos.

### Problema: Analytics nÃ£o aparecem
**SoluÃ§Ã£o:** Verificar se o evento tem dados suficientes (views, participantes, etc).

---

## ðŸ“š Recursos Adicionais

- [DocumentaÃ§Ã£o do Supabase](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion)
- [React Hook Form](https://react-hook-form.com)

---

## ðŸ‘¥ Contribuindo

Para adicionar novas funcionalidades ao dashboard:

1. Criar componente na pasta `components/`
2. Adicionar tipos em `types/index.ts`
3. Criar hook se necessÃ¡rio em `hooks/`
4. Atualizar documentaÃ§Ã£o
5. Testar responsividade
6. Adicionar animaÃ§Ãµes

---

**Ãšltima atualizaÃ§Ã£o:** 2024
**VersÃ£o:** 1.0.0
**Status:** âœ… Pronto para uso (com mock data)
