# ARQUITETURA MULTI-PERFIL REAL - DOCUMENTO FINAL CORRIGIDO

**Status**: Pronto para implementação  
**Data**: 2026-03-27  
**Versão**: 2.0 Final (SQL Corrigido)

---

## SUMÁRIO DE CORREÇÕES APLICADAS

✅ Partial unique indexes fora de CREATE TABLE  
✅ Modelo de acesso híbrido: anon via view, authenticated via RLS  
✅ Semântica de `is_public` fechada (descoberta + página pública)  
✅ CHECK EXISTS substituído por triggers  
✅ Admin RPCs com tabela `admin_users` + REVOKE execute  
✅ Bootstrap transacional de profile + extension + owner member  
✅ Extensões obrigatórias (citext, postgis)  

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

### Modelo de Acesso à Tabela `profiles`
1. **Público (anon)**: Acesso APENAS via view `public_profiles` (REVOKE direto)
2. **Autenticado (authenticated)**: Acesso via RLS policies para seus próprios perfis
3. **Service role**: Acesso total para operações privilegiadas

### Semântica de `is_public`
- `is_public = true`: Perfil aparece em descoberta pública E página pública acessível
- `is_public = false`: Perfil oculto de descoberta, página pública retorna 404
- `is_active = false`: Perfil desativado/suspenso, não aparece em lugar nenhum

---

## 1. SCHEMA FINAL

### 1.0 Extensões Obrigatórias

```sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Function helper para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 1.1 Tabela `profiles` (Base)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('personal', 'business', 'professional', 'driver')),
  
  -- Identificação pública
  handle CITEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  
  -- Contato público (separado do email da conta)
  contact_email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Localização
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'BR',
  
  -- Status e verificação
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
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

-- Partial unique indexes (fora de CREATE TABLE)
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

-- Partial unique indexes (fora de CREATE TABLE)
CREATE UNIQUE INDEX idx_profile_members_unique_user_per_profile 
  ON profile_members(profile_id, user_id);
CREATE UNIQUE INDEX idx_profile_members_one_owner_per_profile 
  ON profile_members(profile_id) WHERE (role = 'owner');
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
  
  CHECK (from_profile_id != to_profile_id)
);

-- Índices
CREATE INDEX idx_profile_links_from ON profile_links(from_profile_id);
CREATE INDEX idx_profile_links_to ON profile_links(to_profile_id);

-- Unique constraint
CREATE UNIQUE INDEX idx_profile_links_unique 
  ON profile_links(from_profile_id, to_profile_id, link_type);

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
  business_hours JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para validar profile_type = 'business' (substitui CHECK EXISTS)
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

CREATE TRIGGER set_business_data_updated_at
  BEFORE UPDATE ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
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
  service_area TEXT[],
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

CREATE TRIGGER set_professional_data_updated_at
  BEFORE UPDATE ON professional_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
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
  documents_verified BOOLEAN DEFAULT false,
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

CREATE TRIGGER set_driver_data_updated_at
  BEFORE UPDATE ON driver_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices
CREATE INDEX idx_driver_location ON driver_data USING GIST(current_location);
CREATE INDEX idx_driver_available ON driver_data(is_available) WHERE is_available = true;
```

### 1.5 Tabelas de Administração

#### Admin Users

```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_users_role ON admin_users(role);
```

#### Profile Audit Log

```sql
CREATE TABLE profile_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profile_audit_log_profile ON profile_audit_log(profile_id);
CREATE INDEX idx_profile_audit_log_performed_at ON profile_audit_log(performed_at DESC);
```

---

## 2. RLS (ROW LEVEL SECURITY) FINAL

### 2.1 Proteção da Tabela Base `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- REVOKE acesso direto de anon (público usa apenas view)
REVOKE ALL ON profiles FROM anon;

-- Authenticated tem acesso via RLS policies
-- Service role mantém acesso total
GRANT ALL ON profiles TO service_role;
```

### 2.2 View Pública `public_profiles`

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

### 2.5 Policies para Extensões

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
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members
        WHERE profile_id = business_data.profile_id
        AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Owners and admins can manage business data"
  ON business_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = business_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = business_data.profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
      ))
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
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members
        WHERE profile_id = professional_data.profile_id
        AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Owners and admins can manage professional data"
  ON professional_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = professional_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = professional_data.profile_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
      ))
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

### 2.7 Policies para Admin Tables

```sql
-- ADMIN USERS
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

-- AUDIT LOG
ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins podem ver audit log
CREATE POLICY "Admins can view audit log"
  ON profile_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Service role pode inserir
CREATE POLICY "Service role can insert audit log"
  ON profile_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);
```

---

## 3. RPCs FINAIS (SECURITY DEFINER)

### 3.1 Create Profile (Transacional com Bootstrap)

```sql
CREATE OR REPLACE FUNCTION create_profile_with_extension(
  p_profile_type TEXT,
  p_handle TEXT,
  p_display_name TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_extension_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_profile_id UUID;
  v_normalized_handle CITEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Validar profile_type
  IF p_profile_type NOT IN ('personal', 'business', 'professional', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid profile type');
  END IF;
  
  -- Normalizar handle
  v_normalized_handle := lower(trim(regexp_replace(p_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  
  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;
  
  -- Verificar unicidade de personal/driver
  IF p_profile_type = 'personal' AND EXISTS (
    SELECT 1 FROM profiles WHERE user_id = v_current_user_id AND profile_type = 'personal'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a personal profile');
  END IF;
  
  IF p_profile_type = 'driver' AND EXISTS (
    SELECT 1 FROM profiles WHERE user_id = v_current_user_id AND profile_type = 'driver'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a driver profile');
  END IF;
  
  -- Criar perfil
  INSERT INTO profiles (user_id, profile_type, handle, display_name, avatar_url, bio)
  VALUES (v_current_user_id, p_profile_type, v_normalized_handle, p_display_name, p_avatar_url, p_bio)
  RETURNING id INTO v_profile_id;
  
  -- Criar extensão conforme tipo
  IF p_profile_type = 'business' AND p_extension_data IS NOT NULL THEN
    INSERT INTO business_data (
      profile_id, legal_name, cnpj, company_type, industry
    ) VALUES (
      v_profile_id,
      p_extension_data->>'legal_name',
      p_extension_data->>'cnpj',
      p_extension_data->>'company_type',
      p_extension_data->>'industry'
    );
    
    -- Bootstrap: adicionar owner member para business
    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');
    
  ELSIF p_profile_type = 'professional' AND p_extension_data IS NOT NULL THEN
    INSERT INTO professional_data (
      profile_id, profession, specialties, years_experience
    ) VALUES (
      v_profile_id,
      p_extension_data->>'profession',
      string_to_array(p_extension_data->>'specialties', ','),
      (p_extension_data->>'years_experience')::INTEGER
    );
    
    -- Bootstrap: adicionar owner member para professional
    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');
    
  ELSIF p_profile_type = 'driver' AND p_extension_data IS NOT NULL THEN
    INSERT INTO driver_data (
      profile_id, license_number, license_category, license_expiry, license_state
    ) VALUES (
      v_profile_id,
      p_extension_data->>'license_number',
      p_extension_data->>'license_category',
      (p_extension_data->>'license_expiry')::DATE,
      p_extension_data->>'license_state'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'handle', v_normalized_handle
  );
END;
$$;

-- Grant execute para authenticated
GRANT EXECUTE ON FUNCTION create_profile_with_extension TO authenticated;
```


### 3.2 Transfer Profile Ownership

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
BEGIN
  v_current_user_id := auth.uid();
  
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

GRANT EXECUTE ON FUNCTION transfer_profile_ownership TO authenticated;
```

### 3.3 Delete Profile

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

GRANT EXECUTE ON FUNCTION delete_profile TO authenticated;
```

### 3.4 Update Profile Handle

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
  
  -- Normalizar handle
  v_normalized_handle := lower(trim(regexp_replace(p_new_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  
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

GRANT EXECUTE ON FUNCTION update_profile_handle TO authenticated;
```

### 3.5 Verify Profile (Admin Only)

```sql
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

-- REVOKE execute de authenticated (apenas backend/edge function)
REVOKE EXECUTE ON FUNCTION verify_profile FROM authenticated;
GRANT EXECUTE ON FUNCTION verify_profile TO service_role;
```

### 3.6 Suspend Profile (Admin Only)

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
    is_active = false,
    is_public = false,
    updated_at = now()
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  -- Log de suspensão
  INSERT INTO profile_audit_log (profile_id, action, reason, performed_by, performed_at)
  VALUES (p_profile_id, 'suspended', p_reason, v_current_user_id, now());
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'suspended_at', now()
  );
END;
$$;

-- REVOKE execute de authenticated
REVOKE EXECUTE ON FUNCTION suspend_profile FROM authenticated;
GRANT EXECUTE ON FUNCTION suspend_profile TO service_role;
```

---

## 4. FLUXO TRANSACIONAL DE CRIAÇÃO DE PERFIL

### 4.1 Personal Profile

```typescript
const result = await supabase.rpc('create_profile_with_extension', {
  p_profile_type: 'personal',
  p_handle: 'joao-silva',
  p_display_name: 'João Silva',
  p_avatar_url: 'https://...',
  p_bio: 'Desenvolvedor full-stack',
  p_extension_data: null // personal não tem extensão
});
```

**Resultado**:
- 1 registro em `profiles` (user_id = conta, profile_type = 'personal')
- 0 registros em `profile_members` (personal não aceita membros)

### 4.2 Business Profile

```typescript
const result = await supabase.rpc('create_profile_with_extension', {
  p_profile_type: 'business',
  p_handle: 'padaria-central',
  p_display_name: 'Padaria Central',
  p_avatar_url: 'https://...',
  p_bio: 'Pães artesanais desde 1985',
  p_extension_data: {
    legal_name: 'Padaria Central LTDA',
    cnpj: '12.345.678/0001-90',
    company_type: 'ltda',
    industry: 'Alimentação'
  }
});
```

**Resultado**:
- 1 registro em `profiles` (user_id = conta criadora)
- 1 registro em `business_data` (profile_id = perfil criado)
- 1 registro em `profile_members` (user_id = conta criadora, role = 'owner')

### 4.3 Professional Profile

```typescript
const result = await supabase.rpc('create_profile_with_extension', {
  p_profile_type: 'professional',
  p_handle: 'dr-carlos-oliveira',
  p_display_name: 'Dr. Carlos Oliveira',
  p_avatar_url: 'https://...',
  p_bio: 'Médico cardiologista',
  p_extension_data: {
    profession: 'Médico',
    specialties: 'Cardiologia,Clínica Geral',
    years_experience: 15
  }
});
```

**Resultado**:
- 1 registro em `profiles` (user_id = conta criadora)
- 1 registro em `professional_data` (profile_id = perfil criado)
- 1 registro em `profile_members` (user_id = conta criadora, role = 'owner')

### 4.4 Driver Profile

```typescript
const result = await supabase.rpc('create_profile_with_extension', {
  p_profile_type: 'driver',
  p_handle: 'motorista-jose',
  p_display_name: 'José Motorista',
  p_avatar_url: 'https://...',
  p_bio: 'Motorista profissional',
  p_extension_data: {
    license_number: '12345678900',
    license_category: 'AB',
    license_expiry: '2028-12-31',
    license_state: 'SP'
  }
});
```

**Resultado**:
- 1 registro em `profiles` (user_id = conta, profile_type = 'driver')
- 1 registro em `driver_data` (profile_id = perfil criado)
- 0 registros em `profile_members` (driver não aceita membros)

---

## 5. CHECKLIST FINAL DE IMPLEMENTAÇÃO

### ✅ Schema
- [x] Extensões obrigatórias (citext, postgis)
- [x] Tabela `profiles` com partial unique indexes fora de CREATE TABLE
- [x] Tabela `profile_members` com partial unique index para owner
- [x] Tabela `profile_links` com trigger de validação same_account
- [x] Extensões 1:1 com triggers (substituindo CHECK EXISTS)
- [x] Tabelas admin: `admin_users`, `profile_audit_log`
- [x] Campo `handle` como CITEXT único
- [x] Separação: `auth.users.email` vs `profiles.contact_email`
- [x] Separação: `profiles.verified` vs `driver_data.documents_verified`

### ✅ RLS e Segurança
- [x] Modelo de acesso híbrido documentado
- [x] `REVOKE ALL` em `profiles` de anon
- [x] View `public_profiles` com campos controlados
- [x] Policies para authenticated respeitando `profile_members`
- [x] Policies para extensões respeitando ownership
- [x] Policies para admin tables

### ✅ RPCs
- [x] `create_profile_with_extension` com bootstrap transacional
- [x] `transfer_profile_ownership` (apenas business/professional)
- [x] `delete_profile` (soft delete)
- [x] `update_profile_handle` com normalização
- [x] `verify_profile` com checagem de admin_users + REVOKE
- [x] `suspend_profile` com audit log + REVOKE

### ✅ Semântica
- [x] `is_public` controla descoberta + página pública
- [x] `is_active` controla ativação geral
- [x] View pública usa `is_active AND is_public`

### ✅ Ownership
- [x] Modelo híbrido: estrutural (`profiles.user_id`) + operacional (`profile_members.role`)
- [x] Personal/driver: sem membros, sem transferência
- [x] Business/professional: múltiplos membros, transferência permitida

### ✅ Bootstrap
- [x] Fluxo transacional documentado para cada tipo
- [x] Owner member criado automaticamente para business/professional
- [x] Validações de unicidade (1 personal, 1 driver por conta)

### ✅ Admin
- [x] Tabela `admin_users` com roles
- [x] RPCs admin com checagem via `admin_users`
- [x] REVOKE execute de authenticated nos RPCs admin
- [x] Audit log para ações administrativas

---

## 6. PRÓXIMOS PASSOS

1. **Aplicar Migrations**: Executar SQL em ordem (extensões → tables → indexes → triggers → RPCs → RLS)
2. **Seed Admin**: Inserir primeiro admin via service_role
3. **Implementar Services**: Criar service layer TypeScript
4. **Atualizar Hooks**: Ajustar para novo modelo
5. **Atualizar Components**: UI usando services
6. **Testes**: Validar todos os fluxos
7. **Deploy**: Staging → produção

---

**FIM DO DOCUMENTO CORRIGIDO**

Este documento está pronto para implementação sem pendências SQL/RLS.
