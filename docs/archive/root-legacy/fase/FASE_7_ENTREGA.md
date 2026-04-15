# FASE 7: ADMIN EDGE FUNCTIONS - ENTREGA

**Data**: 2026-03-27 11:40  
**Status**: COMPLETA  
**Fonte**: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0

---

## OBJETIVO

Criar edge functions para operações administrativas, isolando RPCs admin para chamadas via service_role apenas.

---

## ENTREGAS

### Edge Functions

✅ **admin-verify-profile** (`admin-verify-profile/index.ts`)
- Valida que usuário é admin
- Chama RPC `verify_profile` via service_role
- Registra audit log automaticamente
- CORS configurado

✅ **admin-suspend-profile** (`admin-suspend-profile/index.ts`)
- Valida que usuário é admin
- Valida que reason é obrigatório
- Chama RPC `suspend_profile` via service_role
- Registra audit log automaticamente
- CORS configurado

### Helper Compartilhado

✅ **adminAuth** (`_shared/adminAuth.ts`)
- `validateAdmin()` - Valida token e consulta admin_users
- `requireAdmin()` - Middleware para proteger edge functions
- Retorna userId e role do admin

### Service TypeScript

✅ **AdminService** (`adminService.ts`)
- `verifyProfile()` - Chama edge function verify
- `suspendProfile()` - Chama edge function suspend
- `isCurrentUserAdmin()` - Verifica se usuário é admin
- `getProfileAuditLog()` - Busca histórico de ações

---

## ARQUIVOS CRIADOS

```
supabase/functions/
├── _shared/
│   └── adminAuth.ts                # Helper de autenticação admin
├── admin-verify-profile/
│   └── index.ts                    # Edge function verificar
└── admin-suspend-profile/
    └── index.ts                    # Edge function suspender

src/core/profiles/services/multi-profile/
├── adminService.ts                 # Service TypeScript
└── index.ts                        # Export atualizado
```

---

## FLUXO DE EXECUÇÃO

### Verificar Perfil

```
Client (Admin UI)
  ↓
AdminService.verifyProfile(profileId, reason)
  ↓
Edge Function: admin-verify-profile
  ↓
validateAdmin() → Verifica admin_users
  ↓
Supabase Client (service_role)
  ↓
RPC: verify_profile(p_profile_id, p_admin_user_id, p_reason)
  ↓
UPDATE profiles SET verified = true
INSERT INTO profile_audit_log
  ↓
Retorna { success: true, profile_id }
```

### Suspender Perfil

```
Client (Admin UI)
  ↓
AdminService.suspendProfile(profileId, reason)
  ↓
Edge Function: admin-suspend-profile
  ↓
validateAdmin() → Verifica admin_users
  ↓
Valida reason obrigatório
  ↓
Supabase Client (service_role)
  ↓
RPC: suspend_profile(p_profile_id, p_admin_user_id, p_reason)
  ↓
UPDATE profiles SET is_active = false
INSERT INTO profile_audit_log
  ↓
Retorna { success: true, profile_id }
```

---

## SEGURANÇA

### Camadas de Validação

1. **Edge Function**: Valida token JWT
2. **adminAuth**: Consulta admin_users
3. **RPC**: Executa operação via service_role
4. **Audit Log**: Registra ação com performed_by

### Permissões

- RPCs admin: `REVOKE EXECUTE FROM authenticated`
- RPCs admin: `GRANT EXECUTE TO service_role`
- Edge functions: Apenas admins autenticados
- Audit log: Apenas service_role pode inserir

### CORS

- Configurado para permitir chamadas do frontend
- Headers: Authorization, Content-Type
- Methods: POST, OPTIONS

---

## DEPLOYMENT

### Deploy Edge Functions

```bash
# Verificar login
supabase functions list

# Deploy verify
supabase functions deploy admin-verify-profile

# Deploy suspend
supabase functions deploy admin-suspend-profile

# Verificar deploy
supabase functions list
```

### Variáveis de Ambiente

As edge functions usam variáveis automáticas do Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Não é necessário configurar manualmente.

---

## PADRÕES DE USO

### Verificar Perfil (Admin UI)

```typescript
import { AdminService } from '@/core/profiles/services/multi-profile';

const handleVerify = async (profileId: string) => {
  const result = await AdminService.verifyProfile(profileId, 'Documentos verificados');
  
  if (result.success) {
    toast({ title: 'Perfil verificado' });
  } else {
    toast({ title: 'Erro', description: result.error, variant: 'destructive' });
  }
};
```

### Suspender Perfil (Admin UI)

```typescript
const handleSuspend = async (profileId: string, reason: string) => {
  const result = await AdminService.suspendProfile(profileId, reason);
  
  if (result.success) {
    toast({ title: 'Perfil suspenso' });
  } else {
    toast({ title: 'Erro', description: result.error, variant: 'destructive' });
  }
};
```

### Verificar se é Admin

```typescript
const isAdmin = await AdminService.isCurrentUserAdmin();

if (isAdmin) {
  // Mostrar UI admin
}
```

### Buscar Audit Log

```typescript
const log = await AdminService.getProfileAuditLog(profileId);

log.forEach(entry => {
  console.log(`${entry.action} por ${entry.performed_by} em ${entry.performed_at}`);
});
```

---

## TESTES MANUAIS

### Cenários para Testar

1. **Verificar Perfil (Admin)**
   - Login como admin
   - Chamar AdminService.verifyProfile()
   - Verificar que profile.verified = true
   - Verificar registro em audit_log

2. **Suspender Perfil (Admin)**
   - Login como admin
   - Chamar AdminService.suspendProfile() com reason
   - Verificar que profile.is_active = false
   - Verificar registro em audit_log

3. **Acesso Negado (Não-Admin)**
   - Login como usuário normal
   - Tentar chamar edge function
   - Deve retornar 403 Forbidden

4. **Reason Obrigatório**
   - Tentar suspender sem reason
   - Deve retornar erro 400

---

## PRÓXIMOS PASSOS

### Fase 8: Limpeza Final
- Migrar código legado
- Remover ProfileService antigo
- Unificar contexts
- Testes E2E
- Lint e formatação
- Documentação final

---

## CRITÉRIO DE PRONTO

- [x] 2 edge functions criadas
- [x] Helper adminAuth criado
- [x] AdminService TypeScript criado
- [x] Validação de admin implementada
- [x] Audit log registrado
- [x] CORS configurado
- [x] Documentação de deployment

---

**Fase 7 concluída em**: 2026-03-27 11:40

**NOTA**: Edge functions precisam ser deployadas manualmente via CLI:
```bash
supabase functions deploy admin-verify-profile
supabase functions deploy admin-suspend-profile
```
