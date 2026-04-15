-- Migration: Add titulo column to classifieds table if it doesn't exist
-- Date: 2026-03-25

DO $$
BEGIN
    -- Check if titulo column exists, if not, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'classifieds' 
        AND column_name = 'titulo'
    ) THEN
        ALTER TABLE classifieds ADD COLUMN titulo TEXT;
    END IF;
END $$;

-- Also ensure the table has the correct structure
COMMENT ON COLUMN classifieds.titulo IS 'Título do classificado';