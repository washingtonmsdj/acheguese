import { invokeNullableSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";

export type CommunityNotificationAction =
  | "postLike"
  | "postComment"
  | "commentReply"
  | "postMentions";

export interface CommunityNotificationParams {
  postId?: string;
  commentId?: string;
  parentCommentId?: string;
  replyCommentId?: string;
  actorProfileId: string;
}

const FUNCTION_NAME = "community-notifications-rpc";
const SERVICE_NAME = "CommunityNotificationBrokerService";

export class CommunityNotificationBrokerService {
  static async notify(
    action: CommunityNotificationAction,
    params: CommunityNotificationParams,
  ): Promise<unknown | null> {
    return invokeNullableSupabaseBroker<unknown, CommunityNotificationAction>({
      action,
      functionName: FUNCTION_NAME,
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async notifyPostLike(postId: string, actorProfileId: string): Promise<unknown | null> {
    return this.notify("postLike", { postId, actorProfileId });
  }

  static async notifyPostComment(
    postId: string,
    commentId: string,
    actorProfileId: string,
  ): Promise<unknown | null> {
    return this.notify("postComment", { postId, commentId, actorProfileId });
  }

  static async notifyCommentReply(
    postId: string,
    parentCommentId: string,
    replyCommentId: string,
    actorProfileId: string,
  ): Promise<unknown | null> {
    return this.notify("commentReply", {
      postId,
      parentCommentId,
      replyCommentId,
      actorProfileId,
    });
  }

  static async notifyPostMentions(postId: string, actorProfileId: string): Promise<unknown | null> {
    return this.notify("postMentions", { postId, actorProfileId });
  }
}
