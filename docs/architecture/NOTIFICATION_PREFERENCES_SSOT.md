# Notification Preferences SSOT

## Owner

`src/core/notifications/services/NotificationPreferencesService.ts` is the
only browser-facing owner of `notification_preferences`.

The service derives its row and RPC argument types from
`types.generated.ts`. The removed legacy services must not be recreated:

- `UserNotificationPreferencesService` performed full-row client updates;
- `PushNotificationPreferencesService` declared columns that do not exist in
  the database and had no consumer.

## Command contract

`get_current_notification_preferences()` derives `auth.uid()` and creates the
default row when absent.

`patch_current_notification_preferences(...)` locks the current row and uses
omitted parameters as "preserve current value". The canonical service exposes:

- `patchChannels` for email, push and in-app;
- `patchTopics` for social, system and marketing;
- `patchFrequency` for delivery cadence;
- `patchQuietHours` for an explicit schedule set/clear;
- `patchAll` for the settings page's single atomic save.

No command accepts `user_id`. Direct INSERT/UPDATE/DELETE is revoked from
`authenticated`; delivery functions retain service-role read access.

## Invariants

- transactional notifications are mandatory and cannot be disabled;
- frequency is one of `immediate`, `daily`, `weekly`, `never`;
- quiet hour start and end are both present or both absent;
- quiet-hour days contain one to seven unique domain values from 1 through 7;
- one row exists per User;
- changed-field audit stores a boolean field mask, never preference values.

## Proof

- preflight: `notification-preferences-preflight-remote-audit.sql`;
- static guard: `notification-preferences-consolidation-security.test.ts`;
- remote behavior: `notification-preferences-remote-probe.sql`;
- remote catalog: `notification-preferences-remote-audit.sql`.

The behavior probe changes channels, topics, frequency, schedule and clear
operations independently, proves unrelated fields remain unchanged, checks
direct-write rejection, and rolls the transaction back.
