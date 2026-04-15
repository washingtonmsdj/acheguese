-- Migration: Fix driver_locations schema and add location_tracking history
-- Date: 2026-04-07
-- Purpose: GATE 2 - Add missing GPS columns and create history table

-- ============================================
-- 1. ADD MISSING COLUMNS TO driver_locations
-- ============================================

-- Add accuracy column (meters)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10,2);

-- Add heading column (degrees, 0-360)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS heading DECIMAL(5,2);

-- Add speed column (km/h)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS speed DECIMAL(6,2);

-- Add altitude column (meters)
ALTER TABLE driver_locations 
ADD COLUMN IF NOT EXISTS altitude DECIMAL(8,2);

-- Rename lat/lng to latitude/longitude for consistency
ALTER TABLE driver_locations 
RENAME COLUMN lat TO latitude;

ALTER TABLE driver_locations 
RENAME COLUMN lng TO longitude;

-- Add comment
COMMENT ON TABLE driver_locations IS 'Current location of drivers (last known position)';
COMMENT ON COLUMN driver_locations.accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN driver_locations.heading IS 'Direction of movement in degrees (0-360)';
COMMENT ON COLUMN driver_locations.speed IS 'Speed in km/h';
COMMENT ON COLUMN driver_locations.altitude IS 'Altitude in meters';

-- ============================================
-- 2. CREATE LOCATION TRACKING HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS location_tracking (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude          DECIMAL(10,7) NOT NULL,
  longitude         DECIMAL(10,7) NOT NULL,
  accuracy          DECIMAL(10,2),
  heading           DECIMAL(5,2),
  speed             DECIMAL(6,2),
  altitude          DECIMAL(8,2),
  source            TEXT DEFAULT 'gps',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_tracking_driver_id 
  ON location_tracking(driver_profile_id);

CREATE INDEX IF NOT EXISTS idx_location_tracking_created_at 
  ON location_tracking(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_tracking_driver_time 
  ON location_tracking(driver_profile_id, created_at DESC);

-- Add comment
COMMENT ON TABLE location_tracking IS 'Historical tracking of driver locations (audit trail)';
COMMENT ON COLUMN location_tracking.source IS 'Source of location data (gps, manual, etc)';

-- ============================================
-- 3. ADD PERFORMANCE INDEXES
-- ============================================

-- Index for queries by updated_at
CREATE INDEX IF NOT EXISTS idx_driver_locations_updated_at 
  ON driver_locations(updated_at DESC);

-- Composite index for driver + time queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_time 
  ON driver_locations(driver_profile_id, updated_at DESC);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on location_tracking
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view location history
CREATE POLICY "Location tracking viewable" 
  ON location_tracking FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy: Only drivers can insert their own location history
CREATE POLICY "Drivers insert own location history" 
  ON location_tracking FOR INSERT 
  TO authenticated 
  WITH CHECK (
    driver_profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TRIGGER TO AUTO-POPULATE HISTORY
-- ============================================

-- Function to insert into history on every update
CREATE OR REPLACE FUNCTION insert_location_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into history table
  INSERT INTO location_tracking (
    driver_profile_id,
    latitude,
    longitude,
    accuracy,
    heading,
    speed,
    altitude,
    source,
    created_at
  ) VALUES (
    NEW.driver_profile_id,
    NEW.latitude,
    NEW.longitude,
    NEW.accuracy,
    NEW.heading,
    NEW.speed,
    NEW.altitude,
    'gps',
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on driver_locations updates
DROP TRIGGER IF EXISTS trigger_insert_location_history ON driver_locations;
CREATE TRIGGER trigger_insert_location_history
  AFTER INSERT OR UPDATE ON driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION insert_location_history();

-- ============================================
-- 6. CLEANUP OLD HISTORY (OPTIONAL)
-- ============================================

-- Function to cleanup old location history (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_location_history()
RETURNS void AS $$
BEGIN
  DELETE FROM location_tracking
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION cleanup_old_location_history() IS 'Cleanup location history older than 7 days (run via cron)';

-- ============================================
-- 7. VALIDATION QUERIES
-- ============================================

-- Verify columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'driver_locations' 
    AND column_name = 'accuracy'
  ) THEN
    RAISE EXCEPTION 'Column accuracy not found in driver_locations';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'location_tracking'
  ) THEN
    RAISE EXCEPTION 'Table location_tracking not found';
  END IF;
  
  RAISE NOTICE 'Migration validated successfully';
END $$;
