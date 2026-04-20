# 🚨 Guia de Configuração de Alertas

## ✅ Checklist de Configuração

- [ ] Sentry - Monitoramento de Erros
- [ ] Supabase - Alertas de Database
- [ ] UptimeRobot - Monitoramento de Disponibilidade
- [ ] Vercel - Alertas de Deploy

---

## 1. 🔴 SENTRY (CRÍTICO - 15 minutos)

### Passo 1: Criar Conta
1. Acesse: https://sentry.io/signup/
2. Crie conta com email ou GitHub
3. Crie uma organização (ex: "Achegue-se")

### Passo 2: Criar Projeto
1. Click em "Create Project"
2. Plataforma: **React**
3. Nome: **acheguese-production**
4. Copie o **DSN** (exemplo: `https://abc123@o123.ingest.sentry.io/456`)

### Passo 3: Configurar Variáveis de Ambiente
Adicione ao `.env.local` e `.env.production`:

```env
# Sentry
VITE_SENTRY_DSN=https://SEU-DSN-AQUI@sentry.io/SEU-PROJETO-ID
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
```

### Passo 4: Deploy com Sentry
```bash
# Rebuild e redeploy
npm run build
vercel --prod
```

### Passo 5: Configurar Alertas no Sentry
1. **Settings** → **Alerts** → **Create Alert Rule**
2. Configure 3 alertas essenciais:

#### Alerta 1: Novos Erros
- **When**: An issue is first seen
- **Then**: Send notification to email
- **Frequency**: Immediately

#### Alerta 2: Erros Frequentes
- **When**: An issue is seen more than 10 times in 1 hour
- **Then**: Send notification to email + Slack (se configurado)
- **Frequency**: At most once every 30 minutes

#### Alerta 3: Erros Críticos
- **When**: An issue has the tag "level:error" or "level:fatal"
- **Then**: Send notification immediately
- **Frequency**: Immediately

### Passo 6: Testar
```bash
# Acesse a aplicação e force um erro de teste
# O erro deve aparecer no Sentry em segundos
```

---

## 2. 💾 SUPABASE (IMPORTANTE - 10 minutos)

### Passo 1: Acessar Dashboard
1. https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
2. Login com sua conta

### Passo 2: Configurar Backups Automáticos
1. **Settings** → **Database** → **Backups**
2. Enable: **Daily Backups** (7 dias de retenção)
3. Enable: **Email notifications for backup failures**
4. Email: seu-email@exemplo.com

### Passo 3: Configurar Performance Alerts
1. **Settings** → **Database** → **Performance**
2. Configure thresholds:
   - **CPU Usage**: Alert when > 80%
   - **Memory Usage**: Alert when > 85%
   - **Active Connections**: Alert when > 90% of max
   - **Disk Usage**: Alert when > 80%

### Passo 4: Configurar Database Webhooks (Opcional)
1. **Database** → **Webhooks**
2. Create webhook para eventos críticos:
   - Table: `profiles`
   - Events: `INSERT`, `UPDATE`, `DELETE`
   - URL: Seu endpoint de monitoramento (se tiver)

### Passo 5: Configurar Auth Alerts
1. **Authentication** → **Settings**
2. Enable: **Email notifications for suspicious activity**
3. Configure rate limiting alerts

---

## 3. 📡 UPTIMEROBOT (ESSENCIAL - 5 minutos)

### Passo 1: Criar Conta
1. https://uptimerobot.com/signUp
2. Plano Free (50 monitores, 5 min interval)

### Passo 2: Adicionar Monitor Principal
1. **Add New Monitor**
2. Configuração:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Achegue-se Production
   URL: https://acheguese.com.br
   Monitoring Interval: 5 minutes
   Monitor Timeout: 30 seconds
   ```

### Passo 3: Adicionar Health Check
1. **Add New Monitor**
2. Configuração:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Achegue-se Health Check
   URL: https://acheguese.com.br/api/health
   Monitoring Interval: 5 minutes
   Keyword: healthy
   ```

### Passo 4: Configurar Alertas
1. **Alert Contacts** → **Add Alert Contact**
2. Adicione:
   - **Email**: seu-email@exemplo.com
   - **SMS** (opcional): seu-telefone
   - **Slack** (opcional): webhook URL

### Passo 5: Configurar Notificações
1. Para cada monitor:
   - **Alert When**: Down
   - **Alert After**: 2 minutes (1 check)
   - **Alert Contacts**: Selecione todos

---

## 4. ⚡ VERCEL (RÁPIDO - 3 minutos)

### Passo 1: Acessar Settings
1. https://vercel.com/jogo-brasils-projects/acheguese/settings/notifications

### Passo 2: Configurar Email Notifications
Enable notificações para:
- ✅ Deployment Failed
- ✅ Deployment Succeeded (apenas para production)
- ✅ Domain Configuration Issues
- ✅ Performance Degradation

### Passo 3: Configurar Integrations (Opcional)
1. **Settings** → **Integrations**
2. Adicione:
   - **Slack**: Para notificações em tempo real
   - **Discord**: Alternativa ao Slack
   - **GitHub**: Para comentários em PRs

### Passo 4: Configurar Performance Monitoring
1. **Analytics** → **Settings**
2. Enable:
   - **Web Vitals Monitoring**
   - **Real User Monitoring (RUM)**
3. Configure thresholds:
   - LCP: < 2.5s
   - FID: < 100ms
   - CLS: < 0.1

---

## 📊 Dashboard de Monitoramento

### URLs Importantes
- **Sentry**: https://sentry.io/organizations/SEU-ORG/issues/
- **Supabase**: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
- **UptimeRobot**: https://uptimerobot.com/dashboard
- **Vercel**: https://vercel.com/jogo-brasils-projects/acheguese

### Checklist Diário
- [ ] Verificar Sentry para novos erros
- [ ] Verificar UptimeRobot para downtime
- [ ] Verificar Vercel Analytics para performance

### Checklist Semanal
- [ ] Revisar logs do Supabase
- [ ] Verificar uso de recursos (CPU, Memory, Disk)
- [ ] Revisar alertas recebidos

---

## 🚨 Alertas Críticos Configurados

### Nível 1: CRÍTICO (Ação Imediata)
- ❌ Site down (UptimeRobot)
- ❌ Database down (Supabase)
- ❌ Erro fatal na aplicação (Sentry)
- ❌ Deploy failed (Vercel)

**Ação**: Investigar e resolver imediatamente

### Nível 2: IMPORTANTE (Ação em 1h)
- ⚠️ Performance degradation (Vercel)
- ⚠️ High error rate (Sentry)
- ⚠️ Database CPU > 80% (Supabase)
- ⚠️ Backup failed (Supabase)

**Ação**: Investigar causa e planejar correção

### Nível 3: AVISO (Ação em 24h)
- 📊 Novos erros não críticos (Sentry)
- 📊 Slow queries (Supabase)
- 📊 High memory usage (Supabase)

**Ação**: Adicionar ao backlog de melhorias

---

## 🔧 Troubleshooting

### Sentry não está recebendo erros
1. Verifique se `VITE_SENTRY_DSN` está configurado
2. Verifique se o build incluiu o Sentry
3. Teste forçando um erro: `throw new Error("Test")`

### UptimeRobot reportando falso positivo
1. Aumente o timeout para 60 segundos
2. Configure "Alert After" para 2-3 checks
3. Verifique se o site está realmente acessível

### Supabase não enviando alertas
1. Verifique email em Settings → Database → Backups
2. Verifique spam/lixo eletrônico
3. Configure webhook alternativo

### Vercel não notificando
1. Verifique Settings → Notifications
2. Verifique se email está verificado
3. Configure Slack como alternativa

---

## 📞 Contatos de Emergência

### Suporte Técnico
- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **Sentry**: https://sentry.io/support

### Documentação
- **Sentry Alerts**: https://docs.sentry.io/product/alerts/
- **Supabase Monitoring**: https://supabase.com/docs/guides/platform/metrics
- **UptimeRobot**: https://uptimerobot.com/help/
- **Vercel Monitoring**: https://vercel.com/docs/concepts/observability

---

## ✅ Validação Final

Após configurar todos os alertas, teste:

1. **Sentry**: Force um erro na aplicação
2. **UptimeRobot**: Aguarde 5 minutos e verifique status
3. **Supabase**: Verifique se backups estão rodando
4. **Vercel**: Faça um deploy e verifique notificação

**Status**: 🟢 Todos os alertas configurados e funcionando

---

**Última atualização**: 2026-04-19
**Responsável**: DevOps Team
**Próxima revisão**: 2026-05-19
