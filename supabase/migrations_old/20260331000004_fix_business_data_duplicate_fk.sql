-- Remove FK duplicado em business_data → locations
-- O constraint 'fk_business_data_location_id' é duplicata de 'business_data_location_id_fkey'
-- A duplicidade causava erro no PostgREST: "more than one relationship was found"
ALTER TABLE business_data DROP CONSTRAINT IF EXISTS fk_business_data_location_id;
