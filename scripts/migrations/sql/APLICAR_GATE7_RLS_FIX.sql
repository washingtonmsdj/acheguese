-- GATE 7: FIX RLS - Operational Verifications
-- Permitir que service role e usuários autenticados criem/leiam verificações

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "operational_verifications_insert_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_select_policy" ON operational_verifications;
DROP POLICY IF EXISTS "operational_verifications_update_policy" ON operational_verifications;

-- Policy para INSERT: service role ou usuário autenticado
CREATE POLICY "operational_verifications_insert_policy"
ON operational_verifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy para SELECT: service role ou usuário autenticado
CREATE POLICY "operational_verifications_select_policy"
ON operational_verifications
FOR SELECT
TO authenticated
USING (true);

-- Policy para UPDATE: service role ou usuário autenticado
CREATE POLICY "operational_verifications_update_policy"
ON operational_verifications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verificar que RLS está habilitado
ALTER TABLE operational_verifications ENABLE ROW LEVEL SECURITY;
