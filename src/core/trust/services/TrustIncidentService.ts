import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export type ClassifiedIncidentReason =
  | "spam"
  | "harassment"
  | "fraud"
  | "inappropriate_content"
  | "unsafe"
  | "other";

export type ClassifiedCommentIncidentReason =
  | "spam"
  | "offensive"
  | "fraud"
  | "harassment"
  | "other";

export interface TrustIncidentCommandResult {
  created: boolean;
  incidentId: string;
  conversationStatus?: "blocked";
}

function parseCommandResult(value: unknown): TrustIncidentCommandResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid trust incident command response");
  }

  const result = value as Record<string, unknown>;
  if (typeof result.created !== "boolean" || typeof result.incident_id !== "string") {
    throw new Error("Invalid trust incident command response");
  }

  return {
    created: result.created,
    incidentId: result.incident_id,
    conversationStatus:
      result.conversation_status === "blocked" ? "blocked" : undefined,
  };
}

class TrustIncidentServiceClass {
  async reportClassifiedComment(input: {
    classifiedId: string;
    commentId: string;
    reason: ClassifiedCommentIncidentReason;
    description?: string;
  }): Promise<TrustIncidentCommandResult> {
    const { data, error } = await supabase.rpc("report_classified_comment", {
      p_classified_id: input.classifiedId,
      p_comment_id: input.commentId,
      p_reason: input.reason,
      p_description: input.description,
    });
    if (error) {
      logger.error("[TrustIncidentService] reportClassifiedComment failed", error);
      throw error;
    }
    return parseCommandResult(data);
  }

  async reportClassifiedConversation(input: {
    conversationId: string;
    reason: ClassifiedIncidentReason;
    description?: string;
  }): Promise<TrustIncidentCommandResult> {
    const { data, error } = await supabase.rpc("report_classified_conversation", {
      p_conversation_id: input.conversationId,
      p_reason: input.reason,
      p_description: input.description,
    });
    if (error) {
      logger.error("[TrustIncidentService] reportClassifiedConversation failed", error);
      throw error;
    }
    return parseCommandResult(data);
  }

  async reportClassifiedMessage(input: {
    messageId: string;
    reason: ClassifiedIncidentReason;
    description?: string;
  }): Promise<TrustIncidentCommandResult> {
    const { data, error } = await supabase.rpc("report_classified_message", {
      p_message_id: input.messageId,
      p_reason: input.reason,
      p_description: input.description,
    });
    if (error) {
      logger.error("[TrustIncidentService] reportClassifiedMessage failed", error);
      throw error;
    }
    return parseCommandResult(data);
  }
}

export const TrustIncidentService = new TrustIncidentServiceClass();
