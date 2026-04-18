# ✅ Checklist de Deploy - Correções de Segurança

**IMPORTANTE:** Siga este checklist ANTES de fazer deploy para produção.

---

## 📋 PRÉ-DEPLOY

### 1. Validação Local

- [ ] Rodar `npm install` para instalar dependências
- [ ] Rodar `npm run security:scan` - deve passar 100%
- [ ] Rodar `npm run lint:security` - sem erros
- [ ] Rodar `npm test tests/security/` - todos os testes passando
- [ ] Rodar `npm run build` - build sem erros
- [ ] Testar aplicação localmente - funcionalidades OK

### 2. Code Review

- [ ] PR criado com todas as mudanças
- [ ] Code review aprovado por 2+ pessoas
- [ ] Security team revisou as mudanças
- [ ] Nenhum comentário pendente no PR

### 3. Testes

- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Testes E2E passando
- [ ] Testes de segurança passando
- [ ] Smoke tests em staging

---

## 🚀 DEPLOY

### 1. Staging

- [ ] Deploy para staging
- [ ] Validar CSP no browser (F12 > Console)
- [ ] Testar funcionalidades críticas:
  - [ ] Login/Logout
  - [ ] Criação de posts
  - [ ] Upload de imagens
  - [ ] Mapas funcionando
  - [ ] Formulários funcionando
- [ ] Verificar logs de erro
- [ ] Nenhum erro de CSP bloqueando funcionalidades

### 2. Produção

- [ ] Backup do banco de dados
- [ ] Deploy para produção
- [ ] Monitorar logs por 30 minutos
- [ ] Verificar métricas de erro
- [ ] Testar funcionalidades críticas
- [ ] Rollback plan pronto

---

## 🔍 PÓS-DEPLOY

### 1. Validação Imediata (0-1h)

- [ ] Site carregando normalmente
- [ ] Nenhum erro crítico nos logs
- [ ] CSP funcionando (verificar headers)
- [ ] Funcionalidades principais OK
- [ ] Performance normal

### 2. Monitoramento (1-24h)

- [ ] Monitorar taxa de erro
- [ ] Monitorar performance
- [ ] Verificar feedback de usuários
- [ ] Analisar logs de segurança
- [ ] Verificar tentativas de XSS bloqueadas

### 3. Validação Completa (24-48h)

- [ ] Nenhum incidente reportado
- [ ] Métricas de uso normais
- [ ] Nenhum bug crítico
- [ ] Feedback positivo do time
- [ ] Documentação atualizada

---

## 🚨 ROLLBACK

### Se algo der errado:

1. **Identificar o problema**
   - Verificar logs
   - Reproduzir o erro
   - Avaliar impacto

2. **Decidir ação**
   - [ ] Hotfix rápido (< 30 min)
   - [ ] Rollback completo
   - [ ] Rollback parcial (apenas CSP)

3. **Executar rollback**
   ```bash
   # Vercel
   vercel rollback
   
   # Ou via dashboard
   # Vercel Dashboard > Deployments > Previous > Promote
   ```

4. **Comunicar**
   - [ ] Notificar time
   - [ ] Atualizar status page
   - [ ] Documentar incidente

---

## 📊 MÉTRICAS DE SUCESSO

### Imediato (0-24h)

- [ ] Taxa de erro < 0.1%
- [ ] Performance degradation < 5%
- [ ] Nenhum incidente crítico
- [ ] CSP bloqueando 0 requisições legítimas

### Curto Prazo (1-7 dias)

- [ ] Nenhum bug de segurança reportado
- [ ] Nenhuma reclamação de usuários
- [ ] Métricas de uso estáveis
- [ ] Time confortável com mudanças

### Médio Prazo (1-4 semanas)

- [ ] Nenhuma tentativa de XSS bem-sucedida
- [ ] Código novo seguindo diretrizes
- [ ] Nenhuma regressão detectada
- [ ] Penetration test agendado

---

## 🔧 COMANDOS ÚTEIS

### Verificar Headers em Produção

```bash
curl -I https://seu-dominio.com | grep -i "content-security-policy"
```

### Verificar Logs no Vercel

```bash
vercel logs --follow
```

### Testar CSP Localmente

```bash
# Abrir browser
# F12 > Console
# Verificar se há erros de CSP
```

---

## 📞 CONTATOS DE EMERGÊNCIA

### Time de Segurança

- **Lead:** [Nome] - [Email] - [Telefone]
- **Backup:** [Nome] - [Email] - [Telefone]

### DevOps

- **Lead:** [Nome] - [Email] - [Telefone]
- **Backup:** [Nome] - [Email] - [Telefone]

### Gerência

- **CTO:** [Nome] - [Email] - [Telefone]
- **CEO:** [Nome] - [Email] - [Telefone]

---

## 📝 NOTAS

### CSP Pode Bloquear

Se o CSP estiver bloqueando algo legítimo:

1. Verificar console do browser
2. Identificar o recurso bloqueado
3. Avaliar se é necessário
4. Atualizar CSP em `vercel.json`
5. Redeploy

### Exemplo de Erro CSP

```
Refused to load the script 'https://example.com/script.js' 
because it violates the following Content Security Policy directive: 
"script-src 'self' https://cdn.jsdelivr.net"
```

**Solução:** Adicionar `https://example.com` ao `script-src` no CSP.

---

## ✅ APROVAÇÃO FINAL

Antes de fazer deploy para produção, confirme:

- [ ] Todos os itens deste checklist foram verificados
- [ ] Security team aprovou
- [ ] DevOps team aprovou
- [ ] Gerência aprovou (se necessário)
- [ ] Rollback plan documentado
- [ ] Equipe de plantão disponível

**Assinaturas:**

- Security Lead: _________________ Data: _______
- DevOps Lead: _________________ Data: _______
- CTO: _________________ Data: _______

---

**Última atualização:** 2026-04-18  
**Versão:** 1.0.0  
**Próxima revisão:** Após primeiro deploy
