# ARQUITETURA MULTI-PERFIL REAL - DOCUMENTO FINAL CONSOLIDADO

**Status**: Pronto para implementação  
**Data**: 2026-03-27  
**Versão**: 1.0 Final

---

## DECISÕES ARQUITETURAIS FECHADAS (NÃO-NEGOCIÁVEIS)

### Modelo Conceitual
- **Multi-perfil real estrito**: `auth.users` = conta, `profiles` = identidades públicas/operacionais reais
- **Profile types mantidos**: `personal`, `business`, `professional`, `driver`
- Business, professional e driver são PERFIS REAIS, não "capacidades anexadas"
- `business_data`, `professional_data`, `driver_data` são extensões 1:1, não substituições
- `user_id` NUNCA usado em rotas públicas
- Classificado é conteúdo, NÃO é tipo de perfil

### SSOT (Single Source of Truth)
- Banco = verdade estrutural
- Services = camada de lógica de negócio apenas
- Hooks = orquestração apenas
- Components = UI apenas
- Zero acesso direto ao Supabase fora da service layer

### Proteção da Camada Pública
- `REVOKE SELECT` em `profiles` de `anon` e `authenticated`
- Acesso público APENAS via view `public_profiles`
- Nenhuma coluna sensível exposta publicamente

---

## 1. SCHEMA FINAL

### 1.0 Extensões Obrigatórias

```sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 1.1 Tabela `profiles` (Base)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('personal', 'business', 'professional', 'driver')),
  
  -- Identificação pública
  handle CITEXT NOT NULL, -- case-insensitive, formato: joao-silva (sem @)
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  
  -- Contato público (separado do email da conta)
  contact_email TEXT, -- email público do perfil (opcional)
  phone TEXT,
  website TEXT,
  
  -- Localização
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  
  -- Status e verificação
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- controla visibilidade em descoberta pública E acesso à página pública
  verified BOOLEAN DEFAULT false, -- verificação de identidade (blue check)
  verified_at TIMESTAMPTZ,
  
  -- Reputação por perfil
  reputation_score DECIMAL(10,2) DEFAULT 0,
  trust_score DECIMAL(10,2) DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices básicos
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_handle ON profiles(handle);
CREATE INDEX idx_profiles_type ON profiles(profile_type);
CREATE INDEX idx_profiles_active_public ON profiles(is_active, is_public) WHERE is_active AND is_public;

-- Partial unique indexes (substituindo UNIQUE ... WHERE)
CREATE UNIQUE INDEX idx_profiles_handle_unique ON profiles(handle);
CREATE UNIQUE INDEX idx_profiles_personal_per_user ON profiles(user_id) WHERE (profile_type = 'personal');
CREATE UNIQUE INDEX idx_profiles_driver_per_user ON profiles(user_id) WHERE (profile_type = 'driver');

-- Trigger para updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Tabela `profile_members` (Membros de Perfis)

```sql
CREATE TABLE profile_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_profile_members_profile ON profile_members(profile_id);
CREATE INDEX idx_profile_members_user ON profile_members(user_id);

-- Partial unique indexes
CREATE UNIQUE INDEX idx_profile_members_unique_user_per_profile ON profile_members(profile_id, user_id);
CREATE UNIQUE INDEX idx_profile_members_one_owner_per_profile ON profile_members(profile_id) WHERE (role = 'owner');
```

**Regras de Membros**:
- `personal`: NÃO aceita membros (apenas dono da conta)
- `driver`: NÃO aceita membros (apenas dono da conta)
- `business`: aceita múltiplos membros (owner, admin, member)
- `professional`: aceita múltiplos membros (owner, admin, member)

### 1.3 Tabela `profile_links` (Vínculos entre Perfis)

```sql
CREATE TABLE profile_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  link_type TEXT NOT NULL CHECK (link_type IN ('owns', 'works_for', 'drives_for', 'partner')),
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(from_profile_id, to_profile_id, link_type),
  CHECK (from_profile_id != to_profile_id)
);

CREATE INDEX idx_profile_links_from ON profile_links(from_profile_id);
CREATE INDEX idx_profile_links_to ON profile_links(to_profile_id);

-- Trigger para validar que perfis vinculados pertencem à mesma conta
CREATE OR REPLACE FUNCTION validate_profile_link_same_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.user_id = p2.user_id
    WHERE p1.id = NEW.from_profile_id
    AND p2.id = NEW.to_profile_id
  ) THEN
    RAISE EXCEPTION 'Profile links must be between profiles of the same account';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_profile_link_same_account
  BEFORE INSERT OR UPDATE ON profile_links
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_link_same_account();
```

### 1.4 Extensões 1:1 por Tipo de Perfil

#### Business Data

```sql
CREATE TABLE business_data (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Dados legais
  legal_name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  tax_id TEXT,
  company_type TEXT CHECK (company_type IN ('mei', 'ltda', 'sa', 'eireli', 'other')),
  
  -- Operação
  industry TEXT,
  employee_count TEXT CHECK (employee_count IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  founded_year INTEGER,
  
  -- Endereço comercial
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_zip TEXT,
  
  -- Horário
  business_hours JSONB, -- {mon: "9-18", tue: "9-18", ...}
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para validar profile_type = 'business'
CREATE OR REPLACE FUNCTION validate_business_data_profile_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.profile_id 
    AND profile_type = 'business'
  ) THEN
    RAISE EXCEPTION 'business_data can only be created for business profiles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_business_data_profile_type
  BEFORE INSERT OR UPDATE ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION validate_business_data_profile_type();
```

#### Professional Data

```sql
CREATE TABLE professional_data (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Profissão
  profession TEXT NOT NULL,
  specialties TEXT[],
  license_number TEXT,
  license_state TEXT,
  
  -- Experiência
  years_experience INTEGER,
  education TEXT,
  certifications TEXT[],
  
  -- Serviços
  services_offered TEXT[],
  service_area TEXT[], -- cidades/regiões atendidas
  hourly_rate DECIMAL(10,2),
  accepts_remote BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para validar profile_type = 'professional'
CREATE OR REPLACE FUNCTION validate_professional_data_profile_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.profile_id 
    AND profile_type = 'professional'
  ) THEN
    RAISE EXCEPTION 'professional_data can only be created for professional profiles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_professional_data_profile_type
  BEFORE INSERT OR UPDATE ON professional_data
  FOR EACH ROW
  EXECUTE FUNCTION validate_professional_data_profile_type();
```

#### Driver Data

```sql
CREATE TABLE driver_data (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Habilitação
  license_number TEXT NOT NULL,
  license_category TEXT NOT NULL CHECK (license_category IN ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE')),
  license_expiry DATE NOT NULL,
  license_state TEXT NOT NULL,
  
  -- Veículo
  vehicle_type TEXT CHECK (vehicle_type IN ('car', 'motorcycle', 'van', 'truck')),
  vehicle_plate TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  
  -- Documentação e verificação
  documents_verified BOOLEAN DEFAULT false, -- verificação de documentos (CNH, veículo)
  documents_verified_at TIMESTAMPTZ,
  background_check_status TEXT CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
  background_check_date TIMESTAMPTZ,
  
  -- Status operacional
  is_available BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT, 4326),
  last_location_update TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para validar profile_type = 'driver'
CREATE OR REPLACE FUNCTION validate_driver_data_profile_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.profile_id 
    AND profile_type = 'driver'
  ) THEN
    RAISE EXCEPTION 'driver_data can only be created for driver profiles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_driver_data_profile_type
  BEFORE INSERT OR UPDATE ON driver_data
  FOR EACH ROW
  EXECUTE FUNCTION validate_driver_data_profile_type();

-- Índices
CREATE INDEX idx_driver_location ON driver_data USING GIST(current_location);
CREATE INDEX idx_driver_available ON driver_data(is_available) WHERE is_available = true;
```

---

## 2. RLS (ROW LEVEL SECURITY) FINAL

### 2.0 Modelo de Acesso à Tabela `profiles`

**DECISÃO ARQUITETURAL**: Acesso híbrido controlado

1. **Público (anon)**: Acesso APENAS via view `public_profiles` (REVOKE direto)
2. **Autenticado (authenticated)**: Acesso via RLS policies para seus próprios perfis
3. **Service role**: Acesso total para operações privilegiadas

**Justificativa**: 
- Público não pode acessar colunas sensíveis (user_id, contact_email privado, etc)
- Usuários autenticados precisam gerenciar seus perfis via client
- RLS garante que cada usuário só acessa seus próprios perfis ou perfis onde é membro

### 2.1 Proteção da Tabela Base `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- REVOKE acesso direto de anon (público usa apenas view)
REVOKE ALL ON profiles FROM anon;

-- Authenticated tem acesso via RLS policies (definidas abaixo)
-- Service role mantém acesso total
GRANT ALL ON profiles TO service_role;
```

### 2.2 View Pública `public_profiles`

**Semântica de `is_public`**:
- `is_public = true`: Perfil aparece em descoberta pública E página pública acessível
- `is_public = false`: Perfil oculto de descoberta, página pública retorna 404
- `is_active = false`: Perfil desativado/suspenso, não aparece em lugar nenhum

```sql
CREATE OR REPLACE VIEW public_profiles AS
SELECT
  p.id,
  p.profile_type,
  p.handle,
  p.display_name,
  p.avatar_url,
  p.bio,
  p.location,
  p.city,
  p.state,
  p.country,
  p.website,
  p.verified,
  p.reputation_score,
  p.created_at,
  -- Campos condicionais: só expõe se perfil é público
  CASE WHEN p.is_public THEN p.contact_email ELSE NULL END as contact_email,
  CASE WHEN p.is_public THEN p.phone ELSE NULL END as phone
FROM profiles p
WHERE p.is_active = true AND p.is_public = true;

-- Acesso público à view
GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;
```

### 2.3 Policies para `profiles` (Acesso Autenticado)

```sql
-- Usuário pode ver seus próprios perfis
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuário pode ver perfis onde é membro
CREATE POLICY "Users can view profiles where they are members"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = profiles.id
      AND user_id = auth.uid()
    )
  );

-- Usuário pode criar perfis para si mesmo
CREATE POLICY "Users can create own profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuário pode atualizar perfis que possui (dono estrutural)
CREATE POLICY "Account owners can update their profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Membros owner/admin podem atualizar perfis que gerenciam
CREATE POLICY "Profile managers can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = profiles.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Apenas dono estrutural pode deletar
CREATE POLICY "Only account owner can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

### 2.4 Policies para `profile_members`

```sql
ALTER TABLE profile_members ENABLE ROW LEVEL SECURITY;

-- Ver membros do próprio perfil
CREATE POLICY "Users can view members of their profiles"
  ON profile_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- Ver onde é membro
CREATE POLICY "Users can view their own memberships"
  ON profile_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Apenas owner/admin pode adicionar membros
CREATE POLICY "Owners and admins can add members"
  ON profile_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_members.profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Apenas owner/admin pode remover membros
CREATE POLICY "Owners and admins can remove members"
  ON profile_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_members.profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );
```

### 2.5 Policies para Extensões (business_data, professional_data, driver_data)

```sql
-- BUSINESS DATA
ALTER TABLE business_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business data of their profiles"
  ON business_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = business_data.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view business data"
  ON business_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = business_data.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage business data"
  ON business_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = business_data.profile_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = business_data.profile_id
      AND user_id = auth.uid()
    )
  );

-- PROFESSIONAL DATA
ALTER TABLE professional_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view professional data of their profiles"
  ON professional_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = professional_data.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can view professional data"
  ON professional_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = professional_data.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage professional data"
  ON professional_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members
      WHERE profile_id = professional_data.profile_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = professional_data.profile_id
      AND user_id = auth.uid()
    )
  );

-- DRIVER DATA
ALTER TABLE driver_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own driver data"
  ON driver_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = driver_data.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own driver data"
  ON driver_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = driver_data.profile_id
      AND user_id = auth.uid()
    )
  );
```

### 2.6 Policies para `profile_links`

```sql
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;

-- Ver links públicos
CREATE POLICY "Anyone can view public profile links"
  ON profile_links FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Ver links dos próprios perfis
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

-- Gerenciar links dos próprios perfis
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

---

## 3. RPCs FINAIS (SECURITY DEFINER)

### 3.1 Transfer Profile Ownership

```sql
CREATE OR REPLACE FUNCTION transfer_profile_ownership(
  p_profile_id UUID,
  p_new_owner_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_current_user_id UUID;
  v_profile_type TEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Buscar perfil
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Apenas dono estrutural pode transferir
  IF v_profile.user_id != v_current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can transfer ownership');
  END IF;
  
  -- Personal e driver não podem ser transferidos
  IF v_profile.profile_type IN ('personal', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Personal and driver profiles cannot be transferred');
  END IF;
  
  -- Verificar se novo dono já é membro
  IF NOT EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
    AND user_id = p_new_owner_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'New owner must be a member first');
  END IF;
  
  -- Atualizar ownership operacional
  UPDATE profile_members
  SET role = 'admin'
  WHERE profile_id = p_profile_id
  AND role = 'owner';
  
  UPDATE profile_members
  SET role = 'owner'
  WHERE profile_id = p_profile_id
  AND user_id = p_new_owner_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'new_owner', p_new_owner_user_id
  );
END;
$$;
```

### 3.2 Delete Profile

```sql
CREATE OR REPLACE FUNCTION delete_profile(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Apenas dono estrutural pode deletar
  IF v_profile.user_id != v_current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can delete profile');
  END IF;
  
  -- Soft delete: marcar como inativo
  UPDATE profiles
  SET is_active = false, updated_at = now()
  WHERE id = p_profile_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'deleted_at', now()
  );
END;
$$;
```

### 3.3 Update Profile Handle

```sql
CREATE OR REPLACE FUNCTION update_profile_handle(
  p_profile_id UUID,
  p_new_handle TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_current_user_id UUID;
  v_normalized_handle CITEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Normalizar handle (remover @, lowercase, substituir espaços por -)
  v_normalized_handle := lower(trim(regexp_replace(p_new_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  
  -- Validar formato
  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;
  
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Verificar permissão (dono ou owner/admin)
  IF v_profile.user_id != v_current_user_id AND NOT EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
    AND user_id = v_current_user_id
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;
  
  -- Verificar disponibilidade
  IF EXISTS (SELECT 1 FROM profiles WHERE handle = v_normalized_handle AND id != p_profile_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Handle already taken');
  END IF;
  
  -- Atualizar
  UPDATE profiles
  SET handle = v_normalized_handle, updated_at = now()
  WHERE id = p_profile_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'new_handle', v_normalized_handle
  );
END;
$$;
```

### 3.4 Verify Profile (Admin Only)

```sql
-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode gerenciar admins
CREATE POLICY "Only service role can manage admins"
  ON admin_users FOR ALL
  TO service_role
  USING (true);

-- Admins podem ver outros admins
CREATE POLICY "Admins can view admin list"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- RPC para verificar perfil
CREATE OR REPLACE FUNCTION verify_profile(
  p_profile_id UUID,
  p_verified BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Verificar se usuário é admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = v_current_user_id
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;
  
  UPDATE profiles
  SET 
    verified = p_verified,
    verified_at = CASE WHEN p_verified THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'verified', p_verified
  );
END;
$$;

-- REVOKE execute de authenticated (apenas backend/edge function pode chamar)
REVOKE EXECUTE ON FUNCTION verify_profile FROM authenticated;
GRANT EXECUTE ON FUNCTION verify_profile TO service_role;
```

### 3.5 Suspend Profile

```sql
CREATE OR REPLACE FUNCTION suspend_profile(
  p_profile_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admin/service_role
  IF current_setting('role') != 'service_role' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;
  
  UPDATE profiles
  SET 
    is_active = false,
    is_public = false,
    updated_at = now()
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Log de suspensão (tabela de audit logs)
  INSERT INTO profile_audit_log (profile_id, action, reason, performed_by, performed_at)
  VALUES (p_profile_id, 'suspended', p_reason, auth.uid(), now());
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'suspended_at', now()
  );
END;
$$;
```

---

## 4. MODELO DE OWNERSHIP FINAL (HÍBRIDO EXPLÍCITO)

### 4.1 Conceito

O sistema usa um modelo de ownership híbrido com dois níveis:

1. **Ownership Estrutural** (`profiles.user_id`):
   - Imutável
   - Define quem criou o perfil
   - Apenas este usuário pode deletar o perfil
   - Sempre tem acesso total ao perfil

2. **Ownership Operacional** (`profile_members.role = 'owner'`):
   - Transferível (apenas para business e professional)
   - Define quem gerencia operacionalmente o perfil
   - Pode adicionar/remover membros
   - Pode atualizar dados do perfil

### 4.2 Regras por Tipo de Perfil

#### Personal
- Ownership estrutural: `profiles.user_id`
- Ownership operacional: N/A (não aceita membros)
- Transferência: NÃO permitida
- Deleção: apenas dono estrutural

#### Driver
- Ownership estrutural: `profiles.user_id`
- Ownership operacional: N/A (não aceita membros)
- Transferência: NÃO permitida
- Deleção: apenas dono estrutural

#### Business
- Ownership estrutural: `profiles.user_id` (criador)
- Ownership operacional: `profile_members.role = 'owner'` (gerente)
- Transferência: PERMITIDA (via RPC `transfer_profile_ownership`)
- Deleção: apenas dono estrutural
- Membros: múltiplos (owner, admin, member)

#### Professional
- Ownership estrutural: `profiles.user_id` (criador)
- Ownership operacional: `profile_members.role = 'owner'` (gerente)
- Transferência: PERMITIDA (via RPC `transfer_profile_ownership`)
- Deleção: apenas dono estrutural
- Membros: múltiplos (owner, admin, member)

### 4.3 Fluxo de Transferência

```
1. Usuário A cria perfil business (user_id = A, owner operacional = A)
2. Usuário A adiciona usuário B como member
3. Usuário A chama transfer_profile_ownership(profile_id, B)
4. Sistema valida:
   - A é dono estrutural? ✓
   - Perfil é business/professional? ✓
   - B já é membro? ✓
5. Sistema atualiza:
   - A: role = 'admin' (mantém acesso)
   - B: role = 'owner' (assume gestão)
6. user_id permanece = A (dono estrutural imutável)
```

---

## 5. CAMADA PÚBLICA FINAL

### 5.1 Estratégia de Proteção

**Problema**: Expor `profiles` diretamente permite vazamento de colunas sensíveis.

**Solução**: View pública controlada + REVOKE na tabela base.

```sql
-- 1. Revogar acesso direto
REVOKE SELECT ON profiles FROM anon;
REVOKE SELECT ON profiles FROM authenticated;

-- 2. Criar view pública
CREATE VIEW public_profiles AS
SELECT
  id, profile_type, handle, display_name, avatar_url, bio,
  location, city, state, country, website, verified,
  reputation_score, created_at,
  CASE WHEN is_public THEN contact_email ELSE NULL END as contact_email,
  CASE WHEN is_public THEN phone ELSE NULL END as phone
FROM profiles
WHERE is_active = true;

-- 3. Conceder acesso à view
GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;
```

### 5.2 Impacto na Service Layer

**Antes** (acesso direto):
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('handle', handle)
  .single();
```

**Depois** (via view pública):
```typescript
const { data } = await supabase
  .from('public_profiles')
  .select('*')
  .eq('handle', handle)
  .single();
```

### 5.3 Queries Públicas

#### Buscar perfil por handle
```typescript
export async function getPublicProfile(handle: string) {
  const { data, error } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('handle', handle)
    .single();
  
  return { data, error };
}
```

#### Descoberta pública
```typescript
export async function discoverProfiles(filters: {
  profile_type?: string;
  city?: string;
  verified?: boolean;
}) {
  let query = supabase
    .from('public_profiles')
    .select('*')
    .order('reputation_score', { ascending: false });
  
  if (filters.profile_type) {
    query = query.eq('profile_type', filters.profile_type);
  }
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.verified) {
    query = query.eq('verified', true);
  }
  
  return await query;
}
```

### 5.4 Rota Pública Final

**Decisão**: `/p/:handle` (sem @ na URL)

**Justificativa**:
- Mais limpo e profissional
- Evita encoding issues com @
- Handle já é único globalmente
- Padrão usado por GitHub, Twitter/X

**Exemplos**:
- `/p/joao-silva` → perfil personal
- `/p/padaria-central` → perfil business
- `/p/dr-carlos-oliveira` → perfil professional
- `/p/motorista-jose` → perfil driver

**Implementação**:
```typescript
// app/routes/p.$handle.tsx
export async function loader({ params }: LoaderFunctionArgs) {
  const { handle } = params;
  const profile = await getPublicProfile(handle);
  
  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }
  
  return json({ profile });
}
```

---

## 6. MATRIZ DE CAPACIDADES FINAL

| Capacidade | Personal | Business | Professional | Driver |
|------------|----------|----------|--------------|--------|
| **Comunidade** |
| Criar posts | ✓ | ✓ | ✓ | ✓ |
| Comentar | ✓ | ✓ | ✓ | ✓ |
| Reagir | ✓ | ✓ | ✓ | ✓ |
| Seguir perfis | ✓ | ✓ | ✓ | ✓ |
| **Classificados** |
| Publicar anúncios | ✓ | ✓ | ✓ | ✗ |
| Responder anúncios | ✓ | ✓ | ✓ | ✓ |
| Avaliar vendedores | ✓ | ✓ | ✓ | ✓ |
| **Vagas** |
| Publicar vagas | ✗ | ✓ | ✗ | ✗ |
| Candidatar-se | ✓ | ✗ | ✓ | ✓ |
| **Serviços** |
| Oferecer serviços | ✗ | ✓ | ✓ | ✗ |
| Contratar serviços | ✓ | ✓ | ✓ | ✓ |
| Avaliar prestadores | ✓ | ✓ | ✓ | ✓ |
| **Mobilidade** |
| Solicitar corrida | ✓ | ✓ | ✓ | ✗ |
| Aceitar corridas | ✗ | ✗ | ✗ | ✓ |
| Avaliar motorista | ✓ | ✓ | ✓ | ✗ |
| Avaliar passageiro | ✗ | ✗ | ✗ | ✓ |
| **Mensagens** |
| Enviar mensagens | ✓ | ✓ | ✓ | ✓ |
| Receber mensagens | ✓ | ✓ | ✓ | ✓ |
| **Membros** |
| Adicionar membros | ✗ | ✓ | ✓ | ✗ |
| Transferir ownership | ✗ | ✓ | ✓ | ✗ |
| **Descoberta** |
| Aparecer em busca | ✓ | ✓ | ✓ | ✓ |
| Verificação (blue check) | ✓ | ✓ | ✓ | ✓ |

---

## 7. REGRAS DE FEED FINAL

### 7.1 Tipos de Feed

#### Feed Próprio (Profile Feed)
- Mostra apenas posts do perfil específico
- Rota: `/p/:handle`
- Query: `posts.profile_id = :profile_id`
- Visível publicamente se `profile.is_public = true`

#### Feed Geral (Community Feed)
- Mostra posts de todos os perfis da comunidade
- Rota: `/feed` ou `/comunidade`
- Query: `posts WHERE community_id = :community_id`
- Ordenação: cronológica ou por engajamento

#### Feed de Descoberta (Discovery Feed)
- Mostra posts de perfis verificados ou com alta reputação
- Rota: `/descobrir` ou `/explorar`
- Query: `posts JOIN profiles ON verified = true OR reputation_score > threshold`
- Ordenação: por relevância/engajamento

### 7.2 Distribuição de Posts por Tipo de Perfil

#### Personal
- Posts aparecem em: feed próprio + feed geral + descoberta (se verificado)
- Sem restrições de distribuição

#### Business
- Posts aparecem em: feed próprio + feed geral + descoberta
- Opção de "post promocional" (marcado como `is_promotional = true`)
- Posts promocionais podem ter alcance reduzido no feed geral
- Solução anti-spam: limite de posts promocionais por dia

#### Professional
- Posts aparecem em: feed próprio + feed geral + descoberta
- Posts de serviços profissionais (marcados como `post_type = 'service'`)
- Podem ter seção dedicada no feed de descoberta

#### Driver
- Posts aparecem em: feed próprio + feed geral
- Geralmente não postam conteúdo regular
- Sistema de mobilidade tem interface própria

### 7.3 Regras Anti-Poluição

```sql
-- Limite de posts promocionais por perfil business
CREATE TABLE post_limits (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id),
  promotional_posts_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE
);

-- Trigger para resetar contador diário
CREATE OR REPLACE FUNCTION reset_daily_post_limits()
RETURNS void AS $$
BEGIN
  UPDATE post_limits
  SET promotional_posts_today = 0, last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

### 7.4 Algoritmo de Feed Geral

```typescript
export async function getCommunityFeed(options: {
  communityId: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const query = supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!inner(id, handle, display_name, avatar_url, profile_type, verified),
      engagement:post_engagement(likes, comments, shares)
    `)
    .eq('community_id', options.communityId)
    .eq('is_active', true);
  
  // Reduzir peso de posts promocionais
  // Implementar no ranking/ordenação
  
  return await query
    .order('created_at', { ascending: false })
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 20));
}
```

---

## 8. MIGRAÇÃO: USERNAME → HANDLE (CITEXT)

### 8.1 Plano de Migração

```sql
-- Passo 1: Adicionar coluna handle (CITEXT)
ALTER TABLE profiles ADD COLUMN handle CITEXT;

-- Passo 2: Migrar dados existentes
UPDATE profiles
SET handle = lower(regexp_replace(username, '\s+', '-', 'g'))
WHERE handle IS NULL;

-- Passo 3: Resolver colisões
DO $$
DECLARE
  collision RECORD;
  new_handle TEXT;
  counter INTEGER;
BEGIN
  FOR collision IN
    SELECT handle, array_agg(id) as profile_ids
    FROM profiles
    WHERE handle IS NOT NULL
    GROUP BY handle
    HAVING count(*) > 1
  LOOP
    counter := 1;
    FOR profile_id IN SELECT unnest(collision.profile_ids[2:])
    LOOP
      new_handle := collision.handle || '-' || counter;
      WHILE EXISTS (SELECT 1 FROM profiles WHERE handle = new_handle) LOOP
        counter := counter + 1;
        new_handle := collision.handle || '-' || counter;
      END LOOP;
      
      UPDATE profiles SET handle = new_handle WHERE id = profile_id;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Passo 4: Tornar handle obrigatório e único
ALTER TABLE profiles ALTER COLUMN handle SET NOT NULL;
CREATE UNIQUE INDEX idx_profiles_handle_unique ON profiles(handle);

-- Passo 5: Remover coluna username (após validação)
-- ALTER TABLE profiles DROP COLUMN username;
```

### 8.2 Validação Pós-Migração

```sql
-- Verificar handles duplicados
SELECT handle, count(*)
FROM profiles
GROUP BY handle
HAVING count(*) > 1;

-- Verificar handles inválidos
SELECT id, handle
FROM profiles
WHERE handle !~ '^[a-z0-9][a-z0-9-]{2,29}$';

-- Verificar handles nulos
SELECT count(*)
FROM profiles
WHERE handle IS NULL;
```

---

## 9. CHECKLIST FINAL DE APROVAÇÃO

### 9.1 Schema
- [ ] Tabela `profiles` com `profile_type` e constraints de unicidade
- [ ] Tabela `profile_members` com unique constraint em owner
- [ ] Tabela `profile_links` com trigger de validação same_account
- [ ] Extensões 1:1: `business_data`, `professional_data`, `driver_data`
- [ ] Campo `handle` como CITEXT único
- [ ] Separação: `auth.users.email` vs `profiles.contact_email`
- [ ] Separação: `profiles.verified` vs `driver_data.documents_verified`

### 9.2 RLS e Segurança
- [ ] `REVOKE SELECT` em `profiles` de anon/authenticated
- [ ] View `public_profiles` com campos controlados
- [ ] Policies para acesso autenticado via service layer
- [ ] Policies respeitando `profile_members` para business/professional
- [ ] RPCs com `SECURITY DEFINER` para operações privilegiadas

### 9.3 Ownership
- [ ] Modelo híbrido documentado: estrutural + operacional
- [ ] Personal e driver: sem membros, sem transferência
- [ ] Business e professional: múltiplos membros, transferência permitida
- [ ] RPC `transfer_profile_ownership` implementado

### 9.4 Camada Pública
- [ ] Rota pública: `/p/:handle` (sem @)
- [ ] Service layer usando `public_profiles` para queries públicas
- [ ] Descoberta pública com filtros (tipo, cidade, verificado)

### 9.5 Capacidades
- [ ] Matriz de capacidades por profile_type documentada
- [ ] Regras de feed por identidade documentadas
- [ ] Anti-poluição para posts promocionais

### 9.6 Migração
- [ ] Plano de migração username → handle
- [ ] Resolução de colisões
- [ ] Validação pós-migração

### 9.7 SSOT
- [ ] Banco = verdade estrutural
- [ ] Services = única camada de acesso
- [ ] Hooks = orquestração apenas
- [ ] Components = UI apenas

---

## 10. PRÓXIMOS PASSOS

1. **Aprovação Final**: Revisar este documento e aprovar
2. **Criar Migrations**: Gerar arquivos SQL de migração
3. **Implementar Services**: Criar service layer seguindo SSOT
4. **Atualizar Hooks**: Ajustar hooks para novo modelo
5. **Atualizar Components**: Ajustar UI para usar services
6. **Testes**: Validar todas as capacidades por profile_type
7. **Deploy**: Aplicar migrations em staging → produção

---

**FIM DO DOCUMENTO**

Este documento está pronto para implementação. Não contém contradições com versões anteriores.
