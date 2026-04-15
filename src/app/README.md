# App Layer

**Purpose**: Application infrastructure, routing, layouts, providers, and configuration.

## Structure

- `router/` - Application routing configuration
- `layouts/` - Page layouts and templates
- `providers/` - React context providers
- `config/` - Application configuration

## Rules

- Contains only application-level infrastructure
- No business logic or domain-specific code
- Can import from `shared/`, `core/`, `integrations/`, and `modules/`
- Should be the thinnest possible layer
