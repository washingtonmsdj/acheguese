# 🚀 Comece Aqui - Dashboard do Organizador

Guia rápido para começar a usar o Dashboard do Organizador em **5 minutos**.

---

## ⚡ Setup Rápido (3 Passos)

### 1️⃣ Adicionar Rotas (1 minuto)

Abra seu arquivo de rotas (`App.tsx` ou `routes.tsx`) e adicione:

```tsx
import EventsOrganizerDashboard from '@/features/events-v2/pages/EventsOrganizerDashboard';
import EventsOrganizerForm from '@/features/events-v2/pages/EventsOrganizerForm';

// Dentro do seu <Routes>
<Route path="/eventos/organizer" element={<EventsOrganizerDashboard />} />
<Route path="/eventos/organizer/new" element={<EventsOrganizerForm />} />
<Route path="/eventos/organizer/edit/:eventId" element={<EventsOrganizerForm />} />
```

### 2️⃣ Adicionar Link no Menu (1 minuto)

Adicione um link para o dashboard no seu menu principal:

```tsx
<Link to="/eventos/organizer">
  Dashboard do Organizador
</Link>
```

### 3️⃣ Testar (1 minuto)

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:5173/eventos/organizer`
3. Pronto! 🎉

---

## 🎯 O Que Você Verá

### Dashboard Principal
- 📊 4 cards de estatísticas
- 🔍 Busca e filtros
- 📋 Lista de eventos
- ➕ Botão "Criar Evento"

### Formulário de Criação
- 📝 5 steps intuitivos
- 💾 Salvar rascunho
- 👁️ Preview
- 🚀 Publicar

---

## 🧪 Testando com Mock Data

O sistema já vem com dados de exemplo! Você pode:

1. **Ver eventos mockados** no dashboard
2. **Criar novos eventos** (salvos localmente)
3. **Editar eventos** existentes
4. **Ver analytics** de cada evento

---

## 🔌 Próximo Passo: Backend

Quando estiver pronto para dados reais, siga o guia:

📖 **`INTEGRACAO_BACKEND.md`**

Lá você encontrará:
- Schema completo do banco
- Hooks prontos para usar
- Configuração do Supabase
- Exemplos de código

---

## 📚 Documentação Completa

### Para Desenvolvedores
1. **`README_DASHBOARD.md`** - Visão geral e quick start
2. **`DASHBOARD_ORGANIZADOR.md`** - Guia detalhado de componentes
3. **`ROTAS_ORGANIZADOR.md`** - Sistema de rotas
4. **`INTEGRACAO_BACKEND.md`** - Integração com Supabase

### Para Product Owners
- **`DASHBOARD_COMPLETO.md`** - Status, roadmap e checklist

---

## 🎨 Personalizando

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

### Adicionar Campos no Formulário

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

## 🧩 Usando Componentes Isolados

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

## 🔐 Protegendo Rotas

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

## 🐛 Problemas Comuns

### "Module not found"
**Solução:** Verificar se os caminhos de import estão corretos

### "Cannot read property of undefined"
**Solução:** Verificar se os dados mockados estão sendo carregados

### Estilos não aparecem
**Solução:** Verificar se Tailwind CSS está configurado

### Animações não funcionam
**Solução:** Instalar Framer Motion: `npm install framer-motion`

---

## 📊 Estrutura de Dados

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

## 🎯 Fluxo de Uso

### Para Organizador

1. **Acessar Dashboard**
   - Ver estatísticas gerais
   - Listar eventos criados

2. **Criar Novo Evento**
   - Clicar em "Criar Evento"
   - Preencher 5 steps
   - Salvar ou publicar

3. **Gerenciar Evento**
   - Editar informações
   - Adicionar ingressos
   - Ver analytics
   - Exportar dados

4. **Acompanhar Resultados**
   - Ver visualizações
   - Acompanhar vendas
   - Analisar tráfego

---

## 🚀 Deploy

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

## 📞 Precisa de Ajuda?

### Documentação
1. `README_DASHBOARD.md` - Visão geral
2. `DASHBOARD_ORGANIZADOR.md` - Componentes
3. `ROTAS_ORGANIZADOR.md` - Rotas
4. `INTEGRACAO_BACKEND.md` - Backend

### Exemplos
Todos os componentes têm exemplos de uso na documentação!

### Suporte
Abra uma issue no GitHub ou consulte a documentação.

---

## ✅ Checklist Rápido

- [ ] Rotas adicionadas
- [ ] Link no menu criado
- [ ] Dashboard acessível
- [ ] Formulário funcionando
- [ ] Componentes testados
- [ ] Mock data carregando
- [ ] Pronto para backend!

---

## 🎉 Pronto!

Você agora tem um **Dashboard do Organizador completo e funcional**!

### Próximos Passos:
1. ✅ Testar todas as funcionalidades
2. ✅ Personalizar conforme necessário
3. ✅ Integrar com backend (quando pronto)
4. ✅ Deploy em produção

---

**Tempo total:** ~5 minutos
**Dificuldade:** Fácil
**Status:** ✅ Pronto para uso

**Boa sorte!** 🚀
