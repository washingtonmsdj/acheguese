import type { MessagingProviderId } from "../inboxTypes";

function cleanMessagingRouteSegment(value: string, label: string): string {
  const segment = value.trim();
  if (!segment || /[/?#]/.test(segment)) {
    throw new Error(`Invalid Messaging ${label}`);
  }
  return encodeURIComponent(segment);
}

export const messagingRoutes = {
  inbox: () => "/mensagens",
  threadPattern: () => "/mensagens/:providerId/:threadId",
  thread: (providerId: MessagingProviderId, threadId: string) =>
    `/mensagens/${cleanMessagingRouteSegment(
      providerId,
      "provider ID",
    )}/${cleanMessagingRouteSegment(threadId, "thread ID")}`,
} as const;
