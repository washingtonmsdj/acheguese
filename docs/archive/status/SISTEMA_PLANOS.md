# Sistema de Planos - Análise Completa

## Status Atual
✅ Módulo já existe e está implementado em `src/core/subscription/`

## Estrutura

### 1. Tipos de Planos

#### Para Usuários (user_subscriptions)
- `free` - Gratuito
- `basic` - Básico
- `premium` - Premium
- `enterprise` - Empresarial

#### Para Empresas (business_subscriptions)
- `basico` - R$ 29/mês
- `profissional` - R$ 79/mês (destaque)
- `premium_20` - R$ 149/mês

## Como Funciona

### Para Usuários Comuns
```typescript
// Features por plano
free: {
  max_businesses: 1,
  max_posts: 10,
  max_photos: 5,
  analytics: false,
  priority_support: false,
  verified_badge: false,
  ads_free: false
}

premium: {
  max_businesses: 10,
  max_posts: -1, // ilimitado
  max_photos: 100,
  analytics: true,
  priority_support: true,
  verified_badge: true,
  ads_free: true
}
```

### Para Empresas
```typescript
basico: {
  price: 29,
  limites: {
    photos: 5,
    products: 10,
    services: 10,
    agendamentos_mes: 50,
    cupons_actives: 1
  }
}

profissional: {
  price: 79,
  limites: {
    photos: 20,
    products: 100,
    services: 100,
    agendamentos_mes: 200,
    cupons_actives: 3
  }
}

premium_20: {
  price: 149,
  limites: {
    photos: -1, // ilimitado
    products: -1,
    services: -1,
    agendamentos_mes: -1,
    cupons_actives: -1
  }
}
```

## Serviços Disponíveis

### SubscriptionService (src/core/subscription/)
```typescript
// Buscar assinatura ativa
await SubscriptionService.getActiveSubscription(userId)

// Criar assinatura
await SubscriptionService.createSubscription({
  user_id: userId,
  plan_type: 'premium',
  expires_at: '2026-12-31',
  amount_cents: 9900
})

// Verificar feature
await SubscriptionService.hasFeature(userId, 'analytics')

// Cancelar
await SubscriptionService.cancelSubscription(userId, immediate: true)

// Renovar
await SubscriptionService.renewSubscription(userId, expiresAt, amountCents)

// Stats (admin)
await SubscriptionService.getSubscriptionStats()
```

## Componentes UI

### SubscriptionPlans (src/modules/business/components/)
- Exibe cards dos planos
- Permite seleção de plano
- Mostra features e limites
- Badge de destaque no plano recomendado

### Integração no Dashboard
```typescript
// DashboardEmpresaPageV2.tsx
<TabPanel value="plano">
  <SubscriptionPlans
    currentPlan={currentPlan}
    onSelectPlan={handlePlanSelect}
  />
</TabPanel>
```

## Tabelas no Supabase

### user_subscriptions
- Assinaturas de usuários comuns
- Controla features e limites
- Status: active, cancelled, expired, suspended

### business_subscriptions (provável)
- Assinaturas de empresas
- Controla limites de produtos/serviços
- Integração com pagamentos

## Fluxo de Pagamento

### Atual (Mock)
1. Usuário seleciona plano
2. Toast de confirmação
3. Estado local atualizado

### Produção (Futuro)
1. Usuário seleciona plano
2. Redireciona para gateway de pagamento (Stripe/Mercado Pago)
3. Webhook confirma pagamento
4. SubscriptionService.createSubscription()
5. Features liberadas automaticamente

## Verificação de Limites

### Exemplo: Criar Post
```typescript
// Verificar se pode criar post
const features = await SubscriptionService.getUserFeatures(userId);
const postsCount = await PostService.getPostsCountByUser(userId);

if (features.max_posts !== -1 && postsCount >= features.max_posts) {
  throw new Error('Limite de posts atingido. Faça upgrade!');
}
```

### Exemplo: Upload de Foto
```typescript
const features = await SubscriptionService.getUserFeatures(userId);
const photosCount = await MediaService.getPhotosCount(businessId);

if (features.max_photos !== -1 && photosCount >= features.max_photos) {
  throw new Error('Limite de fotos atingido. Faça upgrade!');
}
```

## Próximos Passos

### Essencial
1. ✅ Módulo já existe
2. ⚠️ Integrar verificação de limites nos services
3. ⚠️ Criar hooks: `useSubscription()`, `useFeatureAccess()`
4. ⚠️ Adicionar UI de upgrade quando limite atingido
5. ⚠️ Integrar gateway de pagamento

### Opcional
- Página de gerenciamento de assinatura
- Histórico de pagamentos
- Faturas/recibos
- Cupons de desconto
- Trial gratuito (7 dias)
- Downgrade de plano

## Recomendação

O sistema está bem estruturado. Falta:
1. Criar hooks para facilitar uso nos componentes
2. Integrar verificação de limites nos services críticos
3. UI de upgrade/paywall quando limite atingido
4. Gateway de pagamento (Stripe recomendado)
