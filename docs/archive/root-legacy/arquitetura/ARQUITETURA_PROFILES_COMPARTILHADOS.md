# ARQUITETURA: PROFILES COMPARTILHADOS

## CONCEITO

O sistema usa um único profile por usuário, compartilhado entre todos os módulos:
- Comunidade
- Mobilidade (Passageiro e Motorista)
- Gastronomia
- Eventos
- Outros módulos

## ESTRUTURA

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles (Tabela central)
    ↓ (1:N)
├── community_posts
├── ride_requests (passenger_profile_id)
├── ride_requests (driver_profile_id)
├── driver_data
├── restaurant_reviews
└── event_registrations
```

## TABELA PROFILES

```sql
CREATE TABLE profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  avatar_url        TEXT,
  bio               TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint para garantir 1 profile por usuário
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);
```

## FLUXO DE CRIAÇÃO

### 1. Signup (Novo Usuário)
```
1. Usuário cria conta → auth.users
2. Trigger automático → cria profile
3. Profile disponível para todos os módulos
```

### 2. Primeiro Acesso ao Módulo
```
1. Usuário acessa mobilidade
2. Sistema busca profile existente
3. Se não existir, cria automaticamente
4. Profile compartilhado com outros módulos
```

## PROBLEMA ATUAL

### Profiles Duplicados
- Usuário `a3ea040f-6f7a-44dd-b778-10eff4295303` tem 6 profiles
- Causa: Trigger executando múltiplas vezes ou inserções manuais
- Impacto: Query `.single()` falha com erro 406

### Solução Aplicada no Código
```typescript
// ANTES (FALHA COM DUPLICATAS)
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', user.id)
  .single(); // ❌ Erro 406 se múltiplos

// DEPOIS (FUNCIONA COM DUPLICATAS)
const { data: profilesList } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', user.id)
  .limit(1); // ✅ Retorna primeiro

const profile = profilesList[0];
```

### Solução Definitiva no Banco
1. Migrar referências para profile principal
2. Deletar profiles duplicados
3. Adicionar constraint UNIQUE
4. Prevenir duplicatas futuras

## BOAS PRÁTICAS

### 1. Sempre usar profile_id (não user_id)
```typescript
// ❌ ERRADO
ride_requests.passenger_user_id = user.id

// ✅ CORRETO
ride_requests.passenger_profile_id = profile.id
```

### 2. Buscar profile uma vez e cachear
```typescript
// Hook centralizado
const { profile } = useAuth(); // Já retorna profile

// Não buscar profile em cada componente
```

### 3. Validar profile existe
```typescript
if (!profile) {
  toast.error("Perfil não encontrado");
  return;
}
```

### 4. Usar RLS baseado em profile_id
```sql
CREATE POLICY "Users access own data"
  ON ride_requests FOR SELECT
  USING (
    passenger_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

## MÓDULOS QUE USAM PROFILES

### Comunidade
- `community_posts.author_profile_id`
- `community_comments.author_profile_id`
- `community_reactions.profile_id`

### Mobilidade
- `ride_requests.passenger_profile_id`
- `ride_requests.driver_profile_id`
- `driver_data.driver_profile_id`
- `driver_availability.profile_id`

### Gastronomia
- `restaurant_reviews.reviewer_profile_id`
- `restaurant_favorites.profile_id`

### Eventos
- `event_registrations.profile_id`
- `event_attendance.profile_id`

## MIGRAÇÃO DE DADOS

### Cenário: Limpar duplicatas
```sql
-- 1. Identificar profile principal (mais antigo com nome)
WITH profile_principal AS (
  SELECT id
  FROM profiles
  WHERE user_id = 'USER_ID'
  ORDER BY 
    CASE WHEN display_name IS NOT NULL THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1
)

-- 2. Atualizar todas as referências
UPDATE ride_requests
SET passenger_profile_id = (SELECT id FROM profile_principal)
WHERE passenger_profile_id IN (
  SELECT id FROM profiles WHERE user_id = 'USER_ID'
);

-- 3. Deletar duplicatas
DELETE FROM profiles
WHERE user_id = 'USER_ID'
  AND id NOT IN (SELECT id FROM profile_principal);
```

## PREVENÇÃO DE DUPLICATAS

### 1. Constraint UNIQUE
```sql
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_user_id_unique 
  UNIQUE (user_id);
```

### 2. Trigger de criação seguro
```sql
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE user_id = NEW.id
  ) THEN
    INSERT INTO profiles (user_id, display_name)
    VALUES (NEW.id, NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Código defensivo
```typescript
// Sempre usar limit(1) ou maybeSingle()
const { data: profiles } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', user.id)
  .limit(1);
```

## CONCLUSÃO

O sistema usa profiles compartilhados entre módulos para:
- ✅ Consistência de dados
- ✅ Evitar duplicação de informações
- ✅ Facilitar queries cross-module
- ✅ Simplificar RLS policies
- ✅ Melhorar performance

A correção aplicada no código garante funcionamento mesmo com duplicatas, mas a solução definitiva é limpar o banco e adicionar constraint UNIQUE.
