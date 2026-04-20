# 🔒 Guia de Segurança - Vercel Deploy

## ⚠️ IMPORTANTE: Sobre o arquivo `.env`

### Status Atual

**PROBLEMA IDENTIFICADO**: O arquivo `.env` está commitado no repositório, mesmo estando no `.gitignore`.

### Por que isso é um problema?

1. **Histórico do Git**: Mesmo que você delete o arquivo agora, ele permanece no histórico
2. **Exposição de Informações**: Project ID, URL e chaves públicas estão visíveis
3. **Má Prática**: Arquivos `.env` nunca devem ser commitados

### É Seguro?

**Resposta Curta**: ⚠️ **Parcialmente Seguro**

**Análise Detalhada**:

| Item | Status | Risco | Explicação |
|------|--------|-------|------------|
| `VITE_SUPABASE_URL` | ⚠️ Exposto | Baixo | URL é pública por natureza |
| `VITE_SUPABASE_PROJECT_ID` | ⚠️ Exposto | Baixo | Project ID é visível no frontend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ⚠️ Exposto | **Baixo** | É uma chave **pública** (anon key) |
| `SUPABASE_DB_URL` | ✅ Seguro | Nenhum | Contém `[PASSWORD]` placeholder |
| Credenciais de Teste | ✅ Removidas | Nenhum | Já foram removidas |

### Por que a Publishable Key é "Segura"?

A `VITE_SUPABASE_PUBLISHABLE_KEY` (também chamada de "anon key"):

✅ **É PROJETADA para ser pública**:
- Usada no frontend (JavaScript do navegador)
- Qualquer pessoa pode ver no código fonte do site
- Protegida por RLS (Row Level Security) no banco

✅ **Tem permissões limitadas**:
- Não pode acessar dados sem autenticação
- Não pode fazer operações administrativas
- Não pode bypassar RLS policies

❌ **MAS ainda assim**:
- Não deveria estar no repositório Git
- Deveria ser configurada via variáveis de ambiente
- Facilita ataques de reconhecimento

---

## 🛡️ Correção Recomendada

### Opção 1: Remover do Histórico (Recomendado)

```bash
# ⚠️ ATENÇÃO: Isso reescreve o histórico do Git!
# Faça backup antes de executar

# 1. Instalar BFG Repo-Cleaner
# Download: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Fazer backup
git clone --mirror https://github.com/seu-usuario/seu-repo.git repo-backup

# 3. Remover .env do histórico
java -jar bfg.jar --delete-files .env repo-backup

# 4. Limpar e fazer push
cd repo-backup
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# 5. Todos os colaboradores devem re-clonar o repositório
```

### Opção 2: Aceitar o Risco (Mais Simples)

Se você aceita que a chave pública está exposta:

```bash
# 1. Remover .env do tracking (mas mantém no histórico)
git rm --cached .env

# 2. Commitar
git commit -m "security: remove .env from tracking"

# 3. Push
git push
```

**Nota**: A chave ainda estará no histórico, mas não será mais rastreada.

### Opção 3: Rotacionar Chaves (Mais Seguro)

```bash
# 1. Gerar novas chaves no Supabase Dashboard
# Settings > API > Reset anon key

# 2. Atualizar .env.local com nova chave

# 3. Remover .env do tracking
git rm --cached .env

# 4. Commitar
git commit -m "security: rotate keys and remove .env"

# 5. Push
git push
```

---

## 🚀 Configuração Segura no Vercel

### 1. Variáveis de Ambiente no Vercel

**Dashboard do Vercel** → **Settings** → **Environment Variables**

Configure as seguintes variáveis:

#### Production
```bash
VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[ROTATED_KEY_REMOVED]
VITE_SUPABASE_PROJECT_ID=xhdowzacfujckjelqhtd
VITE_FEATURE_COMMUNITY_ALERTS=false
VITE_FEATURE_MAPS_V4=true
BASE_URL=https://yourdomain.com
```

#### Preview (Staging)
```bash
VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[ROTATED_KEY_REMOVED]
VITE_SUPABASE_PROJECT_ID=xhdowzacfujckjelqhtd
VITE_FEATURE_COMMUNITY_ALERTS=false
VITE_FEATURE_MAPS_V4=true
BASE_URL=https://preview.yourdomain.com
```

#### Development
```bash
VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[ROTATED_KEY_REMOVED]
VITE_SUPABASE_PROJECT_ID=xhdowzacfujckjelqhtd
VITE_FEATURE_COMMUNITY_ALERTS=false
VITE_FEATURE_MAPS_V4=true
BASE_URL=http://localhost:8080
```

### 2. Secrets (Não Expor no Frontend)

⚠️ **NUNCA configure no Vercel** (são para backend/scripts apenas):
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Senhas de teste

Essas devem estar **apenas** em:
- `.env.local` (desenvolvimento local)
- Supabase Edge Functions Secrets (produção)

---

## 📋 Checklist de Deploy no Vercel

### Antes do Deploy

- [ ] `.env` removido do tracking Git
- [ ] Variáveis de ambiente configuradas no Vercel Dashboard
- [ ] `.vercelignore` configurado corretamente
- [ ] Build local testado: `npm run build`
- [ ] Preview deploy testado

### Configuração no Vercel

- [ ] **Build Command**: `npm run build` ou `vite build`
- [ ] **Output Directory**: `dist`
- [ ] **Install Command**: `npm install`
- [ ] **Framework Preset**: Vite

### Variáveis de Ambiente

- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configurada
- [ ] `VITE_SUPABASE_PROJECT_ID` configurada
- [ ] Feature flags configuradas
- [ ] `BASE_URL` configurada

### Após Deploy

- [ ] Testar autenticação
- [ ] Testar conexão com Supabase
- [ ] Verificar console do navegador (sem erros)
- [ ] Testar CORS
- [ ] Verificar que secrets não estão expostos

---

## 🔒 Segurança no Vercel

### O que o Vercel Protege

✅ **Variáveis de Ambiente**:
- Não são expostas no código do cliente
- Apenas variáveis com prefixo `VITE_` são incluídas no build
- Outras variáveis ficam apenas no servidor

✅ **Build Seguro**:
- Build acontece em ambiente isolado
- Secrets não vazam para o frontend

✅ **HTTPS Automático**:
- Certificado SSL gratuito
- HTTPS enforçado automaticamente

### O que o Vercel NÃO Protege

❌ **Variáveis com prefixo `VITE_`**:
- São incluídas no bundle JavaScript
- Ficam visíveis no código fonte do navegador
- **Por isso só use para chaves públicas!**

❌ **Código do Frontend**:
- Todo código JavaScript é público
- Qualquer pessoa pode ver no DevTools
- **Nunca coloque secrets no código frontend!**

---

## 🎯 Recomendações Finais

### Para Desenvolvimento Local

```bash
# .env.local (NÃO commitar)
VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[ROTATED_KEY_REMOVED]
VITE_SUPABASE_PROJECT_ID=xhdowzacfujckjelqhtd

# Secrets (apenas para scripts backend)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_your_key
```

### Para Vercel (Produção)

**Variáveis de Ambiente no Dashboard**:
```bash
# Apenas variáveis públicas (prefixo VITE_)
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

**Secrets no Supabase Edge Functions**:
```bash
# Secrets administrativos
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## ❓ FAQ

### P: É seguro ter a Publishable Key no código?
**R**: ✅ Sim! É uma chave **pública** projetada para isso. Ela é protegida por RLS no Supabase.

### P: Preciso rotacionar a chave exposta no Git?
**R**: ⚠️ Recomendado, mas não crítico. A chave pública tem permissões limitadas.

### P: Como proteger a Service Role Key?
**R**: 🔒 **NUNCA** coloque no frontend. Use apenas em:
- Scripts backend locais (`.env.local`)
- Supabase Edge Functions (Secrets)
- Nunca no Vercel (a menos que seja para API routes)

### P: O Vercel é seguro?
**R**: ✅ Sim! O Vercel é uma plataforma confiável usada por milhões. Mas:
- Configure variáveis de ambiente corretamente
- Não exponha secrets no frontend
- Use HTTPS (automático no Vercel)

### P: Preciso remover .env do histórico do Git?
**R**: ⚠️ Recomendado se:
- Repositório é público
- Há colaboradores externos
- Quer seguir melhores práticas

Não é crítico se:
- Repositório é privado
- Apenas chaves públicas estão expostas
- Você aceita o risco

---

## 📞 Suporte

**Documentação**:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Este Guia: `SECURITY_VERCEL_GUIDE.md`

**Contato**:
- Email: security@ordax.com
- Slack: #security

---

**Última Atualização**: 2026-04-15  
**Status**: ✅ Guia Completo
