# Feature Modules

**Purpose**: Self-contained feature modules organized by business domain.

## Structure

Each module follows this internal structure:

```
modules/{feature-name}/
├── components/     # Feature-specific components
├── hooks/         # Feature-specific hooks
├── services/      # Business logic
├── types/         # Feature-specific types
├── pages/         # Feature pages
└── index.ts       # Barrel exports
```

## Rules

- Can import from `shared/`, `core/`, and `integrations/`
- **NO CROSS-MODULE IMPORTS** between feature modules
- Each module is self-contained and independent
- Follows feature-first organization principles
