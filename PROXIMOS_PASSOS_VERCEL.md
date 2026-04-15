# ✅ Próximos Passos no Vercel

## 🎉 Parabéns! Você já adicionou:

- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 📝 Faltam Adicionar (Recomendado)

### 1. VITE_SUPABASE_PROJECT_ID
```
Name: VITE_SUPABASE_PROJECT_ID
Value: xhdowzacfujckjelqhtd
Environment: ✅ Production ✅ Preview ✅ Development
```

### 2. ALLOWED_ORIGINS (IMPORTANTE para CORS)
```
Name: ALLOWED_ORIGINS
Value: https://seu-projeto.vercel.app
Environment: ✅ Production ✅ Preview ✅ Development
```
⚠️ **NOTA**: Você vai atualizar isso depois do primeiro deploy com a URL real!

### 3. VITE_FEATURE_COMMUNITY_ALERTS (Opcional)
```
Name: VITE_FEATURE_COMMUNITY_ALERTS
Value: false
Environment: ✅ Production ✅ Preview ✅ Development
```

### 4. VITE_FEATURE_MAPS_V4 (Opcional)
```
Name: VITE_FEATURE_MAPS_V4
Value: true
Environment: ✅ Production ✅ Preview ✅ Development
```

---

## 🚀 Opção 1: Deploy Agora (Mínimo Necessário)

Se quiser fazer deploy agora com o mínimo:

### Você JÁ TEM o suficiente! ✅

As 2 variáveis que você adicionou são as mais importantes. Você pode:

1. **Clicar em "Deploy"** agora
2. Adicionar as outras depois

### ⚠️ Mas vai ter um problema de CORS

Sem `ALLOWED_ORIGINS`, as edge functions vão bloquear requisições. Então é melhor adicionar pelo menos essa.

---

## 🎯 Opção 2: Adicionar Tudo Agora (Recomendado)

### Passo a Passo:

1. **Adicione `VITE_SUPABASE_PROJECT_ID`**
   - Name: `VITE_SUPABASE_PROJECT_ID`
   - Value: `xhdowzacfujckjelqhtd`
   - Marque: Production, Preview, Development
   - Clique em "Add"

2. **Adicione `ALLOWED_ORIGINS` (temporário)**
   - Name: `ALLOWED_ORIGINS`
   - Value: `http://localhost:8080` (temporário)
   - Marque: Production, Preview, Development
   - Clique em "Add"
   - ⚠️ Você vai atualizar isso depois!

3. **Adicione Feature Flags (opcional)**
   - `VITE_FEATURE_COMMUNITY_ALERTS` = `false`
   - `VITE_FEATURE_MAPS_V4` = `true`

4. **Clique em "Deploy"**

---

## 📊 Status Atual

```
┌─────────────────────────────────────────────────────┐
│           VARIÁVEIS NO VERCEL                       │
├─────────────────────────────────────────────────────┤
│ ✅ VITE_SUPABASE_URL                                │
│ ✅ VITE_SUPABASE_PUBLISHABLE_KEY                    │
│ ⚠️  VITE_SUPABASE_PROJECT_ID (falta)                │
│ ⚠️  ALLOWED_ORIGINS (falta - IMPORTANTE!)           │
│ ⏸️  VITE_FEATURE_COMMUNITY_ALERTS (opcional)        │
│ ⏸️  VITE_FEATURE_MAPS_V4 (opcional)                 │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 Depois do Primeiro Deploy

### 1. Anote a URL do Vercel
Quando o deploy terminar, você verá algo como:
```
https://seu-projeto-abc123.vercel.app
```

### 2. Atualize ALLOWED_ORIGINS

1. Volte em **Settings** → **Environment Variables**
2. Encontre `ALLOWED_ORIGINS`
3. Clique em **"Edit"** (ícone de lápis)
4. Atualize o valor para a URL real:
   ```
   https://seu-projeto-abc123.vercel.app
   ```
5. Clique em **"Save"**

### 3. Faça um Novo Deploy (Opcional)

Opção A: Aguarde o próximo push no Git (deploy automático)

Opção B: Deploy manual:
1. Vá em **"Deployments"**
2. Clique nos 3 pontinhos do último deploy
3. Clique em **"Redeploy"**

---

## 🔒 Configurar Supabase Edge Functions

**IMPORTANTE**: Depois do deploy no Vercel, configure no Supabase:

### 1. Acesse Supabase Dashboard
```
https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
```

### 2. Vá em Edge Functions → Secrets

### 3. Adicione:

```
Name: ALLOWED_ORIGINS
Value: https://seu-projeto-abc123.vercel.app
```

### 4. Adicione outros secrets (se usar):

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
DENO_ENV=production
```

---

## ✅ Checklist Completo

### Antes do Deploy
- [x] Adicionou `VITE_SUPABASE_URL`
- [x] Adicionou `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] Adicionar `VITE_SUPABASE_PROJECT_ID`
- [ ] Adicionar `ALLOWED_ORIGINS` (temporário)
- [ ] Adicionar feature flags (opcional)

### Durante o Deploy
- [ ] Clicar em "Deploy"
- [ ] Aguardar 2-5 minutos
- [ ] Anotar URL do Vercel

### Depois do Deploy
- [ ] Atualizar `ALLOWED_ORIGINS` com URL real
- [ ] Configurar secrets no Supabase
- [ ] Testar o site
- [ ] Verificar console do navegador (F12)

---

## 🎯 Recomendação

### Faça Agora:

1. **Adicione `ALLOWED_ORIGINS`** (mesmo que temporário)
   - Value: `http://localhost:8080,https://seu-projeto.vercel.app`
   - Você atualiza depois com a URL real

2. **Adicione `VITE_SUPABASE_PROJECT_ID`**
   - Value: `xhdowzacfujckjelqhtd`

3. **Clique em "Deploy"**

### Depois do Deploy:

1. Anote a URL
2. Atualize `ALLOWED_ORIGINS`
3. Configure Supabase
4. Teste!

---

## 🆘 Problemas Comuns

### "CORS blocked" após deploy
**Solução**: Atualize `ALLOWED_ORIGINS` com a URL correta do Vercel

### Site carrega mas não conecta ao Supabase
**Solução**: Verifique se as variáveis estão corretas no Vercel

### Edge functions não funcionam
**Solução**: Configure `ALLOWED_ORIGINS` no Supabase Edge Functions

---

## 📞 Precisa de Ajuda?

**Guias Disponíveis**:
- `VARIAVEIS_VERCEL.md` - Lista completa de variáveis
- `VERCEL_DEPLOY_GUIDE.md` - Guia passo a passo
- `VERCEL_WARNING_EXPLANATION.md` - Sobre o aviso de segurança

**Próximo Passo**: Adicione as variáveis que faltam e clique em "Deploy"! 🚀

---

**Última Atualização**: 2026-04-15  
**Status**: ✅ Quase Pronto para Deploy
