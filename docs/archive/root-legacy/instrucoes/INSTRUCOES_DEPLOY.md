# INSTRUÇÕES DE DEPLOY - MULTI-PERFIL REAL

**Data**: 2026-03-27  
**Projeto**: xhdowzacfujckjelqhtd  
**Status**: Pronto para deploy

---

## PRÉ-REQUISITOS

### Verificações
- [x] Build executado com sucesso
- [x] 0 erros de ESLint
- [x] Migrations aplicadas no banco remoto
- [x] Supabase CLI instalado (v2.75.0+)
- [x] Credenciais configuradas em `.env.local`

### Ambiente
```bash
# Verificar versão do CLI
supabase --version

# Verificar conexão com projeto
supabase projects list
```

---

## DEPLOY EDGE FUNCTIONS

### 1. Conectar ao Projeto (se necessário)
```bash
supabase link --project-ref xhdowzacfujckjelqhtd
```

### 2. Deploy admin-verify-profile
```bash
supabase functions deploy admin-verify-profile --project-ref xhdowzacfujckjelqhtd
```

**Esperado**:
```
Deploying function admin-verify-profile...
Function admin-verify-profile deployed successfully.
URL: https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-verify-profile
```

### 3. Deploy admin-suspend-profile
```bash
supabase functions deploy admin-suspend-profile --project-ref xhdowzacfujckjelqhtd
```

**Esperado**:
```
Deploying function admin-suspend-profile...
Function admin-suspend-profile deployed successfully.
URL: https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-suspend-profile
```

### 4. Verificar Deploy
```bash
supabase functions list --project-ref xhdowzacfujckjelqhtd
```

**Esperado**:
```
┌─────────────────────────┬─────────┬─────────────────────┐
│ NAME                    │ STATUS  │ UPDATED             │
├─────────────────────────┼─────────┼─────────────────────┤
│ admin-verify-profile    │ ACTIVE  │ 2026-03-27 11:50:00 │
│ admin-suspend-profile   │ ACTIVE  │ 2026-03-27 11:50:00 │
└─────────────────────────┴─────────┴─────────────────────┘
```

---

## TESTES PÓS-DEPLOY

### 1. Testar admin-verify-profile

**Requisitos**:
- Usuário admin cadastrado em `admin_users`
- Service role key configurada

**Teste via curl**:
```bash
curl -X POST \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-verify-profile \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "uuid-do-perfil",
    "adminUserId": "uuid-do-admin"
  }'
```

**Resposta esperada**:
```json
{
  "success": true,
  "message": "Profile verified successfully",
  "profile": {
    "id": "uuid-do-perfil",
    "is_verified": true,
    "verified_at": "2026-03-27T11:50:00Z"
  }
}
```

### 2. Testar admin-suspend-profile

**Teste via curl**:
```bash
curl -X POST \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-suspend-profile \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "uuid-do-perfil",
    "adminUserId": "uuid-do-admin",
    "reason": "Violação de termos de uso",
    "duration": 7
  }'
```

**Resposta esperada**:
```json
{
  "success": true,
  "message": "Profile suspended successfully",
  "profile": {
    "id": "uuid-do-perfil",
    "is_suspended": true,
    "suspended_until": "2026-04-03T11:50:00Z",
    "suspension_reason": "Violação de termos de uso"
  }
}
```

### 3. Verificar Audit Log

**Query SQL**:
```sql
SELECT * FROM profile_audit_log 
WHERE profile_id = 'uuid-do-perfil' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Esperado**: Registros de verify e suspend com admin_user_id

---

## TESTES FUNCIONAIS NA UI

### 1. Criação de Perfis

**Passos**:
1. Login na aplicação
2. Acessar criação de perfil
3. Criar perfil personal
4. Criar perfil business (preencher CNPJ)
5. Criar perfil professional (preencher CRM)
6. Criar perfil driver (preencher CNH)

**Validações**:
- [ ] Cada perfil tem handle único
- [ ] profile_type está correto
- [ ] Extensões foram criadas
- [ ] Perfil aparece na lista de perfis do usuário

### 2. Rotas Públicas

**Passos**:
1. Copiar handle de um perfil
2. Acessar `/p/:handle` (sem login)
3. Verificar dados exibidos

**Validações**:
- [ ] Perfil público é exibido
- [ ] Extensão é renderizada corretamente
- [ ] Vínculos públicos aparecem
- [ ] Vínculos privados NÃO aparecem
- [ ] Perfil privado retorna 404
- [ ] SEO meta tags estão presentes

### 3. Configurações de Privacidade

**Passos**:
1. Login na aplicação
2. Acessar `/perfil/configuracoes`
3. Ir para tab "Privacidade"
4. Alterar toggles de privacidade

**Validações**:
- [ ] Toggles funcionam
- [ ] Mudanças são salvas
- [ ] Toast de sucesso aparece
- [ ] Rota pública reflete mudanças

### 4. Gestão de Vínculos

**Passos**:
1. Acessar `/perfil/configuracoes`
2. Ir para tab "Vínculos"
3. Adicionar novo vínculo
4. Editar vínculo existente
5. Reordenar vínculos
6. Deletar vínculo

**Validações**:
- [ ] CRUD funciona
- [ ] Privacidade por vínculo funciona
- [ ] Ordenação é salva
- [ ] Rota pública reflete mudanças

### 5. Gestão de Membros

**Passos**:
1. Acessar `/perfil/configuracoes`
2. Ir para tab "Membros"
3. Adicionar novo membro (email)
4. Alterar role de membro
5. Remover membro

**Validações**:
- [ ] Apenas owner pode adicionar/remover
- [ ] Manager pode editar perfil
- [ ] Member não pode editar
- [ ] Convites funcionam (se implementado)

### 6. Troca de Perfil

**Passos**:
1. Clicar no MultiProfileSwitcher
2. Selecionar outro perfil
3. Verificar que UI atualiza

**Validações**:
- [ ] Perfil ativo muda
- [ ] localStorage é atualizado
- [ ] UI reflete perfil ativo
- [ ] Perfil personal é default

---

## TESTES DE SEGURANÇA

### 1. RLS Policies

**Teste 1: Usuário anon**
```sql
-- Conectar como anon
SET ROLE anon;

-- Deve retornar apenas perfis públicos
SELECT * FROM public_profiles;

-- Deve falhar (sem acesso direto)
SELECT * FROM profiles;
```

**Teste 2: Usuário authenticated**
```sql
-- Conectar como authenticated
SET ROLE authenticated;
SET request.jwt.claims.sub = 'user-uuid';

-- Deve retornar perfis do usuário
SELECT * FROM profiles WHERE user_id = 'user-uuid';

-- Deve falhar (perfis de outros)
SELECT * FROM profiles WHERE user_id != 'user-uuid';
```

### 2. RPCs

**Teste 1: create_profile_with_extension**
```sql
-- Como authenticated
SELECT create_profile_with_extension(
  'business',
  'minha-empresa',
  'Minha Empresa',
  '{"cnpj": "12345678000190"}'::jsonb
);
```

**Teste 2: verify_profile (deve falhar)**
```sql
-- Como authenticated (não admin)
SELECT verify_profile('profile-uuid', 'admin-uuid');
-- Esperado: ERROR: permission denied
```

### 3. Admin Functions

**Teste 1: Sem service_role (deve falhar)**
```bash
curl -X POST \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-verify-profile \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileId": "uuid", "adminUserId": "uuid"}'
```

**Esperado**: 403 Forbidden

**Teste 2: Com service_role (deve funcionar)**
```bash
curl -X POST \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-verify-profile \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"profileId": "uuid", "adminUserId": "uuid"}'
```

**Esperado**: 200 OK

---

## MONITORAMENTO

### Logs de Edge Functions
```bash
# Ver logs em tempo real
supabase functions logs admin-verify-profile --follow
supabase functions logs admin-suspend-profile --follow
```

### Audit Log
```sql
-- Ver últimas ações admin
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

### Performance
```sql
-- Ver perfis mais acessados
SELECT 
  handle,
  profile_type,
  view_count,
  last_viewed_at
FROM profiles
ORDER BY view_count DESC
LIMIT 10;
```

---

## ROLLBACK (SE NECESSÁRIO)

### Edge Functions
```bash
# Deletar edge function
supabase functions delete admin-verify-profile
supabase functions delete admin-suspend-profile
```

### Migrations
```bash
# Reverter última migration
supabase db reset --linked

# Aplicar até migration específica
supabase db push --linked
```

**ATENÇÃO**: Rollback de migrations pode causar perda de dados. Fazer backup antes.

---

## SUPORTE

### Documentação
- `ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md` - Arquitetura completa
- `PLANO_EXECUCAO_FASES.md` - Plano de execução
- `FASE_*_ENTREGA.md` - Documentação de cada fase
- `STATUS_IMPLEMENTACAO.md` - Status atual

### Logs
- Edge functions: `supabase functions logs`
- Banco de dados: `profile_audit_log` table
- Aplicação: Browser console

---

**Última atualização**: 2026-03-27 11:50

