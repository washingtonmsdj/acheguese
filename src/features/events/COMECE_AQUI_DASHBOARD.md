# ðŸš€ Comece Aqui - Dashboard do Organizador

Guia rÃ¡pido para comeÃ§ar a usar o Dashboard do Organizador em **5 minutos**.

---

## âš¡ Setup RÃ¡pido (3 Passos)

### 1ï¸âƒ£ Adicionar Rotas (1 minuto)

Abra seu arquivo de rotas (`App.tsx` ou `routes.tsx`) e adicione:

```tsx
import EventsOrganizerDashboard from '@/features/events-v2/pages/EventsOrganizerDashboard';
import EventsOrganizerForm from '@/features/events-v2/pages/EventsOrganizerForm';

// Dentro do seu <Routes>
<Route path="/eventos/organizer" element={<EventsOrganizerDashboard />} />
<Route path="/eventos/organizer/new" element={<EventsOrganizerForm />} />
<Route path="/eventos/organizer/edit/:eventId" element={<EventsOrganizerForm />} />
```

### 2ï¸âƒ£ Adicionar Link no Menu (1 minuto)

Adicione um link para o dashboard no seu menu principal:

```tsx
<Link to="/eventos/organizer">
  Dashboard do Organizador
</Link>
```

### 3ï¸âƒ£ Testar (1 minuto)

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:5173/eventos/organizer`
3. Pronto! ðŸŽ‰

---

## ðŸŽ¯ O Que VocÃª VerÃ¡

### Dashboard Principal
- ðŸ“Š 4 cards de estatÃ­sticas
- ðŸ” Busca e filtros
- ðŸ“‹ Lista de eventos
- âž• BotÃ£o "Criar Evento"

### FormulÃ¡rio de CriaÃ§Ã£o
- ðŸ“ 5 steps intuitivos
- ðŸ’¾ Salvar rascunho
- ðŸ‘ï¸ Preview
- ðŸš€ Publicar

---

## ðŸ§ª Testando com Mock Data

O sistema jÃ¡ vem com dados de exemplo! VocÃª pode:

1. **Ver eventos mockados** no dashboard
2. **Criar novos eventos** (salvos localmente)
3. **Editar eventos** existentes
4. **Ver analytics** de cada evento

---

## ðŸ”Œ PrÃ³ximo Passo: Backend

Quando estiver pronto para dados reais, siga o guia:

ðŸ“– **`INTEGRACAO_BACKEND.md`**

LÃ¡ vocÃª encontrarÃ¡:
- Schema completo do banco
- Hooks prontos para usar
- ConfiguraÃ§Ã£o do Supabase
- Exemplos de cÃ³digo

---

## ðŸ“š DocumentaÃ§Ã£o Completa

### Para Desenvolvedores
1. **`README_DASHBOARD.md`** - VisÃ£o geral e quick start
2. **`DASHBOARD_ORGANIZADOR.md`** - Guia detalhado de componentes
3. **`ROTAS_ORGANIZADOR.md`** - Sistema de rotas
4. **`INTEGRACAO_BACKEND.md`** - IntegraÃ§Ã£o com Supabase

### Para Product Owners
- **`DASHBOARD_COMPLETO.md`** - Status, roadmap e checklist

---

## ðŸŽ¨ Personalizando

### Mudar Cores

Os componentes usam o tema do Tailwind. Para personalizar:

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
        // ...
      }
    }
  }
}
```

### Adicionar Campos no FormulÃ¡rio

Edite `EventsOrganizerForm.tsx` e adicione seus campos:

```tsx
// No formData
const [formData, setFormData] = useState({
  // ... campos existentes
  meuNovoCampo: '',
});

// No renderStepContent()
<Input
  value={formData.meuNovoCampo}
  onChange={(e) => handleInputChange('meuNovoCampo', e.target.value)}
/>
```

---

## ðŸ§© Usando Componentes Isolados

### Analytics Card

```tsx
import { EventAnalyticsCard } from '@/features/events-v2/components/EventAnalyticsCard';

function MyPage() {
  return <EventAnalyticsCard event={myEvent} />;
}
```

### Image Uploader

```tsx
import { EventImageUploader } from '@/features/events-v2/components/EventImageUploader';

function MyForm() {
  const [image, setImage] = useState('');
  
  return (
    <EventImageUploader
      value={image}
      onChange={setImage}
      aspectRatio="video"
      maxSizeMB={5}
    />
  );
}
```

### Ticket Manager

```tsx
import { EventTicketManager } from '@/features/events-v2/components/EventTicketManager';

function MyForm() {
  const [tickets, setTickets] = useState([]);
  
  return (
    <EventTicketManager
      tickets={tickets}
      onChange={setTickets}
    />
  );
}
```

---

## ðŸ” Protegendo Rotas

Para proteger as rotas do organizador:

```tsx
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  return children;
}

// Usar nas rotas
<Route 
  path="/eventos/organizer" 
  element={
    <ProtectedRoute>
      <EventsOrganizerDashboard />
    </ProtectedRoute>
  } 
/>
```

---

## ðŸ› Problemas Comuns

### "Module not found"
**SoluÃ§Ã£o:** Verificar se os caminhos de import estÃ£o corretos

### "Cannot read property of undefined"
**SoluÃ§Ã£o:** Verificar se os dados mockados estÃ£o sendo carregados

### Estilos nÃ£o aparecem
**SoluÃ§Ã£o:** Verificar se Tailwind CSS estÃ¡ configurado

### AnimaÃ§Ãµes nÃ£o funcionam
**SoluÃ§Ã£o:** Instalar Framer Motion: `npm install framer-motion`

---

## ðŸ“Š Estrutura de Dados

### Evento (EventV2)

```typescript
interface EventV2 {
  id: string;
  title: string;
  short_description: string;
  description: string;
  category: EventCategory;
  start_date: string;
  end_date?: string;
  location: {
    type: 'physical' | 'online' | 'hybrid';
    venue_name?: string;
    address?: string;
    city?: string;
    state?: string;
    online_url?: string;
  };
  is_free: boolean;
  capacity: number;
  cover_image_url: string;
  status: EventStatus;
  views_count: number;
  participants_count: number;
  tickets: Ticket[];
  // ...
}
```

### Ingresso (Ticket)

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

## ðŸŽ¯ Fluxo de Uso

### Para Organizador

1. **Acessar Dashboard**
   - Ver estatÃ­sticas gerais
   - Listar eventos criados

2. **Criar Novo Evento**
   - Clicar em "Criar Evento"
   - Preencher 5 steps
   - Salvar ou publicar

3. **Gerenciar Evento**
   - Editar informaÃ§Ãµes
   - Adicionar ingressos
   - Ver analytics
   - Exportar dados

4. **Acompanhar Resultados**
   - Ver visualizaÃ§Ãµes
   - Acompanhar vendas
   - Analisar trÃ¡fego

---

## ðŸš€ Deploy

### Desenvolvimento
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

---

## ðŸ“ž Precisa de Ajuda?

### DocumentaÃ§Ã£o
1. `README_DASHBOARD.md` - VisÃ£o geral
2. `DASHBOARD_ORGANIZADOR.md` - Componentes
3. `ROTAS_ORGANIZADOR.md` - Rotas
4. `INTEGRACAO_BACKEND.md` - Backend

### Exemplos
Todos os componentes tÃªm exemplos de uso na documentaÃ§Ã£o!

### Suporte
Abra uma issue no GitHub ou consulte a documentaÃ§Ã£o.

---

## âœ… Checklist RÃ¡pido

- [ ] Rotas adicionadas
- [ ] Link no menu criado
- [ ] Dashboard acessÃ­vel
- [ ] FormulÃ¡rio funcionando
- [ ] Componentes testados
- [ ] Mock data carregando
- [ ] Pronto para backend!

---

## ðŸŽ‰ Pronto!

VocÃª agora tem um **Dashboard do Organizador completo e funcional**!

### PrÃ³ximos Passos:
1. âœ… Testar todas as funcionalidades
2. âœ… Personalizar conforme necessÃ¡rio
3. âœ… Integrar com backend (quando pronto)
4. âœ… Deploy em produÃ§Ã£o

---

**Tempo total:** ~5 minutos
**Dificuldade:** FÃ¡cil
**Status:** âœ… Pronto para uso

**Boa sorte!** ðŸš€
