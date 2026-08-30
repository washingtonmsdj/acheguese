begin;

-- G5 forward-only reconciliation of the report RPC contract.
-- Public wrappers are SECURITY INVOKER and delegate to authenticated-only
-- private helpers, so service_role EXECUTE on the wrappers is incoherent.

revoke execute on function public.create_vaga_report(uuid, text, text)
  from public, anon, service_role;
revoke execute on function private.create_vaga_report(uuid, text, text)
  from public, anon, service_role;
grant execute on function public.create_vaga_report(uuid, text, text)
  to authenticated;
grant execute on function private.create_vaga_report(uuid, text, text)
  to authenticated;

revoke execute on function public.moderate_vaga_report(uuid, text, text)
  from public, anon, service_role;
revoke execute on function private.moderate_vaga_report(uuid, text, text)
  from public, anon, service_role;
grant execute on function public.moderate_vaga_report(uuid, text, text)
  to authenticated;
grant execute on function private.moderate_vaga_report(uuid, text, text)
  to authenticated;

revoke execute on function public.create_review_report(uuid, text, text)
  from public, anon, service_role;
revoke execute on function private.create_review_report(uuid, text, text)
  from public, anon, service_role;
grant execute on function public.create_review_report(uuid, text, text)
  to authenticated;
grant execute on function private.create_review_report(uuid, text, text)
  to authenticated;

revoke execute on function public.moderate_review_report(uuid, text, text)
  from public, anon, service_role;
revoke execute on function private.moderate_review_report(uuid, text, text)
  from public, anon, service_role;
grant execute on function public.moderate_review_report(uuid, text, text)
  to authenticated;
grant execute on function private.moderate_review_report(uuid, text, text)
  to authenticated;

revoke execute on function public.create_ride_report(
  uuid, text, text, text, text, text[], double precision, double precision
) from public, anon, service_role;
revoke execute on function private.create_ride_report(
  uuid, text, text, text, text, text[], double precision, double precision
) from public, anon, service_role;
grant execute on function public.create_ride_report(
  uuid, text, text, text, text, text[], double precision, double precision
) to authenticated;
grant execute on function private.create_ride_report(
  uuid, text, text, text, text, text[], double precision, double precision
) to authenticated;

revoke execute on function public.moderate_ride_report(uuid, text, text, text)
  from public, anon, service_role;
revoke execute on function private.moderate_ride_report(uuid, text, text, text)
  from public, anon, service_role;
grant execute on function public.moderate_ride_report(uuid, text, text, text)
  to authenticated;
grant execute on function private.moderate_ride_report(uuid, text, text, text)
  to authenticated;

do $verify$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'public.create_vaga_report(uuid,text,text)'::regprocedure,
    'private.create_vaga_report(uuid,text,text)'::regprocedure,
    'public.moderate_vaga_report(uuid,text,text)'::regprocedure,
    'private.moderate_vaga_report(uuid,text,text)'::regprocedure,
    'public.create_review_report(uuid,text,text)'::regprocedure,
    'private.create_review_report(uuid,text,text)'::regprocedure,
    'public.moderate_review_report(uuid,text,text)'::regprocedure,
    'private.moderate_review_report(uuid,text,text)'::regprocedure,
    'public.create_ride_report(uuid,text,text,text,text,text[],double precision,double precision)'::regprocedure,
    'private.create_ride_report(uuid,text,text,text,text,text[],double precision,double precision)'::regprocedure,
    'public.moderate_ride_report(uuid,text,text,text)'::regprocedure,
    'private.moderate_ride_report(uuid,text,text,text)'::regprocedure
  ] loop
    if has_function_privilege('anon', fn, 'execute')
       or has_function_privilege('service_role', fn, 'execute')
       or not has_function_privilege('authenticated', fn, 'execute') then
      raise exception 'report RPC grant contract mismatch for %', fn;
    end if;
  end loop;
end
$verify$;

commit;
