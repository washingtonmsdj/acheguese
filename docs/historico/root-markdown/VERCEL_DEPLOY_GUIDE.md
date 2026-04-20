# 🚀 Guia Completo de Deploy no Vercel

**Tempo estimado**: 15 minutos  
**Dificuldade**: Fácil

---

## 📋 Pré-requisitos

Antes de começar, você precisa:

- [ ] Conta no Vercel (gratuita): https://vercel.com/signup
- [ ] Repositório Git (GitHub, GitLab ou Bitbucket)
- [ ] Credenciais do Supabase (URL e Publishable Key)

---

## 🎯 Passo 1: Preparar o Projeto

### 1.1 Verificar Arquivos Necessários

```bash
# Verificar se existe vercel.json (opcional)
ls vercel.json

# Verificar se existe .vercelignore
ls .vercelignore
```

### 1.2 Criar `vercel.json` (se não existir)

Crie o arquivo `vercel.json` na raiz do projeto:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 1.3 Verificar `package.json`

Certifique-se que tem os scripts corretos:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🌐 Passo 2: Conectar ao Vercel

### 2.1 Acessar Vercel

1. Acesse: https://vercel.com
2. Faça login ou crie uma conta
3. Clique em **"Add New..."** → **"Project"**

### 2.2 Importar Repositório

1. Selecione seu provedor Git (GitHub, GitLab, Bitbucket)
2. Autorize o Vercel a acessar seus repositórios
3. Selecione o repositório do projeto
4. Clique em **"Import"**

---

## ⚙️ Passo 3: Configurar o Projeto

### 3.1 Configurações Básicas

Na tela de configuração:

**Framework Preset**: Vite  
**Root Directory**: `./` (raiz)  
**Build Command**: `npm run build` (ou deixe em branco para usar o padrão)  
**Output Directory**: `dist` (ou deixe em branco para usar o padrão)  
**Install Command**: `npm install` (ou deixe em branco)

### 3.2 Variáveis de Ambiente

**IMPORTANTE**: Clique em **"Environment Variables"** e adicione:

#### Variáveis Obrigatórias

```bash
# Supabase (obtenha no dashboard do Supabase)
VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_WVn4OOnU853X3kGXwi2miA_9HmLO83V
VITE_SUPABASE_PROJECT_ID=xhdowzacfujckjelqhtd

# CORS (seus domínios - IMPORTANTE!)
ALLOWED_ORIGINS=https://yourdomain.vercel.app

# Feature Flags
VITE_FEATURE_COMMUNITY_ALERTS=false
VITE_FEATURE_MAPS_V4=true

# Base URL (será preenchido automaticamente pelo Vercel)
BASE_URL=https://yourdomain.vercel.app
```

#### Como Adicionar Variáveis

Para cada variável:

1. **Name**: Nome da variável (ex: `VITE_SUPABASE_URL`)
2. **Value**: Valor da variável (ex: `https://xhdowzacfujckjelqhtd.supabase.co`)
3. **Environment**: Selecione onde usar:
   - ✅ **Production** (produção)
   - ✅ **Preview** (staging/preview)
   - ✅ **Development** (desenvolvimento local)
4. Clique em **"Add"**

### 3.3 Configurações Avançadas (Opcional)

Clique em **"Advanced"** se quiser configurar:

- **Node.js Version**: 18.x (recomendado)
- **Install Command**: `npm ci` (mais rápido que `npm install`)
- **Build Command**: `npm run build`

---

## 🚀 Passo 4: Deploy

### 4.1 Iniciar Deploy

1. Revise todas as configurações
2. Clique em **"Deploy"**
3. Aguarde o build (2-5 minutos)

### 4.2 Acompanhar Build

Você verá:
- ✅ Clonando repositório
- ✅ Instalando dependências
- ✅ Building
- ✅ Deploying

### 4.3 Deploy Concluído

Quando terminar, você verá:
- 🎉 **Congratulations!**
- URL do projeto: `https://seu-projeto.vercel.app`

---

## 🔧 Passo 5: Configurações Pós-Deploy

### 5.1 Configurar Domínio Customizado (Opcional)

1. No dashboard do projeto, clique em **"Settings"**
2. Clique em **"Domains"**
3. Adicione seu domínio customizado
4. Siga as instruções para configurar DNS

### 5.2 Atualizar ALLOWED_ORIGINS

Depois de ter o domínio final:

1. Vá em **"Settings"** → **"Environment Variables"**
2. Edite `ALLOWED_ORIGINS`
3. Adicione todos os domínios (separados por vírgula):

```bash
ALLOWED_ORIGINS=https://seu-projeto.vercel.app,https://yourdomain.com
```

4. Clique em **"Save"**
5. Faça um novo deploy para aplicar

### 5.3 Configurar Redirects (Opcional)

Se quiser redirecionar www para não-www (ou vice-versa):

Crie/edite `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "https://www.yourdomain.com/:path*",
      "destination": "https://yourdomain.com/:path*",
      "permanent": true
    }
  ]
}
```

---

## 🔒 Passo 6: Configurar Secrets no Supabase

**IMPORTANTE**: Secrets administrativos NÃO vão no Vercel!

### 6.1 Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **"Edge Functions"** → **"Secrets"**

### 6.2 Adicionar Secrets

Adicione os seguintes secrets:

```bash
# CORS (mesmo valor do Vercel)
ALLOWED_ORIGINS=https://seu-projeto.vercel.app

# Stripe (se usar)
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Resend (se usar email)
RESEND_API_KEY=re_your_key

# Ambiente
DENO_ENV=production
```

### 6.3 Aplicar Secrets

1. Clique em **"Save"**
2. As edge functions serão reiniciadas automaticamente

---

## ✅ Passo 7: Testar o Deploy

### 7.1 Testar Site

1. Acesse a URL do Vercel: `https://seu-projeto.vercel.app`
2. Verifique se carrega corretamente
3. Teste autenticação
4. Teste funcionalidades principais

### 7.2 Verificar Console do Navegador

Abra DevTools (F12) e verifique:
- ✅ Sem erros no console
- ✅ Conexão com Supabase funcionando
- ✅ Sem avisos de CORS

### 7.3 Testar CORS

```bash
# Testar de outro domínio
curl -H "Origin: https://seu-projeto.vercel.app" \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/nominatim-proxy?q=test

# Deve retornar dados, não erro de CORS
```

---

## 🔄 Passo 8: Configurar Deploy Automático

### 8.1 Deploy Automático no Push

Por padrão, o Vercel já faz deploy automático quando você:
- Faz push para a branch `main` → Deploy em **Production**
- Faz push para outras branches → Deploy em **Preview**

### 8.2 Configurar Branches

1. Vá em **"Settings"** → **"Git"**
2. Configure:
   - **Production Branch**: `main` (ou `master`)
   - **Preview Branches**: Todas as outras

### 8.3 Desabilitar Deploy Automático (Opcional)

Se quiser controle manual:

1. Vá em **"Settings"** → **"Git"**
2. Desmarque **"Automatically deploy"**

---

## 📊 Passo 9: Monitoramento

### 9.1 Ver Logs

1. No dashboard do projeto
2. Clique em **"Deployments"**
3. Clique em um deploy
4. Veja **"Build Logs"** e **"Function Logs"**

### 9.2 Analytics (Opcional)

1. Vá em **"Analytics"**
2. Veja:
   - Visitantes
   - Page views
   - Performance
   - Web Vitals

### 9.3 Configurar Alertas (Opcional)

1. Vá em **"Settings"** → **"Notifications"**
2. Configure alertas para:
   - Deploy failures
   - Performance issues
   - Downtime

---

## 🐛 Troubleshooting

### Erro: "Build failed"

**Solução**:
1. Verifique os logs de build
2. Teste localmente: `npm run build`
3. Verifique se todas as dependências estão no `package.json`

### Erro: "CORS blocked"

**Solução**:
1. Verifique `ALLOWED_ORIGINS` no Vercel
2. Verifique `ALLOWED_ORIGINS` no Supabase Edge Functions
3. Certifique-se que os domínios estão corretos

### Erro: "Environment variable not found"

**Solução**:
1. Vá em **"Settings"** → **"Environment Variables"**
2. Verifique se todas as variáveis estão configuradas
3. Certifique-se que estão marcadas para **Production**
4. Faça um novo deploy

### Site carrega mas não conecta ao Supabase

**Solução**:
1. Verifique `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Abra DevTools (F12) e veja erros no console
3. Teste a conexão manualmente

### Deploy demora muito

**Solução**:
1. Use `npm ci` ao invés de `npm install`
2. Adicione cache de dependências
3. Otimize o build do Vite

---

## 📋 Checklist Final

Antes de considerar o deploy completo:

### Vercel
- [ ] Projeto importado e configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy em produção funcionando
- [ ] Domínio customizado configurado (se aplicável)
- [ ] CORS configurado corretamente
- [ ] Site acessível e funcionando

### Supabase
- [ ] Edge Functions secrets configurados
- [ ] CORS configurado nas edge functions
- [ ] Conexão testada e funcionando
- [ ] RLS policies ativas

### Testes
- [ ] Site carrega corretamente
- [ ] Autenticação funciona
- [ ] Sem erros no console
- [ ] CORS funcionando
- [ ] Performance aceitável

### Segurança
- [ ] Sem credenciais hardcoded
- [ ] HTTPS ativo (automático no Vercel)
- [ ] Headers de segurança configurados
- [ ] Rate limiting ativo

---

## 🎯 Comandos Úteis

### Vercel CLI (Opcional)

Instalar:
```bash
npm install -g vercel
```

Login:
```bash
vercel login
```

Deploy manual:
```bash
vercel --prod
```

Ver logs:
```bash
vercel logs
```

Listar projetos:
```bash
vercel list
```

---

## 📞 Suporte

### Documentação Oficial
- Vercel: https://vercel.com/docs
- Vite: https://vitejs.dev/guide/
- Supabase: https://supabase.com/docs

### Guias do Projeto
- **Este Guia**: `VERCEL_DEPLOY_GUIDE.md`
- **Segurança**: `SECURITY_VERCEL_GUIDE.md`
- **Quick Start**: `QUICK_START_SECURITY.md`

### Contato
- Email: security@ordax.com
- Slack: #deployment

---

## 🎉 Pronto!

Seu projeto está no ar! 🚀

**URL**: https://seu-projeto.vercel.app

**Próximos passos**:
1. Compartilhe com a equipe
2. Configure monitoramento
3. Adicione domínio customizado
4. Configure CI/CD avançado

---

**Última Atualização**: 2026-04-15  
**Versão**: 1.0  
**Status**: ✅ Completo
