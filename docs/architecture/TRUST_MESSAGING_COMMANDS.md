# Trust incidents and Classified Messaging

## Scope

This document is the SSOT for the command boundary introduced by migration
`20260714119000_harden_trust_messaging_incident_commands.sql`.

It does not create a universal report table or a universal chat aggregate:

- `trust_events` remains the canonical Trust event table;
- `conversations` and `messages` remain the Classified Messaging tables;
- `classified_comments` remains owned by Classifieds;
- only command policy, identity derivation and audit protocol are shared.

## Corrected identity model

The remote-only legacy schema referenced `auth.users` from `buyer_id`,
`seller_id`, `blocked_by` and `sender_profile_id`, while runtime consumers sent
Profile IDs. The migration reproduces both tables locally, converts resolvable
legacy IDs and then enforces FKs to `profiles(id)`. It aborts instead of
silently discarding an unresolved identity.

The active profile is derived by `private.current_active_profile_id()`. The
browser never supplies buyer, seller, sender, reporter, reported profile,
Trust role or blocker identity.

## Canonical commands

Classified messaging commands owned by `ClassifiedMessagingService`:

- `create_classified_conversation(classified_id)` derives buyer and seller;
- `send_classified_message(conversation_id, text)` derives sender;
- `mark_classified_messages_read(conversation_id)` derives recipient;
- `block_classified_conversation(conversation_id, reason)` derives blocker;
- `moderate_classified_conversation(conversation_id, action, reason)` derives
  and verifies the administrator.

Incident commands owned by `TrustIncidentService`:

- `report_classified_comment` derives comment author, actor and marketplace roles;
- `report_classified_message` derives sender, actor and conversation context;
- `report_classified_conversation` derives the opposite participant and blocks
  the conversation in the same transaction.

All public RPCs have fixed `search_path`, deny `anon`, and expose only the
minimum command input. Private implementation functions are not executable by
`authenticated`.

## Enforcement and privacy

Direct INSERT/UPDATE/DELETE grants on `conversations` and `messages` are
revoked from `authenticated`. Triggers enforce command-only writes and
immutable identities/content. RLS restricts reads to active participants or
administrators.

Trust incidents require the dedicated command marker. Non-incident Trust
events use the separate server-owned boundary documented in
`TRUST_OPERATIONAL_COMMANDS.md`; there is no generic browser CRUD service.

Incident descriptions are bounded to 600 characters. Each actor is limited to
10 incidents per hour, active duplicates are idempotent, and self-reporting is
rejected. Evidence stores canonical IDs only. Message text, comment content,
profile names and free-form descriptions are not copied into evidence or the
private audit envelope.

Hard deletion was removed from the admin flow. Administrative close/block/
reopen/unblock actions preserve the conversation and audit trail.

## Verification

- `trust-messaging-incident-commands-security.test.ts` protects source contracts;
- `trust-messaging-commands-remote-audit.sql` proves catalog grants, FKs, RLS
  and triggers;
- `trust-messaging-commands-remote-probe.sql` proves actor derivation, message
  lifecycle, deduplication, atomic report/block and rejection after block in a
  transaction that is rolled back;
- the Core Platform ownership manifest controls 27 tables and 27 RPCs.

## Resolved adjacent boundaries

CP-014 is closed by `TRUST_OPERATIONAL_COMMANDS.md`. CP-015 is closed by the
dedicated Community direct-thread aggregate documented in
`COMMUNITY_DIRECT_MESSAGING_SSOT.md`; Classified buyer/seller semantics are not
reused for Community messages.
