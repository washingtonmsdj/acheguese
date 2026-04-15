# 🔔 Módulo de Notificações (SSOT)

## 📋 Contrato Arquitetural

Este módulo é a **única fonte de verdade** para notificações no sistema.

### ✅ Permitido

- Usar `useUnifiedNotifications` para consumir notificações
- Usar `notificationService` para criar notificações
- Usar helpers para notificações específicas
- Importar tipos de `@/modules/notifications`

### ❌ PROIBIDO

- Acessar `supabase.from('notifications')` diretamente
- Criar hooks alternativos de notificações
- Criar services alternativos de notificações
- Duplicar lógica de notificações
- Criar channels Realtime fora do hook oficial

---

## 🚀 Como Usar

### 1. Consumir Notificações (Frontend)

```typescript
import { useUnifiedNotifications } from '@/modules/notifications';

function MeuComponente() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: true,
  });

  return (
    <div>
      <p>Não lidas: {unreadCount}</p>
      {notifications.map(n => (
        <div key={n.id} onClick={() => markAsRead(n.id)}>
          <h4>{n.title}</h4>
          <p>{n.message}</p>
        </div>
      ))}
    </div>
  );
}
```

### 2. Criar Notificações (Backend/Actions)

#### Via Helpers (Recomendado)

```typescript
import {
  notifyRideRequest,
  notifyPostLike,
  notifyBadgeEarned,
} from "@/modules/notifications";

// Notificar motorista sobre nova corrida
await notifyRideRequest({
  driverId: "uuid",
  rideId: "uuid",
  origin: "Rua A, 123",
  destination: "Rua B, 456",
  price: 25.0,
  passengerName: "João Silva",
});

// Notificar autor sobre curtida
await notifyPostLike({
  authorId: "uuid",
  postId: "uuid",
  likerName: "Maria Santos",
  postTitle: "Meu post incrível",
});

// Notificar conquista de badge
await notifyBadgeEarned({
  userId: "uuid",
  badgeName: "Motorista 5 Estrelas",
  badgeIcon: "⭐",
  description: "Você alcançou 100 corridas com nota 5!",
});
```

#### Via Service Direto

```typescript
import {
  notificationService,
  NotificationType,
  NotificationPriority,
} from "@/modules/notifications";

await notificationService.createNotification({
  user_id: "uuid",
  type: NotificationType.SYSTEM_ALERT,
  title: "Manutenção programada",
  message: "O sistema ficará indisponível das 2h às 4h",
  priority: NotificationPriority.HIGH,
  metadata: {
    scheduled_at: "2024-03-17T02:00:00Z",
    duration_hours: 2,
  },
});
```

### 3. Filtrar Notificações

```typescript
const { notifications } = useUnifiedNotifications({
  filters: {
    type: "ride_request", // Apenas pedidos de corrida
    read: false, // Apenas não lidas
    priority: ["high", "urgent"], // Alta prioridade
    limit: 20, // Limitar resultados
  },
});
```

### 4. Helpers Disponíveis

```typescript
// Mobilidade
notifyRideRequest();
notifyRideAccepted();
notifyRideCompleted();
notifyNewRating();

// Comunidade
notifyPostLike();
notifyPostComment();
notifyMention();

// Agendamentos
notifyNewAppointment();
notifyAppointmentReminder();

// Gamificação
notifyBadgeEarned();
notifyLevelUp();

// Sistema
notifySystemAlert();
```

---

## 📁 Estrutura do Módulo

```
src/modules/notifications/
├── index.ts                    # Exports públicos (ÚNICO ponto de entrada)
├── README.md                   # Este arquivo
│
├── hooks/
│   └── useUnifiedNotifications.ts  # Hook oficial (ÚNICO permitido)
│
├── services/
│   └── notification.service.ts     # Service oficial (ÚNICO permitido)
│
├── types/
│   └── notification.types.ts       # Tipos centralizados
│
├── helpers/
│   └── notification.helpers.ts     # Helpers para criar notificações
│
└── components/
    └── notifications/
        └── UnifiedNotificationBellV2.tsx  # Componente de sino
```

---

## 🎯 Tipos de Notificação

### Mobilidade

- `ride_request` - Novo pedido de corrida
- `ride_accepted` - Corrida aceita
- `ride_started` - Corrida iniciada
- `ride_completed` - Corrida concluída
- `ride_cancelled` - Corrida cancelada
- `payment_received` - Pagamento recebido
- `new_rating` - Nova avaliação

### Comunidade

- `post_like` - Curtida em post
- `post_comment` - Comentário em post
- `comment_reply` - Resposta a comentário
- `mention` - Menção em post/comentário
- `follow` - Novo seguidor

### Agendamentos

- `appointment_new` - Novo agendamento
- `appointment_confirmed` - Agendamento confirmado
- `appointment_cancelled` - Agendamento cancelado
- `appointment_reminder` - Lembrete de agendamento
- `appointment_completed` - Agendamento concluído

### Gamificação

- `badge_earned` - Badge conquistado
- `level_up` - Subiu de nível
- `achievement_unlocked` - Conquista desbloqueada

### Sistema

- `system_alert` - Alerta do sistema
- `system_update` - Atualização do sistema
- `system_maintenance` - Manutenção programada

### Marketing

- `promotion` - Promoção disponível
- `coupon` - Cupom disponível
- `event` - Evento próximo

### Alertas

- `alert_nearby` - Alerta próximo
- `alert_confirmation` - Confirmação de alerta
- `alert_update` - Atualização de alerta

---

## 🔒 Segurança (RLS)

O sistema possui Row Level Security (RLS) ativo:

- Usuários veem apenas suas próprias notificações
- Usuários podem marcar suas notificações como lidas
- Usuários podem deletar suas notificações
- Sistema pode criar notificações para qualquer usuário

---

## 📊 API do Hook

### Dados

```typescript
notifications: Notification[]  // Lista de notificações
stats: NotificationStats       // Estatísticas
unreadCount: number            // Contador de não lidas
```

### Estado

```typescript
loading: boolean; // Carregando
error: string | null; // Erro
```

### Ações

```typescript
markAsRead(id: string): Promise<boolean>
markAllAsRead(): Promise<number>
deleteNotification(id: string): Promise<boolean>
refresh(): void
```

### Helpers

```typescript
getUnreadNotifications(): Notification[]
getNotificationsByType(type: string): Notification[]
getHighPriorityNotifications(): Notification[]
```

---

## 🔄 Realtime

O sistema usa **1 único channel Realtime** por usuário:

```typescript
supabase.channel(`notifications:${user.id}`).on("postgres_changes", {
  event: "INSERT",
  schema: "public",
  table: "notifications",
  filter: `user_id=eq.${user.id}`,
});
```

**Importante:** Não crie channels adicionais. Use o hook oficial.

---

## 🚫 Exemplos de Uso INCORRETO

### ❌ Acesso Direto ao Banco

```typescript
// ERRADO - Nunca faça isso!
const { data } = await supabase
  .from("notifications")
  .select("*")
  .eq("user_id", userId);
```

### ❌ Hook Alternativo

```typescript
// ERRADO - Não crie hooks alternativos!
function useMyNotifications() {
  const [notifications, setNotifications] = useState([]);
  // ...
}
```

### ❌ Service Alternativo

```typescript
// ERRADO - Não crie services alternativos!
class MyNotificationService {
  async create() {
    /* ... */
  }
}
```

---

## ✅ Exemplos de Uso CORRETO

### ✅ Usar Hook Oficial

```typescript
import { useUnifiedNotifications } from "@/modules/notifications";

const { notifications, markAsRead } = useUnifiedNotifications();
```

### ✅ Usar Service Oficial

```typescript
import { notificationService } from "@/modules/notifications";

await notificationService.createNotification({
  /* ... */
});
```

### ✅ Usar Helpers

```typescript
import { notifyRideRequest } from "@/modules/notifications";

await notifyRideRequest({
  /* ... */
});
```

---

## 🛠️ Adicionar Novo Tipo de Notificação

1. **Adicionar enum em `types/notification.types.ts`:**

```typescript
export const NotificationType = {
  // ... existentes
  MY_NEW_TYPE: "my_new_type",
} as const;
```

2. **Adicionar metadata type (se necessário):**

```typescript
export interface MyNewTypeMetadata {
  custom_field: string;
  another_field: number;
}
```

3. **Criar helper em `helpers/notification.helpers.ts`:**

```typescript
export async function notifyMyNewType(params: {
  userId: string;
  customField: string;
}) {
  return notificationService.createNotification({
    user_id: params.userId,
    type: NotificationType.MY_NEW_TYPE,
    title: "Título",
    message: "Mensagem",
    metadata: { custom_field: params.customField },
  });
}
```

4. **Exportar helper em `index.ts`:**

```typescript
export { notifyMyNewType } from "./helpers/notification.helpers";
```

---

## 📝 Checklist de Code Review

Ao revisar código relacionado a notificações, verificar:

- [ ] Usa `useUnifiedNotifications` (não cria hook alternativo)
- [ ] Usa `notificationService` ou helpers (não acessa banco direto)
- [ ] Importa de `@/modules/notifications`
- [ ] Não cria channels Realtime adicionais
- [ ] Não duplica lógica de notificações
- [ ] Segue tipos centralizados
- [ ] Não acessa `supabase.from('notifications')`

---

## 🎓 Princípios Arquiteturais

1. **Single Source of Truth (SSOT)**
   - Um único módulo para notificações
   - Um único hook para consumir
   - Um único service para criar

2. **Separation of Concerns**
   - Hooks: lógica de estado e Realtime
   - Service: lógica de negócio e API
   - Helpers: conveniência e abstração
   - Types: contratos e interfaces

3. **Encapsulation**
   - Acesso ao banco apenas via service
   - Lógica complexa escondida
   - API simples e clara

4. **Consistency**
   - Mesma API em todo o app
   - Mesmo comportamento
   - Mesmos tipos

---

## 📚 Referências

- **Migration:** `supabase/migrations/20240316000000_create_unified_notifications.sql`
- **Consolidação:** `CONSOLIDACAO_NOTIFICACOES_SSOT.md`
- **Guia Rápido:** `GUIA_RAPIDO_NOTIFICACOES_SSOT.md`

---

**Sistema blindado e pronto para evolução controlada!**
