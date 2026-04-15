-- Consolida verified como coluna canônica, remove is_verified e o trigger de sync.
-- SSOT: profiles.verified é o único campo de verificação.

-- Remove trigger de sync (não é mais necessário)
DROP TRIGGER IF EXISTS sync_verified_trigger ON profiles;
DROP FUNCTION IF EXISTS sync_verified_fields();

-- Garante que verified está sincronizado com is_verified antes de dropar
UPDATE profiles SET verified = is_verified WHERE verified IS DISTINCT FROM is_verified;

-- Remove coluna redundante
ALTER TABLE profiles DROP COLUMN IF EXISTS is_verified;
