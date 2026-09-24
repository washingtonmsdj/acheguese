import { businessDirectMessagingService } from "./BusinessDirectMessagingService";
import { messagingRoutes } from "../routes/messagingRoutes";

export interface OpenBusinessDirectConversationInput {
  profileId: string;
  businessId: string;
}

export async function openBusinessDirectConversation(
  input: OpenBusinessDirectConversationInput,
  createOrGetThread: (
    input: OpenBusinessDirectConversationInput,
  ) => Promise<string> = (value) =>
    businessDirectMessagingService.createOrGetThread(value),
): Promise<string> {
  const threadId = await createOrGetThread(input);
  return messagingRoutes.thread("business", threadId);
}
