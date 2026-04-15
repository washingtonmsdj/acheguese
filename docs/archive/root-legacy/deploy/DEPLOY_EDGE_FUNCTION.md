# Deploy Edge Function - Send Emergency Email

## 1. INSTALAR SUPABASE CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Ou via npm
npm install -g supabase
```

## 2. LOGIN NO SUPABASE

```bash
supabase login
```

## 3. LINK COM PROJETO

```bash
# Obter project ref do dashboard: https://supabase.com/dashboard/project/_/settings/general
supabase link --project-ref your-project-ref
```

## 4. CONFIGURAR RESEND API KEY (SECRET)

```bash
# Criar conta: https://resend.com
# Gerar API key: https://resend.com/api-keys

# Configurar secret (server-side, NÃO exposto ao client)
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

## 5. DEPLOY DA FUNÇÃO

```bash
supabase functions deploy send-emergency-email
```

## 6. VALIDAR DEPLOY

```bash
# Testar função
supabase functions invoke send-emergency-email \
  --body '{"contactId":"test","contactName":"Teste","contactEmail":"seu-email@example.com","alertId":"test-alert","alertType":"sos","alertCreatedAt":"2024-01-01T00:00:00Z","userName":"Usuário Teste","userPhone":"11999999999"}'
```

## 7. VERIFICAR LOGS

```bash
supabase functions logs send-emergency-email
```

## ESTRUTURA

```
supabase/
  functions/
    send-emergency-email/
      index.ts          # Edge Function (Deno)
```

## SEGURANÇA

✅ **API key NO CLIENT:**
- VITE_RESEND_API_KEY removida
- Nenhum segredo exposto no bundle

✅ **API key NO SERVER:**
- RESEND_API_KEY como secret do Supabase
- Acessível apenas na Edge Function
- Não exposta em logs ou responses

## FLUXO

```
Client (SafetyService)
  ↓
EmailNotificationProvider
  ↓
supabase.functions.invoke('send-emergency-email')
  ↓
Edge Function (Deno) [SERVER-SIDE]
  ↓
Resend API (com RESEND_API_KEY secret)
  ↓
Email enviado
  ↓
Response estruturado
  ↓
Client recebe resultado
  ↓
saveDeliveryLog()
```

## TROUBLESHOOTING

### Erro: "Function not found"
```bash
# Verificar funções deployadas
supabase functions list

# Re-deploy
supabase functions deploy send-emergency-email
```

### Erro: "RESEND_API_KEY not configured"
```bash
# Verificar secrets
supabase secrets list

# Configurar novamente
supabase secrets set RESEND_API_KEY=re_your_key
```

### Erro: "CORS"
- Edge Function já tem headers CORS configurados
- Verificar se URL do Supabase está correta

## PRODUÇÃO

1. Configurar domínio verificado no Resend
2. Atualizar `from` na Edge Function:
   ```typescript
   from: 'Alerta de Emergência <noreply@seudominio.com>'
   ```
3. Testar com email real
4. Monitorar logs: `supabase functions logs send-emergency-email --tail`
