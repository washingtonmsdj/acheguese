# Messaging UI

`src/modules/messaging` is the horizontal UI owner for private Inbox/Chat.

Status: **paused / not MVP-certified**.

Rules:

- the global Inbox does not belong to Community, Business, Classifieds, Mobility,
  or Territorial Communication;
- domain-specific persistence remains owned by the appropriate messaging
  aggregate under `src/core/messaging` (or another domain owner when the
  semantics are intentionally different, such as ride chat);
- the future global Inbox composes provider/adapters from enabled domains;
- enabling Messaging must not implicitly enable Community or Classifieds;
- no universal database table or monolithic `MessagingService` is required;
- while the provider-based Inbox UI is not implemented and certified,
  `/mensagens` and `/chat/*` remain fail-closed through the `messaging`
  lifecycle surface.
