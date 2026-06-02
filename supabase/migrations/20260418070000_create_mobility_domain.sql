-- ============================================================================
-- MIGRATION: Create Mobility Domain Tables
-- ============================================================================
-- Etapa: 1.4.5 - Mobility Domain
-- Data: 2026-04-18
-- Descrição: Cria tabelas do domínio de mobilidade (caronas, motoristas, rotas)
-- ============================================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE ride_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE route_status AS ENUM ('active', 'full', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM ('once', 'daily', 'weekdays', 'weekly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 1. DRIVER_DATA
CREATE TABLE IF NOT EXISTS driver_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  subscription_active BOOLEAN NOT NULL DEFAULT false,
  vehicle JSONB NOT NULL DEFAULT '{}',
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_rides INTEGER NOT NULL DEFAULT 0 CHECK (total_rides >= 0),
  total_rides_completed INTEGER NOT NULL DEFAULT 0 CHECK (total_rides_completed >= 0),
  total_rides_cancelled INTEGER NOT NULL DEFAULT 0 CHECK (total_rides_cancelled >= 0),
  acceptance_rate DECIMAL(5,2) DEFAULT 0 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
  cancellation_rate DECIMAL(5,2) DEFAULT 0 CHECK (cancellation_rate >= 0 AND cancellation_rate <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_data_profile_id_unique UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_data_profile_id ON driver_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_data_is_online ON driver_data(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_driver_data_is_verified ON driver_data(is_verified) WHERE is_verified = true;

DROP TRIGGER IF EXISTS update_driver_data_updated_at ON driver_data;
CREATE TRIGGER update_driver_data_updated_at BEFORE UPDATE ON driver_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE driver_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Driver data viewable" ON driver_data;
CREATE POLICY "Driver data viewable" ON driver_data FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Drivers manage own data" ON driver_data;
CREATE POLICY "Drivers manage own data" ON driver_data FOR ALL TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 2. DRIVER_ROUTES
CREATE TABLE IF NOT EXISTS driver_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin JSONB NOT NULL,
  destination JSONB NOT NULL,
  waypoints JSONB DEFAULT '[]',
  departure_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER NOT NULL DEFAULT 1 CHECK (available_seats > 0),
  price_per_seat DECIMAL(10,2) NOT NULL CHECK (price_per_seat >= 0),
  status route_status NOT NULL DEFAULT 'active',
  recurrence recurrence_type DEFAULT 'once',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_routes_driver_id ON driver_routes(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_routes_departure ON driver_routes(departure_time DESC);
CREATE INDEX IF NOT EXISTS idx_driver_routes_status ON driver_routes(status);

DROP TRIGGER IF EXISTS update_driver_routes_updated_at ON driver_routes;
CREATE TRIGGER update_driver_routes_updated_at BEFORE UPDATE ON driver_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE driver_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active routes viewable" ON driver_routes;
CREATE POLICY "Active routes viewable" ON driver_routes FOR SELECT TO authenticated USING (status = 'active');
DROP POLICY IF EXISTS "Drivers manage own routes" ON driver_routes;
CREATE POLICY "Drivers manage own routes" ON driver_routes FOR ALL TO authenticated
  USING (driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 3. RIDE_REQUESTS
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  route_id UUID REFERENCES driver_routes(id) ON DELETE SET NULL,
  origin JSONB,
  destination JSONB,
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  status ride_status NOT NULL DEFAULT 'pending',
  suggested_price DECIMAL(10,2) CHECK (suggested_price >= 0),
  final_price DECIMAL(10,2) CHECK (final_price >= 0),
  available_seats INTEGER DEFAULT 1 CHECK (available_seats > 0),
  share_token TEXT UNIQUE,
  share_view_count INTEGER NOT NULL DEFAULT 0 CHECK (share_view_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger_id ON ride_requests(passenger_profile_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver_id ON ride_requests(driver_profile_id) WHERE driver_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_share_token ON ride_requests(share_token) WHERE share_token IS NOT NULL;

DROP TRIGGER IF EXISTS update_ride_requests_updated_at ON ride_requests;
CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON ride_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ride participants view" ON ride_requests;
CREATE POLICY "Ride participants view" ON ride_requests FOR SELECT TO authenticated
  USING (
    passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Passengers create rides" ON ride_requests;
CREATE POLICY "Passengers create rides" ON ride_requests FOR INSERT TO authenticated
  WITH CHECK (passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Participants update rides" ON ride_requests;
CREATE POLICY "Participants update rides" ON ride_requests FOR UPDATE TO authenticated
  USING (
    passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 4. ROUTE_RESERVATIONS
CREATE TABLE IF NOT EXISTS route_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES driver_routes(id) ON DELETE CASCADE,
  passenger_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seats INTEGER NOT NULL DEFAULT 1 CHECK (seats > 0),
  status reservation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_reservations_route_id ON route_reservations(route_id);
CREATE INDEX IF NOT EXISTS idx_route_reservations_passenger_id ON route_reservations(passenger_profile_id);
CREATE INDEX IF NOT EXISTS idx_route_reservations_status ON route_reservations(status);

DROP TRIGGER IF EXISTS update_route_reservations_updated_at ON route_reservations;
CREATE TRIGGER update_route_reservations_updated_at BEFORE UPDATE ON route_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE route_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reservation participants view" ON route_reservations;
CREATE POLICY "Reservation participants view" ON route_reservations FOR SELECT TO authenticated
  USING (
    passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR route_id IN (
      SELECT id FROM driver_routes WHERE driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "Passengers manage own reservations" ON route_reservations;
CREATE POLICY "Passengers manage own reservations" ON route_reservations FOR ALL TO authenticated
  USING (passenger_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 5. ROUTE_TRIPS
CREATE TABLE IF NOT EXISTS route_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES driver_routes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status trip_status NOT NULL DEFAULT 'in_progress'
);

CREATE INDEX IF NOT EXISTS idx_route_trips_route_id ON route_trips(route_id);
CREATE INDEX IF NOT EXISTS idx_route_trips_status ON route_trips(status);

ALTER TABLE route_trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Trips viewable" ON route_trips;
CREATE POLICY "Trips viewable" ON route_trips FOR SELECT TO authenticated USING (true);

-- 6. DRIVER_LOCATIONS
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at ON driver_locations(updated_at DESC);

ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Driver locations viewable" ON driver_locations;
CREATE POLICY "Driver locations viewable" ON driver_locations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Drivers manage own location" ON driver_locations;
CREATE POLICY "Drivers manage own location" ON driver_locations FOR ALL TO authenticated
  USING (driver_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 7. EMERGENCY_ALERTS
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_ride_id ON emergency_alerts(ride_id) WHERE ride_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_profile_id ON emergency_alerts(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view emergency alerts" ON emergency_alerts;
CREATE POLICY "Admins view emergency alerts" ON emergency_alerts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role_enum = 'admin' 
      AND revoked_at IS NULL
    )
  );
DROP POLICY IF EXISTS "Authenticated insert emergency alerts" ON emergency_alerts;
CREATE POLICY "Authenticated insert emergency alerts" ON emergency_alerts FOR INSERT TO authenticated WITH CHECK (true);

-- COMENTÁRIOS
COMMENT ON TABLE driver_data IS 'Dados de motoristas - extensão de profiles';
COMMENT ON TABLE driver_routes IS 'Rotas oferecidas por motoristas';
COMMENT ON TABLE ride_requests IS 'Solicitações de carona';
COMMENT ON TABLE route_reservations IS 'Reservas de assentos em rotas';
COMMENT ON TABLE route_trips IS 'Viagens realizadas';
COMMENT ON TABLE driver_locations IS 'Localização em tempo real de motoristas';
COMMENT ON TABLE emergency_alerts IS 'Alertas de emergência';

-- FIM DA MIGRATION
