# 🚀 Guia de Deploy - Vercel

Este guia explica como fazer o deploy do **Achegue-se** na Vercel.

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com) com projeto configurado
- Repositório Git (GitHub, GitLab ou Bitbucket)

## 🔧 Configuração Inicial

### 1. Preparar o Repositório

```bash
# Certifique-se de que todas as alterações estão commitadas
git add .
git commit -m "Preparar para deploy na Vercel"
git push origin main
```

### 2. Importar Projeto na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte seu repositório Git
3. Selecione o repositório do projeto
4. Configure as seguintes opções:

**Framework Preset:** Vite
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

### 3. Configurar Variáveis de Ambiente

No painel da Vercel, vá em **Settings > Environment Variables** e adicione:

#### ✅ Obrigatórias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
```

#### 🔧 Opcionais (mas recomendadas)

```env
# Sentry (Monitoramento de erros)
VITE_SENTRY_DSN=seu_sentry_dsn

# Feature Flags
VITE_FEATURE_COMMUNITY_ALERTS=true
VITE_FEATURE_MAPS_V4=true

# Google Maps (se usar)
VITE_GOOGLE_MAPS_API_KEY=sua_google_maps_api_key
```

#### 💳 Stripe (se usar pagamentos)

```env
STRIPE_SECRET_KEY=sk_live_sua_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_sua_publishable_key
STRIPE_PRICE_ID_PRO=price_seu_plano_pro
STRIPE_PRICE_ID_DELIVERY=price_seu_plano_delivery
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret
```

### 4. Configurar Domínio Personalizado

1. Vá em **Settings > Domains**
2. Adicione `acheguese.com.br`
3. Configure os registros DNS conforme instruções da Vercel:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 🚀 Deploy

### Deploy Automático

Após a configuração inicial, cada push para a branch `main` fará deploy automático:

```bash
git push origin main
```

### Deploy Manual

Via CLI da Vercel:

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy de produção
vercel --prod
```

## 🔍 Verificação Pós-Deploy

Após o deploy, verifique:

- ✅ Site carrega corretamente
- ✅ Autenticação funciona (login/registro)
- ✅ Conexão com Supabase está OK
- ✅ Mapas carregam (se aplicável)
- ✅ Imagens e assets carregam
- ✅ SEO tags estão corretas (view-source)
- ✅ Certificado SSL está ativo (HTTPS)

### Comandos de Verificação

```bash
# Verificar build localmente
npm run build
npm run preview

# Verificar tipos TypeScript
npm run typecheck

# Verificar linting
npm run lint

# Verificar SSOT compliance
npm run validate:ssot
```

## 🐛 Troubleshooting

### Erro: "Build failed"

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro: "Environment variables not found"

- Verifique se todas as variáveis obrigatórias estão configuradas na Vercel
- Certifique-se de que os nomes começam com `VITE_` para serem expostas ao frontend

### Erro: "Supabase connection failed"

- Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão corretas
- Teste a conexão localmente primeiro

### Erro 404 em rotas

- Verifique se `vercel.json` tem a configuração de rewrites correta
- A configuração já está incluída no arquivo `vercel.json`

## 📊 Monitoramento

### Analytics da Vercel

Acesse **Analytics** no painel da Vercel para ver:
- Pageviews
- Tempo de carregamento
- Core Web Vitals
- Erros

### Logs

Acesse **Deployments > [seu deploy] > Logs** para ver:
- Build logs
- Runtime logs
- Erros de servidor

## 🔄 Rollback

Se algo der errado:

1. Vá em **Deployments**
2. Encontre o deploy anterior que funcionava
3. Clique nos três pontos (...)
4. Selecione **Promote to Production**

## 📝 Checklist de Deploy

- [ ] Código commitado e pushed
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Build local funciona (`npm run build`)
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Linting sem erros (`npm run lint`)
- [ ] Domínio personalizado configurado
- [ ] DNS configurado corretamente
- [ ] SSL/HTTPS ativo
- [ ] Supabase conectado
- [ ] Testes básicos passando
- [ ] SEO tags verificadas
- [ ] Performance verificada (Lighthouse)

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Vite](https://vitejs.dev/guide/)
- [Documentação Supabase](https://supabase.com/docs)
- [Painel Vercel](https://vercel.com/dashboard)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no painel da Vercel
2. Consulte a documentação oficial
3. Verifique issues no GitHub do projeto
4. Entre em contato com o time de desenvolvimento

---

**Última atualização:** Abril 2026  
**Versão:** 1.0.0
