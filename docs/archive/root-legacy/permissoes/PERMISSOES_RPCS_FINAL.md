# PERMISSÕES EXPLÍCITAS DAS RPCs - FINAL

**Data**: 2026-03-27  
**Tipo**: Padronização defensiva de permissões EXECUTE

---

## A) LISTA FINAL DE GRANT/REVOKE POR FUNÇÃO

### RPCs de Usuário (Authenticated)

#### 1. create_profile_with_extension
- ❌ REVOKE EXECUTE FROM PUBLIC
- ❌ REVOKE EXECUTE FROM anon
- ✅ GRANT EXECUTE TO authenticated

#### 2. transfer_profile_ownership
- ❌ REVOKE EXECUTE FROM PUBLIC
- ❌ REVOKE EXECUTE FROM anon
- ✅ GRANT EXECUTE TO authenticated

#### 3. delete_profile
- ❌ REVOKE EXECUTE FROM PUBLIC
- ❌ REVOKE EXECUTE FROM anon
- ✅ GRANT EXECUTE TO authenticated

#### 4. update_profile_handle
- ❌ REVOKE EXECUTE FROM PUBLIC
- ❌ REVOKE EXECUTE FROM anon
- ✅ GRANT EXECUTE TO authenticated

### RPCs Admin (Service Role Only)

#### 5. verify_profile
- ❌ REVOKE EXECUTE FROM PUBLIC
- ❌ REVOKE EXECUTE FROM anon
- ❌ REVOKE EXECUTE FROM authenticated
- ✅ GRANT EXECUTE TO service_role

#### 6. suspend_profile
- ❌ REVOKE EXECUTE FROM PUBLIC
- ❌ REVOKE EXECUTE FROM anon
- ❌ REVOKE EXECUTE FROM authenticated
- ✅ GRANT EXECUTE TO service_role

---

## B) BLOCO SQL FINAL CONSOLIDADO

```sql
-- ============================================================================
-- PERMISSÕES EXPLÍCITAS DAS RPCs
-- ============================================================================
-- Aplicar APÓS a criação de todas as funções
-- Garante que nenhuma função está acessível indevidamente
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RPCs DE USUÁRIO (Authenticated Only)
-- ----------------------------------------------------------------------------

-- create_profile_with_extension
REVOKE EXECUTE ON FUNCTION create_profile_with_extension(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_profile_with_extension(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION create_profile_with_extension(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- transfer_profile_ownership
REVOKE EXECUTE ON FUNCTION transfer_profile_ownership(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION transfer_profile_ownership(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION transfer_profile_ownership(UUID, UUID) TO authenticated;

-- delete_profile
REVOKE EXECUTE ON FUNCTION delete_profile(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION delete_profile(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION delete_profile(UUID) TO authenticated;

-- update_profile_handle
REVOKE EXECUTE ON FUNCTION update_profile_handle(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_profile_handle(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION update_profile_handle(UUID, TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. RPCs ADMIN (Service Role Only)
-- ----------------------------------------------------------------------------

-- verify_profile
REVOKE EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) FROM authenticated;
GRANT EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) TO service_role;

-- suspend_profile
REVOKE EXECUTE ON FUNCTION suspend_profile(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION suspend_profile(UUID, TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION suspend_profile(UUID, TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION suspend_profile(UUID, TEXT, UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- FIM DAS PERMISSÕES
-- ----------------------------------------------------------------------------
```

---

## C) CONFIRMAÇÃO DE SEGURANÇA

### ✅ Verificação Completa

#### Funções de Usuário
- ✅ `create_profile_with_extension`: Apenas authenticated
- ✅ `transfer_profile_ownership`: Apenas authenticated
- ✅ `delete_profile`: Apenas authenticated
- ✅ `update_profile_handle`: Apenas authenticated

#### Funções Admin
- ✅ `verify_profile`: Apenas service_role
- ✅ `suspend_profile`: Apenas service_role

#### Roles Bloqueadas
- ✅ PUBLIC: Sem acesso a nenhuma RPC
- ✅ anon: Sem acesso a nenhuma RPC
- ✅ authenticated: Sem acesso a RPCs admin

### ✅ Matriz de Permissões

| Função | PUBLIC | anon | authenticated | service_role |
|--------|--------|------|---------------|--------------|
| create_profile_with_extension | ❌ | ❌ | ✅ | ✅ (herda) |
| transfer_profile_ownership | ❌ | ❌ | ✅ | ✅ (herda) |
| delete_profile | ❌ | ❌ | ✅ | ✅ (herda) |
| update_profile_handle | ❌ | ❌ | ✅ | ✅ (herda) |
| verify_profile | ❌ | ❌ | ❌ | ✅ |
| suspend_profile | ❌ | ❌ | ❌ | ✅ |

### ✅ Testes de Validação

#### Teste 1: Anon não pode criar perfil
```sql
-- Conectar como anon
SET ROLE anon;

-- Tentar criar perfil
SELECT create_profile_with_extension('personal', 'test', 'Test', NULL, NULL, NULL);

-- Resultado esperado: ERROR: permission denied for function create_profile_with_extension
```

#### Teste 2: Authenticated não pode verificar perfil
```sql
-- Conectar como authenticated
SET ROLE authenticated;

-- Tentar verificar perfil
SELECT verify_profile('profile-id', true);

-- Resultado esperado: ERROR: permission denied for function verify_profile
```

#### Teste 3: Service role pode tudo
```sql
-- Conectar como service_role
SET ROLE service_role;

-- Pode chamar qualquer função
SELECT verify_profile('profile-id', true);
SELECT suspend_profile('profile-id', 'reason', 'admin-id');

-- Resultado esperado: SUCCESS
```

### ✅ Confirmação Final

**NENHUMA FUNÇÃO ESTÁ ACESSÍVEL INDEVIDAMENTE**

Todas as 6 RPCs têm permissões explícitas definidas:
- 4 RPCs de usuário: apenas authenticated
- 2 RPCs admin: apenas service_role
- PUBLIC e anon: bloqueados de todas as RPCs

**Postura defensiva aplicada**: REVOKE explícito de PUBLIC, anon e (quando aplicável) authenticated antes de GRANT específico.

---

## INTEGRAÇÃO NO DOCUMENTO PRINCIPAL

Este bloco SQL deve ser adicionado na seção de migrations do documento principal, após a criação de todas as funções:

```
-- 8. RPCs
CREATE FUNCTION create_profile_with_extension ...
CREATE FUNCTION transfer_profile_ownership ...
CREATE FUNCTION delete_profile ...
CREATE FUNCTION update_profile_handle ...
CREATE FUNCTION verify_profile ...
CREATE FUNCTION suspend_profile ...

-- 9. Permissões explícitas das RPCs (NOVO)
REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ... FROM anon;
GRANT EXECUTE ON FUNCTION ... TO authenticated;
...
```

---

**STATUS**: ✅ PERMISSÕES EXPLÍCITAS PADRONIZADAS E SEGURAS
