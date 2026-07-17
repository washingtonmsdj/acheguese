-- Remove the one-time media reconciliation helper after every environment has
-- applied the canonical post media migration.

BEGIN;

DROP FUNCTION IF EXISTS private.normalize_post_image_reference(TEXT, UUID);

COMMIT;
