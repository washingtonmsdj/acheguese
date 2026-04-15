-- Test: Get all locations that are Salvador or children of Salvador

SELECT id, name, type, geographic_path
FROM locations
WHERE id = ANY(
  get_location_descendants(
    (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
  )
)
ORDER BY type, name;
