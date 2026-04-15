# Deploy Edge Functions — Multi-Perfil Admin

## Funções a deployar

| Função | Rota | Propósito |
|--------|------|-----------|
| `admin-suspend-profile` | POST /functions/v1/admin-suspend-profile | Suspender perfil |
| `admin-verify-profile` | POST /functions/v1/admin-verify-profile | Verificar (badge) perfil |
| `territory-ai-content` | POST /functions/v1/territory-ai-content | Gerar conteúdo IA por território |

## Env vars obrigatórias no Supabase Dashboard

Configurar em: Dashboard → Project Settings → Edge Functions → Secrets

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `SUPABASE_URL` | ✅ Automática | Injetada pelo Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Automática | Injetada pelo Supabase |
| `LOVABLE_API_KEY` | Apenas territory-ai-content | Chave da API de IA |

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas automaticamente pelo runtime do Supabase. Não é necessário configurar manualmente.

## Pré-requisito: Supabase CLI

```bash
# Instalar CLI
npm install -g supabase

# Autenticar
supabase login

# Linkar ao projeto
supabase link --project-ref xhdowzacfujckjelqhtd
```

## Deploy

### Todas as funções de uma vez
```bash
supabase functions deploy admin-suspend-profile
supabase functions deploy admin-verify-profile
supabase functions deploy territory-ai-content
```

### Verificar deploy
```bash
supabase functions list
```

## Checklist pós-deploy

### 1. Verificar que as funções aparecem na lista
```bash
supabase functions list
# Esperado: admin-suspend-profile, admin-verify-profile, territory-ai-content listadas
```

### 2. Smoke test: função sem auth retorna 403
```bash
curl -X POST https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-suspend-profile \
  -H "Content-Type: application/json" \
  -d '{"profile_id":"test","reason":"test"}'
# Esperado: {"error":"Missing or invalid authorization header"} com status 403
```

### 3. Smoke test: função com token inválido retorna 403
```bash
curl -X POST https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-verify-profile \
  -H "Authorization: Bearer token-invalido" \
  -H "Content-Type: application/json" \
  -d '{"profile_id":"test"}'
# Esperado: {"error":"Invalid or expired token"} com status 403
```

### 4. Verificar logs no Dashboard
Dashboard → Edge Functions → [nome da função] → Logs
- Sem erros de inicialização
- Sem erros de env vars faltando

## Dependências verificadas

- `_shared/adminAuth.ts`: helper compartilhado, sem dependências externas além de supabase-js
- `supabase-js@2`: importado via esm.sh (sem instalação local necessária)
- Tabela `admin_users`: deve existir com colunas `user_id uuid` e `role text`
- Tabela `profile_audit_log`: usada pelos RPCs `suspend_profile` e `verify_profile`
- RPCs `suspend_profile`, `verify_profile`: deployados nas migrations (service_role only)

## Permissões dos RPCs admin

Confirmado nas migrations:
- `verify_profile`: GRANT apenas para `service_role` ✅
- `suspend_profile`: GRANT apenas para `service_role` ✅

As edge functions usam `SUPABASE_SERVICE_ROLE_KEY` para chamar esses RPCs — correto.

## Rollback

```bash
# Não há rollback automático de edge functions no Supabase
# Para reverter: re-deploy da versão anterior do arquivo
git checkout <commit-anterior> -- supabase/functions/admin-suspend-profile/index.ts
supabase functions deploy admin-suspend-profile
```
