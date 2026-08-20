# Legacy source namespace

`src/features` is **closed for new code**.

The canonical project structure is defined in [`src/modules/README.md`](../modules/README.md):

- product bounded contexts -> `src/modules`;
- app-level flows/landings -> `src/app/features`;
- reusable domain contracts/services -> `src/core`;
- external adapters -> `src/integrations`;
- cross-domain primitives -> `src/shared`.

## Current exception

`src/features/events` is legacy migration debt. Existing code may remain temporarily while its callers are characterized and migrated, but new product behavior must not be added here.

Migration target:

- product UI/public surface -> `src/modules/community-events`;
- reusable event domain contracts/services -> canonical event ownership in `src/core`, outside the business-vertical taxonomy.

Do not create another directory under `src/features`.
