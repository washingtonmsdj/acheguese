# Bugfix Requirements Document

## Introduction

The admin metrics dashboard is crashing with a database error: "column profiles.role does not exist". This bug occurs because the code in `src/hooks/admin/useRealtimeMetrics.ts` is querying a `role` column that was removed during the AAA refactoring project (currently at 45% completion). The database schema was refactored to use `profile_type` (enum) instead of `role`, but the hook code was not updated accordingly.

This bug prevents administrators from viewing real-time driver metrics and forces the dashboard to fall back to mock data, significantly degrading the user experience and preventing proper system monitoring.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the admin dashboard loads and `useRealtimeMetrics` hook executes THEN the system attempts to query `.from('profiles').select('id, name, avatar_url, role').eq('role', 'driver')`

1.2 WHEN the Supabase query executes with the non-existent `role` column THEN the system receives a 400 Bad Request error with code "42703" and message "column profiles.role does not exist"

1.3 WHEN the database error occurs THEN the system logs a warning and falls back to mock data instead of displaying real driver information

1.4 WHEN the admin views the dashboard THEN they see simulated data instead of actual driver metrics, preventing proper system monitoring

### Expected Behavior (Correct)

2.1 WHEN the admin dashboard loads and `useRealtimeMetrics` hook executes THEN the system SHALL query `.from('profiles').select('id, name, avatar_url, profile_type').eq('profile_type', 'driver')`

2.2 WHEN the Supabase query executes with the correct `profile_type` column THEN the system SHALL successfully retrieve driver profiles without database errors

2.3 WHEN driver profiles are successfully retrieved THEN the system SHALL display actual driver data instead of falling back to mock data

2.4 WHEN the admin views the dashboard THEN they SHALL see real-time metrics for actual drivers in the system

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the hook fetches ride requests data THEN the system SHALL CONTINUE TO query the `ride_requests` table correctly

3.2 WHEN the hook calculates revenue metrics THEN the system SHALL CONTINUE TO aggregate completed rides correctly

3.3 WHEN the hook fetches rating data THEN the system SHALL CONTINUE TO query the `ride_ratings` table correctly

3.4 WHEN the hook subscribes to realtime updates THEN the system SHALL CONTINUE TO listen for changes on `profiles` and `ride_requests` tables

3.5 WHEN database queries fail for other reasons THEN the system SHALL CONTINUE TO fall back to mock data gracefully

3.6 WHEN the hook returns metrics THEN the system SHALL CONTINUE TO provide the same data structure and interface


## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type DatabaseQuery
  OUTPUT: boolean
  
  // Returns true when the query references the non-existent 'role' column
  RETURN (X.table = 'profiles') AND 
         (X.selectColumns CONTAINS 'role' OR X.filterColumn = 'role')
END FUNCTION
```

### Property Specification - Fix Checking

```pascal
// Property: Fix Checking - Correct Column Usage
FOR ALL X WHERE isBugCondition(X) DO
  result ← executeQuery'(X)
  ASSERT result.success = true AND 
         result.error IS NULL AND
         result.data IS NOT NULL
END FOR
```

Where:
- **F**: Original query using `role` column (buggy)
- **F'**: Fixed query using `profile_type` column (correct)

### Property Specification - Preservation Checking

```pascal
// Property: Preservation Checking - Other Queries Unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT executeQuery(X) = executeQuery'(X)
END FOR
```

This ensures that all other database queries in the hook (ride_requests, ride_ratings, etc.) continue to work exactly as before.

## Concrete Counterexample

**Input:** Admin dashboard loads, triggering `useRealtimeMetrics` hook

**Current Behavior (F):**
```typescript
const { data: driversData, error: driversError } = await supabase
  .from('profiles')
  .select('id, name, avatar_url, role')  // ❌ 'role' doesn't exist
  .eq('role', 'driver');                  // ❌ 'role' doesn't exist

// Result: driversError = {
//   code: "42703",
//   message: "column profiles.role does not exist"
// }
```

**Expected Behavior (F'):**
```typescript
const { data: driversData, error: driversError } = await supabase
  .from('profiles')
  .select('id, name, avatar_url, profile_type')  // ✅ 'profile_type' exists
  .eq('profile_type', 'driver');                  // ✅ 'profile_type' exists

// Result: driversData = [
//   { id: '...', name: 'Driver Name', avatar_url: '...', profile_type: 'driver' }
// ]
```

## Root Cause

The database schema was refactored in migration `20260316_refactor_user_profiles_architecture.sql` which:
1. Added `profile_type` enum column to `profiles` table
2. Removed the old `role` column (if it existed)
3. Migrated data to use the new `profile_type` enum with values: 'personal', 'driver', 'business', 'professional', 'community'

However, the application code in `src/hooks/admin/useRealtimeMetrics.ts` was not updated to reflect this schema change, causing a mismatch between the code and database structure.
