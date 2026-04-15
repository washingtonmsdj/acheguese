-- Test RPC function for getting location descendants

-- 1. Get Salvador's descendants (should include city + all districts)
SELECT rpc_get_location_descendants_ids(
  (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
) as salvador_and_districts;

-- 2. Verify: count how many IDs returned
SELECT array_length(
  rpc_get_location_descendants_ids(
    (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador')
  ),
  1
) as total_locations;

-- 3. Test with district (should only return itself)
SELECT rpc_get_location_descendants_ids(
  (SELECT id FROM locations WHERE geographic_path = '/br/ba/salvador/nordeste-de-amaralina')
) as district_only;
