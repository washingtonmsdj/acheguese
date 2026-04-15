# GATE 2: VEREDITO FINAL - BLOQUEADO POR RLS

**Data:** 07/04/2026  
**Status:** NÃO FECHADO (bloqueado por RLS)

---

## RESUMO EXECUTIVO

Tentativa de validação operacional real do Gate 2 FALHOU devido a violação de RLS.

**Erro:** `new row violates row-level security policy for table "driver_locations"`

---

## O QUE FOI FEITO

### ✅ Setup Completo

1. **Usuário criado:**
   - ID: `f68e2893-6893-40e1-96b2-e3b16b238957`
   - Email: `test-driver@acheguese.local`
   - Password: `TestDriver123!@#`
   - Status: Confirmado

2. **Profile criado:**
   - ID: `b2b405cb-bf9c-405b-ad68-759de702dfb0`
   - Type: `driver`
   - Username: `test_driver`

3. **Driver data criado:**
   - Profile ID: `b2b405cb-bf9c-405b-ad68-759de702dfb0`
   - is_online: `true`

4. **Credenciais salvas:**
   - Arquivo: `.env.test`
   - Contém: user_id, profile_id, email, password

### ❌ Validação Operacional FALHOU

**Testes executados:**
- ✅ Autenticação: PASSOU
- ✅ Buscar profile: PASSOU
- ❌ Publicar localização: FALHOU (RLS)
- ❌ Update localização: FALHOU (RLS)
- ❌ Realtime: FALHOU (timeout - sem dados)
- ❌ Latência: FALHOU (timeout - sem dados)
- ❌ Reconexão: FALHOU (RLS)

---

## DIAGNÓSTICO DO PROBLEMA

### Policy RLS Atual

```sql
CREATE POLICY "Drivers manage own location" ON driver_locations FOR ALL TO authenticated
  USING (driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
```

### O Que a Policy Exige

1. Usuário autenticado
2. `driver_profile_id` deve ser o `id` de um profile
3. Esse profile deve ter `user_id = auth.uid()`

### O Que Está Acontecendo

**Teste:**
- auth.uid() = `f68e2893-6893-40e1-96b2-e3b16b238957`
- profile.id = `b2b405cb-bf9c-405b-ad68-759de702dfb0`
- profile.user_id = `f68e2893-6893-40e1-96b2-e3b16b238957`

**TrackingService.updatePosition():**
- Recebe: `driverProfileId = 'b2b405cb-bf9c-405b-ad68-759de702dfb0'`
- Tenta inserir: `driver_profile_id = 'b2b405cb-bf9c-405b-ad68-759de702dfb0'`

**Policy deveria passar:**
```sql
-- Verificação da policy
SELECT id FROM profiles 
WHERE user_id = 'f68e2893-6893-40e1-96b2-e3b16b238957'
-- Retorna: 'b2b405cb-bf9c-405b-ad68-759de702dfb0'

-- driver_profile_id IN (...)
'b2b405cb-bf9c-405b-ad68-759de702dfb0' IN ('b2b405cb-bf9c-405b-ad68-759de702dfb0')
-- Deveria ser TRUE
```

### Possíveis Causas

1. **Profile type não é 'driver':**
   - ❌ DESCARTADO - Verificamos que profile_type = 'driver'

2. **Profile não está ativo:**
   - ❌ DESCARTADO - Verificamos que is_active = true

3. **Sessão do Supabase não está propagando auth.uid():**
   - ⚠️ POSSÍVEL - Cliente pode não estar enviando token corretamente

4. **Policy tem bug ou condição adicional:**
   - ⚠️ POSSÍVEL - Pode haver outra policy conflitante

5. **TrackingService não está usando o cliente autenticado:**
   - ⚠️ PROVÁVEL - Service pode estar usando cliente sem auth

---

## PRÓXIMOS PASSOS OBRIGATÓRIOS

### OPÇÃO 1: Debugar RLS (RECOMENDADO)

1. **Verificar se auth.uid() está disponível:**
   ```sql
   SELECT auth.uid();
   ```

2. **Verificar se a policy está sendo avaliada corretamente:**
   ```sql
   SELECT * FROM profiles WHERE user_id = auth.uid();
   ```

3. **Testar insert manual via SQL Editor autenticado:**
   ```sql
   INSERT INTO driver_locations (driver_profile_id, lat, lng)
   VALUES ('b2b405cb-bf9c-405b-ad68-759de702dfb0', -23.5505, -46.6333);
   ```

4. **Verificar se TrackingService está usando cliente autenticado:**
   - Verificar se `supabase.auth.getSession()` retorna sessão válida
   - Verificar se headers incluem `Authorization: Bearer <token>`

### OPÇÃO 2: Criar Policy Temporária para Teste

```sql
-- Policy permissiva APENAS para teste
CREATE POLICY "test_driver_location_insert" ON driver_locations
  FOR INSERT TO authenticated
  USING (driver_profile_id = 'b2b405cb-bf9c-405b-ad68-759de702dfb0');
```

⚠️ **NÃO RECOMENDADO** - Contorna o problema sem resolver a causa raiz.

### OPÇÃO 3: Validar TrackingService

Verificar se o TrackingService está:
1. Recebendo o cliente Supabase autenticado
2. Usando o cliente correto para insert
3. Propagando o token de autenticação

---

## VEREDITO FINAL

**Gate 2 está NÃO FECHADO.**

**Bloqueador:** RLS está impedindo publicação de localização mesmo com autenticação válida.

**Matriz de Maturidade:**
- Fundação Técnica: 95% ✅
- Implementado Funcionalmente: 75% ✅
- Validado Operacionalmente: 10% ❌ (BLOQUEADO)
- Pronto para Produção: 5% ❌

**Estimativa para resolver:** 30-60 minutos de debug RLS.

---

## ARQUIVOS CRIADOS

1. `scripts/setup-gate2-simple.js` - Setup automatizado (FUNCIONOU)
2. `.env.test` - Credenciais de teste (CRIADO)
3. `tests/operational/gate2-real-auth-validation.test.ts` - Teste operacional (FALHOU POR RLS)
4. `GATE_2_VEREDITO_FINAL_BLOQUEADO_RLS.md` - Este documento

---

**Próxima ação:** Debugar RLS ou criar policy temporária para validação.
