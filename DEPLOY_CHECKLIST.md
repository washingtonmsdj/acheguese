# ✅ Checklist de Deploy - Vercel

Use este checklist para garantir que tudo está configurado corretamente antes e depois do deploy.

## 📋 Pré-Deploy

### Código e Repositório
- [ ] Todas as alterações commitadas
- [ ] Branch `main` atualizada
- [ ] Código pushed para o repositório remoto
- [ ] `.gitignore` configurado (não commitar `.env` com valores reais)

### Build Local
- [ ] `npm install` executado sem erros
- [ ] `npm run build` funciona localmente
- [ ] `npm run preview` mostra o site funcionando
- [ ] `npm run typecheck` sem erros TypeScript
- [ ] `npm run lint` sem erros de linting
- [ ] `npm run verify:deploy` passou com sucesso

### Arquivos de Configuração
- [ ] `vercel.json` existe e está configurado
- [ ] `.vercelignore` existe
- [ ] `package.json` tem script `build`
- [ ] `vite.config.ts` está correto
- [ ] `index.html` tem meta tags SEO
- [ ] `robots.txt` tem domínio correto (`acheguese.com.br`)

### Supabase
- [ ] Projeto Supabase criado e configurado
- [ ] Migrations aplicadas no banco
- [ ] RLS (Row Level Security) configurado
- [ ] Storage buckets criados (se necessário)
- [ ] Auth providers configurados
- [ ] URL e chaves anotadas para configuração

## 🚀 Durante o Deploy

### Vercel - Configuração Inicial
- [ ] Projeto importado na Vercel
- [ ] Framework detectado como Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`

### Variáveis de Ambiente - Obrigatórias
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configurada

### Variáveis de Ambiente - Opcionais
- [ ] `VITE_SENTRY_DSN` (se usar Sentry)
- [ ] `VITE_FEATURE_COMMUNITY_ALERTS` (true/false)
- [ ] `VITE_FEATURE_MAPS_V4` (true/false)
- [ ] `VITE_GOOGLE_MAPS_API_KEY` (se usar Google Maps)
- [ ] Variáveis Stripe (se usar pagamentos)

### Deploy
- [ ] Primeiro deploy iniciado
- [ ] Build completou sem erros
- [ ] Deploy bem-sucedido
- [ ] URL de preview gerada

## ✅ Pós-Deploy

### Verificação Básica
- [ ] Site abre na URL da Vercel
- [ ] Página inicial carrega corretamente
- [ ] Imagens e assets carregam
- [ ] CSS/estilos aplicados corretamente
- [ ] Sem erros no console do navegador
- [ ] HTTPS ativo (cadeado verde)

### Funcionalidades Core
- [ ] Navegação entre páginas funciona
- [ ] Login/registro funciona
- [ ] Autenticação persiste após reload
- [ ] Logout funciona
- [ ] Rotas protegidas redirecionam corretamente

### Integração Supabase
- [ ] Conexão com Supabase estabelecida
- [ ] Queries ao banco funcionam
- [ ] Auth funciona (login/registro)
- [ ] Upload de imagens funciona (se aplicável)
- [ ] RLS está funcionando (testar permissões)

### SEO e Meta Tags
- [ ] Title tag correto (view-source)
- [ ] Meta description presente
- [ ] Open Graph tags corretas
- [ ] Twitter cards configuradas
- [ ] Favicon aparece
- [ ] robots.txt acessível (`/robots.txt`)
- [ ] Sitemap acessível (se implementado)

### Performance
- [ ] Lighthouse score > 80 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)
- [ ] Core Web Vitals OK (LCP, FID, CLS)
- [ ] Tempo de carregamento < 3s

### Responsividade
- [ ] Desktop (1920x1080) OK
- [ ] Laptop (1366x768) OK
- [ ] Tablet (768x1024) OK
- [ ] Mobile (375x667) OK
- [ ] Mobile landscape OK

### Navegadores
- [ ] Chrome/Edge (Chromium) OK
- [ ] Firefox OK
- [ ] Safari (se possível) OK
- [ ] Mobile browsers OK

## 🌐 Domínio Personalizado

### Configuração DNS
- [ ] Domínio `acheguese.com.br` adicionado na Vercel
- [ ] Registro A configurado (@ → 76.76.21.21)
- [ ] Registro CNAME configurado (www → cname.vercel-dns.com)
- [ ] DNS propagado (verificar em https://dnschecker.org)
- [ ] SSL/TLS certificado emitido
- [ ] Redirect www → apex (ou vice-versa) configurado

### Verificação Domínio
- [ ] `https://acheguese.com.br` abre
- [ ] `https://www.acheguese.com.br` abre
- [ ] Redirect funciona corretamente
- [ ] HTTPS forçado (HTTP → HTTPS)
- [ ] Certificado SSL válido

## 📊 Monitoramento

### Vercel Analytics
- [ ] Analytics ativado no projeto
- [ ] Pageviews sendo registrados
- [ ] Web Vitals sendo coletados

### Sentry (se configurado)
- [ ] Sentry DSN configurado
- [ ] Erros sendo capturados
- [ ] Source maps funcionando
- [ ] Alertas configurados

### Logs
- [ ] Logs de build acessíveis
- [ ] Logs de runtime acessíveis
- [ ] Sem erros críticos nos logs

## 🔄 CI/CD

### Deploy Automático
- [ ] Push para `main` dispara deploy
- [ ] Preview deploys em PRs funcionando
- [ ] Notificações de deploy configuradas (opcional)

### Rollback
- [ ] Sabe como fazer rollback (Deployments > Promote)
- [ ] Deploy anterior testado e funcional

## 📱 Testes Finais

### Fluxo de Usuário
- [ ] Novo usuário consegue se registrar
- [ ] Usuário consegue fazer login
- [ ] Usuário consegue navegar pelo site
- [ ] Usuário consegue usar funcionalidades principais
- [ ] Usuário consegue fazer logout

### Fluxos Críticos (específicos do projeto)
- [ ] Busca de estabelecimentos funciona
- [ ] Visualização de perfis funciona
- [ ] Mapas carregam (se aplicável)
- [ ] Classificados aparecem (se aplicável)
- [ ] Comunidade funciona (se aplicável)

## 🎉 Deploy Completo!

Quando todos os itens estiverem marcados:

- [ ] **Deploy está completo e funcional**
- [ ] **Documentação atualizada**
- [ ] **Time notificado**
- [ ] **Usuários podem acessar**

---

## 📝 Notas

**Data do Deploy:** _______________

**URL de Produção:** https://acheguese.com.br

**URL Vercel:** _______________

**Versão Deployada:** _______________

**Responsável:** _______________

**Observações:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

**Última atualização:** Abril 2026
