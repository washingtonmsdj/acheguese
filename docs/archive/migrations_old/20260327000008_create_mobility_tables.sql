-- Tabelas de mobilidade faltantes

-- ride_ratings: avaliações de corridas
CREATE TABLE IF NOT EXISTS ride_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id         UUID REFERENCES ride_requests(id) ON DELETE CASCADE,
  rater_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_ratings_ride ON ride_ratings(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_ratings_rated ON ride_ratings(rated_id);

ALTER TABLE ride_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own ride ratings" ON ride_ratings FOR SELECT TO authenticated
  USING (rater_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR rated_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users create ride ratings" ON ride_ratings FOR INSERT TO authenticated
  WITH CHECK (rater_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- driver_profiles: perfil de motorista (referenciado pelo AdminMobilityService)
CREATE TABLE IF NOT EXISTS driver_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating          DECIMAL(3,2) NOT NULL DEFAULT 5.0,
  total_rides     INTEGER NOT NULL DEFAULT 0,
  total_earnings  DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_profile ON driver_profiles(profile_id);

ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read driver profiles" ON driver_profiles FOR SELECT TO authenticated USING (true);
