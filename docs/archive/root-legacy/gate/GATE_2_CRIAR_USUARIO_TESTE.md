# GATE 2: CRIAR USUÁRIO MOTORISTA DE TESTE

**Objetivo:** Criar usuário real autenticado para validação operacional

---

## PASSO 1: Criar Usuário via Dashboard

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/auth/users

2. Clique em "Add User" (ou "Invite")

3. Preencha:
   - **Email:** `test-driver@acheguese.local`
   - **Password:** `TestDriver123!@#`
   - **Auto Confirm User:** ✅ SIM (marcar)

4. Clique em "Create User"

5. **COPIE O UUID DO USUÁRIO** (aparece na lista)

---

## PASSO 2: Criar Perfil e Driver Data

1. Acesse SQL Editor: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql

2. Cole o SQL abaixo **SUBSTITUINDO** `USER_UUID_AQUI` pelo UUID copiado:

```sql
DO $$
DECLARE
  v_user_id UUID := 'USER_UUID_AQUI'; -- SUBSTITUIR PELO UUID REAL
  v_profile_id UUID;
BEGIN
  -- Criar perfil
  INSERT INTO profiles (user_id, username, full_name, profile_type)
  VALUES (v_user_id, 'test_driver', 'Test Driver', 'driver')
  RETURNING id INTO v_profile_id;
  
  RAISE NOTICE 'Profile criado: %', v_profile_id;
  
  -- Criar driver_data
  INSERT INTO driver_data (driver_profile_id, is_online, is_available)
  VALUES (v_profile_id, true, true);
  
  RAISE NOTICE 'Driver data criado';
  
  -- Mostrar IDs
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Profile ID: %', v_profile_id;
END $$;
```

3. Execute (Ctrl+Enter)

4. **COPIE O PROFILE_ID** que aparece no resultado

---

## PASSO 3: Validar Criação

Execute para confirmar:

```sql
SELECT 
  p.id as profile_id,
  p.user_id,
  p.username,
  p.profile_type,
  dd.is_online,
  dd.is_available
FROM profiles p
LEFT JOIN driver_data dd ON dd.driver_profile_id = p.id
WHERE p.username = 'test_driver';
```

**Esperado:**
- 1 linha retornada
- profile_type = 'driver'
- is_online = true
- is_available = true

---

## PASSO 4: Atualizar .env.test

Crie arquivo `.env.test` com:

```bash
# Usuário Motorista de Teste
TEST_DRIVER_EMAIL="test-driver@acheguese.local"
TEST_DRIVER_PASSWORD="TestDriver123!@#"
TEST_DRIVER_USER_ID="[UUID do usuário]"
TEST_DRIVER_PROFILE_ID="[UUID do profile]"
```

---

## PASSO 5: Executar Validação

```bash
npm run test tests/operational/gate2-real-auth-validation.test.ts
```

---

## INFORMAÇÕES NECESSÁRIAS

Após criar, me informe:

1. **User ID:** (UUID do auth.users)
2. **Profile ID:** (UUID do profiles)

Ou simplesmente execute o teste e ele vai buscar automaticamente.

---

**Pronto para criar o usuário?**

