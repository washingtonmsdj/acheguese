# 🚀 GUIA DE DEPLOY - Segurança XSS

**Data:** 2026-04-18  
**Versão:** 2.0.0  
**Status:** PRONTO PARA DEPLOY

---

## 📋 PRÉ-REQUISITOS

### Checklist Antes do Deploy

- [x] Todas as 7 vulnerabilidades corrigidas
- [x] Validação automática passou (8/8)
- [x] Componentes seguros criados
- [x] Cookie storage implementado
- [x] CSP configurado
- [x] Testes criados
- [x] Documentação completa
- [ ] **Testes em staging** ⚠️ PENDENTE
- [ ] **Aprovação do tech lead** ⚠️ PENDENTE
- [ ] **Comunicação ao time** ⚠️ PENDENTE

---

## 🎯 ESTRATÉGIA DE DEPLOY

### Abordagem Recomendada: **Canary Deployment**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  FASE 1: Staging (100% do tráfego)                         │
│  ├─ Testar todas as funcionalidades                        │
│  ├─ Validar migração de cookies                            │
│  └─ Monitorar logs por 24h                                 │
│                                                             │
│  FASE 2: Produção - Canary (5% do tráfego)                 │
│  ├─ Deploy para 5% dos usuários                            │
│  ├─ Monitorar métricas por 2h                              │
│  └─ Validar sem erros                                      │
│                                                             │
│  FASE 3: Produção - Gradual (25% do tráfego)               │
│  ├─ Aumentar para 25% dos usuários                         │
│  ├─ Monitorar métricas por 4h                              │
│  └─ Validar sem erros                                      │
│                                                             │
│  FASE 4: Produção - Completo (100% do tráfego)             │
│  ├─ Deploy completo                                        │
│  ├─ Monitorar métricas por 24h                             │
│  └─ Validar migração completa                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 FASE 1: STAGING

### 1.1 Deploy em Staging

```bash
# 1. Garantir que está na branch correta
git checkout main
git pull origin main

# 2. Build de produção
npm run build

# 3. Executar validações finais
npm run security:scan
npm run lint:security
npm test tests/security/

# 4. Deploy para staging
vercel --prod --scope=staging
```

### 1.2 Testes em Staging

#### Testes Funcionais

```bash
# Checklist de testes manuais
```

- [ ] **Login/Logout**
  - [ ] Login com email/senha funciona
  - [ ] Tokens são armazenados em cookies
  - [ ] Logout limpa cookies corretamente
  - [ ] Refresh mantém sessão

- [ ] **Mapas (innerHTML corrigido)**
  - [ ] MapLibreAdapter renderiza marcadores
  - [ ] RideTrackingMap mostra localização
  - [ ] StandaloneMap funciona
  - [ ] MiniMap renderiza corretamente
  - [ ] LiveTrackingMap atualiza em tempo real

- [ ] **Componentes Seguros**
  - [ ] SafeHtml renderiza HTML de usuário
  - [ ] SafeLink valida URLs
  - [ ] SafeImage carrega imagens

- [ ] **Migração de Cookies**
  - [ ] Usuários com localStorage migram automaticamente
  - [ ] Novos usuários usam cookies diretamente
  - [ ] Fallback para localStorage funciona

#### Testes de Segurança

```bash
# Testes de XSS
```

- [ ] **Vetores de Ataque**
  - [ ] `<script>alert('XSS')</script>` é bloqueado
  - [ ] `<img src=x onerror=alert(1)>` é bloqueado
  - [ ] `javascript:alert(1)` é bloqueado
  - [ ] Event handlers inline são removidos

- [ ] **CSP**
  - [ ] Scripts inline são bloqueados
  - [ ] Apenas domínios permitidos carregam
  - [ ] Console não mostra erros de CSP

- [ ] **Cookies**
  - [ ] Cookies têm flag Secure
  - [ ] Cookies têm SameSite=Strict
  - [ ] Cookies expiram corretamente

### 1.3 Monitoramento em Staging

```bash
# Verificar logs do Vercel
vercel logs --follow

# Verificar erros no Sentry (se configurado)
# Acessar dashboard do Sentry
```

**Métricas a monitorar:**
- Taxa de erro: < 0.1%
- Tempo de resposta: < 500ms
- Migração de cookies: > 95% sucesso
- Erros de CSP: 0

**Duração:** 24 horas

---

## 🚀 FASE 2: PRODUÇÃO - CANARY (5%)

### 2.1 Deploy Canary

```bash
# Deploy com canary (5% do tráfego)
vercel --prod --canary=5
```

### 2.2 Monitoramento Intensivo

**Duração:** 2 horas

**Métricas críticas:**

```javascript
// Dashboard de monitoramento
{
  "errorRate": "< 0.1%",           // Taxa de erro
  "responseTime": "< 500ms",        // Tempo de resposta
  "cookieMigration": "> 95%",       // Sucesso de migração
  "cspViolations": "0",             // Violações de CSP
  "xssAttempts": "0 successful",    // Tentativas de XSS
  "userComplaints": "0"             // Reclamações de usuários
}
```

**Alertas configurados:**
- Taxa de erro > 0.5% → Rollback automático
- Tempo de resposta > 1s → Investigar
- Violações de CSP > 10 → Investigar
- Tentativas de XSS bem-sucedidas > 0 → Alerta crítico

### 2.3 Validação Canary

```bash
# Verificar logs em tempo real
vercel logs --follow --prod

# Verificar métricas
curl https://api.vercel.com/v1/deployments/[deployment-id]/metrics
```

**Critérios de sucesso:**
- ✅ Taxa de erro < 0.1%
- ✅ Sem violações de CSP
- ✅ Migração de cookies > 95%
- ✅ Sem reclamações de usuários

**Se falhar:** Rollback imediato

```bash
vercel rollback
```

---

## 📈 FASE 3: PRODUÇÃO - GRADUAL (25%)

### 3.1 Aumentar Tráfego

```bash
# Aumentar para 25% do tráfego
vercel --prod --canary=25
```

### 3.2 Monitoramento Contínuo

**Duração:** 4 horas

**Métricas:**
- Taxa de erro: < 0.1%
- Tempo de resposta: < 500ms
- Migração de cookies: > 95%
- Satisfação do usuário: > 95%

### 3.3 Validação

**Critérios de sucesso:**
- ✅ Todas as métricas dentro do esperado
- ✅ Feedback positivo dos usuários
- ✅ Sem incidentes reportados

---

## 🎯 FASE 4: PRODUÇÃO - COMPLETO (100%)

### 4.1 Deploy Completo

```bash
# Deploy para 100% do tráfego
vercel --prod
```

### 4.2 Monitoramento Pós-Deploy

**Duração:** 24 horas (monitoramento intensivo)

**Checklist:**

- [ ] **Primeiras 2 horas**
  - [ ] Monitorar logs em tempo real
  - [ ] Verificar taxa de erro
  - [ ] Validar migração de cookies
  - [ ] Responder a incidentes imediatamente

- [ ] **Primeiras 8 horas**
  - [ ] Monitorar métricas a cada hora
  - [ ] Verificar feedback de usuários
  - [ ] Validar funcionalidades críticas
  - [ ] Documentar problemas encontrados

- [ ] **Primeiras 24 horas**
  - [ ] Monitorar métricas a cada 4 horas
  - [ ] Analisar logs de migração
  - [ ] Validar taxa de sucesso
  - [ ] Preparar relatório de deploy

### 4.3 Validação Final

```bash
# Executar validação completa
npm run security:scan

# Verificar logs
vercel logs --prod --since=24h

# Gerar relatório
npm run generate:deploy-report
```

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Principais

| Métrica | Meta | Crítico |
|---------|------|---------|
| **Taxa de Erro** | < 0.1% | < 0.5% |
| **Tempo de Resposta** | < 500ms | < 1s |
| **Migração de Cookies** | > 95% | > 90% |
| **Violações de CSP** | 0 | < 10 |
| **Tentativas de XSS** | 0 sucesso | 0 sucesso |
| **Satisfação do Usuário** | > 95% | > 90% |

### Dashboard de Monitoramento

```javascript
// Exemplo de query para monitoramento
{
  "deployment": {
    "id": "deployment-id",
    "status": "READY",
    "metrics": {
      "errorRate": 0.05,        // 0.05%
      "avgResponseTime": 320,    // 320ms
      "cookieMigration": 97.5,   // 97.5%
      "cspViolations": 0,
      "xssAttempts": 0
    }
  }
}
```

---

## 🚨 PLANO DE ROLLBACK

### Quando Fazer Rollback

**Rollback IMEDIATO se:**
- Taxa de erro > 1%
- Violações de CSP > 100
- Tentativas de XSS bem-sucedidas > 0
- Tempo de resposta > 2s
- Reclamações críticas de usuários

**Rollback PLANEJADO se:**
- Taxa de erro > 0.5% (por 30 min)
- Migração de cookies < 90%
- Feedback negativo consistente

### Como Fazer Rollback

```bash
# Rollback para versão anterior
vercel rollback

# Ou rollback para versão específica
vercel rollback [deployment-url]

# Verificar status
vercel ls
```

### Após Rollback

1. **Investigar causa raiz**
   - Analisar logs
   - Reproduzir problema
   - Identificar correção

2. **Corrigir problema**
   - Implementar fix
   - Testar em staging
   - Validar correção

3. **Tentar novamente**
   - Seguir processo de deploy
   - Monitorar mais intensamente

---

## 📞 COMUNICAÇÃO

### Antes do Deploy

**Para o Time:**

```
📢 COMUNICADO: Deploy de Segurança XSS

Olá time!

Vamos fazer o deploy das correções de segurança XSS:

📅 Data: [DATA]
⏰ Horário: [HORÁRIO]
⏱️ Duração estimada: 2-4 horas

🔧 O que muda:
• Tokens migram de localStorage para cookies seguros
• Componentes de mapas atualizados
• CSP implementado

✅ O que NÃO muda:
• Funcionalidades permanecem as mesmas
• UX permanece idêntica
• Performance mantida ou melhorada

📚 Documentação: SECURITY_INDEX.md

Dúvidas? #security no Slack
```

**Para Usuários (se necessário):**

```
📢 Manutenção Programada

Faremos uma atualização de segurança:

📅 Data: [DATA]
⏰ Horário: [HORÁRIO]
⏱️ Duração: ~30 minutos

Durante a atualização:
• Você pode continuar usando normalmente
• Pode ser necessário fazer login novamente
• Suas sessões serão preservadas

Obrigado pela compreensão!
```

### Durante o Deploy

**Atualizações a cada hora:**

```
✅ [HH:MM] Deploy iniciado - Fase Canary (5%)
✅ [HH:MM] Canary validado - Aumentando para 25%
✅ [HH:MM] 25% validado - Deploy completo iniciado
✅ [HH:MM] Deploy completo - Monitorando
```

### Após o Deploy

**Relatório Final:**

```
✅ DEPLOY CONCLUÍDO COM SUCESSO

📊 Métricas:
• Taxa de erro: 0.05% ✅
• Tempo de resposta: 320ms ✅
• Migração de cookies: 97.5% ✅
• Violações de CSP: 0 ✅

🎉 Resultado: SUCESSO TOTAL

📚 Documentação: SECURITY_STATUS_FINAL.md
```

---

## 🔍 TROUBLESHOOTING

### Problema: Usuários não conseguem fazer login

**Causa provável:** Cookies desabilitados

**Solução:**
1. HybridStorage faz fallback automático para localStorage
2. Verificar logs: `[HybridStorage] Fallback para localStorage`
3. Usuário pode continuar usando normalmente

**Ação:** Nenhuma (funciona automaticamente)

### Problema: Mapas não renderizam

**Causa provável:** Erro na criação de SVG via DOM API

**Solução:**
1. Verificar console do browser
2. Verificar logs do Vercel
3. Rollback se necessário

**Ação:** Investigar e corrigir

### Problema: CSP bloqueia recursos

**Causa provável:** Domínio não permitido no CSP

**Solução:**
1. Identificar domínio bloqueado nos logs
2. Adicionar domínio ao CSP em `vercel.json`
3. Deploy da correção

**Ação:** Atualizar CSP

### Problema: Performance degradada

**Causa provável:** DOMPurify adicionando overhead

**Solução:**
1. Verificar métricas de performance
2. Otimizar uso de DOMPurify
3. Considerar lazy loading

**Ação:** Otimizar se necessário

---

## 📋 CHECKLIST FINAL DE DEPLOY

### Pré-Deploy

- [ ] Todas as validações passaram
- [ ] Testes em staging concluídos
- [ ] Aprovação do tech lead obtida
- [ ] Time comunicado
- [ ] Plano de rollback preparado
- [ ] Monitoramento configurado

### Durante Deploy

- [ ] Fase Canary (5%) validada
- [ ] Fase Gradual (25%) validada
- [ ] Deploy completo (100%) executado
- [ ] Métricas monitoradas
- [ ] Incidentes tratados

### Pós-Deploy

- [ ] Monitoramento de 24h concluído
- [ ] Métricas dentro do esperado
- [ ] Migração de cookies validada
- [ ] Feedback de usuários positivo
- [ ] Relatório de deploy criado
- [ ] Time comunicado sobre sucesso
- [ ] Documentação atualizada

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

### Curto Prazo (1 semana)

- [ ] Monitorar métricas diariamente
- [ ] Coletar feedback de usuários
- [ ] Analisar logs de migração
- [ ] Documentar lições aprendidas

### Médio Prazo (1 mês)

- [ ] Revisar taxa de migração de cookies
- [ ] Analisar tentativas de XSS bloqueadas
- [ ] Otimizar performance se necessário
- [ ] Treinar time nos novos componentes

### Longo Prazo (3 meses)

- [ ] Implementar HttpOnly verdadeiro
- [ ] Contratar penetration testing
- [ ] Iniciar bug bounty program
- [ ] Buscar certificação de segurança

---

## 📚 RECURSOS

### Documentação

- **[SECURITY_INDEX.md](./SECURITY_INDEX.md)** - Índice completo
- **[SECURITY_STATUS_FINAL.md](./SECURITY_STATUS_FINAL.md)** - Status final
- **[SECURITY_GUIDELINES.md](./docs/SECURITY_GUIDELINES.md)** - Diretrizes

### Comandos Úteis

```bash
# Validação
npm run security:scan

# Deploy
vercel --prod

# Logs
vercel logs --follow --prod

# Rollback
vercel rollback

# Métricas
vercel inspect [deployment-url]
```

### Contatos

- **Tech Lead:** [nome]
- **Security Team:** #security no Slack
- **Emergências:** security@acheguese.com

---

## ✅ CONCLUSÃO

Este guia garante um deploy seguro e controlado das correções de segurança XSS.

**Lembre-se:**
- Seguir o processo passo a passo
- Monitorar métricas constantemente
- Estar preparado para rollback
- Comunicar o time regularmente

**Boa sorte com o deploy!** 🚀

---

**Versão:** 1.0.0  
**Data:** 2026-04-18  
**Status:** PRONTO PARA USO

---

*Deploy seguro, monitoramento ativo, sucesso garantido.*
