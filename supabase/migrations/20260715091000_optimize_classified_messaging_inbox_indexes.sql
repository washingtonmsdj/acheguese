-- Supporting indexes for the Classified Messaging keyset inbox read model.
-- The trailing UUID keeps pagination deterministic when timestamps tie.

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_inbox
  ON public.conversations (buyer_id, last_message_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_inbox
  ON public.conversations (seller_id, last_message_at DESC, id DESC);

COMMENT ON INDEX public.idx_conversations_buyer_inbox IS
  'Supports bounded keyset inbox pages for a Classified buyer.';

COMMENT ON INDEX public.idx_conversations_seller_inbox IS
  'Supports bounded keyset inbox pages for a Classified seller.';
