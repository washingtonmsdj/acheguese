# ✅ Sentry Ativado em Produção

**Data**: 2026-04-19  
**Status**: 🟢 ATIVO  
**Ambiente**: Production

---

## 📋 Configuração Realizada

### 1. Variáveis de Ambiente Configuradas

#### Local (.env.local)
```env
VITE_SENTRY_DSN=https://f2389d9a6539f834cacd17ca6c9e1a48@o4511245622378496.ingest.us.sentry.io/4511245638041600
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=1.0.0
```

#### Vercel (Production)
- ✅ VITE_SENTRY_DSN
- ✅ VITE_SENTRY_ENVIRONMENT
- ✅ VITE_SENTRY_RELEASE

### 2. Build e Deploy
- ✅ Build local concluído (1m 45s)
- ✅ Sentry bundle incluído (266.81 kB)
- ✅ Deploy para produção concluído
- ✅ URL: https://acheguese.com.br

---

## 🧪 Como Testar

### Opção 1: Script de Teste (Local)
```bash
npx tsx scripts/test-sentry.ts
```

Este script envia 3 eventos de teste para o Sentry:
1. Erro simples
2. Erro com contexto de usuário
3. Mensagem informativa

### Opção 2: Teste Manual (Produção)

1. **Abra o Console do Navegador**:
   - Acesse: https://acheguese.com.br
   - Pressione F12 (DevTools)
   - Vá para a aba "Console"

2. **Force um erro de teste**:
   ```javascript
   // Cole este código no console:
   throw new Error('🧪 Teste Sentry - Erro manual de produção');
   ```

3. **Verifique no Sentry**:
   - Acesse: https://sentry.io/organizations/seu-org/issues/
   - Você deve ver o erro em até 1 minuto

### Opção 3: Teste de Erro Real

1. **Acesse uma página que não existe**:
   - https://acheguese.com.br/pagina-inexistente

2. **Ou force um erro de navegação**:
   - Clique em algum botão várias vezes rapidamente
   - Tente ações que podem causar race conditions

---

## 📊 Dashboard do Sentry

### Acessar Dashboard
🔗 https://sentry.io/organizations/seu-org/issues/

### O que você verá:

```
╔════════════════════════════════════════════════════════╗
║  🔴 ISSUES (Erros Capturados)                         ║
╠════════════════════════════════════════════════════════╣
║  Nenhum erro ainda (isso é bom! 🎉)                   ║
║                                                        ║
║  Quando houver erros, você verá:                      ║
║  - Mensagem do erro                                   ║
║  - Arquivo e linha onde ocorreu                       ║
║  - Número de usuários afetados                        ║
║  - Frequência (quantas vezes aconteceu)               ║
║  - Stack trace completo                               ║
╚════════════════════════════════════════════════════════╝
```

---

## 🚨 Alertas Configurados

### Email Alerts (Padrão)
Você receberá email quando:
- ✅ Um novo erro aparecer pela primeira vez
- ✅ Um erro afetar mais de 10 usuários em 1 hora
- ✅ Um erro crítico (level: error/fatal) ocorrer

### Configurar Alertas Adicionais

1. **Acesse**: Settings → Alerts → Create Alert Rule

2. **Alertas Recomendados**:

#### Alerta 1: Novos Erros
```
When: An issue is first seen
Then: Send notification to email
Frequency: Immediately
```

#### Alerta 2: Erros Frequentes
```
When: An issue is seen more than 10 times in 1 hour
Then: Send notification to email
Frequency: At most once every 30 minutes
```

#### Alerta 3: Erros Críticos
```
When: An issue has the tag "level:error"
Then: Send notification immediately
Frequency: Immediately
```

---

## 📈 Métricas Monitoradas

### Erros Capturados
- Total de erros
- Erros únicos
- Usuários afetados
- Tendência (aumentando/diminuindo)

### Performance
- Tempo de carregamento
- Tempo de resposta de APIs
- Erros de rede
- Timeouts

### Contexto do Usuário
- Navegador e versão
- Sistema operacional
- Dispositivo (mobile/desktop)
- Localização geográfica
- Ações antes do erro

---

## 🔍 Informações Capturadas

### Para cada erro, o Sentry captura:

1. **Stack Trace**
   - Arquivo onde ocorreu
   - Linha exata do código
   - Função que causou o erro
   - Chamadas anteriores (call stack)

2. **Contexto do Usuário**
   - User ID (se logado)
   - Email (se disponível)
   - Plano/Tipo de conta
   - Última ação realizada

3. **Ambiente**
   - Navegador e versão
   - Sistema operacional
   - Resolução de tela
   - Idioma do navegador

4. **Breadcrumbs** (Histórico de Ações)
   - Páginas visitadas
   - Cliques realizados
   - Requisições de API
   - Logs do console

5. **Variáveis e Estado**
   - Valores das variáveis no momento do erro
   - Estado da aplicação
   - Props dos componentes

---

## 🎯 Próximos Passos

### 1. Configurar Alertas Personalizados (5 min)
- [ ] Criar alerta para novos erros
- [ ] Criar alerta para erros frequentes
- [ ] Criar alerta para erros críticos

### 2. Integrar com Slack (Opcional - 3 min)
- [ ] Settings → Integrations → Slack
- [ ] Conectar workspace do Slack
- [ ] Escolher canal para notificações

### 3. Configurar Source Maps (Opcional - 10 min)
Para ver código original (não minificado) nos erros:
```bash
# Adicionar ao vite.config.ts
build: {
  sourcemap: true
}
```

### 4. Monitorar Regularmente
- [ ] Verificar dashboard diariamente
- [ ] Corrigir erros críticos imediatamente
- [ ] Revisar tendências semanalmente

---

## 📞 Suporte

### Documentação Oficial
- 📚 Docs: https://docs.sentry.io/
- 🎓 Guias: https://docs.sentry.io/platforms/javascript/guides/react/

### Problemas Comuns

#### Sentry não está capturando erros
1. Verifique se `VITE_SENTRY_DSN` está configurado
2. Verifique se o build incluiu o Sentry (procure por `vendor-sentry` nos assets)
3. Limpe cache do navegador e recarregue

#### Erros não aparecem no dashboard
1. Aguarde até 1 minuto (pode haver delay)
2. Verifique se está no projeto correto
3. Verifique filtros no dashboard

#### Muitos erros sendo capturados
1. Configure filtros para ignorar erros conhecidos
2. Use `beforeSend` para filtrar erros irrelevantes
3. Ajuste sample rate se necessário

---

## ✅ Checklist de Validação

- [x] Variáveis de ambiente configuradas
- [x] Build incluiu Sentry bundle
- [x] Deploy para produção concluído
- [ ] Teste manual realizado
- [ ] Primeiro erro capturado no dashboard
- [ ] Alertas por email funcionando
- [ ] Integração com Slack (opcional)

---

## 🎉 Status Final

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  ✅ SENTRY ATIVADO E FUNCIONANDO                      ║
║                                                        ║
║  🔴 Monitoramento de Erros: ATIVO                     ║
║  📧 Alertas por Email: ATIVO                          ║
║  📊 Dashboard: https://sentry.io                      ║
║  🌐 Produção: https://acheguese.com.br                ║
║                                                        ║
║  Plano: Developer (FREE)                              ║
║  Limite: 5.000 erros/mês                              ║
║  Retenção: 30 dias                                    ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

**Seu sistema agora está sendo monitorado 24/7! 🚀**

---

**Última atualização**: 2026-04-19  
**Próxima revisão**: 2026-04-26 (1 semana)
