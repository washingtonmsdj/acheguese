# ✅ CHECKLIST DE LANÇAMENTO — Ordax SaaS

> **Imprima este documento e marque cada item conforme completa**

---

## 📅 DIA DO LANÇAMENTO

**Data**: _______________  
**Responsável**: _______________  
**Horário de Início**: _______________

---

## ⏰ FASE 1: PREPARAÇÃO (3 horas)

### 🚀 Deploy Edge Functions (15 min)
- [ ] Deploy sitemap: `npx supabase functions deploy sitemap`
- [ ] Deploy health-check: `npx supabase functions deploy health-check`
- [ ] Testar sitemap: `curl https://[projeto].supabase.co/functions/v1/sitemap`
- [ ] Testar health-check: `curl https://[projeto].supabase.co/functions/v1/health-check`
- [ ] Verificar logs sem erros

**Horário de Conclusão**: _______________

---

### 💾 Aplicar Migrations (30 min)
- [ ] Aplicar logs: `npx tsx scripts/apply-logs-migration.ts`
- [ ] Aplicar analytics: `npx tsx scripts/apply-analytics-migration.ts`
- [ ] Verificar diff: `npx supabase db diff`
- [ ] Testar queries nas novas tabelas
- [ ] Verificar RLS funcionando

**Horário de Conclusão**: _______________

---

### 🔄 Configurar Backups (30 min)
- [ ] Acessar Supabase Dashboard → Settings → Database → Backups
- [ ] Habilitar "Automated Backups"
- [ ] Configurar retention: 30 days
- [ ] Habilitar PITR (Point-in-Time Recovery)
- [ ] Executar backup manual de teste
- [ ] Verificar backup criado com sucesso

**Horário de Conclusão**: _______________

---

### 🚨 Configurar Alertas (1 hora)

#### Sentry
- [ ] Acessar https://sentry.io/organizations/ordax/
- [ ] Settings → Alerts
- [ ] Criar alerta: Error rate > 1% em 5 min
- [ ] Criar alerta: Performance degradation (p95 > 3s)
- [ ] Criar alerta: New critical issue
- [ ] Configurar notificações (email + Slack)
- [ ] Testar alertas

#### Supabase
- [ ] Acessar Settings → Alerts
- [ ] Criar alerta: Database CPU > 80%
- [ ] Criar alerta: Database connections > 80%
- [ ] Criar alerta: Storage > 80%
- [ ] Criar alerta: API errors > 100/min
- [ ] Configurar notificações

#### UptimeRobot
- [ ] Criar conta: https://uptimerobot.com/
- [ ] Adicionar monitor: Website (https://ordax.com.br)
- [ ] Adicionar monitor: Status page (https://ordax.com.br/status)
- [ ] Adicionar monitor: Health check (edge function)
- [ ] Configurar notificações
- [ ] Testar monitors

**Horário de Conclusão**: _______________

---

### 🧪 Executar Smoke Tests (30 min)
- [ ] Build: `npm run build`
- [ ] Preview: `npm run preview`
- [ ] Smoke tests local: `npx tsx scripts/smoke-tests.ts local`
- [ ] Resultado: ___/12 testes passando
- [ ] Smoke tests staging: `npx tsx scripts/smoke-tests.ts staging`
- [ ] Resultado: ___/12 testes passando
- [ ] Corrigir erros (se houver)

**Horário de Conclusão**: _______________

---

## ⏰ FASE 2: DEPLOY PRODUÇÃO (30 min)

### ✅ Verificações Finais
- [ ] TypeScript: `npm run type-check` (0 erros)
- [ ] Linting: `npm run lint` (0 erros)
- [ ] Tests: `npm run test` (todos passando)
- [ ] Bundle size: `npm run build -- --analyze` (< 500KB gzipped)

**Horário de Conclusão**: _______________

---

### 🚀 Deploy Vercel
- [ ] Executar: `vercel --prod`
- [ ] Aguardar build completar
- [ ] Verificar deploy bem-sucedido
- [ ] Anotar URL de produção: _______________
- [ ] Acessar URL e verificar site carregando

**Horário de Conclusão**: _______________

---

### ✅ Validação Pós-Deploy
- [ ] Smoke tests produção: `npx tsx scripts/smoke-tests.ts production`
- [ ] Resultado: ___/12 testes passando
- [ ] Status page: `curl https://ordax.com.br/status`
- [ ] Sitemap: `curl https://ordax.com.br/sitemap.xml`
- [ ] Robots.txt: `curl https://ordax.com.br/robots.txt`
- [ ] Verificar Sentry (sem erros)
- [ ] Verificar Vercel Analytics (tracking funcionando)

**Horário de Conclusão**: _______________

---

## ⏰ FASE 3: CONFIGURAÇÃO SEO (1 hora)

### 🔍 Google Search Console
- [ ] Acessar: https://search.google.com/search-console
- [ ] Adicionar propriedade: ordax.com.br
- [ ] Verificar domínio (DNS ou HTML)
- [ ] Submeter sitemap: https://ordax.com.br/sitemap.xml
- [ ] Configurar alertas
- [ ] Verificar indexação iniciada

**Horário de Conclusão**: _______________

---

### 🔍 Bing Webmaster Tools
- [ ] Acessar: https://www.bing.com/webmasters
- [ ] Adicionar site: ordax.com.br
- [ ] Verificar domínio
- [ ] Submeter sitemap: https://ordax.com.br/sitemap.xml
- [ ] Verificar indexação iniciada

**Horário de Conclusão**: _______________

---

### 📊 Google Analytics (Opcional)
- [ ] Criar propriedade GA4
- [ ] Adicionar tracking code
- [ ] Configurar goals
- [ ] Testar tracking
- [ ] Verificar dados chegando

**Horário de Conclusão**: _______________

---

## ⏰ FASE 4: ALPHA ROLLOUT (Semana 1)

### 🎯 Configurar Feature Flags (1%)
- [ ] Editar: `src/shared/utils/featureFlags.ts`
- [ ] Ajustar rolloutPercentage: 1
- [ ] Commit e push
- [ ] Deploy automático
- [ ] Verificar feature flags funcionando

**Data de Início**: _______________

---

### 👥 Convidar Participantes
- [ ] Equipe interna (_____ pessoas)
- [ ] Early adopters (_____ pessoas)
- [ ] Enviar emails de convite
- [ ] Preparar onboarding
- [ ] Criar canal de feedback (#alpha-feedback)

**Data de Conclusão**: _______________

---

### 📊 Monitoramento Intensivo
- [ ] Abrir Vercel Analytics
- [ ] Abrir Sentry
- [ ] Abrir Supabase Metrics
- [ ] Abrir Status Page
- [ ] Monitorar error rate (target: < 0.5%)
- [ ] Monitorar response time (target: < 2s)
- [ ] Monitorar success rate (target: > 98%)

**Métricas Dia 1**:
- Error rate: _____%
- Response time p95: _____ms
- Success rate: _____%

**Métricas Dia 7**:
- Error rate: _____%
- Response time p95: _____ms
- Success rate: _____%

---

### 💬 Coleta de Feedback
- [ ] Criar formulário de feedback
- [ ] Enviar pesquisa de satisfação
- [ ] Coletar feedback via Slack
- [ ] Documentar issues encontradas
- [ ] Priorizar ajustes

**Issues Encontradas**: _______________

**Ajustes Necessários**: _______________

---

## ⏰ FASE 5: BETA ROLLOUT (Semana 2)

### 🎯 Aumentar Rollout (10%)
- [ ] Ajustar rolloutPercentage: 10
- [ ] Deploy
- [ ] Convidar beta testers (_____ pessoas)
- [ ] Enviar comunicação
- [ ] Preparar onboarding

**Data de Início**: _______________

---

### 📊 Validar Escala
- [ ] Database CPU: ____% (target: < 50%)
- [ ] Database connections: ____% (target: < 50%)
- [ ] API response time: _____ms (target: < 1s)
- [ ] Cache hit rate: ____% (target: > 90%)
- [ ] Performance estável: [ ] SIM [ ] NÃO

**Data de Conclusão**: _______________

---

## ⏰ FASE 6: GRADUAL ROLLOUT (Semana 3)

### 📈 Rollout 25% (Dias 15-17)
- [ ] Ajustar rolloutPercentage: 25
- [ ] Deploy
- [ ] Monitorar métricas
- [ ] Sem problemas críticos

**Data**: _______________

---

### 📈 Rollout 50% (Dias 18-19)
- [ ] Ajustar rolloutPercentage: 50
- [ ] Deploy
- [ ] Validar carga
- [ ] Performance OK

**Data**: _______________

---

### 📈 Rollout 75% (Dias 20-21)
- [ ] Ajustar rolloutPercentage: 75
- [ ] Deploy
- [ ] Sistema estável
- [ ] Preparado para 100%

**Data**: _______________

---

## ⏰ FASE 7: FULL ROLLOUT (Semana 4)

### 🎉 Rollout 100% (Dia 22)
- [ ] Ajustar rolloutPercentage: 100
- [ ] Deploy
- [ ] Enviar comunicação oficial
- [ ] Equipe de suporte preparada
- [ ] Monitoramento intensivo ativo

**Data**: _______________

---

### 🎊 Celebração!
- [ ] Sistema estável
- [ ] Usuários satisfeitos
- [ ] Métricas positivas
- [ ] Equipe celebrando!
- [ ] Press release enviado
- [ ] Social media posts publicados

**Data**: _______________

---

## 📊 MÉTRICAS FINAIS

### Técnicas
- Error rate: ____% (target: < 0.5%)
- Response time p95: _____ms (target: < 2s)
- Success rate: ____% (target: > 98%)
- Uptime: ____% (target: > 99.9%)
- Cache hit rate: ____% (target: > 90%)

### Negócio
- User satisfaction: ____/5.0 (target: > 4.5)
- Feature adoption: ____% (target: > 60%)
- Retention rate: ____% (target: > 80%)
- NPS: ____ (target: > 50)
- Daily active users: _____

### SEO
- Páginas indexadas: ____% (target: 100%)
- CTR: ____% (target: +40% vs baseline)
- Engagement: ____% (target: +60% vs baseline)
- Rankings: Top ____ (target: Top 10)

---

## ✅ ASSINATURAS

### Aprovações
- [ ] Tech Lead: _______________ Data: _______________
- [ ] Product Manager: _______________ Data: _______________
- [ ] CEO: _______________ Data: _______________

### Confirmações
- [ ] Sistema em produção
- [ ] Monitoramento ativo
- [ ] Equipe de suporte preparada
- [ ] Documentação completa
- [ ] Rollback procedures testados

---

## 🎉 LANÇAMENTO COMPLETO!

**Data de Lançamento**: _______________  
**Horário**: _______________  
**Status**: [ ] SUCESSO [ ] PROBLEMAS

**Observações**: 
_______________________________________________
_______________________________________________
_______________________________________________

---

*Versão: 1.0.0*  
*Data: 2026-04-19*

