# Admin Module

This module contains all administrative functionality for the platform.

## Structure

- **components/** - Admin-specific UI components
- **hooks/** - Admin-specific React hooks
- **services/** - Admin business logic and API calls
- **types/** - TypeScript type definitions
- **pages/** - Admin page components
- **schemas/** - Zod validation schemas

## Usage

Import from the module's public API:

```typescript
import { AdminComponent } from "@/modules/admin";
```

## Dependencies

- Can import from: `@/core/*`, `@/shared/*`
- Cannot import from: other `@/modules/*`, `@/integrations/*`
