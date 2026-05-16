# 🔌 Integração com Backend - Dashboard do Organizador

Guia completo para integrar o dashboard com Supabase e APIs.

## 📋 Índice

1. [Schema do Banco de Dados](#schema-do-banco-de-dados)
2. [Hooks Personalizados](#hooks-personalizados)
3. [Mutations](#mutations)
4. [Upload de Arquivos](#upload-de-arquivos)
5. [Autenticação](#autenticação)
6. [Permissões](#permissões)

---

## 🗄️ Schema do Banco de Dados

### Tabela: `events`

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações Básicas
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Data e Local
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_type TEXT NOT NULL, -- 'physical', 'online', 'hybrid'
  venue_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  online_url TEXT,
  
  -- Ingressos
  is_free BOOLEAN DEFAULT true,
  capacity INTEGER DEFAULT 0,
  
  -- Mídia
  cover_image_url TEXT,
  
  -- Detalhes
  requirements TEXT[],
  what_to_bring TEXT[],
  age_restriction TEXT,
  
  -- Status e Métricas
  status TEXT DEFAULT 'rascunho', -- 'rascunho', 'publicado', 'cancelado', 'finalizado', 'em_andamento'
  views_count INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT valid_status CHECK (status IN ('rascunho', 'publicado', 'cancelado', 'finalizado', 'em_andamento')),
  CONSTRAINT valid_location_type CHECK (location_type IN ('physical', 'online', 'hybrid')),
  CONSTRAINT valid_category CHECK (category IN ('cultural', 'esportivo', 'social', 'religioso', 'educacional', 'gastronomico', 'artistico', 'comunitario'))
);

-- Indexes
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_slug ON events(slug);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Tabela: `event_tickets`

```sql
CREATE TABLE event_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  
  sale_start_date TIMESTAMPTZ,
  sale_end_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_quantity CHECK (quantity_sold <= quantity_available),
  CONSTRAINT valid_price CHECK (price >= 0)
);

CREATE INDEX idx_tickets_event ON event_tickets(event_id);
```

### Tabela: `event_gallery`

```sql
CREATE TABLE event_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_event ON event_gallery(event_id);
```

### Tabela: `event_participants`

```sql
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES event_tickets(id) ON DELETE SET NULL,
  
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'checked_in'
  checked_in_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, user_id),
  CONSTRAINT valid_participant_status CHECK (status IN ('confirmed', 'cancelled', 'checked_in'))
);

CREATE INDEX idx_participants_event ON event_participants(event_id);
CREATE INDEX idx_participants_user ON event_participants(user_id);
```

### Tabela: `event_analytics`

```sql
CREATE TABLE event_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  traffic_source JSONB, -- { "direct": 45, "social": 30, "search": 15, "referral": 10 }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, date)
);

CREATE INDEX idx_analytics_event ON event_analytics(event_id);
CREATE INDEX idx_analytics_date ON event_analytics(date);
```

---

## 🎣 Hooks Personalizados

### useOrganizerEvents

```typescript
// hooks/useOrganizerEvents.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EventV2 } from '../types';

export function useOrganizerEvents() {
  return useQuery({
    queryKey: ['organizer-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          tickets:event_tickets(*),
          gallery:event_gallery(*)
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as EventV2[];
    },
  });
}
```

### useEvent

```typescript
// hooks/useEvent.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EventV2 } from '../types';

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          tickets:event_tickets(*),
          gallery:event_gallery(*),
          organizer:auth.users(id, email, user_metadata)
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      return data as EventV2;
    },
    enabled: !!eventId,
  });
}
```

### useEventAnalytics

```typescript
// hooks/useEventAnalytics.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useEventAnalytics(eventId: string, days: number = 30) {
  return useQuery({
    queryKey: ['event-analytics', eventId, days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('event_analytics')
        .select('*')
        .eq('event_id', eventId)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;

      return data;
    },
    enabled: !!eventId,
  });
}
```

---

## 🔄 Mutations

### useCreateEvent

```typescript
// hooks/useCreateEvent.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';
import type { EventV2 } from '../types';

interface CreateEventInput {
  title: string;
  short_description: string;
  description: string;
  category: string;
  start_date: string;
  end_date?: string;
  location_type: string;
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  online_url?: string;
  is_free: boolean;
  capacity?: number;
  cover_image_url?: string;
  requirements?: string[];
  what_to_bring?: string[];
  age_restriction?: string;
  status?: string;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Não autenticado');

      const slug = generateSlug(input.title);

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...input,
          slug,
          organizer_id: user.id,
          published_at: input.status === 'publicado' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      return data as EventV2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    },
  });
}
```

### useUpdateEvent

```typescript
// hooks/useUpdateEvent.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { EventV2 } from '../types';

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<EventV2>) => {
      const { data, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      return data as EventV2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
}
```

### useDeleteEvent

```typescript
// hooks/useDeleteEvent.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    },
  });
}
```

### useCreateTicket

```typescript
// hooks/useCreateTicket.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CreateTicketInput {
  event_id: string;
  name: string;
  description?: string;
  price: number;
  quantity_available: number;
  sale_start_date?: string;
  sale_end_date?: string;
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      const { data, error } = await supabase
        .from('event_tickets')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['event', variables.event_id] 
      });
    },
  });
}
```

---

## 📤 Upload de Arquivos

### useUploadImage

```typescript
// hooks/useUploadImage.ts

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },
  });
}
```

### Uso no Componente

```typescript
import { useUploadImage } from '@/hooks/useUploadImage';

function EventForm() {
  const uploadImage = useUploadImage();

  const handleImageUpload = async (file: File) => {
    try {
      const url = await uploadImage.mutateAsync(file);
      setFormData({ ...formData, cover_image_url: url });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  return (
    <EventImageUploader
      value={formData.cover_image_url}
      onChange={handleImageUpload}
    />
  );
}
```

---

## 🔐 Autenticação

### useAuth Hook

```typescript
// hooks/useAuth.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obter usuário atual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading };
}
```

---

## 🔒 Permissões (RLS)

### Row Level Security Policies

```sql
-- Eventos: Organizador pode ver/editar seus próprios eventos
CREATE POLICY "Organizadores podem ver seus eventos"
  ON events FOR SELECT
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizadores podem criar eventos"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizadores podem atualizar seus eventos"
  ON events FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizadores podem deletar seus eventos"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id);

-- Eventos publicados são públicos
CREATE POLICY "Eventos publicados são públicos"
  ON events FOR SELECT
  USING (status = 'publicado');

-- Ingressos: Apenas organizador do evento pode gerenciar
CREATE POLICY "Organizadores podem gerenciar ingressos"
  ON event_tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_tickets.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Galeria: Apenas organizador do evento pode gerenciar
CREATE POLICY "Organizadores podem gerenciar galeria"
  ON event_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_gallery.event_id
      AND events.organizer_id = auth.uid()
    )
  );
```

---

## 📊 Exemplo Completo de Integração

### EventsOrganizerDashboard com Backend

```typescript
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents';
import { useDeleteEvent } from '@/hooks/useDeleteEvent';

export default function EventsOrganizerDashboard() {
  const { data: events, isLoading, error } = useOrganizerEvents();
  const deleteEvent = useDeleteEvent();

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Tem certeza?')) {
      try {
        await deleteEvent.mutateAsync(eventId);
        toast.success('Evento excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir evento');
      }
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <div>
      {events?.map(event => (
        <EventCard
          key={event.id}
          event={event}
          onDelete={() => handleDeleteEvent(event.id)}
        />
      ))}
    </div>
  );
}
```

### EventsOrganizerForm com Backend

```typescript
import { useCreateEvent } from '@/hooks/useCreateEvent';
import { useUpdateEvent } from '@/hooks/useUpdateEvent';
import { useEvent } from '@/hooks/useEvent';

export default function EventsOrganizerForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const { data: existingEvent } = useEvent(eventId!);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(eventId!);

  const handlePublish = async () => {
    try {
      if (eventId) {
        await updateEvent.mutateAsync({
          ...formData,
          status: 'publicado',
        });
        toast.success('Evento atualizado!');
      } else {
        const newEvent = await createEvent.mutateAsync({
          ...formData,
          status: 'publicado',
        });
        toast.success('Evento criado!');
        navigate(`/eventos/${newEvent.id}`);
      }
    } catch (error) {
      toast.error('Erro ao salvar evento');
    }
  };

  return (
    <form onSubmit={handlePublish}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 🚀 Próximos Passos

1. ✅ Implementar todos os hooks
2. ✅ Configurar RLS no Supabase
3. ✅ Criar bucket de storage para imagens
4. ✅ Testar permissões
5. ✅ Adicionar tratamento de erros
6. ✅ Implementar loading states
7. ✅ Adicionar validações

---

**Última atualização:** 2024
**Versão:** 1.0.0
