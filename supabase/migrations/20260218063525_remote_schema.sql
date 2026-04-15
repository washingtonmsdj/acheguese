set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_old_compiler_sessions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM public.compiler_sessions
  WHERE updated_at < EXTRACT(EPOCH FROM NOW() - INTERVAL '7 days') * 1000;
END;
$function$
;


