begin;

-- F-005 incremental hardening: these browser-facing report RPCs require an
-- authenticated user context in their private helpers. service_role does not
-- inherit authenticated, so advertising EXECUTE on the public wrappers is an
-- incoherent contract and broadens the exposed surface without a valid caller.

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

commit;
