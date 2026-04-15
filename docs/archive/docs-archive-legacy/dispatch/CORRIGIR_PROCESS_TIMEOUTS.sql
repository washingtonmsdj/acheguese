-- Corrigir ambiguidade em process_dispatch_timeouts

DROP FUNCTION IF EXISTS process_dispatch_timeouts();

CREATE OR REPLACE FUNCTION process_dispatch_timeouts()
RETURNS TABLE (
  ride_id UUID,
  action TEXT,
  details TEXT
) AS $$
DECLARE
  v_timeout_ride RECORD;
  v_origin_lat FLOAT;
  v_origin_lng FLOAT;
  v_next_driver RECORD;
  v_attempt_number INT;
  v_max_attempts INT := 5;
BEGIN
  FOR v_timeout_ride IN
    SELECT DISTINCT ON (rr.id)
      rr.id as ride_id,
      rr.driver_profile_id,
      rr.pickup_address_id,
      rr.created_at,
      rda.attempt_number,
      rda.id as audit_id
    FROM ride_requests rr
    JOIN ride_dispatch_audit rda ON rda.ride_id = rr.id
    WHERE rr.status = 'driver_assigned'
      AND rda.status = 'pending'
      AND rda.timeout_at < NOW()
    ORDER BY rr.id, rda.created_at DESC
  LOOP
    UPDATE ride_dispatch_audit
    SET status = 'timeout', responded_at = NOW(), updated_at = NOW()
    WHERE id = v_timeout_ride.audit_id;

    v_attempt_number := v_timeout_ride.attempt_number;

    IF v_attempt_number >= v_max_attempts THEN
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 
              'Max attempts reached (' || v_max_attempts || ')', NOW());

      RETURN QUERY SELECT v_timeout_ride.ride_id, 'expired'::TEXT, 
                          ('Max attempts: ' || v_max_attempts)::TEXT;
      CONTINUE;
    END IF;

    IF EXTRACT(EPOCH FROM (NOW() - v_timeout_ride.created_at)) / 60 > 10 THEN
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 'Total timeout (10min)', NOW());

      RETURN QUERY SELECT v_timeout_ride.ride_id, 'expired'::TEXT, 'Total timeout'::TEXT;
      CONTINUE;
    END IF;

    SELECT a.latitude, a.longitude
    INTO v_origin_lat, v_origin_lng
    FROM addresses a
    WHERE a.id = v_timeout_ride.pickup_address_id;

    SELECT * INTO v_next_driver
    FROM find_eligible_drivers(v_origin_lat, v_origin_lng, 10)
    WHERE profile_id NOT IN (
      SELECT rda2.driver_profile_id 
      FROM ride_dispatch_audit rda2
      WHERE rda2.ride_id = v_timeout_ride.ride_id
    )
    LIMIT 1;

    IF NOT FOUND THEN
      UPDATE ride_requests
      SET status = 'expired', updated_at = NOW()
      WHERE id = v_timeout_ride.ride_id;

      INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
      VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'expired', 'system', 
              'No more drivers available', NOW());

      RETURN QUERY SELECT v_timeout_ride.ride_id, 'expired'::TEXT, 'No more drivers'::TEXT;
      CONTINUE;
    END IF;

    UPDATE ride_requests
    SET 
      driver_profile_id = v_next_driver.profile_id,
      status = 'driver_assigned',
      updated_at = NOW()
    WHERE id = v_timeout_ride.ride_id;

    INSERT INTO ride_dispatch_audit (
      ride_id,
      driver_profile_id,
      attempt_number,
      offered_at,
      timeout_at,
      status,
      created_at
    ) VALUES (
      v_timeout_ride.ride_id,
      v_next_driver.profile_id,
      v_attempt_number + 1,
      NOW(),
      NOW() + INTERVAL '30 seconds',
      'pending',
      NOW()
    );

    INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason, created_at)
    VALUES (v_timeout_ride.ride_id, 'driver_assigned', 'driver_assigned', 'system', 
            'Retry attempt ' || (v_attempt_number + 1) || ' (distance: ' || ROUND(v_next_driver.distance_km::numeric, 2) || 'km)', NOW());

    RETURN QUERY SELECT v_timeout_ride.ride_id, 'retry'::TEXT, 
                        ('Attempt ' || (v_attempt_number + 1) || ' to driver ' || v_next_driver.profile_id)::TEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Funcao corrigida!' as status;
