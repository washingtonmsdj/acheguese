# Shared Layer

**Purpose**: Reusable utilities, UI components, hooks, constants, and types with NO dependencies.

## Structure

- `components/ui/` - Generic UI components (buttons, inputs, modals, etc.)
- `hooks/` - Reusable React hooks
- `utils/` - Utility functions
- `constants/` - Application constants
- `types/` - TypeScript type definitions

## Rules

- **NO DEPENDENCIES** on `core/`, `modules/`, or `integrations/`
- Can only import from other `shared/` directories
- Must be completely independent and reusable
- Should not contain any business logic
