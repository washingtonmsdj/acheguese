-- Test hierarchical business query

-- 1. Get Salvador's location_id
SELECT id, name, geographic_path 
FROM locations 
WHERE geographic_path = '/br/ba/salvador';

-- 2. Get all descendant IDs (Salvador + districts)
SELECT rpc_get_location_descendants_ids(
  (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
) as location_ids;

-- 3. Query businesses using hierarchical filter (should find Tone Cos Loja)
SELECT 
  bd.business_name,
  bd.category,
  bd.status,
  l.name as location_name,
  l.geographic_path
FROM business_data bd
LEFT JOIN locations l ON bd.location_id = l.id
WHERE bd.status = 'active'
  AND bd.location_id = ANY(
    rpc_get_location_descendants_ids(
      (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
    )
  );
