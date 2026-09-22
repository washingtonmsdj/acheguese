# Messaging UI

`src/modules/messaging` is the horizontal UI owner for private Inbox/Chat.

Status: **active in the MVP with the Business provider**.

Rules:

- the global Inbox does not belong to Community, Business, Classifieds, Mobility,
  or Territorial Communication;
- domain-specific persistence remains owned by the appropriate messaging
  aggregate under `src/core/messaging` (or another domain owner when the
  semantics are intentionally different, such as ride chat);
- the global Inbox composes provider/adapters selected by the application lifecycle;
- the MVP registers **Business** only;
- enabling Messaging does not implicitly enable Community or Classifieds;
- no universal database table or monolithic `MessagingService` is required;
- `/mensagens` and `/mensagens/:providerId/:threadId` are authenticated routes;
- new providers must be implemented in core, registered explicitly and enabled
  by the application composition root before they can appear in the Inbox.
