# 🚀 Deploy na Vercel - Achegue-se

> **Status:** ✅ Pronto para deploy  
> **Domínio:** acheguese.com.br  
> **Plataforma:** Vercel  
> **Framework:** Vite + React + TypeScript

---

## ⚡ Quick Start (5 minutos)

```bash
# 1. Verificar preparação
npm run verify:deploy

# 2. Commit e push
git add .
git commit -m "Deploy para Vercel"
git push origin main

# 3. Importar na Vercel
# 👉 https://vercel.com/new
```

---

## 📚 Documentação Disponível

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **[VERCEL_QUICKSTART.md](./VERCEL_QUICKSTART.md)** | Guia rápido (5 min) | Primeiro deploy |
| **[DEPLOY.md](./DEPLOY.md)** | Guia completo e detalhado | Referência completa |
| **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)** | Checklist passo a passo | Validação pós-deploy |
| **[VERCEL_SETUP_COMPLETE.md](./VERCEL_SETUP_COMPLETE.md)** | Resumo da preparação | Visão geral |

---

## 🔐 Variáveis de Ambiente

Configure na Vercel em **Settings > Environment Variables**:

### ✅ Obrigatórias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key
```

**Onde encontrar:**
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings > API**
4. Copie **Project URL** e **anon public key**

### 🔧 Opcionais

```env
VITE_FEATURE_COMMUNITY_ALERTS=true
VITE_FEATURE_MAPS_V4=true
VITE_SENTRY_DSN=seu_sentry_dsn
VITE_GOOGLE_MAPS_API_KEY=sua_api_key
```

---

## 📋 Arquivos de Configuração

### ✅ Criados e Configurados

- `vercel.json` - Configuração da Vercel
- `.vercelignore` - Arquivos a ignorar
- `.env.production` - Template de variáveis
- `scripts/verify-deploy-ready.mjs` - Script de verificação

### ✅ Atualizados

- Domínio `acheguese.com.br` em todos os arquivos SEO
- `robots.txt` com domínio correto
- `package.json` com comando `verify:deploy`

---

## 🎯 Configuração da Vercel

### Detecção Automática

A Vercel detectará automaticamente:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### Otimizações Incluídas

- ✅ Cache de assets (1 ano)
- ✅ Headers de segurança
- ✅ SPA routing automático
- ✅ Code splitting
- ✅ Minification
- ✅ Tree shaking

---

## 🔍 Comandos Úteis

```bash
# Verificar preparação para deploy
npm run verify:deploy

# Build local (testar antes de deploy)
npm run build

# Preview do build local
npm run preview

# Verificar tipos TypeScript
npm run typecheck

# Verificar linting
npm run lint

# Verificar SSOT compliance
npm run validate:ssot
```

---

## 🌐 Configurar Domínio Personalizado

### 1. Adicionar na Vercel

1. Vá em **Settings > Domains**
2. Adicione `acheguese.com.br`
3. Adicione `www.acheguese.com.br` (opcional)

### 2. Configurar DNS

No seu provedor de domínio (Registro.br, etc):

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### 3. Aguardar Propagação

- Tempo: 5 minutos a 48 horas (geralmente 10-30 min)
- Verificar: https://dnschecker.org

---

## ✅ Checklist Rápido

### Antes do Deploy
- [ ] `npm run verify:deploy` passou
- [ ] Código commitado e pushed
- [ ] Supabase configurado

### Durante o Deploy
- [ ] Projeto importado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy iniciado

### Após o Deploy
- [ ] Site abre na URL da Vercel
- [ ] Login funciona
- [ ] Rotas funcionam
- [ ] HTTPS ativo
- [ ] Domínio personalizado configurado (opcional)

---

## 🐛 Problemas Comuns

### Build Falha

```bash
# Testar localmente
npm run build

# Se funcionar local, verificar variáveis de ambiente na Vercel
```

### Erro 404 em Rotas

- Já está configurado no `vercel.json`
- Se persistir, verificar se o arquivo existe

### Variáveis Não Funcionam

- Certifique-se que começam com `VITE_`
- Redeploy após adicionar variáveis

### Supabase Não Conecta

- Verificar URL e chave na Vercel
- Testar conexão localmente primeiro

---

## 📊 Performance Esperada

Com a configuração atual:

| Métrica | Valor Esperado |
|---------|----------------|
| Lighthouse Performance | 90+ |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Bundle Size (gzipped) | ~500KB |

---

## 🎉 Pronto para Deploy!

Seu projeto está 100% preparado. Siga o guia rápido:

👉 **[VERCEL_QUICKSTART.md](./VERCEL_QUICKSTART.md)**

Ou o guia completo:

👉 **[DEPLOY.md](./DEPLOY.md)**

---

## 📞 Suporte

- 📖 Documentação completa em `DEPLOY.md`
- ✅ Checklist em `DEPLOY_CHECKLIST.md`
- 🔍 Verificação: `npm run verify:deploy`
- 🌐 [Vercel Docs](https://vercel.com/docs)
- 🗄️ [Supabase Docs](https://supabase.com/docs)

---

**Boa sorte com o deploy! 🚀**

*Última atualização: 15 de Abril de 2026*
