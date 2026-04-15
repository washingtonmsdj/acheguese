-- Migration: validate_event_coordinates_trigger
-- Trigger server-side que valida consistência de coordenadas em events.
-- Redundante com CHECK constraints, mas explícito para mensagens de erro claras.

CREATE OR REPLACE FUNCTION validate_event_coordinates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.latitude IS NULL) != (NEW.longitude IS NULL) THEN
    RAISE EXCEPTION 'latitude e longitude devem ser ambos NULL ou ambos NOT NULL';
  END IF;
  IF NEW.latitude IS NOT NULL AND NEW.coordinate_source IS NULL THEN
    RAISE EXCEPTION 'coordinate_source é obrigatório quando há coordenadas';
  END IF;
  IF NEW.latitude IS NULL AND NEW.coordinate_source IS NOT NULL THEN
    RAISE EXCEPTION 'coordinate_source deve ser NULL quando não há coordenadas';
  END IF;
  IF NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) THEN
    RAISE EXCEPTION 'latitude fora do intervalo [-90, 90]: %', NEW.latitude;
  END IF;
  IF NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) THEN
    RAISE EXCEPTION 'longitude fora do intervalo [-180, 180]: %', NEW.longitude;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_validate_event_coordinates'
      AND tgrelid = 'events'::regclass
  ) THEN
    CREATE TRIGGER trg_validate_event_coordinates
      BEFORE INSERT OR UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION validate_event_coordinates();
  END IF;
END $$;
