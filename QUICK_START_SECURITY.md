# 🚀 Quick Start - Segurança

Guia rápido para configurar segurança no projeto.

---

## ⚡ Setup Rápido (5 minutos)

### 1. Copiar Template de Ambiente

```bash
cp .env.local.example .env.local
```

### 2. Gerar Senhas Fortes

**PowerShell:**
```powershell
# Gerar 3 senhas fortes
1..3 | ForEach-Object {
    Add-Type -AssemblyName System.Web
    [System.Web.Security.Membership]::GeneratePassword(20, 5)
}
```

**Linux/Mac:**
```bash
# Gerar 3 senhas fortes
for i in {1..3}; do openssl rand -base64 20; done
```

### 3. Configurar `.env.local`

Edite `.env.local` e preencha:

```bash
# Supabase (obtenha no dashboard)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# CORS (seus domínios)
ALLOWED_ORIGINS="http://localhost:8080,https://yourdomain.com"

# Stripe (obtenha no dashboard)
STRIPE_SECRET_KEY="sk_test_your_key"
STRIPE_WEBHOOK_SECRET="whsec_your_secret"

# Senhas de teste (use as geradas acima)
E2E_USER_PASSWORD="[SENHA_1]"
E2E_ADMIN_PASSWORD="[SENHA_2]"
TEST_DRIVER_PASSWORD="[SENHA_3]"
```

### 4. Validar Configuração

```bash
node scripts/security/validate-security.mjs
```

**Resultado esperado:**
```
✅ VALIDAÇÃO PASSOU - Projeto seguro para deploy
```

---

## 🔒 Regras de Ouro

### ❌ NUNCA Faça Isso

```typescript
// ❌ Credenciais hardcoded
const API_KEY = "sk_live_1234567890";

// ❌ CORS permissivo
'Access-Control-Allow-Origin': '*'

// ❌ Sem validação
const userId = req.body.userId;
await db.query(`SELECT * FROM users WHERE id = '${userId}'`);

// ❌ Expor detalhes de erro
return new Response(JSON.stringify({ error: error.stack }));
```

### ✅ Sempre Faça Isso

```typescript
// ✅ Usar variáveis de ambiente
const API_KEY = Deno.env.get('API_KEY');
if (!API_KEY) throw new Error('API_KEY not configured');

// ✅ CORS restrito
import { getCorsHeaders } from './security.ts';
headers: getCorsHeaders()

// ✅ Validar entrada
import { isValidUUID } from './security.ts';
if (!isValidUUID(userId)) return errorResponse('Invalid ID', 400);

// ✅ Erro genérico
import { errorResponse } from './security.ts';
return errorResponse('Operation failed', 500, error);
```

---

## 📝 Checklist Antes de Commitar

```bash
# 1. Validar segurança
node scripts/security/validate-security.mjs

# 2. Verificar que .env.local não está no commit
git status | grep .env.local
# Não deve aparecer nada

# 3. Verificar que não há credenciais
git diff | grep -E "(sk_live|sk_test|whsec_|eyJhbGci)"
# Não deve aparecer nada

# 4. Commitar
git add .
git commit -m "feat: sua mensagem"
```

---

## 🚀 Deploy em Produção

### 1. Configurar Variáveis de Ambiente

No Vercel/Netlify/etc, configure:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
DENO_ENV=production
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### 2. Configurar Edge Functions

No Supabase Dashboard > Edge Functions > Secrets:

```bash
ALLOWED_ORIGINS=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### 3. Validar Deploy

```bash
# Testar CORS
curl -H "Origin: https://yourdomain.com" \
  https://your-project.supabase.co/functions/v1/your-function

# Testar rate limiting
for i in {1..101}; do
  curl https://your-project.supabase.co/functions/v1/your-function
done
# Deve retornar 429 após 100 requests
```

---

## 🆘 Troubleshooting

### Erro: "VITE_SUPABASE_URL deve estar definida"

**Solução:**
```bash
# Verificar se .env.local existe
ls -la .env.local

# Se não existir, criar
cp .env.local.example .env.local

# Editar e preencher
```

### Erro: "CORS blocked"

**Solução:**
```bash
# Verificar ALLOWED_ORIGINS
echo $ALLOWED_ORIGINS

# Deve conter seu domínio
# Se não, adicionar em .env.local:
ALLOWED_ORIGINS="http://localhost:8080,https://yourdomain.com"
```

### Erro: "Rate limit exceeded"

**Solução:**
```bash
# Aguardar 1 minuto ou
# Aumentar limite em .env.local:
RATE_LIMIT_MAX_REQUESTS="200"
RATE_LIMIT_WINDOW_MS="60000"
```

---

## 📚 Documentação Completa

- **Guia Completo**: `SECURITY.md`
- **Relatório Detalhado**: `SECURITY_FIXES_APPLIED.md`
- **Resumo**: `RESUMO_CORRECOES_SEGURANCA.md`
- **Este Guia**: `QUICK_START_SECURITY.md`

---

## 🎯 Comandos Úteis

```bash
# Validar segurança
node scripts/security/validate-security.mjs

# Gerar senha forte (PowerShell)
Add-Type -AssemblyName System.Web; [System.Web.Security.Membership]::GeneratePassword(20, 5)

# Gerar senha forte (Linux/Mac)
openssl rand -base64 20

# Verificar variáveis de ambiente
printenv | grep SUPABASE

# Testar edge function
curl -X POST https://your-project.supabase.co/functions/v1/your-function \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## ✅ Tudo Pronto!

Se você seguiu todos os passos:

1. ✅ `.env.local` configurado
2. ✅ Senhas fortes geradas
3. ✅ Validação passou
4. ✅ CORS configurado
5. ✅ Pronto para deploy

**Próximo passo**: Deploy em produção! 🚀

---

**Dúvidas?** Consulte `SECURITY.md` ou contate security@ordax.com
