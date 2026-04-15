# INSTRUÇÕES PRÉ-PRODUÇÃO

## AÇÕES OBRIGATÓRIAS ANTES DE PRODUÇÃO

### 1. EMAIL DE PRODUÇÃO

#### 1.1 Configurar Domínio no Resend

1. Acessar [Resend Dashboard](https://resend.com/domains)
2. Adicionar domínio verificado (ex: `alerts.seudominio.com`)
3. Configurar registros DNS:
   - SPF
   - DKIM
   - DMARC
4. Aguardar verificação

#### 1.2 Configurar Secrets no Supabase

```bash
# Configurar domínio de email
supabase secrets set EMAIL_FROM_DOMAIN=alerts@seudominio.com

# Configurar nome do remetente
supabase secrets set EMAIL_FROM_NAME="Sistema de Segurança"
```

#### 1.3 Re-deploy da Edge Function

```bash
supabase functions deploy send-emergency-email
```

#### 1.4 Validar Envio Real

```bash
node teste_entrega_externa_final.mjs
```

Verificar:
- Email recebido com domínio correto
- Não aparece "via resend.dev"
- Reputação do domínio OK

---

### 2. RATE LIMITING

#### 2.1 Deploy da Edge Function Atualizada

A Edge Function já foi atualizada com rate limiting:
- Limite: 5 emails por alerta a cada 5 minutos
- Bloqueio registrado em `emergency_delivery_log`
- Erro claro retornado

```bash
supabase functions deploy send-emergency-email
```

#### 2.2 Validar Rate Limiting

```bash
node teste_rate_limiting.mjs
```

Resultado esperado:
- 5 emails enviados
- 1+ emails bloqueados
- Log de bloqueio persistido

#### 2.3 Ajustar Limites (Opcional)

Se necessário, ajustar constantes na Edge Function:

```typescript
const RATE_LIMIT_MAX = 5  // Máximo de emails
const RATE_LIMIT_WINDOW_MINUTES = 5  // Janela de tempo
```

---

### 3. AUTH/RLS REAL

#### 3.1 Reativar Autenticação

No ambiente de staging/homologação:

1. Habilitar autenticação no Supabase Dashboard
2. Configurar providers (Email, Google, etc.)
3. Testar login/logout

#### 3.2 Validar RLS com Auth Real

Executar com usuário autenticado:

```bash
node verificar_rls_completo.mjs
```

Resultado esperado:
- 11/11 tabelas acessíveis
- Authenticated vê apenas próprios dados
- Service role continua com acesso total

#### 3.3 Testar Fluxos com Auth

Validar via navegador com usuário real:
- Login
- Criar alerta de emergência
- Criar contato de emergência
- Enviar email
- Verificar logs

---

### 4. VALIDAÇÃO FINAL DE NAVEGADOR

#### 4.1 Pricing Admin

1. Acessar `/admin/pricing`
2. Criar nova regra
3. Ativar regra
4. Tentar criar regra conflitante
5. Verificar erro de conflito
6. Verificar auditoria

Console esperado: sem erros críticos

#### 4.2 Criação de Corrida com Pricing

1. Acessar módulo de corridas
2. Criar nova corrida
3. Verificar cálculo de preço
4. Confirmar valores corretos

Console esperado: sem erros críticos

#### 4.3 Alerta de Emergência

1. Acessar módulo de segurança
2. Acionar botão de emergência
3. Verificar alerta criado
4. Verificar notificação enviada

Console esperado: sem erros críticos

#### 4.4 Compartilhamento de Viagem

1. Criar corrida
2. Gerar link de compartilhamento
3. Abrir link em aba anônima
4. Verificar dados da corrida

Console esperado: sem erros críticos

#### 4.5 Envio Externo

1. Criar contato de emergência
2. Acionar alerta
3. Verificar email recebido
4. Verificar log persistido

Console esperado: sem erros críticos

---

### 5. CHECKLIST FINAL

Antes de marcar como "pronto para produção":

- [ ] Domínio de email verificado no Resend
- [ ] Secrets configurados no Supabase
- [ ] Edge Function re-deployada
- [ ] Envio real validado com domínio final
- [ ] Rate limiting implementado e testado
- [ ] Autenticação reativada em staging
- [ ] RLS validado com auth real
- [ ] Fluxos testados via navegador
- [ ] Console sem erros críticos
- [ ] Logs de auditoria funcionando
- [ ] Documentação atualizada

---

## SCRIPTS DE VALIDAÇÃO

### Validação Completa

```bash
# 1. RLS
node verificar_rls_completo.mjs

# 2. E2E Fluxos
node hardening_teste_e2e_fluxos.mjs

# 3. Entrega Externa
node teste_entrega_externa_final.mjs

# 4. Rate Limiting
node teste_rate_limiting.mjs
```

### Resultado Esperado

Todos os scripts devem passar com 100% de sucesso.

---

## RISCOS RESIDUAIS

### Baixo
- Domínio de email em sandbox (mitigado após configuração)
- Rate limiting não testado em carga real (mitigar em staging)

### Médio
- Nenhum

### Alto
- Nenhum

---

## PRÓXIMOS PASSOS

1. Executar todas as ações obrigatórias acima
2. Validar em staging/homologação
3. Executar testes de carga
4. Monitorar métricas por 1 semana
5. Deploy em produção
