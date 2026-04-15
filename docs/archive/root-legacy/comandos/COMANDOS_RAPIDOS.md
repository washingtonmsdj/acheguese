# ⚡ COMANDOS RÁPIDOS - MULTI-PERFIL

---

## DEPLOY EDGE FUNCTIONS

```bash
# Deploy admin-verify-profile
supabase functions deploy admin-verify-profile

# Deploy admin-suspend-profile
supabase functions deploy admin-suspend-profile

# Listar functions
supabase functions list
```

---

## VERIFICAR BANCO

```bash
# Ver migrations aplicadas
supabase db diff --linked

# Ver tabelas
supabase db query "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"

# Ver perfis
supabase db query "SELECT id, handle, profile_type, is_verified, is_suspended FROM profiles LIMIT 10"

# Ver views públicas
supabase db query "SELECT * FROM public_profiles LIMIT 5"

# Ver audit log
supabase db query "SELECT * FROM profile_audit_log ORDER BY created_at DESC LIMIT 10"
```

---

## BUILD E LINT

```bash
# Lint
npm run lint

# Build
npm run build

# Dev server (manual)
npm run dev
```

---

## TESTAR EDGE FUNCTIONS

```bash
# Verificar perfil (substitua os UUIDs)
curl -X POST \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-verify-profile \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"profileId": "uuid", "adminUserId": "uuid"}'

# Suspender perfil (substitua os UUIDs)
curl -X POST \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-suspend-profile \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"profileId": "uuid", "adminUserId": "uuid", "reason": "teste", "duration": 7}'
```

---

## LOGS

```bash
# Ver logs de edge function
supabase functions logs admin-verify-profile --follow
supabase functions logs admin-suspend-profile --follow
```

---

## QUERIES ÚTEIS

```sql
-- Contar perfis por tipo
SELECT profile_type, COUNT(*) 
FROM profiles 
GROUP BY profile_type;

-- Ver perfis verificados
SELECT handle, profile_type, verified_at 
FROM profiles 
WHERE is_verified = true;

-- Ver perfis suspensos
SELECT handle, profile_type, suspended_until, suspension_reason 
FROM profiles 
WHERE is_suspended = true;

-- Ver membros de um perfil
SELECT pm.*, p.handle 
FROM profile_members pm
JOIN profiles p ON p.id = pm.member_profile_id
WHERE pm.profile_id = 'uuid-do-perfil';

-- Ver vínculos de um perfil
SELECT * FROM profile_links 
WHERE profile_id = 'uuid-do-perfil' 
ORDER BY display_order;

-- Ver ações admin
SELECT 
  pal.*,
  p.handle,
  au.email as admin_email
FROM profile_audit_log pal
JOIN profiles p ON p.id = pal.profile_id
LEFT JOIN admin_users au ON au.id = pal.admin_user_id
ORDER BY pal.created_at DESC
LIMIT 20;
```

---

## ROTAS DA APLICAÇÃO

```
/p/:handle                  - Perfil público
/perfil/configuracoes       - Configurações do perfil
  ├─ Tab: Privacidade       - 6 toggles
  ├─ Tab: Vínculos          - CRUD de links
  └─ Tab: Membros           - CRUD de membros
```

---

## ARQUIVOS IMPORTANTES

```
ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md  - Arquitetura aprovada
PLANO_EXECUCAO_FASES.md                 - Plano de execução
STATUS_IMPLEMENTACAO.md                 - Status detalhado
RESUMO_FINAL.md                         - Resumo executivo
CHECKLIST_VALIDACAO_FINAL.md            - Checklist de testes
INSTRUCOES_DEPLOY.md                    - Instruções de deploy
```

---

**Última atualização**: 2026-03-27 11:50

