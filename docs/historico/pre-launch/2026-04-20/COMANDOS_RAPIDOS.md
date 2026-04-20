# ⚡ COMANDOS RÁPIDOS — Referência de Deploy

> **Guia rápido de comandos para deploy e manutenção**

---

## 🚀 DEPLOY INICIAL

### 1. Edge Functions
```bash
# Deploy sitemap
npx supabase functions deploy sitemap

# Deploy health check
npx supabase functions deploy health-check

# Verificar
curl https://[projeto].supabase.co/functions/v1/sitemap
curl https://[projeto].supabase.co/functions/v1/health-check
```

### 2. Migrations
```bash
# Aplicar logs
npx tsx scripts/apply-logs-migration.ts

# Aplicar analytics
npx tsx scripts/apply-analytics-migration.ts

# Verificar
npx supabase db diff
```

### 3. Smoke Tests
```bash
# Local
npx tsx scripts/smoke-tests.ts local

# Staging
npx tsx scripts/smoke-tests.ts staging

# Production
npx tsx scripts/smoke-tests.ts production
```

### 4. Deploy Vercel
```bash
# Via CLI
vercel --prod

# Via Git
git push origin main
```

---

## 🔄 MANUTENÇÃO DIÁRIA

### Verificar Status
```bash
# Status page
curl https://ordax.com.br/status

# Health check
curl https://[projeto].supabase.co/functions/v1/health-check

# Smoke tests
npx tsx scripts/smoke-tests.ts production
```

### Monitorar Logs
```bash
# Vercel logs
vercel logs

# Supabase logs
npx supabase functions logs health-check
npx supabase functions logs sitemap
```

### Verificar Métricas
- Vercel Analytics: https://vercel.com/ordax/analytics
- Sentry: https://sentry.io/organizations/ordax/issues/
- Supabase: Dashboard → Metrics
- Status Page: https://ordax.com.br/status

---

## 💾 BACKUP

### Backup Manual
```bash
# Storage
npx tsx scripts/backup-storage.ts

# Config
npx tsx scripts/backup-config.ts

# Database (via Supabase CLI)
npx supabase db dump -f backup-$(date +%Y%m%d).sql
```

### Restore
```bash
# Storage
npx tsx scripts/restore-storage.ts backups/storage-2026-04-19

# Database
npx supabase db reset --db-url "postgresql://..."
```

---

## 🚨 EMERGÊNCIA

### Rollback Vercel (< 1 min)
```bash
# Via CLI
vercel rollback

# Via Dashboard
# https://vercel.com/ordax/deployments
# Click em deployment anterior → "Promote to Production"
```

### Desabilitar Feature (Instantâneo)
```typescript
// src/shared/utils/featureFlags.ts
FEATURE_NAME: {
  enabled: false,
}
```

### Rollback Database (< 5 min)
```bash
# Rollback última migration
npx supabase migration down

# Restore de backup
# Via Dashboard: Settings → Database → Backups → Restore
```

---

## 🔍 DEBUGGING

### Verificar Build
```bash
# TypeScript
npm run type-check

# Linting
npm run lint

# Tests
npm run test

# Build
npm run build

# Bundle size
npm run build -- --analyze
```

### Verificar Supabase
```bash
# Status
npx supabase status

# Migrations
npx supabase migration list

# Diff
npx supabase db diff
```

---

## 📊 SEO

### Gerar Sitemap
```bash
npx tsx scripts/generate-sitemap.ts
```

### Verificar SEO
```bash
# Robots.txt
curl https://ordax.com.br/robots.txt

# Sitemap
curl https://ordax.com.br/sitemap.xml

# Status page
curl https://ordax.com.br/status
```

### Submeter Sitemap
- Google: https://search.google.com/search-console
- Bing: https://www.bing.com/webmasters

---

## 🧪 TESTES

### Smoke Tests
```bash
# Todos ambientes
npx tsx scripts/smoke-tests.ts local
npx tsx scripts/smoke-tests.ts staging
npx tsx scripts/smoke-tests.ts production
```

### Performance
```bash
# Lighthouse
npx lighthouse https://ordax.com.br --view

# Bundle size
npm run build -- --analyze
```

---

## 📈 FEATURE FLAGS

### Ajustar Rollout
```typescript
// src/shared/utils/featureFlags.ts

// Alpha (1%)
rolloutPercentage: 1

// Beta (10%)
rolloutPercentage: 10

// Gradual (25%, 50%, 75%)
rolloutPercentage: 25
rolloutPercentage: 50
rolloutPercentage: 75

// Full (100%)
rolloutPercentage: 100
```

### Desabilitar Feature
```typescript
FEATURE_NAME: {
  enabled: false,
}
```

---

## 🔐 SEGURANÇA

### Verificar Headers
```bash
# Local
curl -I http://localhost:5173

# Production
curl -I https://ordax.com.br
```

### Validar CSP
- CSP Evaluator: https://csp-evaluator.withgoogle.com/
- SecurityHeaders: https://securityheaders.com/?q=ordax.com.br
- Mozilla Observatory: https://observatory.mozilla.org/

---

## 📦 DEPENDÊNCIAS

### Atualizar
```bash
# Check updates
npm outdated

# Update all
npm update

# Update specific
npm update @supabase/supabase-js
```

### Audit
```bash
# Security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 🎯 LINKS ÚTEIS

### Dashboards
- Vercel: https://vercel.com/ordax
- Supabase: https://supabase.com/dashboard
- Sentry: https://sentry.io/organizations/ordax
- UptimeRobot: https://uptimerobot.com/

### Documentação
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Sentry: https://docs.sentry.io/
- React Query: https://tanstack.com/query/latest

### Ferramentas
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster: https://www.bing.com/webmasters
- Lighthouse: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/

---

## 📞 SUPORTE

### Contatos
- Tech Lead: [telefone]
- DevOps: [telefone]
- CEO: [telefone]

### Suporte Técnico
- Supabase: https://supabase.com/support
- Vercel: https://vercel.com/support
- Sentry: https://sentry.io/support

---

*Atualizado: 2026-04-19*  
*Versão: 1.0.0*

