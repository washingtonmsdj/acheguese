# 🔧 FASE 3.2 — Guia de Configuração do Stripe

> **Data**: 2026-04-18  
> **Tempo Estimado**: 30 minutos  
> **Pré-requisito**: Conta Stripe criada

---

## 📋 CHECKLIST

- [ ] Criar conta Stripe (se não tiver)
- [ ] Criar 3 produtos
- [ ] Criar 3 preços
- [ ] Atualizar billing_plans no banco
- [ ] Configurar webhook endpoint
- [ ] Adicionar secrets no Supabase
- [ ] Testar com Stripe CLI

---

## 1️⃣ CRIAR PRODUTOS NO STRIPE

### Acessar Dashboard
1. Ir para: https://dashboard.stripe.com/test/products
2. Clicar em **"+ Add product"**

### Produto 1: Pro
```
Name: Plano Pro
Description: Página premium com recursos avançados
Pricing model: Standard pricing
Price: R$ 49.90
Billing period: Monthly
Currency: BRL

Metadata (opcional):
- plan_code: pro
- supabase_plan: pro
```

**Copiar**: `price_id` (ex: `price_1ABC123xyz`)

---

### Produto 2: Delivery
```
Name: Plano Delivery
Description: Plano completo com sistema de pedidos e delivery
Pricing model: Standard pricing
Price: R$ 99.90
Billing period: Monthly
Currency: BRL

Metadata (opcional):
- plan_code: delivery
- supabase_plan: delivery
```

**Copiar**: `price_id` (ex: `price_2DEF456xyz`)

---

### Produto 3: Free (Opcional)
```
Name: Plano Free
Description: Plano gratuito básico
Pricing model: Standard pricing
Price: R$ 0.00
Billing period: Monthly
Currency: BRL

Metadata (opcional):
- plan_code: free
- supabase_plan: free
```

**Nota**: O plano Free não precisa de checkout, mas pode ser útil para referência.

---

## 2️⃣ ATUALIZAR BANCO DE DADOS

### Conectar ao Supabase
```bash
# Via Supabase Dashboard
# Ou via SQL Editor
```

### Atualizar billing_plans
```sql
-- Atualizar plano Pro
UPDATE billing_plans 
SET stripe_price_id = 'price_1ABC123xyz'  -- Substituir pelo price_id real
WHERE code = 'pro';

-- Atualizar plano Delivery
UPDATE billing_plans 
SET stripe_price_id = 'price_2DEF456xyz'  -- Substituir pelo price_id real
WHERE code = 'delivery';

-- Verificar
SELECT code, name, stripe_price_id 
FROM billing_plans 
WHERE is_active = true;
```

**Resultado esperado**:
```
code     | name     | stripe_price_id
---------|----------|------------------
free     | Free     | null
pro      | Pro      | price_1ABC123xyz
delivery | Delivery | price_2DEF456xyz
```

---

## 3️⃣ CONFIGURAR WEBHOOK

### Obter URL do Webhook
```bash
# Formato da URL
https://[PROJECT_ID].supabase.co/functions/v1/billing-webhook

# Exemplo
https://abcdefghijklmnop.supabase.co/functions/v1/billing-webhook
```

**Como obter PROJECT_ID**:
1. Acessar: https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api
2. Copiar "Project URL"
3. Extrair o ID da URL

---

### Criar Endpoint no Stripe
1. Ir para: https://dashboard.stripe.com/test/webhooks
2. Clicar em **"+ Add endpoint"**
3. Preencher:
   ```
   Endpoint URL: https://[PROJECT_ID].supabase.co/functions/v1/billing-webhook
   Description: Supabase Billing Webhook
   ```

4. Selecionar eventos:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

5. Clicar em **"Add endpoint"**

6. **Copiar Signing Secret**: `whsec_xxx...`

---

## 4️⃣ ADICIONAR SECRETS NO SUPABASE

### Obter Stripe Secret Key
1. Ir para: https://dashboard.stripe.com/test/apikeys
2. Copiar **"Secret key"**: `sk_test_xxx...`

### Adicionar Secrets via CLI
```bash
# Navegar para pasta do projeto
cd supabase

# Adicionar STRIPE_SECRET_KEY
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx...

# Adicionar STRIPE_WEBHOOK_SECRET
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx...

# Verificar secrets (não mostra valores)
supabase secrets list
```

### Adicionar Secrets via Dashboard (Alternativa)
1. Acessar: https://supabase.com/dashboard/project/[PROJECT_ID]/settings/vault
2. Clicar em **"New secret"**
3. Adicionar:
   ```
   Name: STRIPE_SECRET_KEY
   Value: sk_test_xxx...
   ```
4. Repetir para `STRIPE_WEBHOOK_SECRET`

---

## 5️⃣ TESTAR CONFIGURAÇÃO

### Instalar Stripe CLI
```bash
# Windows (via Scoop)
scoop install stripe

# macOS (via Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
# Ver: https://stripe.com/docs/stripe-cli
```

### Login no Stripe CLI
```bash
stripe login
```

### Testar Webhook Localmente
```bash
# Forward webhooks para função local
stripe listen --forward-to http://localhost:54321/functions/v1/billing-webhook

# Em outro terminal, trigger evento de teste
stripe trigger customer.subscription.created
```

**Resultado esperado**:
```
✔ Webhook received: customer.subscription.created
✔ Event processed successfully
```

### Verificar no Banco
```sql
-- Ver webhooks recebidos
SELECT * FROM stripe_webhook_events 
ORDER BY created_at DESC 
LIMIT 5;

-- Ver assinaturas criadas
SELECT * FROM user_subscriptions 
ORDER BY created_at DESC 
LIMIT 5;

-- Ver transações
SELECT * FROM billing_transactions 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 6️⃣ TESTAR CHECKOUT COMPLETO

### Criar Usuário de Teste
```sql
-- Criar usuário de teste (se não tiver)
-- Via Supabase Dashboard > Authentication > Users
```

### Testar Fluxo no Frontend
1. Fazer login com usuário de teste
2. Ir para página de pricing (quando criada)
3. Clicar em "Assinar Pro"
4. Preencher dados de teste:
   ```
   Card number: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```
5. Confirmar pagamento
6. Verificar redirecionamento para success page
7. Verificar assinatura no banco

### Verificar Webhook
```bash
# No terminal com stripe listen
# Deve aparecer:
✔ customer.subscription.created
✔ invoice.paid
```

### Verificar Banco
```sql
-- Ver assinatura do usuário
SELECT 
  us.user_id,
  us.plan_code,
  us.status,
  us.stripe_subscription_id,
  bp.name as plan_name
FROM user_subscriptions us
JOIN billing_plans bp ON bp.code = us.plan_code
WHERE us.user_id = '[USER_ID]';

-- Ver transações
SELECT * FROM billing_transactions
WHERE user_id = '[USER_ID]'
ORDER BY created_at DESC;
```

---

## 7️⃣ TESTAR PORTAL DO CLIENTE

### Acessar Portal
1. No frontend, clicar em "Gerenciar Assinatura"
2. Verificar redirecionamento para Stripe Portal
3. Testar funcionalidades:
   - Ver faturas
   - Atualizar método de pagamento
   - Cancelar assinatura
   - Ver histórico

### Testar Cancelamento
1. No portal, clicar em "Cancel subscription"
2. Confirmar cancelamento
3. Verificar webhook:
   ```bash
   ✔ customer.subscription.deleted
   ```
4. Verificar banco:
   ```sql
   SELECT plan_code, status, canceled_at
   FROM user_subscriptions
   WHERE user_id = '[USER_ID]';
   
   -- Deve mostrar:
   -- plan_code: free
   -- status: canceled
   -- canceled_at: [timestamp]
   ```

---

## 8️⃣ TESTAR FALHA DE PAGAMENTO

### Simular Falha
```bash
# Trigger evento de falha
stripe trigger invoice.payment_failed
```

### Verificar Banco
```sql
-- Ver status atualizado
SELECT status FROM user_subscriptions
WHERE user_id = '[USER_ID]';
-- Deve mostrar: past_due

-- Ver transação de falha
SELECT * FROM billing_transactions
WHERE user_id = '[USER_ID]'
  AND transaction_type = 'payment_failed'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🔒 SEGURANÇA

### Secrets Management
- ✅ NUNCA commitar secrets no git
- ✅ Usar `.env.local` para desenvolvimento
- ✅ Usar Supabase Vault para produção
- ✅ Rotacionar secrets periodicamente

### Webhook Security
- ✅ Sempre validar assinatura do Stripe
- ✅ Usar HTTPS apenas
- ✅ Implementar idempotência
- ✅ Rate limiting configurado

---

## 🚀 PRODUÇÃO

### Quando Migrar para Produção:

1. **Criar produtos em Live Mode**:
   - Ir para: https://dashboard.stripe.com/products
   - Criar mesmos produtos
   - Copiar novos `price_id`

2. **Atualizar banco de produção**:
   ```sql
   UPDATE billing_plans 
   SET stripe_price_id = 'price_LIVE_xxx'
   WHERE code = 'pro';
   ```

3. **Configurar webhook em Live Mode**:
   - Ir para: https://dashboard.stripe.com/webhooks
   - Adicionar endpoint de produção
   - Copiar novo signing secret

4. **Atualizar secrets de produção**:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_xxx
   ```

5. **Testar em produção**:
   - Usar cartão real
   - Verificar webhooks
   - Monitorar logs

---

## 📊 MONITORAMENTO

### Dashboard do Stripe
- Acessar: https://dashboard.stripe.com/test/dashboard
- Monitorar:
  - Pagamentos
  - Assinaturas
  - Webhooks
  - Falhas

### Logs do Supabase
```bash
# Ver logs da edge function
supabase functions logs billing-webhook

# Ver logs em tempo real
supabase functions logs billing-webhook --follow
```

### Queries de Monitoramento
```sql
-- Assinaturas ativas
SELECT COUNT(*) FROM user_subscriptions
WHERE status IN ('active', 'trialing');

-- Assinaturas por plano
SELECT plan_code, COUNT(*) 
FROM user_subscriptions
WHERE status IN ('active', 'trialing')
GROUP BY plan_code;

-- Webhooks pendentes
SELECT COUNT(*) FROM stripe_webhook_events
WHERE processed = false;

-- Webhooks com erro
SELECT COUNT(*) FROM stripe_webhook_events
WHERE processed = false AND retry_count >= 5;

-- Transações do dia
SELECT COUNT(*), SUM(amount_cents)
FROM billing_transactions
WHERE created_at >= CURRENT_DATE;
```

---

## ✅ CHECKLIST FINAL

### Test Mode:
- [ ] Produtos criados
- [ ] Preços criados
- [ ] billing_plans atualizado
- [ ] Webhook configurado
- [ ] Secrets adicionados
- [ ] Checkout testado
- [ ] Portal testado
- [ ] Webhooks funcionando

### Produção (Depois):
- [ ] Produtos criados em Live Mode
- [ ] Preços criados em Live Mode
- [ ] billing_plans atualizado (produção)
- [ ] Webhook configurado (produção)
- [ ] Secrets atualizados (produção)
- [ ] Testes em produção
- [ ] Monitoramento ativo

---

## 🆘 TROUBLESHOOTING

### Webhook não está sendo recebido
1. Verificar URL do endpoint
2. Verificar se função está deployada
3. Verificar logs: `supabase functions logs billing-webhook`
4. Testar com Stripe CLI: `stripe listen`

### Assinatura não está sendo criada
1. Verificar logs da função
2. Verificar se `stripe_price_id` está correto
3. Verificar se secrets estão configurados
4. Verificar RLS policies

### Erro de validação de assinatura
1. Verificar se `STRIPE_WEBHOOK_SECRET` está correto
2. Verificar se está usando o secret correto (test vs live)
3. Recriar webhook endpoint se necessário

---

**Status**: 📋 GUIA COMPLETO  
**Próxima Ação**: Seguir passos 1-8  
**Tempo Estimado**: 30 minutos

---

*Documentado por: Kiro AI*  
*Data: 2026-04-18*  
*Fase: Pré-Lançamento - Billing & Subscriptions*
