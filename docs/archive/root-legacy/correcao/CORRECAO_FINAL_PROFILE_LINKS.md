# CORREÇÃO FINAL: Profile Links Policies

**Data**: 2026-03-27  
**Tipo**: Correção de inconsistência de ownership

---

## A) POLICY ANTIGA

### SELECT (Antiga)
```sql
CREATE POLICY "Users can view links of their profiles"
  ON profile_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_links.from_profile_id
      AND user_id = auth.uid()
    )
  );
```

### ALL (Antiga)
```sql
CREATE POLICY "Users can manage links of their profiles"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_links.from_profile_id
      AND user_id = auth.uid()
    )
  );
```

**Problema**: Apenas dono estrutural (`profiles.user_id`) podia gerenciar links, ignorando owner/admin operacional.

---

## B) POLICY CORRIGIDA

### SELECT (Corrigida)
```sql
CREATE POLICY "Users can view links of their profiles"
  ON profile_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_links.from_profile_id
      AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_links.from_profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );
```

### ALL (Corrigida)
```sql
CREATE POLICY "Users can manage links of their profiles"
  ON profile_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = profile_links.from_profile_id
      AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_links.from_profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );
```

**Solução**: Dono estrutural OU owner/admin operacional podem gerenciar links.

---

## C) EXPLICAÇÃO OBJETIVA

### Por que essa correção fecha a última inconsistência?

**Inconsistência identificada**:
O modelo híbrido de ownership estava aplicado em:
- ✅ `profiles` (UPDATE policies)
- ✅ `business_data` (ALL policies)
- ✅ `professional_data` (ALL policies)
- ✅ `profile_members` (gestão de membros)
- ❌ `profile_links` (apenas dono estrutural)

**Cenário problemático**:
1. Usuário A cria perfil business
2. Usuário A adiciona usuário B como member
3. Usuário A transfere ownership para B
4. B vira owner operacional, A vira admin
5. B consegue:
   - ✅ Atualizar perfil
   - ✅ Gerenciar business_data
   - ✅ Adicionar/remover membros
   - ❌ Gerenciar profile_links (BLOQUEADO pela policy antiga)

**Impacto da correção**:
Após transferência de ownership, o novo owner operacional tem controle completo sobre o perfil, incluindo:
- Atualização de dados do perfil
- Gestão de extensões (business_data/professional_data)
- Gestão de membros
- **Gestão de vínculos (profile_links)** ← AGORA CORRIGIDO

**Consistência final**:
Todas as policies de gestão seguem o mesmo padrão:
```
dono estrutural (profiles.user_id = auth.uid())
OU
owner/admin operacional (profile_members.role IN ('owner', 'admin'))
```

**Resultado**: O modelo híbrido de ownership está agora 100% consistente em todas as tabelas relacionadas ao perfil.

---

## VALIDAÇÃO

### Teste: Owner operacional gerencia links após transferência

```sql
-- Setup
-- Usuário A cria business
INSERT INTO profiles (id, user_id, profile_type, handle, display_name)
VALUES ('business-id', 'user-a-id', 'business', 'empresa-teste', 'Empresa Teste');

INSERT INTO profile_members (profile_id, user_id, role)
VALUES ('business-id', 'user-a-id', 'owner');

-- Usuário A adiciona usuário B
INSERT INTO profile_members (profile_id, user_id, role)
VALUES ('business-id', 'user-b-id', 'member');

-- Transferência de ownership
UPDATE profile_members SET role = 'admin' WHERE profile_id = 'business-id' AND role = 'owner';
UPDATE profile_members SET role = 'owner' WHERE profile_id = 'business-id' AND user_id = 'user-b-id';

-- Teste: Usuário B (novo owner) tenta criar link
-- Autenticado como user-b-id
INSERT INTO profile_links (from_profile_id, to_profile_id, link_type)
VALUES ('business-id', 'other-profile-id', 'owns');

-- Resultado esperado: ✅ SUCCESS (policy corrigida permite)
-- Resultado com policy antiga: ❌ BLOCKED (apenas user-a-id poderia)
```

---

## CONCLUSÃO

Esta correção fecha a última inconsistência do documento, garantindo que o modelo híbrido de ownership seja aplicado uniformemente em todas as operações de gestão de perfil.

**Status final**: ✅ 100% CONSISTENTE E PRONTO PARA IMPLEMENTAÇÃO
