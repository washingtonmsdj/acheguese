# Core Systems

**Purpose**: Cross-cutting concerns and foundational business logic used by multiple features.

## Structure

- `auth/` - Authentication and authorization
- `users/` - User management
- `profiles/` - User profiles
- `permissions/` - Permission and role management

## Rules

- Can import from `shared/` and `integrations/`
- Cannot import from `modules/` (feature modules import from core)
- Contains business logic used across multiple features
- Follows SSOT (Single Source of Truth) principles
