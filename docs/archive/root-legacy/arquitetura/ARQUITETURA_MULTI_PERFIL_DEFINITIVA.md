# ARQUITETURA MULTI-PERFIL REAL - DOCUMENTO DEFINITIVO

**Status**: 100% Pronto para Implementação  
**Data**: 2026-03-27  
**Versão**: 3.0 Definitiva

---

## SUMÁRIO DE CORREÇÕES FINAIS

✅ Modelo único para RPCs admin (backend/service_role apenas)  
✅ Policies de profile_members corrigidas (owner/admin veem todos)  
✅ Views públicas por tipo de extensão  
✅ create_profile_with_extension endurecida (validação obrigatória)  
✅ Privacidade granular por campo  
✅ profile_links públicos acessíveis para anon  
✅ public_profile_links filtra perfis privados (from e to)  
✅ show_business_links e show_professional_links aplicados na view  
✅ Service layer não depende de show_linked_profiles (view já filtra)  
✅ Enforcement forte: trigger impede membros em personal/driver  
✅ Policies de profile_links seguem modelo híbrido de ownership  
✅ Permissões EXECUTE explícitas e defensivas em todas as RPCs  

---

## DECISÃO ARQUITETURAL: RPCs ADMIN

**MODELO ESCOLHIDO**: Backend/Service Role apenas

**Justificativa**:
- RPCs admin são chamadas APENAS por backend/edge functions
- Validação de admin fica na camada de aplicação (backend)
- RPCs usam `REVOKE EXECUTE FROM authenticated`
- Backend valida `admin_users` antes de chamar RPC via service_role

**Fluxo**:
```
Client → Backend API → Valida admin_users → Chama RPC via service_role → Sucesso
```

---

## CORREÇÕES FINAIS APLICADAS

### 1. public_profile_links Não Expõe Perfis Privados

**Problema**: View expunha perfis com `is_public = false` através de vínculos.

**Solução**: Filtros adicionados:
- `p_from.is_public = true` (perfil origem deve ser público)
- `p_to.is_public = true` (perfil destino deve ser público)
- Ambos os perfis devem estar ativos

### 2. show_business_links e show_professional_links Aplicados

**Problema**: Campos existiam mas não eram usados na camada pública.

**Solução**: Lógica aplicada em `public_profile_links`:
- `link_type IN ('owns', 'partner')` → requer `show_business_links = true`
- `link_type IN ('works_for', 'drives_for')` → requer `show_professional_links = true`

### 3. Service Layer Sem Dependência de show_linked_profiles

**Problema**: Service layer verificava `show_linked_profiles` antes de buscar links.

**Solução**: View `public_profile_links` já aplica todos os filtros:
- `show_linked_profiles`
- `show_business_links`
- `show_professional_links`
- `is_public` de ambos os perfis

Service layer apenas consulta a view, sem lógica adicional.

### 4. Enforcement Forte para Membros em Personal/Driver

**Problema**: Restrição apenas documentada, não garantida no banco.

**Solução**: Trigger `prevent_members_personal_driver`:
- Bloqueia INSERT/UPDATE em `profile_members`
- Valida `profile_type` antes de permitir operação
- Lança exceção se tipo for `personal` ou `driver`

### 5. Policies de profile_links Seguem Modelo Híbrido

**Problema**: Apenas dono estrutural podia gerenciar links, ignorando owner/admin operacional.

**Solução**: Policies corrigidas para permitir gestão por:
- Dono estrutural (`profiles.user_id = auth.uid()`)
- OU owner/admin operacional (`profile_members.role IN ('owner', 'admin')`)

**Impacto**: Após transferência de ownership, novo owner operacional pode gerenciar links.

---

## 1. SCHEMA FINAL COM PRIVACIDADE GRANULAR

### 1.0 Extensões Obrigatórias

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 1.1 Tabela `profiles` (Base com Privacidade Granular)

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
  
  -- Contato público
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
  
  -- Privacidade granular
  show_contact_email BOOLEAN DEFAULT false,
  show_phone BOOLEAN DEFAULT false,
  show_linked_profiles BOOLEAN DEFAULT true,
  show_business_links BOOLEAN DEFAULT true,
  show_professional_links BOOLEAN DEFAULT true,
  
  -- Reputação
  reputation_score DECIMAL(10,2) DEFAULT 0,
  trust_score DECIMAL(10,2) DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_handle ON profiles(handle);
CREATE INDEX idx_profiles_type ON profiles(profile_type);
CREATE INDEX idx_profiles_active_public ON profiles(is_active, is_public) WHERE is_active AND is_public;

-- Partial unique indexes
CREATE UNIQUE INDEX idx_profiles_handle_unique ON profiles(handle);
CREATE UNIQUE INDEX idx_profiles_personal_per_user ON profiles(user_id) WHERE (profile_type = 'personal');
CREATE UNIQUE INDEX idx_profiles_driver_per_user ON profiles(user_id) WHERE (profile_type = 'driver');

-- Trigger
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Tabela `profile_members`

```sql
CREATE TABLE profile_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profile_members_profile ON profile_members(profile_id);
CREATE INDEX idx_profile_members_user ON profile_members(user_id);

CREATE UNIQUE INDEX idx_profile_members_unique_user_per_profile 
  ON profile_members(profile_id, user_id);
CREATE UNIQUE INDEX idx_profile_members_one_owner_per_profile 
  ON profile_members(profile_id) WHERE (role = 'owner');

-- ENFORCEMENT: Impedir membros em personal e driver
CREATE OR REPLACE FUNCTION enforce_no_members_for_personal_driver()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_type TEXT;
BEGIN
  SELECT profile_type INTO v_profile_type
  FROM profiles
  WHERE id = NEW.profile_id;
  
  IF v_profile_type IN ('personal', 'driver') THEN
    RAISE EXCEPTION 'Personal and driver profiles cannot have members';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_members_personal_driver
  BEFORE INSERT OR UPDATE ON profile_members
  FOR EACH ROW
  EXECUTE FUNCTION enforce_no_members_for_personal_driver();
```

### 1.3 Tabela `profile_links`

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

CREATE INDEX idx_profile_links_from ON profile_links(from_profile_id);
CREATE INDEX idx_profile_links_to ON profile_links(to_profile_id);

CREATE UNIQUE INDEX idx_profile_links_unique 
  ON profile_links(from_profile_id, to_profile_id, link_type);

-- Trigger same account
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

### 1.4 Extensões 1:1

#### Business Data

```sql
CREATE TABLE business_data (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  legal_name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  tax_id TEXT,
  company_type TEXT CHECK (company_type IN ('mei', 'ltda', 'sa', 'eireli', 'other')),
  
  industry TEXT,
  employee_count TEXT CHECK (employee_count IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  founded_year INTEGER,
  
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_zip TEXT,
  
  business_hours JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
  
  profession TEXT NOT NULL,
  specialties TEXT[],
  license_number TEXT,
  license_state TEXT,
  
  years_experience INTEGER,
  education TEXT,
  certifications TEXT[],
  
  services_offered TEXT[],
  service_area TEXT[],
  hourly_rate DECIMAL(10,2),
  accepts_remote BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
  
  license_number TEXT NOT NULL,
  license_category TEXT NOT NULL CHECK (license_category IN ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE')),
  license_expiry DATE NOT NULL,
  license_state TEXT NOT NULL,
  
  vehicle_type TEXT CHECK (vehicle_type IN ('car', 'motorcycle', 'van', 'truck')),
  vehicle_plate TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  
  documents_verified BOOLEAN DEFAULT false,
  documents_verified_at TIMESTAMPTZ,
  background_check_status TEXT CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
  background_check_date TIMESTAMPTZ,
  
  is_available BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT, 4326),
  last_location_update TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE INDEX idx_driver_location ON driver_data USING GIST(current_location);
CREATE INDEX idx_driver_available ON driver_data(is_available) WHERE is_available = true;
```

### 1.5 Tabelas Admin

```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_users_role ON admin_users(role);

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

## 2. VIEWS PÚBLICAS POR TIPO

### 2.1 View Pública Base

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
  -- Privacidade granular
  CASE WHEN p.show_contact_email THEN p.contact_email ELSE NULL END as contact_email,
  CASE WHEN p.show_phone THEN p.phone ELSE NULL END as phone
FROM profiles p
WHERE p.is_active = true AND p.is_public = true;

GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;
```

### 2.2 View Pública Business

```sql
CREATE OR REPLACE VIEW public_business_profiles AS
SELECT
  pp.*,
  bd.legal_name,
  bd.company_type,
  bd.industry,
  bd.employee_count,
  bd.founded_year,
  bd.business_city,
  bd.business_state,
  bd.business_hours
FROM public_profiles pp
JOIN business_data bd ON bd.profile_id = pp.id
WHERE pp.profile_type = 'business';

GRANT SELECT ON public_business_profiles TO anon;
GRANT SELECT ON public_business_profiles TO authenticated;
```

### 2.3 View Pública Professional

```sql
CREATE OR REPLACE VIEW public_professional_profiles AS
SELECT
  pp.*,
  pd.profession,
  pd.specialties,
  pd.years_experience,
  pd.certifications,
  pd.services_offered,
  pd.service_area,
  pd.hourly_rate,
  pd.accepts_remote
FROM public_profiles pp
JOIN professional_data pd ON pd.profile_id = pp.id
WHERE pp.profile_type = 'professional';

GRANT SELECT ON public_professional_profiles TO anon;
GRANT SELECT ON public_professional_profiles TO authenticated;
```

### 2.4 View Pública Driver

```sql
CREATE OR REPLACE VIEW public_driver_profiles AS
SELECT
  pp.*,
  dd.vehicle_type,
  dd.vehicle_model,
  dd.vehicle_year,
  dd.vehicle_color,
  dd.is_available
FROM public_profiles pp
JOIN driver_data dd ON dd.profile_id = pp.id
WHERE pp.profile_type = 'driver';

GRANT SELECT ON public_driver_profiles TO anon;
GRANT SELECT ON public_driver_profiles TO authenticated;
```

### 2.5 View Pública Profile Links (Corrigida)

```sql
CREATE OR REPLACE VIEW public_profile_links AS
SELECT
  pl.id,
  pl.from_profile_id,
  pl.to_profile_id,
  pl.link_type,
  pl.display_order,
  -- Perfil origem
  p_from.handle as from_handle,
  p_from.display_name as from_display_name,
  p_from.avatar_url as from_avatar_url,
  p_from.profile_type as from_profile_type,
  -- Perfil destino
  p_to.handle as to_handle,
  p_to.display_name as to_display_name,
  p_to.avatar_url as to_avatar_url,
  p_to.profile_type as to_profile_type
FROM profile_links pl
JOIN profiles p_from ON p_from.id = pl.from_profile_id
JOIN profiles p_to ON p_to.id = pl.to_profile_id
WHERE pl.is_public = true
  AND p_from.is_active = true
  AND p_from.is_public = true
  AND p_from.show_linked_profiles = true
  AND p_to.is_active = true
  AND p_to.is_public = true
  -- Respeitar privacidade granular por tipo de link
  AND (
    (pl.link_type IN ('owns', 'partner') AND p_from.show_business_links = true)
    OR (pl.link_type = 'works_for' AND p_from.show_professional_links = true)
    OR (pl.link_type = 'drives_for' AND p_from.show_professional_links = true)
  );

GRANT SELECT ON public_profile_links TO anon;
GRANT SELECT ON public_profile_links TO authenticated;
```

---

## 3. RLS FINAL

### 3.1 Profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON profiles FROM anon;
GRANT ALL ON profiles TO service_role;

-- Ver próprios perfis
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Ver perfis onde é membro
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

-- Criar perfis
CREATE POLICY "Users can create own profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Atualizar (dono estrutural)
CREATE POLICY "Account owners can update their profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atualizar (owner/admin operacional)
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

-- Deletar
CREATE POLICY "Only account owner can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

### 3.2 Profile Members (Corrigida)

```sql
ALTER TABLE profile_members ENABLE ROW LEVEL SECURITY;

-- Owner/admin podem ver TODOS os membros do perfil
CREATE POLICY "Managers can view all profile members"
  ON profile_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profile_members pm
      WHERE pm.profile_id = profile_members.profile_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Dono estrutural pode ver membros
CREATE POLICY "Account owner can view profile members"
  ON profile_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = profile_members.profile_id
      AND user_id = auth.uid()
    )
  );

-- Ver próprias memberships
CREATE POLICY "Users can view their own memberships"
  ON profile_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Adicionar membros (owner/admin)
CREATE POLICY "Managers can add members"
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

-- Remover membros (owner/admin)
CREATE POLICY "Managers can remove members"
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

### 3.3 Profile Links

```sql
ALTER TABLE profile_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Dono estrutural ou owner/admin operacional podem ver links
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

-- INSERT/UPDATE/DELETE: Dono estrutural ou owner/admin operacional podem gerenciar links
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

### 3.4 Extensões

```sql
-- BUSINESS DATA
ALTER TABLE business_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business data"
  ON business_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = business_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = business_data.profile_id
        AND pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Managers can modify business data"
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

CREATE POLICY "Users can view professional data"
  ON professional_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = professional_data.profile_id
      AND (p.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profile_members pm
        WHERE pm.profile_id = professional_data.profile_id
        AND pm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Managers can modify professional data"
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

CREATE POLICY "Users can manage their driver data"
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

### 3.5 Admin Tables

```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages admins"
  ON admin_users FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Admins can view admin list"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

ALTER TABLE profile_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON profile_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert audit log"
  ON profile_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);
```

---

## 4. RPCs FINAIS

### 4.1 Create Profile (Endurecida)

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
  
  -- ENDURECIMENTO: business/professional/driver EXIGEM extension_data
  IF p_profile_type IN ('business', 'professional', 'driver') AND p_extension_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Extension data required for ' || p_profile_type || ' profiles');
  END IF;
  
  -- Validar campos obrigatórios por tipo
  IF p_profile_type = 'business' THEN
    IF p_extension_data->>'legal_name' IS NULL OR trim(p_extension_data->>'legal_name') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'legal_name is required for business profiles');
    END IF;
  END IF;
  
  IF p_profile_type = 'professional' THEN
    IF p_extension_data->>'profession' IS NULL OR trim(p_extension_data->>'profession') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'profession is required for professional profiles');
    END IF;
  END IF;
  
  IF p_profile_type = 'driver' THEN
    IF p_extension_data->>'license_number' IS NULL OR trim(p_extension_data->>'license_number') = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_number is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_category' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_category is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_expiry' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_expiry is required for driver profiles');
    END IF;
    IF p_extension_data->>'license_state' IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'license_state is required for driver profiles');
    END IF;
  END IF;
  
  -- Normalizar handle
  v_normalized_handle := lower(trim(regexp_replace(p_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  
  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;
  
  -- Verificar unicidade
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
  
  -- Criar extensão
  IF p_profile_type = 'business' THEN
    INSERT INTO business_data (
      profile_id, legal_name, cnpj, company_type, industry
    ) VALUES (
      v_profile_id,
      p_extension_data->>'legal_name',
      p_extension_data->>'cnpj',
      p_extension_data->>'company_type',
      p_extension_data->>'industry'
    );
    
    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');
    
  ELSIF p_profile_type = 'professional' THEN
    INSERT INTO professional_data (
      profile_id, profession, specialties, years_experience
    ) VALUES (
      v_profile_id,
      p_extension_data->>'profession',
      CASE 
        WHEN p_extension_data->>'specialties' IS NOT NULL 
        THEN string_to_array(p_extension_data->>'specialties', ',')
        ELSE NULL
      END,
      (p_extension_data->>'years_experience')::INTEGER
    );
    
    INSERT INTO profile_members (profile_id, user_id, role)
    VALUES (v_profile_id, v_current_user_id, 'owner');
    
  ELSIF p_profile_type = 'driver' THEN
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

GRANT EXECUTE ON FUNCTION create_profile_with_extension TO authenticated;
```

**Permissões explícitas aplicadas**:
```sql
-- RPCs de usuário: apenas authenticated
REVOKE EXECUTE ON FUNCTION create_profile_with_extension FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_profile_with_extension TO authenticated;

REVOKE EXECUTE ON FUNCTION transfer_profile_ownership FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION transfer_profile_ownership TO authenticated;

REVOKE EXECUTE ON FUNCTION delete_profile FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION delete_profile TO authenticated;

REVOKE EXECUTE ON FUNCTION update_profile_handle FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION update_profile_handle TO authenticated;

-- RPCs admin: apenas service_role
REVOKE EXECUTE ON FUNCTION verify_profile FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_profile TO service_role;

REVOKE EXECUTE ON FUNCTION suspend_profile FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION suspend_profile TO service_role;
```


### 4.2 Transfer Ownership

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
  
  IF v_profile.user_id != v_current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can transfer ownership');
  END IF;
  
  IF v_profile.profile_type IN ('personal', 'driver') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Personal and driver profiles cannot be transferred');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
    AND user_id = p_new_owner_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'New owner must be a member first');
  END IF;
  
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

### 4.3 Delete Profile

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
  
  IF v_profile.user_id != v_current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only account owner can delete profile');
  END IF;
  
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

### 4.4 Update Handle

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
  
  v_normalized_handle := lower(trim(regexp_replace(p_new_handle, '^@', '')));
  v_normalized_handle := regexp_replace(v_normalized_handle, '\s+', '-', 'g');
  
  IF v_normalized_handle !~ '^[a-z0-9][a-z0-9-]{2,29}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid handle format');
  END IF;
  
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  IF v_profile.user_id != v_current_user_id AND NOT EXISTS (
    SELECT 1 FROM profile_members
    WHERE profile_id = p_profile_id
    AND user_id = v_current_user_id
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;
  
  IF EXISTS (SELECT 1 FROM profiles WHERE handle = v_normalized_handle AND id != p_profile_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Handle already taken');
  END IF;
  
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

### 4.5 Verify Profile (Admin - Backend Only)

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
BEGIN
  -- Chamada apenas via service_role (backend valida admin antes)
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

-- Permissões explícitas (aplicar após criação)
-- REVOKE EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) FROM PUBLIC;
-- REVOKE EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) FROM anon;
-- REVOKE EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) FROM authenticated;
-- GRANT EXECUTE ON FUNCTION verify_profile(UUID, BOOLEAN) TO service_role;
```

### 4.6 Suspend Profile (Admin - Backend Only)

```sql
CREATE OR REPLACE FUNCTION suspend_profile(
  p_profile_id UUID,
  p_reason TEXT,
  p_performed_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chamada apenas via service_role (backend valida admin antes)
  UPDATE profiles
  SET 
    is_active = false,
    is_public = false,
    updated_at = now()
  WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  
  INSERT INTO profile_audit_log (profile_id, action, reason, performed_by, performed_at)
  VALUES (p_profile_id, 'suspended', p_reason, p_performed_by, now());
  
  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'suspended_at', now()
  );
END;
$$;

-- REVOKE de authenticated, apenas service_role
REVOKE EXECUTE ON FUNCTION suspend_profile FROM authenticated;
GRANT EXECUTE ON FUNCTION suspend_profile TO service_role;
```

---

## 5. MODELO DE PRIVACIDADE GRANULAR

### 5.1 Campos de Controle

| Campo | Controla | Default | Descrição |
|-------|----------|---------|-----------|
| `is_public` | Descoberta + Página | `true` | Perfil aparece em busca e página acessível |
| `is_active` | Ativação geral | `true` | Perfil ativo no sistema |
| `show_contact_email` | Email público | `false` | Exibe contact_email na página pública |
| `show_phone` | Telefone público | `false` | Exibe phone na página pública |
| `show_linked_profiles` | Vínculos | `true` | Exibe profile_links na página pública |
| `show_business_links` | Links business | `true` | Exibe vínculos de negócio |
| `show_professional_links` | Links professional | `true` | Exibe vínculos profissionais |

### 5.2 Lógica de Exibição

```typescript
// Service layer example
export async function getPublicProfileWithPrivacy(handle: string) {
  const { data: profile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('handle', handle)
    .single();
  
  if (!profile) return null;
  
  // contact_email e phone já vêm filtrados pela view
  
  // Buscar links - a view public_profile_links já aplica todos os filtros de privacidade
  const { data: links } = await supabase
    .from('public_profile_links')
    .select('*')
    .eq('from_profile_id', profile.id);
  
  // Buscar dados específicos por tipo
  let extensionData = null;
  
  if (profile.profile_type === 'business') {
    const { data } = await supabase
      .from('public_business_profiles')
      .select('*')
      .eq('id', profile.id)
      .single();
    extensionData = data;
  } else if (profile.profile_type === 'professional') {
    const { data } = await supabase
      .from('public_professional_profiles')
      .select('*')
      .eq('id', profile.id)
      .single();
    extensionData = data;
  } else if (profile.profile_type === 'driver') {
    const { data } = await supabase
      .from('public_driver_profiles')
      .select('*')
      .eq('id', profile.id)
      .single();
    extensionData = data;
  }
  
  return { 
    profile: extensionData || profile, 
    links: links || []
  };
}
```

### 5.3 Configuração de Privacidade (UI)

```typescript
// Exemplo de update de privacidade
export async function updateProfilePrivacy(
  profileId: string,
  settings: {
    show_contact_email?: boolean;
    show_phone?: boolean;
    show_linked_profiles?: boolean;
    show_business_links?: boolean;
    show_professional_links?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(settings)
    .eq('id', profileId);
  
  return { data, error };
}
```

---

## 6. FLUXO BACKEND PARA RPCs ADMIN

### 6.1 Exemplo Edge Function (Verify Profile)

```typescript
// supabase/functions/admin-verify-profile/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  
  // Validar token do usuário
  const { data: { user } } = await supabaseClient.auth.getUser(token);
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  // Verificar se é admin
  const { data: admin } = await supabaseClient
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
  }
  
  // Chamar RPC via service_role
  const { profile_id, verified } = await req.json();
  
  const { data, error } = await supabaseClient.rpc('verify_profile', {
    p_profile_id: profile_id,
    p_verified: verified
  });
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  
  return new Response(JSON.stringify(data), { status: 200 });
});
```

### 6.2 Exemplo Edge Function (Suspend Profile)

```typescript
// supabase/functions/admin-suspend-profile/index.ts
serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user } } = await supabaseClient.auth.getUser(token);
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const { data: admin } = await supabaseClient
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single();
  
  if (!admin) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
  }
  
  const { profile_id, reason } = await req.json();
  
  const { data, error } = await supabaseClient.rpc('suspend_profile', {
    p_profile_id: profile_id,
    p_reason: reason,
    p_performed_by: user.id
  });
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  
  return new Response(JSON.stringify(data), { status: 200 });
});
```

---

## 7. CHECKLIST FINAL 100% COMPLETO

### ✅ A) RPC Admin Corrigida
- [x] Modelo único: backend/service_role apenas
- [x] Validação de admin na edge function/backend
- [x] REVOKE EXECUTE FROM authenticated
- [x] GRANT EXECUTE TO service_role
- [x] Exemplos de edge functions documentados

### ✅ B) Policies de profile_members Corrigidas
- [x] Owner/admin podem ver TODOS os membros
- [x] Funciona após transferência de ownership
- [x] Dono estrutural mantém acesso
- [x] Membros podem ver próprias memberships

### ✅ C) Views Públicas por Tipo
- [x] `public_profiles` (base)
- [x] `public_business_profiles` (com business_data)
- [x] `public_professional_profiles` (com professional_data)
- [x] `public_driver_profiles` (com driver_data)
- [x] `public_profile_links` (vínculos públicos)
- [x] GRANT SELECT TO anon e authenticated
- [x] public_profile_links filtra from_profile e to_profile privados
- [x] show_business_links aplicado para link_type owns/partner
- [x] show_professional_links aplicado para link_type works_for/drives_for

### ✅ D) RPC de Criação Endurecida
- [x] Business/professional/driver EXIGEM extension_data
- [x] Validação de campos obrigatórios por tipo
- [x] Business: legal_name obrigatório
- [x] Professional: profession obrigatório
- [x] Driver: license_number, category, expiry, state obrigatórios
- [x] Mensagens de erro específicas

### ✅ E) Privacidade Granular
- [x] `show_contact_email` (default false)
- [x] `show_phone` (default false)
- [x] `show_linked_profiles` (default true)
- [x] `show_business_links` (default true)
- [x] `show_professional_links` (default true)
- [x] Views públicas respeitam configurações
- [x] show_business_links aplicado em public_profile_links
- [x] show_professional_links aplicado em public_profile_links
- [x] Service layer não depende de show_linked_profiles (view filtra)

### ✅ F) Correções Finais
- [x] profile_links acessível para anon via view
- [x] Partial unique indexes fora de CREATE TABLE
- [x] Triggers substituindo CHECK EXISTS
- [x] Extensões obrigatórias (citext, postgis)
- [x] Modelo de ownership híbrido mantido
- [x] Bootstrap transacional completo
- [x] Trigger enforce_no_members_for_personal_driver (enforcement forte)
- [x] public_profile_links não expõe perfis privados (from e to)
- [x] Service layer corrigida (sem dependência de show_linked_profiles)
- [x] Policies de profile_links seguem modelo híbrido (owner/admin operacional)

---

## 8. ORDEM DE APLICAÇÃO DAS MIGRATIONS

```sql
-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Functions helpers
CREATE OR REPLACE FUNCTION update_updated_at_column() ...

-- 3. Tabelas base
CREATE TABLE profiles ...
CREATE TABLE profile_members ...
CREATE TABLE profile_links ...
CREATE TABLE business_data ...
CREATE TABLE professional_data ...
CREATE TABLE driver_data ...
CREATE TABLE admin_users ...
CREATE TABLE profile_audit_log ...

-- 4. Índices (incluindo partial unique)
CREATE INDEX ...
CREATE UNIQUE INDEX ...

-- 5. Triggers
CREATE TRIGGER set_profiles_updated_at ...
CREATE TRIGGER enforce_profile_link_same_account ...
CREATE TRIGGER enforce_business_data_profile_type ...
CREATE TRIGGER enforce_professional_data_profile_type ...
CREATE TRIGGER enforce_driver_data_profile_type ...
CREATE TRIGGER prevent_members_personal_driver ...

-- 6. Views públicas
CREATE VIEW public_profiles ...
CREATE VIEW public_business_profiles ...
CREATE VIEW public_professional_profiles ...
CREATE VIEW public_driver_profiles ...
CREATE VIEW public_profile_links ...

-- 7. RLS (enable + policies)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...

-- 8. RPCs
CREATE FUNCTION create_profile_with_extension ...
CREATE FUNCTION transfer_profile_ownership ...
CREATE FUNCTION delete_profile ...
CREATE FUNCTION update_profile_handle ...
CREATE FUNCTION verify_profile ...
CREATE FUNCTION suspend_profile ...

-- 9. Permissões explícitas das RPCs
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

-- 10. Grants finais de views
GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;
...
```

---

**FIM DO DOCUMENTO DEFINITIVO**

Este documento está 100% pronto para implementação sem pendências.

---

## VALIDAÇÃO FINAL DOS 4 PONTOS CRÍTICOS

### ✅ 1. public_profile_links Não Expõe Perfis Privados

**Verificação**:
```sql
-- Teste: perfil privado não deve aparecer em links públicos
-- Setup
UPDATE profiles SET is_public = false WHERE id = 'profile-privado-id';

-- Query
SELECT * FROM public_profile_links 
WHERE from_profile_id = 'profile-privado-id' 
OR to_profile_id = 'profile-privado-id';

-- Resultado esperado: 0 rows (perfil privado não exposto)
```

**Garantia**: View filtra `p_from.is_public = true AND p_to.is_public = true`

### ✅ 2. show_business_links e show_professional_links Aplicados

**Verificação**:
```sql
-- Teste: link business com show_business_links = false não deve aparecer
-- Setup
UPDATE profiles SET show_business_links = false WHERE id = 'business-profile-id';
INSERT INTO profile_links (from_profile_id, to_profile_id, link_type) 
VALUES ('business-profile-id', 'other-profile-id', 'owns');

-- Query
SELECT * FROM public_profile_links WHERE from_profile_id = 'business-profile-id';

-- Resultado esperado: 0 rows (link business oculto)
```

**Garantia**: View aplica condição `(link_type IN ('owns', 'partner') AND show_business_links = true)`

### ✅ 3. Service Layer Sem Dependência de show_linked_profiles

**Verificação**:
```typescript
// Teste: service layer não verifica show_linked_profiles
const profile = await getPublicProfileWithPrivacy('handle');

// A view public_profile_links já aplica o filtro
// Service layer apenas consulta a view
```

**Garantia**: View aplica `show_linked_profiles = true`, service layer não precisa verificar

### ✅ 4. Enforcement Forte para Membros em Personal/Driver

**Verificação**:
```sql
-- Teste: tentar adicionar membro em personal deve falhar
-- Setup
INSERT INTO profiles (user_id, profile_type, handle, display_name)
VALUES ('user-id', 'personal', 'test-personal', 'Test');

-- Tentativa (deve falhar)
INSERT INTO profile_members (profile_id, user_id, role)
VALUES ('personal-profile-id', 'other-user-id', 'member');

-- Resultado esperado: ERROR: Personal and driver profiles cannot have members
```

**Garantia**: Trigger `prevent_members_personal_driver` bloqueia operação

---

## RESUMO EXECUTIVO

**Status**: ✅ 100% PRONTO PARA IMPLEMENTAÇÃO

**Arquitetura**: Multi-perfil real estrito (4 tipos: personal, business, professional, driver)

**Segurança**:
- RLS completo em todas as tabelas
- Views públicas com filtros de privacidade granular
- RPCs admin via backend/service_role apenas
- Enforcement forte via triggers

**Privacidade**:
- 5 níveis de controle granular
- Perfis privados nunca expostos em links públicos
- show_business_links e show_professional_links aplicados
- Service layer simplificada (views fazem o trabalho)

**Integridade**:
- Triggers impedem membros em personal/driver
- Triggers validam profile_type em extensões
- Triggers validam same_account em profile_links
- Partial unique indexes garantem unicidade

**Pronto para**:
1. Aplicar migrations em ordem
2. Criar edge functions admin
3. Implementar service layer TypeScript
4. Desenvolver UI
5. Testes end-to-end
6. Deploy produção
