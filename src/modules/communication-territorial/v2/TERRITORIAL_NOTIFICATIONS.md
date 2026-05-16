# Notificações Territoriais

## 🔔 Conceito

Sistema de notificações contextual e territorial que vai além de curtidas e comentários.

**Objetivo**: Manter usuários informados sobre conteúdo relevante, alertas importantes e atividades territoriais.

---

## 📱 Tipos de Notificações

### 1. **Notificações Editoriais**

#### Nova Publicação no Território
```
📰 Portal Nordeste publicou: "Feira de Saúde no Vale das Pedrinhas"
🕐 Há 5 minutos • Nordeste de Amaralina
```

**Quando**: Canal publica conteúdo em território que o usuário segue  
**Prioridade**: Média  
**Ação**: Abrir publicação

#### Alerta Comunitário
```
🚨 ALERTA: Falta de água no Nordeste de Amaralina
🕐 Há 2 minutos • Portal Nordeste
```

**Quando**: Canal publica alerta urgente  
**Prioridade**: Alta  
**Ação**: Abrir alerta  
**Push**: Sim (se habilitado)

#### Evento Próximo
```
📅 Evento amanhã: "Mutirão de Limpeza - Santa Cruz"
🕐 Amanhã às 8h • Portal Nordeste
```

**Quando**: Evento agendado está próximo (24h antes)  
**Prioridade**: Média  
**Ação**: Abrir evento

#### Cobertura ao Vivo
```
🔴 AO VIVO: Assembleia Comunitária no Nordeste
🕐 Agora • Portal Nordeste
```

**Quando**: Canal inicia cobertura ao vivo  
**Prioridade**: Alta  
**Ação**: Abrir live  
**Push**: Sim (se habilitado)

---

### 2. **Notificações Territoriais**

#### Conteúdo em Alta no Território
```
🔥 Em alta no seu bairro: "Nova linha de ônibus aprovada"
🕐 Há 1 hora • 847 visualizações
```

**Quando**: Conteúdo atinge threshold de engajamento no território  
**Prioridade**: Média  
**Ação**: Abrir publicação

#### Tendência Regional
```
📈 Tendência em Salvador: #MobilizaçãoNordeste
🕐 Últimas 24h • 12 publicações
```

**Quando**: Hashtag ou tema ganha tração regional  
**Prioridade**: Baixa  
**Ação**: Ver trending

#### Comunidade Alcançada
```
🎯 Sua comunidade foi mencionada em 3 publicações
🕐 Hoje • Nordeste de Amaralina
```

**Quando**: Território do usuário é mencionado  
**Prioridade**: Baixa  
**Ação**: Ver menções

---

### 3. **Notificações Operacionais** (Gestores)

#### Comentário para Moderar
```
💬 Novo comentário aguardando moderação
🕐 Há 10 minutos • Portal Nordeste
```

**Quando**: Comentário precisa de aprovação  
**Prioridade**: Média  
**Ação**: Moderar comentário

#### Denúncia Recebida
```
⚠️ Nova denúncia recebida
🕐 Há 5 minutos • Publicação #1234
```

**Quando**: Usuário denuncia conteúdo  
**Prioridade**: Alta  
**Ação**: Revisar denúncia

#### Território Aprovado
```
✅ Território aprovado: Vale das Pedrinhas
🕐 Há 30 minutos • Portal Nordeste
```

**Quando**: Admin aprova novo território  
**Prioridade**: Média  
**Ação**: Ver territórios

#### Meta de Alcance Atingida
```
🎉 Meta atingida: 10k seguidores!
🕐 Há 1 hora • Portal Nordeste
```

**Quando**: Canal atinge milestone  
**Prioridade**: Baixa  
**Ação**: Ver analytics

#### Publicação Agendada
```
⏰ Publicação será publicada em 1 hora
🕐 Hoje às 18h • "Feira de Saúde..."
```

**Quando**: Publicação agendada está próxima  
**Prioridade**: Baixa  
**Ação**: Ver agendamento

#### Insight Disponível
```
💡 Novo insight: Melhor horário para publicar
🕐 Há 2 horas • Portal Nordeste
```

**Quando**: Sistema gera insight baseado em dados  
**Prioridade**: Baixa  
**Ação**: Ver insights

---

### 4. **Notificações Sociais**

#### Novo Seguidor
```
👤 João Silva começou a seguir Portal Nordeste
🕐 Há 15 minutos
```

**Quando**: Usuário segue o canal  
**Prioridade**: Baixa  
**Ação**: Ver perfil

#### Comentário em Publicação
```
💬 Maria comentou: "Ótima iniciativa!"
🕐 Há 5 minutos • "Feira de Saúde..."
```

**Quando**: Usuário comenta em publicação  
**Prioridade**: Baixa  
**Ação**: Ver comentário

#### Reação em Publicação
```
❤️ 10 pessoas reagiram à sua publicação
🕐 Há 1 hora • "Feira de Saúde..."
```

**Quando**: Publicação recebe reações  
**Prioridade**: Baixa  
**Ação**: Ver publicação

#### Compartilhamento
```
🔄 Pedro compartilhou sua publicação
🕐 Há 30 minutos • "Feira de Saúde..."
```

**Quando**: Usuário compartilha publicação  
**Prioridade**: Baixa  
**Ação**: Ver publicação

---

## 🎯 Prioridades

### Alta (Push + Badge + Som)
- 🚨 Alertas comunitários urgentes
- 🔴 Cobertura ao vivo
- ⚠️ Denúncias recebidas
- 🚑 Emergências territoriais

### Média (Badge + Som)
- 📰 Nova publicação no território
- 📅 Evento próximo
- 💬 Comentário para moderar
- ✅ Território aprovado

### Baixa (Badge apenas)
- 🔥 Conteúdo em alta
- 📈 Tendência regional
- 💡 Insights disponíveis
- 👤 Novo seguidor

---

## 📊 Agrupamento

### Por Tempo
```
📰 3 novas publicações no Nordeste de Amaralina
🕐 Últimas 2 horas
```

### Por Tipo
```
💬 5 comentários aguardando moderação
🕐 Hoje
```

### Por Território
```
🎯 Nordeste de Amaralina: 8 atualizações
🕐 Últimas 24 horas
```

---

## 🔕 Preferências do Usuário

### Categorias
- ✅ Alertas comunitários
- ✅ Novas publicações
- ✅ Eventos próximos
- ✅ Cobertura ao vivo
- ⬜ Conteúdo em alta
- ⬜ Tendências regionais
- ⬜ Novos seguidores
- ⬜ Comentários e reações

### Territórios
- ✅ Nordeste de Amaralina (principal)
- ✅ Santa Cruz
- ⬜ Vale das Pedrinhas
- ⬜ Chapada do Rio Vermelho

### Canais
- ✅ Portal Nordeste
- ✅ Rádio Comunitária
- ⬜ Jornal do Bairro

### Horários
- **Não perturbe**: 22h - 7h
- **Push apenas urgentes**: 22h - 7h
- **Todos os tipos**: 7h - 22h

---

## 🏗️ Arquitetura Técnica

### Tabela: `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL, -- 'editorial', 'territorial', 'operational', 'social'
  category TEXT NOT NULL, -- 'new_publication', 'alert', 'event', etc
  priority TEXT NOT NULL, -- 'high', 'medium', 'low'
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  metadata JSONB,
  
  -- Territorial context
  location_id UUID REFERENCES locations(id),
  channel_id UUID REFERENCES communication_channels(id),
  
  -- Status
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Delivery
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread 
  ON notifications(user_id, read_at) 
  WHERE read_at IS NULL;

CREATE INDEX idx_notifications_location 
  ON notifications(location_id, created_at);

CREATE INDEX idx_notifications_channel 
  ON notifications(channel_id, created_at);
```

### Tabela: `notification_preferences`
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Categories
  enable_editorial BOOLEAN DEFAULT true,
  enable_territorial BOOLEAN DEFAULT true,
  enable_operational BOOLEAN DEFAULT true,
  enable_social BOOLEAN DEFAULT true,
  
  -- Specific types
  enable_alerts BOOLEAN DEFAULT true,
  enable_events BOOLEAN DEFAULT true,
  enable_live BOOLEAN DEFAULT true,
  enable_trending BOOLEAN DEFAULT false,
  enable_followers BOOLEAN DEFAULT false,
  
  -- Delivery
  enable_push BOOLEAN DEFAULT true,
  enable_email BOOLEAN DEFAULT false,
  enable_sms BOOLEAN DEFAULT false,
  
  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT,
  
  -- Territories (JSONB array of location_ids)
  followed_territories JSONB DEFAULT '[]',
  
  -- Channels (JSONB array of channel_ids)
  followed_channels JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

### Service: `NotificationService`
```typescript
class NotificationService {
  // Criar notificação
  async create(params: {
    userId: string;
    type: NotificationType;
    category: NotificationCategory;
    priority: NotificationPriority;
    title: string;
    body?: string;
    actionUrl?: string;
    metadata?: any;
    locationId?: string;
    channelId?: string;
  }): Promise<Notification>

  // Listar notificações do usuário
  async list(params: {
    userId: string;
    unreadOnly?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]>

  // Marcar como lida
  async markAsRead(notificationId: string): Promise<void>

  // Marcar todas como lidas
  async markAllAsRead(userId: string): Promise<void>

  // Contar não lidas
  async countUnread(userId: string): Promise<number>

  // Enviar push notification
  async sendPush(notificationId: string): Promise<void>

  // Verificar preferências do usuário
  async shouldNotify(params: {
    userId: string;
    type: NotificationType;
    category: NotificationCategory;
    locationId?: string;
    channelId?: string;
  }): Promise<boolean>
}
```

---

## 🔄 Fluxo de Notificação

### 1. Evento Ocorre
```typescript
// Exemplo: Canal publica alerta
await CommunicationService.publishPublication(publicationId);
```

### 2. Trigger de Notificação
```typescript
// Webhook ou trigger do banco
await NotificationService.onPublicationPublished({
  publicationId,
  channelId,
  locationId,
  type: 'alert',
});
```

### 3. Identificar Destinatários
```typescript
// Buscar usuários que seguem o território ou canal
const recipients = await NotificationService.findRecipients({
  locationId,
  channelId,
  type: 'editorial',
  category: 'alert',
});
```

### 4. Verificar Preferências
```typescript
// Para cada destinatário, verificar se deve notificar
for (const user of recipients) {
  const shouldNotify = await NotificationService.shouldNotify({
    userId: user.id,
    type: 'editorial',
    category: 'alert',
    locationId,
    channelId,
  });
  
  if (shouldNotify) {
    // Criar notificação
  }
}
```

### 5. Criar Notificação
```typescript
const notification = await NotificationService.create({
  userId: user.id,
  type: 'editorial',
  category: 'alert',
  priority: 'high',
  title: 'ALERTA: Falta de água no Nordeste',
  body: publication.title,
  actionUrl: `/comunicacao/agente/${channel.slug}/publicacao/${publication.id}`,
  locationId,
  channelId,
});
```

### 6. Enviar Push (se aplicável)
```typescript
if (notification.priority === 'high' && user.preferences.enable_push) {
  await NotificationService.sendPush(notification.id);
}
```

### 7. Usuário Recebe
```typescript
// Frontend: React Query + WebSocket
const { data: notifications } = useQuery({
  queryKey: ['notifications', 'unread'],
  queryFn: () => NotificationService.list({ unreadOnly: true }),
  refetchInterval: 30000, // Poll a cada 30s
});

// WebSocket para real-time
socket.on('notification:new', (notification) => {
  queryClient.setQueryData(['notifications', 'unread'], (old) => [
    notification,
    ...old,
  ]);
  
  // Mostrar toast
  toast.info(notification.title);
});
```

---

## 🎨 UI/UX

### Badge de Notificações
```tsx
<Button variant="ghost" size="icon" className="relative">
  <Bell className="h-5 w-5" />
  {unreadCount > 0 && (
    <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</Button>
```

### Dropdown de Notificações
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Bell />
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-96">
    <div className="p-4 border-b">
      <h3 className="font-semibold">Notificações</h3>
      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
        Marcar todas como lidas
      </Button>
    </div>
    <div className="max-h-96 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  </DropdownMenuContent>
</DropdownMenu>
```

### Item de Notificação
```tsx
<div 
  className={cn(
    "p-4 border-b hover:bg-accent cursor-pointer",
    !notification.read_at && "bg-primary/5"
  )}
  onClick={() => handleClick(notification)}
>
  <div className="flex gap-3">
    <div className="flex-shrink-0">
      {getIcon(notification.category)}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm">{notification.title}</p>
      {notification.body && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(notification.created_at)}
      </p>
    </div>
    {!notification.read_at && (
      <div className="flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>
    )}
  </div>
</div>
```

---

## 📈 Métricas

### Para Usuários
- Total de notificações recebidas
- Taxa de abertura (clicked / received)
- Tempo médio para abrir
- Notificações por categoria
- Notificações por território

### Para Canais
- Alcance de notificações
- Taxa de engajamento via notificação
- Notificações que geraram ação
- Melhor horário para notificar

---

## 🚀 Implementação Futura

### Fase 1: Básico
- [x] Estrutura de dados
- [ ] Service de notificações
- [ ] UI de notificações
- [ ] Preferências básicas

### Fase 2: Push
- [ ] Integração com Firebase Cloud Messaging
- [ ] Push notifications web
- [ ] Push notifications mobile
- [ ] Quiet hours

### Fase 3: Inteligente
- [ ] ML para melhor horário
- [ ] Agrupamento inteligente
- [ ] Priorização dinâmica
- [ ] Insights de engajamento

### Fase 4: Avançado
- [ ] Email digest
- [ ] SMS para alertas críticos
- [ ] WhatsApp integration
- [ ] Telegram bot

---

**Versão**: 1.0.0  
**Última atualização**: 2024-01-XX  
**Status**: 📋 Especificação completa
