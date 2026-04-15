-- Migration: Add price_type to professional_data
-- Description: Allows professionals to specify pricing model (hourly, fixed, negotiable, etc.)

-- Add price_type column to professional_data
ALTER TABLE professional_data 
ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'negotiable'
CHECK (price_type IN ('hourly', 'fixed', 'negotiable', 'free', 'package', 'consultation'));

-- Add comment explaining the price types
COMMENT ON COLUMN professional_data.price_type IS 
'Type of pricing model:
- hourly: Charged by hour (use hourly_rate)
- fixed: Fixed price per service (use price_range)
- negotiable: Price to be negotiated (A combinar)
- free: Free service
- package: Package/bundle pricing (use price_range)
- consultation: Requires consultation (Sob consulta)';

-- Update existing records to have appropriate price_type
UPDATE professional_data
SET price_type = CASE
  WHEN hourly_rate IS NOT NULL AND hourly_rate > 0 THEN 'hourly'
  WHEN price_range IS NOT NULL AND price_range != '' THEN 'fixed'
  ELSE 'negotiable'
END
WHERE price_type IS NULL OR price_type = 'negotiable';

-- Create helper function to format price display
CREATE OR REPLACE FUNCTION format_professional_price(
  p_price_type TEXT,
  p_hourly_rate DECIMAL,
  p_price_range TEXT
) RETURNS TEXT AS $$
BEGIN
  CASE p_price_type
    WHEN 'hourly' THEN
      IF p_hourly_rate IS NOT NULL THEN
        RETURN 'R$ ' || p_hourly_rate::TEXT || '/h';
      ELSE
        RETURN 'A combinar';
      END IF;
    WHEN 'fixed' THEN
      RETURN COALESCE(p_price_range, 'A combinar');
    WHEN 'negotiable' THEN
      RETURN 'A combinar';
    WHEN 'free' THEN
      RETURN 'Gratuito';
    WHEN 'package' THEN
      RETURN COALESCE(p_price_range, 'Pacotes disponíveis');
    WHEN 'consultation' THEN
      RETURN 'Sob consulta';
    ELSE
      RETURN 'A combinar';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment
COMMENT ON FUNCTION format_professional_price IS 'Formats professional pricing for display based on price_type';

-- Update some existing professionals to have varied price types (for testing)
UPDATE professional_data
SET 
  price_type = 'negotiable',
  price_range = NULL
WHERE hourly_rate IS NULL AND (price_range IS NULL OR price_range = '');

-- Add index for price_type queries
CREATE INDEX IF NOT EXISTS idx_professional_data_price_type ON professional_data(price_type);
