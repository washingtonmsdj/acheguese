# ⚡ Deploy Rápido na Vercel

Guia rápido para fazer deploy do **Achegue-se** na Vercel em 5 minutos.

## 🚀 Passo a Passo

### 1️⃣ Importar na Vercel (2 min)

1. Acesse: https://vercel.com/new
2. Conecte seu repositório Git
3. Clique em **Import**
4. Vercel detectará automaticamente as configurações do Vite

### 2️⃣ Configurar Variáveis de Ambiente (2 min)

No painel da Vercel, adicione estas variáveis em **Settings > Environment Variables**:

#### ✅ Obrigatórias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
```

**Onde encontrar:**
- Acesse seu projeto no [Supabase Dashboard](https://supabase.com/dashboard)
- Vá em **Settings > API**
- Copie **Project URL** e **anon/public key**

#### 🔧 Opcionais (recomendadas)

```env
VITE_FEATURE_COMMUNITY_ALERTS=true
VITE_FEATURE_MAPS_V4=true
```

### 3️⃣ Deploy (1 min)

1. Clique em **Deploy**
2. Aguarde o build (2-3 minutos)
3. Pronto! 🎉

## 🌐 Configurar Domínio Personalizado

### Adicionar acheguese.com.br

1. Vá em **Settings > Domains**
2. Adicione `acheguese.com.br`
3. Configure no seu provedor de DNS:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

4. Aguarde propagação (até 48h, geralmente 5-10 min)

## ✅ Verificar Deploy

Após o deploy, teste:

- [ ] Site abre: `https://seu-projeto.vercel.app`
- [ ] Login funciona
- [ ] Páginas carregam
- [ ] Imagens aparecem
- [ ] HTTPS está ativo (cadeado verde)

## 🔄 Deploys Automáticos

Após configuração inicial, cada `git push` faz deploy automático:

```bash
git add .
git commit -m "Atualização"
git push origin main
```

## 🐛 Problemas Comuns

### Build falha

```bash
# Teste localmente primeiro
npm run build
```

### Variáveis não funcionam

- Certifique-se que começam com `VITE_`
- Redeploy após adicionar variáveis

### Erro 404 em rotas

- Já está configurado no `vercel.json`
- Se persistir, verifique se o arquivo existe

## 📞 Precisa de Ajuda?

- 📖 Guia completo: [DEPLOY.md](./DEPLOY.md)
- 🔍 Verificar preparação: `npm run verify:deploy`
- 📊 Logs: Vercel Dashboard > Deployments > Logs

---

**Tempo total:** ~5 minutos ⚡
