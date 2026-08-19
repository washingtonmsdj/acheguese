DO $$
DECLARE
  v_rows bigint;
  v_service_ok boolean;
BEGIN
  SELECT count(*) INTO v_rows FROM public.qr_codes;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION 'qr_codes is no longer empty; review broker migration before locking writes';
  END IF;

  SELECT has_table_privilege('service_role','public.qr_codes','SELECT')
     AND has_table_privilege('service_role','public.qr_codes','INSERT')
     AND has_table_privilege('service_role','public.qr_codes','UPDATE')
     AND has_table_privilege('service_role','public.qr_codes','DELETE')
  INTO v_service_ok;

  IF NOT v_service_ok THEN
    RAISE EXCEPTION 'service_role qr_codes contract is incomplete';
  END IF;
END
$$;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.qr_codes
FROM anon, authenticated;

COMMENT ON TABLE public.qr_codes IS
  'QR Codes dinâmicos para entidades do sistema. Browser roles são read-only; criação/mutação deve passar por autoridade server-side que valide ownership da entidade e destino.';

DO $$
BEGIN
  IF NOT has_table_privilege('anon','public.qr_codes','SELECT')
     OR NOT has_table_privilege('authenticated','public.qr_codes','SELECT') THEN
    RAISE EXCEPTION 'public/authenticated qr_codes SELECT was removed unexpectedly';
  END IF;

  IF has_table_privilege('anon','public.qr_codes','INSERT')
     OR has_table_privilege('anon','public.qr_codes','UPDATE')
     OR has_table_privilege('anon','public.qr_codes','DELETE')
     OR has_table_privilege('authenticated','public.qr_codes','INSERT')
     OR has_table_privilege('authenticated','public.qr_codes','UPDATE')
     OR has_table_privilege('authenticated','public.qr_codes','DELETE') THEN
    RAISE EXCEPTION 'browser qr_codes DML remains granted';
  END IF;

  IF NOT has_table_privilege('service_role','public.qr_codes','SELECT')
     OR NOT has_table_privilege('service_role','public.qr_codes','INSERT')
     OR NOT has_table_privilege('service_role','public.qr_codes','UPDATE')
     OR NOT has_table_privilege('service_role','public.qr_codes','DELETE') THEN
    RAISE EXCEPTION 'service_role qr_codes privileges changed unexpectedly';
  END IF;
END
$$;
