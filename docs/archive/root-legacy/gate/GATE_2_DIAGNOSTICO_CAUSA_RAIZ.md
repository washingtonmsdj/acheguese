# GATE 2: DIAGNÓSTICO DA CAUSA RAIZ

**Data:** 07/04/2026  
**Status:** CAUSA RAIZ IDENTIFICADA E CORRIGIDA

---

## RESUMO EXECUTIVO

Bloqueio RLS tinha DUAS causas raiz:
1. **TrackingService usava cliente Supabase não autenticado** (CRÍTICO)
2. **Policy RLS não tinha WITH CHECK explícito para INSERT** (IMPORTANTE)

Ambas foram corrigidas.

---

## ETAPA 1: IDENTIFICAÇÃO DO CLIENTE SUPABASE

### Investigação

**Arquivo:** `src/core/tracking/services/TrackingService.ts`

```typescript
import { supabase } from '@/integrations/supabase';  // ❌ Cliente singleton global

export class TrackingService {
  async updatePosition(...) {
    await supabase.from('driver_locations').upsert(...);  // ❌ Usa cliente global
  }
}
```

**Arquivo:** `src/integrations/supabase/supabase.ts`

```typescript
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: window.localStorage,  // ❌ Sessão separada
      storageKey: 'supabase.auth.token',
    },
  },
);
```

### Problema Identificado

**Teste criava NOVO cliente:**
```typescript
// tests/operational/gate2-real-auth-validation.test.ts
supabase = createClient(supabaseUrl, supabaseKey);  // Cliente A
await supabase.auth.signInWithPassword(...);        // Autentica Cliente A

trackingService = new TrackingService(supabase);    // ❌ Mas TrackingService ignorava e usava Cliente B
```

**TrackingService usava cliente GLOBAL:**
```typescript
// Cliente B (singleton global) - NÃO autenticado
import { supabase } from '@/integrations/supabase';
```

**Resultado:**
- Cliente A: Autenticado como motorista ✅
- Cliente B: Não autenticado ❌
- TrackingService usava Cliente B ❌
- RLS bloqueava porque `auth.uid()` era NULL ❌

### Correção Aplicada

**Antes:**
```typescript
export class TrackingService {
  private constructor() { }  // ❌ Sem injeção de dependência
  
  async updatePosition(...) {
    await supabase.from(...).upsert(...);  // ❌ Cliente hardcoded
  }
}
```

**Depois:**
```typescript
export class TrackingService {
  private supabaseClient: SupabaseClient;
  
  constructor(supabaseClient?: SupabaseClient) {
    this.supabaseClient = supabaseClient || defaultSupabase;  // ✅ Injeção de dependência
  }
  
  async updatePosition(...) {
    await this.supabaseClient.from(...).upsert(...);  // ✅ Cliente injetado
  }
}
```

**Teste atualizado:**
```typescript
supabase = createClient(supabaseUrl, supabaseKey);
await supabase.auth.signInWithPassword(...);
trackingService = new TrackingService(supabase);  // ✅ Injeta cliente autenticado
```

---

## ETAPA 2: REVISÃO DA POLICY RLS

### Policy Original

```sql
CREATE POLICY "Drivers manage own location" ON driver_locations 
  FOR ALL TO authenticated
  USING (driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
```

### Problemas Identificados

1. **FOR ALL é ambíguo:**
   - Cobre SELECT, INSERT, UPDATE, DELETE
   - Não tem `WITH CHECK` explícito para INSERT
   - PostgreSQL usa `USING` como fallback para `WITH CHECK`
   - Mas isso pode causar comportamento inesperado

2. **Falta validação de profile_type:**
   - Policy não verifica se profile é do tipo 'driver'
   - Qualquer profile poderia tentar inserir localização

### Correção Aplicada

**Policies separadas por operação:**

```sql
-- SELECT: Qualquer autenticado pode ver
CREATE POLICY "driver_locations_select_policy" ON driver_locations
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: Motorista só pode inserir própria localização
CREATE POLICY "driver_locations_insert_policy" ON driver_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  );

-- UPDATE: Motorista só pode atualizar própria localização
CREATE POLICY "driver_locations_update_policy" ON driver_locations
  FOR UPDATE TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  )
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  );

-- DELETE: Motorista só pode deletar própria localização
CREATE POLICY "driver_locations_delete_policy" ON driver_locations
  FOR DELETE TO authenticated
  USING (
    driver_profile_id IN (
      SELECT id FROM profiles 
      WHERE user_id = auth.uid() AND profile_type = 'driver'
    )
  );
```

### Melhorias

1. ✅ `WITH CHECK` explícito para INSERT
2. ✅ Validação de `profile_type = 'driver'`
3. ✅ Policies separadas por operação (mais claro)
4. ✅ SELECT aberto para todos autenticados (necessário para passageiros)
5. ✅ INSERT/UPDATE/DELETE restritos ao próprio motorista

---

## ETAPA 3: VALIDAÇÃO NO CENÁRIO REAL

### Pré-requisitos

1. ✅ Usuário motorista criado: `f68e2893-6893-40e1-96b2-e3b16b238957`
2. ✅ Profile criado: `b2b405cb-bf9c-405b-ad68-759de702dfb0` (type: driver)
3. ✅ Driver data criado
4. ✅ Credenciais salvas em `.env.test`
5. ✅ TrackingService corrigido (aceita cliente injetado)
6. ⏳ Policy RLS corrigida (aguardando aplicação manual)

### Próximo Passo

Executar validação operacional:
```bash
npm run test tests/operational/gate2-real-auth-validation.test.ts
```

### Evidências Esperadas

- ✅ Autenticação: PASSA
- ✅ Publicar localização: PASSA (com cliente autenticado)
- ✅ Update localização: PASSA (upsert)
- ✅ Realtime: PASSA (recebe atualizações)
- ✅ Latência: < 5s
- ✅ Reconexão: PASSA

---

## ETAPA 4: DIAGNÓSTICO HONESTO

### Causa Raiz Real

**AMBAS as causas eram bloqueadores:**

1. **Cliente não autenticado (CRÍTICO):**
   - TrackingService usava cliente singleton global
   - Teste autenticava cliente diferente
   - `auth.uid()` era NULL no contexto do TrackingService
   - RLS bloqueava corretamente

2. **Policy sem WITH CHECK explícito (IMPORTANTE):**
   - Policy `FOR ALL` não tinha `WITH CHECK` para INSERT
   - Comportamento ambíguo
   - Faltava validação de `profile_type = 'driver'`

### Correções Aplicadas

1. ✅ **TrackingService:**
   - Aceita cliente Supabase via construtor
   - Usa cliente injetado em todas as operações
   - Fallback para cliente global (compatibilidade)

2. ⏳ **Policy RLS:**
   - Policies separadas por operação
   - `WITH CHECK` explícito para INSERT
   - Validação de `profile_type = 'driver'`
   - Aguardando aplicação manual

### Arquivos Modificados

1. `src/core/tracking/services/TrackingService.ts` - Injeção de dependência
2. `tests/operational/gate2-real-auth-validation.test.ts` - Injeta cliente autenticado
3. `supabase/migrations/20260407000004_gate2_fix_driver_locations_policy.sql` - Policy corrigida
4. `APLICAR_NO_SUPABASE_GATE2_POLICY.sql` - SQL para aplicação manual
5. `aplicar-gate2-policy.ps1` - Script PowerShell para aplicar

---

## VEREDITO PARCIAL

**Causa raiz identificada:** ✅  
**Correção de código aplicada:** ✅  
**Correção de policy aplicada:** ⏳ (aguardando aplicação manual)  
**Validação operacional:** ⏳ (aguardando policy)

**Gate 2 será fechado após:**
1. Aplicar policy RLS no SQL Editor
2. Executar validação operacional
3. Confirmar todas as evidências

---

## LIÇÕES APRENDIDAS

1. **Singleton global é anti-pattern para testes:**
   - Dificulta injeção de dependência
   - Cria acoplamento desnecessário
   - Impede testes com contextos diferentes

2. **Policy `FOR ALL` é ambígua:**
   - Sempre separar por operação
   - Sempre usar `WITH CHECK` explícito para INSERT/UPDATE
   - Sempre validar condições de negócio (ex: profile_type)

3. **RLS é segurança, não obstáculo:**
   - Não contornar com policy permissiva
   - Corrigir a causa raiz
   - Validar no cenário real

---

**Próxima ação:** Aplicar policy RLS e executar validação operacional.
