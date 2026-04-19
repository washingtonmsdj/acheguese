# Spatial Search Fix - April 19, 2026

## Problem

Console errors showing:
- `column e.slug does not exist` (Error 42703)
- `relation "tourist_points_v2" does not exist` (Error 42P01)  
- `search_entities_by_radius` RPC not found (404 errors)

## Root Cause

The spatial search RPC functions (`search_entities_by_radius`, `search_entities_by_bounds`, etc.) were defined in `migrations_old/` but never applied to the actual database. The frontend code was calling these functions, but they didn't exist.

## Solution

Created migration `20260419120000_create_spatial_search_functions.sql` that:

1. **Enables PostGIS extension** for geographic calculations
2. **Creates `search_entities_by_radius`** - Searches entities within a radius (km) from a center point
3. **Creates `search_entities_by_bounds`** - Searches entities within a bounding box (map viewport)
4. **Creates `search_entities_hybrid`** - Hybrid search combining radius with territorial prioritization
5. **Creates `calculate_distance_meters`** - Calculates distance between two points

## Supported Entity Types

All functions support these entity types:
- `business` - Businesses (with slug support)
- `event` - Events
- `alert` - Alerts
- `tourist_point` - Tourist points (with slug support)
- `classified` - Classifieds

## Function Signatures

### search_entities_by_radius
```sql
search_entities_by_radius(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_entity_type TEXT,
  p_location_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
```

Returns: `id`, `name`, `latitude`, `longitude`, `distance_meters`, `location_id`, `in_territory`, `slug`

### search_entities_by_bounds
```sql
search_entities_by_bounds(
  p_west DOUBLE PRECISION,
  p_south DOUBLE PRECISION,
  p_east DOUBLE PRECISION,
  p_north DOUBLE PRECISION,
  p_entity_type TEXT,
  p_location_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
```

Returns: `id`, `name`, `latitude`, `longitude`, `location_id`, `in_territory`, `slug`

### search_entities_hybrid
```sql
search_entities_hybrid(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION,
  p_entity_type TEXT,
  p_location_ids UUID[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
```

Returns: `id`, `name`, `latitude`, `longitude`, `distance_meters`, `location_id`, `in_territory`, `slug`

### calculate_distance_meters
```sql
calculate_distance_meters(
  p_lat1 DOUBLE PRECISION,
  p_lng1 DOUBLE PRECISION,
  p_lat2 DOUBLE PRECISION,
  p_lng2 DOUBLE PRECISION
)
```

Returns: `DOUBLE PRECISION` (distance in meters)

## Migration Applied

```bash
npx supabase db push
```

Status: ✅ Successfully applied

## Testing

After applying the migration, the map should now:
- Load entities within radius without errors
- Display businesses, events, alerts, and tourist points
- Calculate distances correctly
- Support territorial filtering

## Notes

- PostGIS extension is required and was already enabled
- Functions use `GEOGRAPHY` type for accurate distance calculations
- All coordinates use WGS84 (SRID 4326)
- Distances are in meters, radii in kilometers
