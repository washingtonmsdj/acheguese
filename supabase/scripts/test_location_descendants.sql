-- Test get_location_descendants function

-- 1. Get Salvador's location_id
SELECT id, name, type, geographic_path 
FROM locations 
WHERE geographic_path = '/br/ba/salvador';

-- 2. Get all descendants of Salvador (should include all districts)
SELECT get_location_descendants(
  (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
) as salvador_descendants;

-- 3. Verify: list all locations that should be included
SELECT id, name, type, geographic_path
FROM locations
WHERE id = ANY(
  get_location_descendants(
    (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
  )
)
ORDER BY type, name;

-- 4. Test with district (should only return itself)
SELECT get_location_descendants(
  (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador/nordeste-de-amaralina')
) as district_descendants;
