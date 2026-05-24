-- Enables operational realtime events for ride lifecycle updates.
-- The check keeps the migration idempotent across local and remote databases.

ALTER TABLE public.ride_requests REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ride_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_requests;
  END IF;
END $$;
