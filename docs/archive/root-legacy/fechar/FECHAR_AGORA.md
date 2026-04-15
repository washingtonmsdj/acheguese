# FECHAR ENTREGA EXTERNA - EXECUTAR AGORA

## 1. CONFIGURAR RESEND_API_KEY

### Passo 1: Obter API Key
```
1. Acesse: https://resend.com
2. Crie conta (grátis - 100 emails/dia)
3. Vá em: https://resend.com/api-keys
4. Clique em "Create API Key"
5. Copie a key (formato: re_...)
```

### Passo 2: Configurar Secret
```bash
supabase secrets set RESEND_API_KEY=re_sua_key_aqui --project-ref xhdowzacfujckjelqhtd
```

**Resultado esperado:**
```
✅ Secret RESEND_API_KEY set successfully
```

## 2. TESTE FIM A FIM REAL

### Teste de Sucesso

```bash
supabase functions invoke send-emergency-email \
  --project-ref xhdowzacfujckjelqhtd \
  --body '{
    "contactId": "test-'$(date +%s)'",
    "contactName": "Teste Final",
    "contactEmail": "SEU_EMAIL_REAL@example.com",
    "alertId": "alert-'$(date +%s)'",
    "alertType": "sos",
    "alertCreatedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "userName": "Sistema de Teste",
    "userPhone": "11999999999",
    "alertDescription": "Teste final de entrega externa"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "contactId": "test-...",
  "channel": "email",
  "timestamp": "2024-...",
  "status": "sent",
  "metadata": {
    "to": "seu-email@example.com",
    "emailId": "resend-id-...",
    "alertId": "alert-..."
  }
}
```

**Verificar inbox:**
- Subject: "🚨 ALERTA DE EMERGÊNCIA"
- From: "Alerta de Emergência <onboarding@resend.dev>"
- Conteúdo HTML formatado

## 3. VALIDAR PERSISTÊNCIA NO BANCO

```sql
-- Executar no SQL Editor do Supabase
SELECT 
  id,
  channel,
  status,
  target,
  error_message,
  metadata,
  created_at,
  delivered_at
FROM emergency_delivery_log
WHERE status = 'sent'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
id: uuid
channel: email
status: sent
target: seu-email@example.com
error_message: NULL
metadata: {"to": "...", "emailId": "...", "alertId": "..."}
created_at: timestamp
delivered_at: timestamp (preenchido)
```

## 4. VALIDAR FALHA REAL

### Teste com Email Inválido

```bash
supabase functions invoke send-emergency-email \
  --project-ref xhdowzacfujckjelqhtd \
  --body '{
    "contactId": "fail-test",
    "contactName": "Teste Falha",
    "contactEmail": "email-invalido",
    "alertId": "alert-fail",
    "alertType": "sos",
    "alertCreatedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "userName": "Teste",
    "userPhone": "11999999999"
  }'
```

**Resultado esperado:**
```json
{
  "success": false,
  "contactId": "fail-test",
  "channel": "email",
  "timestamp": "2024-...",
  "status": "failed",
  "error": "Email inválido ou não fornecido"
}
```

### Verificar no Banco

```sql
SELECT 
  id,
  channel,
  status,
  target,
  error_message,
  created_at,
  delivered_at
FROM emergency_delivery_log
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
id: uuid
channel: email
status: failed
target: email-invalido
error_message: "Email inválido ou não fornecido"
created_at: timestamp
delivered_at: NULL
```

## 5. VALIDAÇÃO AUTOMATIZADA

```bash
node validar_entrega_completa.mjs
```

**Score esperado:** 5/5 (100%)

```
✅ Tabela emergency_delivery_log
✅ Edge Function responde
✅ Envio bem-sucedido
✅ Logs de entrega
✅ Tratamento de falha

📈 Score: 5/5 (100%)
🎉 ENTREGA EXTERNA: 100% FUNCIONAL!
```

## CHECKLIST FINAL

- [ ] RESEND_API_KEY configurado
- [ ] Teste de sucesso executado
- [ ] Email recebido no inbox
- [ ] Log com status='sent' no banco
- [ ] Teste de falha executado
- [ ] Log com status='failed' no banco
- [ ] Validação automatizada: 5/5

## EVIDÊNCIAS NECESSÁRIAS

1. **Secret configurado:**
   ```bash
   supabase secrets list --project-ref xhdowzacfujckjelqhtd | grep RESEND_API_KEY
   ```

2. **Email recebido:**
   - Screenshot do email no inbox
   - Subject: "🚨 ALERTA DE EMERGÊNCIA"

3. **Log sent:**
   ```sql
   SELECT * FROM emergency_delivery_log WHERE status='sent' LIMIT 1;
   ```

4. **Log failed:**
   ```sql
   SELECT * FROM emergency_delivery_log WHERE status='failed' LIMIT 1;
   ```

## APÓS CONCLUSÃO

Execute para gerar relatório final:
```bash
node validar_entrega_completa.mjs > RELATORIO_FINAL_ENTREGA_EXTERNA.txt
```

Se score = 5/5 (100%), entrega externa está **CONCLUÍDA**.
