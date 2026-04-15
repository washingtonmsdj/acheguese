# FASE 2 — INTEGRAÇÃO PROFILE: DIAGNÓSTICO COMPLETO

**Data**: 2026-03-29  
**Status**: Diagnóstico Inicial  
**Objetivo**: Consolidar username como identidade pública do profile

---

## 1. DIAGNÓSTICO DOS PONTOS DE INTEGRAÇÃO

### 1.1 Estado Atual do Módulo Profile

#### Arquivos Principais Identificados
- `src/core/profiles/services/ProfileService.ts` - Service principal (SSOT atual)
- `src/core/profiles/services/ProfileIdentityService.ts` - Service de identidade (duplicado)
- `src/core/profiles/index.ts` - Exports do módulo
- `src/core/public-identity/adapters/ProfileIdentityAdapter.ts` - Adapter já criado

#### Duplicações Críticas Encontradas

**DUPLICAÇÃO 1: isUsernameAvailable()**
- ✅ Existe em `ProfileService.isUsernameAvailable()`
- ✅ Existe em `ProfileIdentityService.isUsernameAvailable()`
- ❌ NENHUM usa `PublicIdentityService`
- ❌ Ambos fazem query direta em `profiles.username`

**DUPLICAÇÃO 2: Dois Services de Profile**
- `ProfileService` - 1000+ linhas, SSOT atual
- `ProfileIdentityService` - 700+ linhas, duplica funcionalidade
- Ambos têm métodos idênticos: `getByUsername()`, `isUsernameAvailable()`, `createProfile()`, etc.

**DUPLICAÇÃO 3: Validação de Username**
- Nenhum dos services usa `ProfileIdentityPolicy` para validação
- Nenhum dos services usa `PublicIdentityService` para disponibilidade
- Validação está espalhada ou ausente

### 1.2 Infraestrutura Faltante

#### Migration de Histórico
❌ **NÃO EXISTE** `profile_username_history`
- Precisa criar migration completa
- Estrutura similar a `business_slug_history`
- Trigger para registro automático

#### Rota Pública
❌ **NÃO EXISTE** `/u/:username`
- Nenhuma rota pública para profile por username
- Apenas `/perfil/:userId` existe (rota interna)

#### Integração com Core
✅ `ProfileIdentityAdapter` já existe
✅ `ProfileIdentityPolicy` já existe
❌ Nenhum service usa o adapter
❌ Nenhum service usa a policy

---

## 2. ARQUITETURA FINAL APLICADA EM PROFILE

### 2.1 Decisões Arquiteturais

#### Identidade Pública
- **Campo**: `profiles.username` (já existe)
- **Rota Pública Principal**: `/u/:username` (criar)
- **Rota Interna/Compatibilidade**: `/perfil/:userId` (manter)
- **Histórico**: Interno, sem redirect público

#### Consolidação de Services
**DECISÃO CRÍTICA**: Manter apenas `ProfileService` como SSOT
- ❌ Remover `ProfileIdentityService` (duplicação desnecessária)
- ✅ Refatorar `ProfileService` para usar `PublicIdentityService`
- ✅ Remover duplicação de `isUsernameAvailable`

#### Histórico de Username
- **Tabela**: `profile_username_history`
- **Trigger**: Automático em UPDATE de `profiles.username`
- **Cooldown**: 30 dias (definido em `ProfileIdentityPolicy`)
- **Redirect Público**: NÃO (apenas auditoria interna)

#### Validação e Disponibilidade
- **Validação**: `ProfileIdentityPolicy.validate()`
- **Disponibilidade**: `PublicIdentityService.checkAvailability()`
- **Sugestões**: `PublicIdentityService.suggestAlternatives()`
- **Cooldown**: `PublicIdentityService.canChange()`

### 2.2 Fluxo de Integração

#### Create Profile
```typescript
async createProfile(profile: CreateProfileData): Promise<Profile> {
  // 1. Validar username via PublicIdentityService
  const validation = await publicIdentityService.validateIdentifier(
    'profile',
    profile.username
  );
  
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  // 2. Verificar disponibilidade
  const availability = await publicIdentityService.checkAvailability(
    'profile',
    profile.username
  );
  
  if (!availability.available) {
    throw new Error('Username already in use');
  }

  // 3. Criar profile (trigger registra histórico inicial)
  const { data, error } = await supabase
    .from('profiles')
    .insert({ ...profile })
    .select()
    .single();

  return data;
}
```

#### Update Profile
```typescript
async updateProfile(
  profileId: string,
  updates: UpdateProfileData
): Promise<Profile> {
  // Se username não mudou, update normal
  if (!updates.username) {
    return this._updateProfileDirect(profileId, updates);
  }

  // 1. Buscar profile atual
  const current = await this.getProfileById(profileId);
  if (!current) throw new Error('Profile not found');

  // 2. Se username é o mesmo, update normal
  if (current.username === updates.username) {
    return this._updateProfileDirect(profileId, updates);
  }

  // 3. Validar novo username
  const validation = await publicIdentityService.validateIdentifier(
    'profile',
    updates.username
  );
  
  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  // 4. Verificar cooldown
  const cooldown = await publicIdentityService.canChange(
    'profile',
    profileId
  );
  
  if (!cooldown.canChange) {
    throw new Error(
      `Cannot change username. ${cooldown.daysRemaining} days remaining.`
    );
  }

  // 5. Verificar disponibilidade
  const availability = await publicIdentityService.checkAvailability(
    'profile',
    updates.username,
    profileId
  );
  
  if (!availability.available) {
    throw new Error('Username already in use');
  }

  // 6. Update (trigger registra histórico)
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  return data;
}
```

---

## 3. ARQUIVOS A ALTERAR

### 3.1 Migrations (Criar)

#### `supabase/migrations/20260329000012_profile_username_history.sql`
```sql
-- Tabela de histórico de username
CREATE TABLE IF NOT EXISTS profile_username_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_username TEXT NOT NULL,
  new_username TEXT NOT NULL,
  change_reason TEXT NOT NULL DEFAULT 'username_changed',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT profile_username_history_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_profile_username_history_profile_id 
  ON profile_username_history(profile_id);
CREATE INDEX idx_profile_username_history_changed_at 
  ON profile_username_history(changed_at DESC);
CREATE INDEX idx_profile_username_history_old_username 
  ON profile_username_history(old_username);

-- RLS
ALTER TABLE profile_username_history ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas o dono pode ver seu histórico
CREATE POLICY "Users can view own username history"
  ON profile_username_history
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Trigger para registro automático
CREATE OR REPLACE FUNCTION fn_record_profile_username_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Registra apenas se username mudou
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    INSERT INTO profile_username_history (
      profile_id,
      old_username,
      new_username,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.username,
      NEW.username,
      'username_changed'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_record_profile_username_history
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_profile_username_history();
```

### 3.2 Services (Refatorar)

#### `src/core/profiles/services/ProfileService.ts`
**Alterações**:
1. Importar `PublicIdentityService`
2. Remover `isUsernameAvailable()` duplicado
3. Adicionar validação em `createProfile()`
4. Adicionar validação e cooldown em `updateProfile()`
5. Criar método privado `_updateProfileDirect()` para updates sem username

#### `src/core/profiles/services/ProfileIdentityService.ts`
**DECISÃO**: REMOVER ARQUIVO COMPLETO
- Duplicação desnecessária
- Toda funcionalidade já está em `ProfileService`
- Nenhum código usa este service

### 3.3 Routing (Criar)

#### `src/core/routing/components/ProfilePublicRoute.tsx`
```typescript
/**
 * Rota pública de profile por username
 * /u/:username
 */
import { useParams, Navigate } from 'react-router-dom';
import { useProfile } from '@/core/profiles/hooks/useProfile';

export function ProfilePublicRoute() {
  const { username } = useParams<{ username: string }>();
  const { profile, loading, error } = useProfile({ username });

  if (loading) return <div>Loading...</div>;
  if (error || !profile) return <Navigate to="/404" replace />;

  // Renderizar página pública do profile
  return <ProfilePublicPage profile={profile} />;
}
```

#### Adicionar rota em `src/App.tsx` ou router principal
```typescript
<Route path="/u/:username" element={<ProfilePublicRoute />} />
```

### 3.4 Exports (Atualizar)

#### `src/core/profiles/index.ts`
**Remover**:
```typescript
export { profileIdentityService, ProfileIdentityService } from './services/ProfileIdentityService';
```

**Manter apenas**:
```typescript
export { profileService, ProfileService } from './services/ProfileService';
```

---

## 4. TESTES OBRIGATÓRIOS (MÍNIMO 10)

### 4.1 Testes de Rota Pública
1. ✅ `/u/:username` resolve corretamente
2. ✅ `/u/:username` com username inválido retorna 404
3. ✅ `/perfil/:userId` continua funcionando (compatibilidade)

### 4.2 Testes de Validação
4. ✅ Username inválido é rejeitado (caracteres especiais)
5. ✅ Username reservado é rejeitado (admin, api, etc)
6. ✅ Username já em uso é rejeitado

### 4.3 Testes de Cooldown
7. ✅ Alteração explícita de username respeita cooldown de 30 dias
8. ✅ Primeira mudança de username não tem cooldown
9. ✅ Alteração de outros campos do profile não afeta username

### 4.4 Testes de Histórico
10. ✅ Histórico interno registra mudança de username
11. ✅ Usernames antigos NÃO geram redirect público
12. ✅ Histórico é visível apenas para o dono do profile

### 4.5 Testes de Integração
13. ✅ `ProfileService` não mantém disponibilidade duplicada fora do núcleo central
14. ✅ `createProfile()` valida username via `PublicIdentityService`
15. ✅ `updateProfile()` valida username e cooldown via `PublicIdentityService`

---

## 5. CHECKLIST FINAL DE ACEITE

### 5.1 Infraestrutura
- [ ] Migration `profile_username_history` criada e aplicada
- [ ] Trigger de histórico funcionando
- [ ] RLS configurado corretamente

### 5.2 Integração Core
- [ ] `ProfileService` usa `PublicIdentityService` para validação
- [ ] `ProfileService` usa `PublicIdentityService` para disponibilidade
- [ ] `ProfileService` usa `PublicIdentityService` para cooldown
- [ ] Duplicação de `isUsernameAvailable` removida

### 5.3 Rota Pública
- [ ] Rota `/u/:username` criada e funcionando
- [ ] Rota `/perfil/:userId` mantida como compatibilidade
- [ ] Username antigo NÃO gera redirect público

### 5.4 Testes
- [ ] Mínimo 15 testes criados
- [ ] 100% dos testes aprovados
- [ ] Cobertura de validação, cooldown e histórico

### 5.5 Limpeza
- [ ] `ProfileIdentityService.ts` removido
- [ ] Imports atualizados
- [ ] Exports limpos em `index.ts`

---

## 6. PRÓXIMOS PASSOS

1. **Criar migration** `profile_username_history`
2. **Refatorar** `ProfileService` para usar `PublicIdentityService`
3. **Remover** `ProfileIdentityService` (duplicação)
4. **Criar** rota `/u/:username`
5. **Criar** testes obrigatórios (mínimo 15)
6. **Validar** checklist final

---

**OBSERVAÇÃO CRÍTICA**: A duplicação entre `ProfileService` e `ProfileIdentityService` é desnecessária e viola SSOT. Apenas `ProfileService` deve existir como fonte única de verdade para profiles.
