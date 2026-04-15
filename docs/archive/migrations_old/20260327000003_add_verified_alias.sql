-- Adiciona coluna 'verified' como alias de 'is_verified' na tabela profiles.
-- O código usa 'verified' em todo lugar, o banco tinha apenas 'is_verified'.
-- Esta migration sincroniza os dois campos via trigger para manter compatibilidade.

-- 1. Adiciona coluna verified (se não existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

-- 2. Sincroniza valores existentes
UPDATE profiles SET verified = is_verified WHERE verified != is_verified;

-- 3. Trigger para manter os dois campos sincronizados
CREATE OR REPLACE FUNCTION sync_verified_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Se is_verified mudou, atualiza verified
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    NEW.verified := NEW.is_verified;
  END IF;
  -- Se verified mudou, atualiza is_verified
  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    NEW.is_verified := NEW.verified;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_verified_trigger ON profiles;
CREATE TRIGGER sync_verified_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_verified_fields();
