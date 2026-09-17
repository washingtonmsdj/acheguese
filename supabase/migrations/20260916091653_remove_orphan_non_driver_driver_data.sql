-- Repair historical integrity drift: driver_data may only extend driver profiles.
-- Delete only non-driver rows with no operational references.

DELETE FROM public.driver_data AS dd
WHERE EXISTS (
  SELECT 1
  FROM public.profiles AS p
  WHERE p.id = dd.profile_id
    AND p.profile_type <> 'driver'
)
AND NOT EXISTS (
  SELECT 1 FROM public.ride_requests AS r
  WHERE r.driver_profile_id = dd.profile_id
)
AND NOT EXISTS (
  SELECT 1 FROM public.driver_availability AS a
  WHERE a.profile_id = dd.profile_id
)
AND NOT EXISTS (
  SELECT 1 FROM public.driver_locations AS l
  WHERE l.driver_profile_id = dd.profile_id
)
AND NOT EXISTS (
  SELECT 1 FROM public.ride_offers AS o
  WHERE o.driver_profile_id = dd.profile_id
);
