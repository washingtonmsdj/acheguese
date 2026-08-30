CREATE OR REPLACE FUNCTION public.create_operational_pin_verification(
  p_ride_id uuid,
  p_is_required boolean,
  p_required_by text,
  p_verification_type text DEFAULT 'pin'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
SET statement_timeout TO '3s'
AS $function$
DECLARE
  v_actor_profile_id uuid := private.current_active_profile_id();
  v_ride public.ride_requests%ROWTYPE;
  v_existing public.operational_verifications%ROWTYPE;
  v_result public.operational_verifications%ROWTYPE;
  v_random bytea;
  v_pin_number bigint;
  v_pin text;
  v_pin_hash text;
  v_now timestamptz := now();
  v_expires_at timestamptz;
  v_is_admin boolean := COALESCE(private.is_admin_from_roles(auth.uid()), false);
BEGIN
  IF auth.uid() IS NULL OR p_ride_id IS NULL OR v_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'active_profile_required' USING ERRCODE = '42501';
  END IF;
  IF p_verification_type <> 'pin' THEN
    RAISE EXCEPTION 'unsupported_operational_verification_type' USING ERRCODE = '22023';
  END IF;
  IF p_is_required AND p_required_by NOT IN ('admin','passenger','driver','sender','operation') THEN
    RAISE EXCEPTION 'invalid_operational_verification_required_by' USING ERRCODE = '22023';
  END IF;
  SELECT ride.* INTO v_ride FROM public.ride_requests ride WHERE ride.id=p_ride_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ride_not_found' USING ERRCODE='P0002'; END IF;
  IF NOT v_is_admin AND v_actor_profile_id IS DISTINCT FROM v_ride.passenger_profile_id THEN
    RAISE EXCEPTION 'ride_requester_profile_required' USING ERRCODE='42501';
  END IF;
  SELECT verification.* INTO v_existing FROM public.operational_verifications verification
  WHERE verification.ride_id=p_ride_id AND verification.verification_type=p_verification_type FOR UPDATE;
  IF NOT p_is_required THEN
    IF FOUND THEN
      UPDATE public.operational_verifications SET is_required=false,required_by=NULL,required_at=NULL,status='not_required',pin_hash=NULL,pin_generated_at=NULL,pin_expires_at=NULL,verified_at=NULL,verified_by=NULL,verification_attempts=0,last_attempt_at=NULL,updated_at=v_now WHERE id=v_existing.id RETURNING * INTO v_result;
    ELSE
      INSERT INTO public.operational_verifications(ride_id,verification_type,is_required,status,verification_attempts)
      VALUES(p_ride_id,p_verification_type,false,'not_required',0) RETURNING * INTO v_result;
    END IF;
    RETURN jsonb_build_object('verification_id',v_result.id,'pin',NULL,'expires_at',NULL);
  END IF;
  IF FOUND AND v_existing.status IN ('pending','verified') THEN
    RETURN jsonb_build_object('verification_id',v_existing.id,'pin',NULL,'expires_at',v_existing.pin_expires_at);
  END IF;
  v_random := extensions.gen_random_bytes(4);
  v_pin_number := (get_byte(v_random,0)::bigint*16777216 + get_byte(v_random,1)::bigint*65536 + get_byte(v_random,2)::bigint*256 + get_byte(v_random,3)::bigint) % 10000;
  v_pin := lpad(v_pin_number::text,4,'0');
  v_pin_hash := extensions.crypt(v_pin,extensions.gen_salt('bf',10));
  v_expires_at := v_now + interval '24 hours';
  IF FOUND THEN
    UPDATE public.operational_verifications SET is_required=true,required_by=p_required_by,required_at=v_now,status='pending',pin_hash=v_pin_hash,pin_generated_at=v_now,pin_expires_at=v_expires_at,verified_at=NULL,verified_by=NULL,verification_attempts=0,last_attempt_at=NULL,updated_at=v_now WHERE id=v_existing.id RETURNING * INTO v_result;
  ELSE
    INSERT INTO public.operational_verifications(ride_id,verification_type,is_required,required_by,required_at,status,pin_hash,pin_generated_at,pin_expires_at,verification_attempts)
    VALUES(p_ride_id,p_verification_type,true,p_required_by,v_now,'pending',v_pin_hash,v_now,v_expires_at,0) RETURNING * INTO v_result;
  END IF;
  RETURN jsonb_build_object('verification_id',v_result.id,'pin',v_pin,'expires_at',v_result.pin_expires_at);
END;$function$;

CREATE OR REPLACE FUNCTION public.get_operational_verification_status(p_ride_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp' SET statement_timeout TO '2s'
AS $function$
DECLARE v_actor_profile_id uuid := private.current_active_profile_id(); v_ride public.ride_requests%ROWTYPE; v_verification public.operational_verifications%ROWTYPE; v_is_admin boolean := COALESCE(private.is_admin_from_roles(auth.uid()),false);
BEGIN
 IF auth.uid() IS NULL OR p_ride_id IS NULL OR v_actor_profile_id IS NULL THEN RAISE EXCEPTION 'active_profile_required' USING ERRCODE='42501'; END IF;
 SELECT ride.* INTO v_ride FROM public.ride_requests ride WHERE ride.id=p_ride_id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF NOT v_is_admin AND v_actor_profile_id IS DISTINCT FROM v_ride.passenger_profile_id AND v_actor_profile_id IS DISTINCT FROM v_ride.driver_profile_id THEN RAISE EXCEPTION 'ride_participant_required' USING ERRCODE='42501'; END IF;
 SELECT verification.* INTO v_verification FROM public.operational_verifications verification WHERE verification.ride_id=p_ride_id AND verification.verification_type='pin';
 IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN jsonb_build_object('id',v_verification.id,'ride_id',v_verification.ride_id,'verification_type',v_verification.verification_type,'is_required',v_verification.is_required,'required_by',v_verification.required_by,'required_at',v_verification.required_at,'status',v_verification.status,'pin_generated_at',v_verification.pin_generated_at,'pin_expires_at',v_verification.pin_expires_at,'verified_at',v_verification.verified_at,'verified_by',v_verification.verified_by,'verification_attempts',COALESCE(v_verification.verification_attempts,0),'last_attempt_at',v_verification.last_attempt_at,'created_at',v_verification.created_at,'updated_at',v_verification.updated_at);
END;$function$;

CREATE OR REPLACE FUNCTION public.verify_operational_pin(p_ride_id uuid,p_pin text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','extensions','pg_temp' SET statement_timeout TO '3s'
AS $function$
DECLARE v_actor_profile_id uuid := private.current_active_profile_id(); v_ride public.ride_requests%ROWTYPE; v_verification public.operational_verifications%ROWTYPE; v_attempts integer; v_attempts_remaining integer; v_now timestamptz:=now();
BEGIN
 IF auth.uid() IS NULL OR p_ride_id IS NULL OR v_actor_profile_id IS NULL THEN RAISE EXCEPTION 'active_profile_required' USING ERRCODE='42501'; END IF;
 IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'invalid_pin_format' USING ERRCODE='22023'; END IF;
 SELECT ride.* INTO v_ride FROM public.ride_requests ride WHERE ride.id=p_ride_id FOR UPDATE;
 IF NOT FOUND OR (v_actor_profile_id IS DISTINCT FROM v_ride.passenger_profile_id AND v_actor_profile_id IS DISTINCT FROM v_ride.driver_profile_id) THEN RAISE EXCEPTION 'ride_participant_required' USING ERRCODE='42501'; END IF;
 SELECT verification.* INTO v_verification FROM public.operational_verifications verification WHERE verification.ride_id=p_ride_id AND verification.verification_type='pin' FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('verified',false,'code','verification_not_found','attempts_remaining',NULL); END IF;
 IF NOT v_verification.is_required OR v_verification.status='not_required' THEN RETURN jsonb_build_object('verified',true,'code','not_required','attempts_remaining',5); END IF;
 IF v_verification.status='verified' THEN RETURN jsonb_build_object('verified',true,'code','already_verified','attempts_remaining',GREATEST(0,5-COALESCE(v_verification.verification_attempts,0))); END IF;
 v_attempts:=COALESCE(v_verification.verification_attempts,0);
 IF v_verification.status='failed' OR v_attempts>=5 THEN RETURN jsonb_build_object('verified',false,'code','max_attempts_reached','attempts_remaining',0); END IF;
 IF v_verification.pin_expires_at IS NULL OR v_verification.pin_expires_at<=v_now THEN UPDATE public.operational_verifications SET status='failed',updated_at=v_now WHERE id=v_verification.id; RETURN jsonb_build_object('verified',false,'code','pin_expired','attempts_remaining',GREATEST(0,5-v_attempts)); END IF;
 v_attempts:=v_attempts+1; v_attempts_remaining:=GREATEST(0,5-v_attempts);
 IF extensions.crypt(p_pin,v_verification.pin_hash)=v_verification.pin_hash THEN
   UPDATE public.operational_verifications SET status='verified',verified_at=v_now,verified_by=v_actor_profile_id,verification_attempts=v_attempts,last_attempt_at=v_now,updated_at=v_now WHERE id=v_verification.id;
   RETURN jsonb_build_object('verified',true,'code','pin_verified','attempts_remaining',v_attempts_remaining);
 END IF;
 UPDATE public.operational_verifications SET status=CASE WHEN v_attempts_remaining=0 THEN 'failed' ELSE 'pending' END,verification_attempts=v_attempts,last_attempt_at=v_now,updated_at=v_now WHERE id=v_verification.id;
 RETURN jsonb_build_object('verified',false,'code',CASE WHEN v_attempts_remaining=0 THEN 'max_attempts_reached' ELSE 'invalid_pin' END,'attempts_remaining',v_attempts_remaining);
END;$function$;

REVOKE ALL ON FUNCTION public.create_operational_pin_verification(uuid,boolean,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.get_operational_verification_status(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.verify_operational_pin(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_operational_pin_verification(uuid,boolean,text,text) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_operational_verification_status(uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.verify_operational_pin(uuid,text) TO authenticated,service_role;