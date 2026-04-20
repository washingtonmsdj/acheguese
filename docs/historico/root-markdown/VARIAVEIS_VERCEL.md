# 📝 Variáveis de Ambiente para Vercel

## ⚡ Copie e Cole Direto no Vercel

### 🎯 Como Adicionar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Para cada variável abaixo:
   - Cole o **Name**
   - Cole o **Value** (substitua os valores conforme necessário)
   - Marque: ✅ Production, ✅ Preview, ✅ Development
   - Clique em **Add**

---

## 📋 Variáveis Obrigatórias

### 1. VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://xhdowzacfujckjelqhtd.supabase.co
```

### 2. VITE_SUPABASE_PUBLISHABLE_KEY
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: [ROTATED_KEY_REMOVED]
```

### 3. VITE_SUPABASE_PROJECT_ID
```
Name: VITE_SUPABASE_PROJECT_ID
Value: xhdowzacfujckjelqhtd
```

### 4. ALLOWED_ORIGINS
```
Name: ALLOWED_ORIGINS
Value: https://seu-projeto.vercel.app
```
⚠️ **IMPORTANTE**: Depois do primeiro deploy, volte aqui e atualize com a URL real do Vercel!

---

## 📋 Variáveis Opcionais

### 5. VITE_FEATURE_COMMUNITY_ALERTS
```
Name: VITE_FEATURE_COMMUNITY_ALERTS
Value: false
```

### 6. VITE_FEATURE_MAPS_V4
```
Name: VITE_FEATURE_MAPS_V4
Value: true
```

### 7. BASE_URL
```
Name: BASE_URL
Value: https://seu-projeto.vercel.app
```
⚠️ **IMPORTANTE**: Atualize com a URL real após o primeiro deploy!

### 8. VITE_GOOGLE_MAPS_API_KEY (se usar Google Maps)
```
Name: VITE_GOOGLE_MAPS_API_KEY
Value: sua_chave_do_google_maps
```

---

## 🔒 Variáveis que NÃO vão no Vercel

**NUNCA adicione estas no Vercel** (vão no Supabase Edge Functions):

❌ `SUPABASE_SERVICE_ROLE_KEY`  
❌ `STRIPE_SECRET_KEY`  
❌ `STRIPE_WEBHOOK_SECRET`  
❌ `RESEND_API_KEY`  
❌ Senhas de teste (E2E_USER_PASSWORD, etc)

Estas vão no **Supabase Dashboard** → **Edge Functions** → **Secrets**

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL DASHBOARD                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Settings → Environment Variables                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Name: VITE_SUPABASE_URL                               │ │
│  │ Value: https://xhdowzacfujckjelqhtd.supabase.co      │ │
│  │ ☑ Production  ☑ Preview  ☑ Development               │ │
│  │ [Add]                                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Name: VITE_SUPABASE_PUBLISHABLE_KEY                   │ │
│  │ Value: sb_publishable_WVn4OOnU853X3kGXwi2miA_9HmLO... │ │
│  │ ☑ Production  ☑ Preview  ☑ Development               │ │
│  │ [Add]                                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Name: VITE_SUPABASE_PROJECT_ID                        │ │
│  │ Value: xhdowzacfujckjelqhtd                           │ │
│  │ ☑ Production  ☑ Preview  ☑ Development               │ │
│  │ [Add]                                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Name: ALLOWED_ORIGINS                                 │ │
│  │ Value: https://seu-projeto.vercel.app                 │ │
│  │ ☑ Production  ☑ Preview  ☑ Development               │ │
│  │ [Add]                                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo Completo

### Passo 1: Adicionar Variáveis no Vercel
```
1. Acesse Vercel Dashboard
2. Selecione projeto
3. Settings → Environment Variables
4. Adicione as 4 variáveis obrigatórias
5. Adicione as opcionais se necessário
```

### Passo 2: Fazer Deploy
```
1. Clique em "Deploy"
2. Aguarde build (2-5 minutos)
3. Anote a URL: https://seu-projeto.vercel.app
```

### Passo 3: Atualizar ALLOWED_ORIGINS
```
1. Volte em Settings → Environment Variables
2. Edite ALLOWED_ORIGINS
3. Coloque a URL real: https://seu-projeto.vercel.app
4. Salve
5. Faça novo deploy (ou aguarde próximo push)
```

### Passo 4: Configurar Supabase
```
1. Acesse Supabase Dashboard
2. Edge Functions → Secrets
3. Adicione ALLOWED_ORIGINS com mesma URL
4. Adicione outros secrets (STRIPE, RESEND, etc)
```

---

## ✅ Checklist

Antes de fazer deploy:

- [ ] Adicionei `VITE_SUPABASE_URL`
- [ ] Adicionei `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Adicionei `VITE_SUPABASE_PROJECT_ID`
- [ ] Adicionei `ALLOWED_ORIGINS` (temporário)
- [ ] Marquei todas para Production, Preview e Development
- [ ] Cliquei em "Add" para cada uma

Após primeiro deploy:

- [ ] Anotei a URL do Vercel
- [ ] Atualizei `ALLOWED_ORIGINS` com URL real
- [ ] Atualizei `BASE_URL` com URL real
- [ ] Configurei secrets no Supabase
- [ ] Testei o site

---

## 🆘 Problemas Comuns

### "Environment variable not found"
**Solução**: Verifique se marcou Production, Preview e Development

### "CORS blocked"
**Solução**: Atualize `ALLOWED_ORIGINS` com a URL correta do Vercel

### "Cannot connect to Supabase"
**Solução**: Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão corretos

### Deploy funciona mas site não carrega
**Solução**: Verifique os logs de build no Vercel

---

## 📞 Precisa de Ajuda?

**Guias Completos**:
- `VERCEL_DEPLOY_GUIDE.md` - Guia passo a passo completo
- `SECURITY_VERCEL_GUIDE.md` - Segurança no Vercel
- `QUICK_START_SECURITY.md` - Setup rápido

**Suporte**:
- Email: security@ordax.com
- Documentação Vercel: https://vercel.com/docs

---

**Última Atualização**: 2026-04-15  
**Versão**: 1.0
