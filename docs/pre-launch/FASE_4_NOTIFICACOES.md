# 📧 FASE 4 — Notificações

> **Data**: 2026-04-18  
> **Status**: 🚧 EM PROGRESSO  
> **Tempo Estimado**: 4 horas

---

## 🎯 OBJETIVO

Implementar sistema completo de notificações para comunicação efetiva com usuários através de múltiplos canais: email, push notifications e in-app notifications.

---

## 📋 ESCOPO

### 1. Email Notifications (2h)
- [ ] Configurar serviço de email (Resend)
- [ ] Criar templates de email
- [ ] Implementar envio de emails
- [ ] Criar edge function para emails
- [ ] Testar envio

### 2. Push Notifications (1h)
- [ ] Configurar Firebase Cloud Messaging
- [ ] Implementar service worker
- [ ] Gerenciar permissões
- [ ] Enviar notificações push
- [ ] Testar em dispositivos

### 3. In-App Notifications (30min)
- [ ] Criar tabela de notificações
- [ ] Implementar centro de notificações
- [ ] Badge de contador
- [ ] Marcar como lida
- [ ] Filtros e busca

### 4. Preferências de Usuário (30min)
- [ ] Tabela de preferências
- [ ] Página de configurações
- [ ] Opt-in/opt-out por tipo
- [ ] Frequência de emails
- [ ] Quiet hours

---

## 📧 ETAPA 4.1 — EMAIL NOTIFICATIONS

### Templates Necessários

#### 1. Welcome Email
**Trigger**: Novo cadastro  
**Conteúdo**:
- Boas-vindas
- Próximos passos
- Links úteis

#### 2. Password Reset
**Trigger**: Solicitação de reset  
**Conteúdo**:
- Link de reset
- Validade (1 hora)
- Aviso de segurança

#### 3. MFA Setup
**Trigger**: MFA habilitado  
**Conteúdo**:
- Confirmação de ativação
- Códigos de backup
- Instruções

#### 4. New Device Login
**Trigger**: Login de novo dispositivo  
**Conteúdo**:
- Detalhes do dispositivo
- Localização
- Ação se não foi você

#### 5. Payment Confirmation
**Trigger**: Pagamento bem-sucedido  
**Conteúdo**:
- Detalhes do pagamento
- Fatura
- Próxima cobrança

#### 6. Subscription Expiring
**Trigger**: 7 dias antes de expirar  
**Conteúdo**:
- Data de expiração
- Como renovar
- O que acontece se expirar

#### 7. Security Alert
**Trigger**: Atividade suspeita  
**Conteúdo**:
- Tipo de alerta
- Ação recomendada
- Como proteger conta

---

## 🔔 ETAPA 4.2 — PUSH NOTIFICATIONS

### Tipos de Notificações

#### 1. Transacionais
- Novo pedido
- Pedido confirmado
- Pedido em rota
- Pedido entregue

#### 2. Sociais
- Nova mensagem
- Novo seguidor
- Comentário em post
- Menção

#### 3. Sistema
- Atualização disponível
- Manutenção programada
- Novo recurso

#### 4. Marketing
- Promoção especial
- Cupom disponível
- Evento próximo

---

## 📱 ETAPA 4.3 — IN-APP NOTIFICATIONS

### Funcionalidades

#### Centro de Notificações
- Lista de notificações
- Filtros (todas, não lidas, lidas)
- Busca
- Paginação
- Marcar como lida
- Marcar todas como lidas
- Deletar notificação

#### Badge de Contador
- Contador de não lidas
- Atualização em tempo real
- Posicionamento no header

#### Tipos de Notificação
- Info (azul)
- Success (verde)
- Warning (amarelo)
- Error (vermelho)

---

## ⚙️ ETAPA 4.4 — PREFERÊNCIAS

### Configurações Disponíveis

#### Por Canal
- Email: on/off
- Push: on/off
- In-app: on/off

#### Por Tipo
- Transacionais: sempre on
- Sociais: configurável
- Sistema: configurável
- Marketing: configurável

#### Frequência
- Imediato
- Diário (resumo)
- Semanal (resumo)
- Nunca

#### Quiet Hours
- Horário de início
- Horário de fim
- Dias da semana

---

## 🗄️ ESTRUTURA DE BANCO

### Tabela: notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  category TEXT NOT NULL CHECK (category IN ('transactional', 'social', 'system', 'marketing')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### Tabela: notification_preferences
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  transactional_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  social_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  system_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily', 'weekly', 'never')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabela: push_subscriptions
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(user_id, is_active);
```

---

## 🔧 SERVIÇOS

### EmailService
```typescript
class EmailService {
  static async sendWelcomeEmail(userId: string): Promise<void>
  static async sendPasswordResetEmail(email: string, token: string): Promise<void>
  static async sendMFASetupEmail(userId: string, backupCodes: string[]): Promise<void>
  static async sendNewDeviceLoginEmail(userId: string, device: Device): Promise<void>
  static async sendPaymentConfirmationEmail(userId: string, payment: Payment): Promise<void>
  static async sendSubscriptionExpiringEmail(userId: string, expiresAt: Date): Promise<void>
  static async sendSecurityAlertEmail(userId: string, alert: SecurityAlert): Promise<void>
}
```

### NotificationService
```typescript
class NotificationService {
  static async createNotification(notification: CreateNotificationInput): Promise<Notification>
  static async getUserNotifications(userId: string, filters?: Filters): Promise<Notification[]>
  static async markAsRead(notificationId: string): Promise<void>
  static async markAllAsRead(userId: string): Promise<void>
  static async deleteNotification(notificationId: string): Promise<void>
  static async getUnreadCount(userId: string): Promise<number>
}
```

### PushService
```typescript
class PushService {
  static async subscribeToPush(userId: string, subscription: PushSubscription): Promise<void>
  static async unsubscribeFromPush(subscriptionId: string): Promise<void>
  static async sendPushNotification(userId: string, notification: PushNotification): Promise<void>
  static async sendPushToAll(userIds: string[], notification: PushNotification): Promise<void>
}
```

---

## 🎨 COMPONENTES UI

### NotificationCenter
```typescript
<NotificationCenter>
  <NotificationList>
    <NotificationItem />
    <NotificationItem />
  </NotificationList>
  <NotificationFilters />
</NotificationCenter>
```

### NotificationBadge
```typescript
<NotificationBadge count={5} />
```

### NotificationPreferences
```typescript
<NotificationPreferences>
  <ChannelSettings />
  <CategorySettings />
  <FrequencySettings />
  <QuietHoursSettings />
</NotificationPreferences>
```

---

## 🔄 FLUXOS

### Fluxo 1: Enviar Email
```
1. Evento ocorre (ex: novo cadastro)
2. Trigger chama edge function
3. Edge function valida dados
4. Busca preferências do usuário
5. Verifica se email está habilitado
6. Verifica quiet hours
7. Renderiza template
8. Envia via Resend
9. Log de envio
10. Retorna sucesso
```

### Fluxo 2: Push Notification
```
1. Evento ocorre
2. Busca subscriptions do usuário
3. Verifica preferências
4. Verifica quiet hours
5. Envia para FCM
6. FCM entrega ao dispositivo
7. Service worker mostra notificação
8. Log de envio
```

### Fluxo 3: In-App Notification
```
1. Evento ocorre
2. Cria registro em notifications
3. Frontend recebe via realtime
4. Atualiza badge de contador
5. Mostra toast (opcional)
6. Adiciona ao centro de notificações
```

---

## 🧪 TESTES

### Email
- [ ] Envio bem-sucedido
- [ ] Template renderizado corretamente
- [ ] Links funcionam
- [ ] Preferências respeitadas
- [ ] Quiet hours respeitadas

### Push
- [ ] Subscription funciona
- [ ] Notificação é entregue
- [ ] Click abre URL correta
- [ ] Unsubscribe funciona

### In-App
- [ ] Notificação aparece
- [ ] Badge atualiza
- [ ] Marcar como lida funciona
- [ ] Filtros funcionam
- [ ] Busca funciona

---

## 📊 MÉTRICAS

### Email
- Taxa de entrega
- Taxa de abertura
- Taxa de clique
- Taxa de bounce
- Taxa de spam

### Push
- Taxa de opt-in
- Taxa de entrega
- Taxa de clique
- Taxa de opt-out

### In-App
- Notificações criadas
- Notificações lidas
- Tempo médio para ler
- Taxa de ação

---

## ✅ CRITÉRIOS DE SUCESSO

### Funcional
- [ ] Emails são enviados
- [ ] Push notifications funcionam
- [ ] In-app notifications aparecem
- [ ] Preferências são respeitadas
- [ ] Quiet hours funcionam

### Performance
- [ ] Email enviado em < 5s
- [ ] Push entregue em < 2s
- [ ] In-app aparece em < 1s

### UX
- [ ] Centro de notificações intuitivo
- [ ] Preferências fáceis de configurar
- [ ] Notificações não são intrusivas

---

## 🚀 PRÓXIMOS PASSOS

1. Criar migrations
2. Implementar EmailService
3. Criar templates de email
4. Implementar NotificationService
5. Criar UI de notificações
6. Implementar PushService
7. Configurar service worker
8. Criar página de preferências
9. Testar tudo
10. Documentar

---

**Status**: 📋 PLANEJAMENTO COMPLETO  
**Próxima Ação**: Criar migrations  
**Tempo Estimado**: 4 horas

---

*Documentado por: Kiro AI*  
*Data: 2026-04-18*  
*Fase: Pré-Lançamento - Notificações*
