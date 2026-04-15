-- Migration: add_address_precision_and_verification
-- Adiciona address_precision, verification_status, owner_user_id à tabela addresses
-- + view pública que mascara dados sensíveis
-- + RLS restritiva para endereços pessoais

-- 1. Criar enums
DO $$ BEGIN
  CREATE TYPE address_precision AS ENUM ('exact','interpolated','street','neighborhood','district','city');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE address_verification_status AS ENUM ('pending','verified','rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Adicionar colunas
ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS precision address_precision DEFAULT 'city',
  ADD COLUMN IF NOT EXISTS verification_status address_verification_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_reason TEXT,
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_addresses_precision ON addresses(precision);
CREATE INDEX IF NOT EXISTS idx_addresses_verification_status ON addresses(verification_status);
CREATE INDEX IF NOT EXISTS idx_addresses_owner_user_id ON addresses(owner_user_id) WHERE owner_user_id IS NOT NULL;

-- 4. RLS mais restritiva
DROP POLICY IF EXISTS "Authenticated users can update addresses" ON addresses;
DROP POLICY IF EXISTS "Authenticated users can delete addresses" ON addresses;

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE TO authenticated
  USING (owner_user_id IS NULL OR owner_user_id = auth.uid());

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE TO authenticated
  USING (owner_user_id IS NULL OR owner_user_id = auth.uid());

-- 5. View pública (nunca expõe rua/número/CEP)
CREATE OR REPLACE VIEW addresses_public AS
SELECT id, location_id, address_type, precision, verification_status,
  CASE WHEN is_verified THEN latitude ELSE NULL END as latitude,
  CASE WHEN is_verified THEN longitude ELSE NULL END as longitude,
  is_verified, created_at
FROM addresses;
