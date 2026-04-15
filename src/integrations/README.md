# Integrations Layer

**Purpose**: External service integrations and infrastructure adapters.

## Structure

- `supabase/` - Supabase database and auth integration
- `realtime/` - Real-time communication
- `maps/` - Map services integration
- `external-notifications/` - External notification services

## Rules

- **NO DEPENDENCIES** on `core/`, `modules/`, or `app/`
- Can only import from `shared/`
- Contains only integration code and adapters
- Should abstract external APIs behind clean interfaces
