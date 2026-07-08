/**
 * Edge Function: community-notifications-rpc
 *
 * Authenticated broker for community notifications sent to another user.
 * Browser clients never pass a recipient user_id here; the function resolves
 * recipients from validated domain records and then calls create_notification
 * with service_role.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  auditLog,
  extractBearerToken,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = {
  postLike: true,
  postComment: true,
  commentReply: true,
  postMentions: true,
} as const;

type CommunityNotificationAction = keyof typeof ACTIONS;
type SupabaseClient = ReturnType<typeof createClient>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
}

interface ProfileRow {
  id: string;
  user_id: string | null;
  name: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  username?: string | null;
}

interface PostRow {
  id: string;
  author_profile_id: string;
  content: string | null;
  is_published: boolean | null;
  is_hidden: boolean | null;
  is_removed: boolean | null;
}

interface CommentRow {
  id: string;
  post_id: string;
  author_profile_id: string;
  content: string | null;
  parent_id: string | null;
  is_hidden: boolean | null;
  is_removed: boolean | null;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanPreview(value: unknown, maxLength = 160): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function displayName(profile: ProfileRow): string {
  return profile.display_name || profile.name || profile.username || "Alguem";
}

function ensureVisiblePost(post: PostRow | null): PostRow {
  if (!post || post.is_removed || post.is_hidden || post.is_published === false) {
    throw new RequestValidationError("Post not found");
  }
  return post;
}

function ensureVisibleComment(comment: CommentRow | null): CommentRow {
  if (!comment || comment.is_removed || comment.is_hidden) {
    throw new RequestValidationError("Comment not found");
  }
  return comment;
}

async function requireUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<UserAuthResult | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse({ error: "Missing or invalid authorization header" }, 401, ALLOWED_METHODS, req);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401, ALLOWED_METHODS, req);
  }

  return { userId: data.user.id };
}

async function getProfileById(
  supabaseAdmin: SupabaseClient,
  profileId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,user_id,name,display_name,avatar_url,username")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRow | null;
}

async function requireActorProfile(
  supabaseAdmin: SupabaseClient,
  actorProfileId: string,
  userId: string,
): Promise<ProfileRow> {
  const actor = await getProfileById(supabaseAdmin, actorProfileId);
  if (!actor || actor.user_id !== userId) {
    throw new RequestValidationError("Actor profile is not owned by authenticated user");
  }
  return actor;
}

async function getPostById(supabaseAdmin: SupabaseClient, postId: string): Promise<PostRow | null> {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select("id,author_profile_id,content,is_published,is_hidden,is_removed")
    .eq("id", postId)
    .maybeSingle();

  if (error) throw error;
  return data as PostRow | null;
}

async function getCommentById(
  supabaseAdmin: SupabaseClient,
  commentId: string,
): Promise<CommentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("comments")
    .select("id,post_id,author_profile_id,content,parent_id,is_hidden,is_removed")
    .eq("id", commentId)
    .maybeSingle();

  if (error) throw error;
  return data as CommentRow | null;
}

async function ensureRecipientUserId(
  supabaseAdmin: SupabaseClient,
  recipientProfileId: string,
): Promise<string | null> {
  const recipient = await getProfileById(supabaseAdmin, recipientProfileId);
  return recipient?.user_id ?? null;
}

async function createNotification(
  supabaseAdmin: SupabaseClient,
  userId: string,
  title: string,
  message: string,
  metadata: Record<string, unknown>,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.rpc("create_notification", {
    p_user_id: userId,
    p_type: "info",
    p_category: "social",
    p_title: title,
    p_message: message,
    p_action_url: null,
    p_action_label: null,
    p_metadata: metadata,
  });

  if (error) throw error;
  return data as string | null;
}

async function handlePostLike(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const postId = requireUuid(params.postId ?? params.post_id, "postId");
  const actorProfileId = requireUuid(params.actorProfileId ?? params.actor_profile_id, "actorProfileId");
  const actor = await requireActorProfile(supabaseAdmin, actorProfileId, userId);

  const { data: like, error: likeError } = await supabaseAdmin
    .from("post_likes_new")
    .select("id")
    .eq("post_id", postId)
    .eq("liker_profile_id", actorProfileId)
    .maybeSingle();
  if (likeError) throw likeError;
  if (!like) {
    throw new RequestValidationError("Like event not found");
  }

  const post = ensureVisiblePost(await getPostById(supabaseAdmin, postId));
  if (post.author_profile_id === actorProfileId) {
    return { notificationId: null, skipped: true, reason: "self_event" };
  }

  const recipientUserId = await ensureRecipientUserId(supabaseAdmin, post.author_profile_id);
  if (!recipientUserId) {
    return { notificationId: null, skipped: true, reason: "recipient_without_user" };
  }

  const notificationId = await createNotification(
    supabaseAdmin,
    recipientUserId,
    "Novo like no seu post",
    `${displayName(actor)} curtiu seu post`,
    {
      domain: "community",
      event: "post_like",
      post_id: postId,
      actor_profile_id: actorProfileId,
      actor_name: displayName(actor),
      actor_avatar: actor.avatar_url,
    },
  );

  return { notificationId, skipped: notificationId === null };
}

async function handlePostComment(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const postId = requireUuid(params.postId ?? params.post_id, "postId");
  const commentId = requireUuid(params.commentId ?? params.comment_id, "commentId");
  const actorProfileId = requireUuid(params.actorProfileId ?? params.actor_profile_id, "actorProfileId");
  const actor = await requireActorProfile(supabaseAdmin, actorProfileId, userId);
  const post = ensureVisiblePost(await getPostById(supabaseAdmin, postId));
  const comment = ensureVisibleComment(await getCommentById(supabaseAdmin, commentId));

  if (comment.post_id !== postId || comment.author_profile_id !== actorProfileId || comment.parent_id) {
    throw new RequestValidationError("Comment event does not match request");
  }
  if (post.author_profile_id === actorProfileId) {
    return { notificationId: null, skipped: true, reason: "self_event" };
  }

  const recipientUserId = await ensureRecipientUserId(supabaseAdmin, post.author_profile_id);
  if (!recipientUserId) {
    return { notificationId: null, skipped: true, reason: "recipient_without_user" };
  }

  const preview = cleanPreview(comment.content);
  const notificationId = await createNotification(
    supabaseAdmin,
    recipientUserId,
    "Novo comentario",
    `${displayName(actor)} comentou no seu post`,
    {
      domain: "community",
      event: "post_comment",
      post_id: postId,
      comment_id: commentId,
      actor_profile_id: actorProfileId,
      actor_name: displayName(actor),
      content_preview: preview,
    },
  );

  return { notificationId, skipped: notificationId === null };
}

async function handleCommentReply(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const postId = requireUuid(params.postId ?? params.post_id, "postId");
  const parentCommentId = requireUuid(params.parentCommentId ?? params.parent_comment_id, "parentCommentId");
  const replyCommentId = requireUuid(params.replyCommentId ?? params.reply_comment_id, "replyCommentId");
  const actorProfileId = requireUuid(params.actorProfileId ?? params.actor_profile_id, "actorProfileId");
  const actor = await requireActorProfile(supabaseAdmin, actorProfileId, userId);
  ensureVisiblePost(await getPostById(supabaseAdmin, postId));

  const parentComment = ensureVisibleComment(await getCommentById(supabaseAdmin, parentCommentId));
  const replyComment = ensureVisibleComment(await getCommentById(supabaseAdmin, replyCommentId));
  if (
    parentComment.post_id !== postId ||
    replyComment.post_id !== postId ||
    replyComment.parent_id !== parentCommentId ||
    replyComment.author_profile_id !== actorProfileId
  ) {
    throw new RequestValidationError("Reply event does not match request");
  }
  if (parentComment.author_profile_id === actorProfileId) {
    return { notificationId: null, skipped: true, reason: "self_event" };
  }

  const recipientUserId = await ensureRecipientUserId(supabaseAdmin, parentComment.author_profile_id);
  if (!recipientUserId) {
    return { notificationId: null, skipped: true, reason: "recipient_without_user" };
  }

  const notificationId = await createNotification(
    supabaseAdmin,
    recipientUserId,
    "Nova resposta no comentario",
    `${displayName(actor)} respondeu seu comentario`,
    {
      domain: "community",
      event: "comment_reply",
      post_id: postId,
      parent_comment_id: parentCommentId,
      reply_comment_id: replyCommentId,
      actor_profile_id: actorProfileId,
      actor_name: displayName(actor),
      content_preview: cleanPreview(replyComment.content),
    },
  );

  return { notificationId, skipped: notificationId === null };
}

function extractMentionUsernames(content: string | null): string[] {
  if (!content) return [];
  const seen = new Set<string>();
  const regex = /@([a-zA-Z0-9_]{3,30})/g;
  let match = regex.exec(content);
  while (match) {
    seen.add(match[1].toLowerCase());
    match = regex.exec(content);
  }
  return [...seen].slice(0, 20);
}

async function handlePostMentions(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const postId = requireUuid(params.postId ?? params.post_id, "postId");
  const actorProfileId = requireUuid(params.actorProfileId ?? params.actor_profile_id, "actorProfileId");
  const actor = await requireActorProfile(supabaseAdmin, actorProfileId, userId);
  const post = ensureVisiblePost(await getPostById(supabaseAdmin, postId));
  if (post.author_profile_id !== actorProfileId) {
    throw new RequestValidationError("Mention event does not match post author");
  }

  const usernames = extractMentionUsernames(post.content);
  if (usernames.length === 0) {
    return { notificationIds: [], skipped: true, reason: "no_mentions" };
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,user_id,name,display_name,avatar_url,username")
    .in("username", usernames);
  if (error) throw error;

  const recipients = ((data ?? []) as ProfileRow[])
    .filter((profile) => profile.id !== actorProfileId && profile.user_id);
  const notificationIds: Array<string | null> = [];

  for (const recipient of recipients) {
    notificationIds.push(
      await createNotification(
        supabaseAdmin,
        recipient.user_id!,
        "Voce foi mencionado",
        `${displayName(actor)} mencionou voce em um post`,
        {
          domain: "community",
          event: "post_mention",
          post_id: postId,
          actor_profile_id: actorProfileId,
          actor_name: displayName(actor),
          mentioned_profile_id: recipient.id,
          content_preview: cleanPreview(post.content),
        },
      ),
    );
  }

  return { notificationIds, skipped: notificationIds.length === 0 };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  userId: string,
  action: CommunityNotificationAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "postLike":
      return handlePostLike(supabaseAdmin, userId, params);
    case "postComment":
      return handlePostComment(supabaseAdmin, userId, params);
    case "commentReply":
      return handleCommentReply(supabaseAdmin, userId, params);
    case "postMentions":
      return handlePostMentions(supabaseAdmin, userId, params);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 120, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseAdmin = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const auth = await requireUser(req, supabaseAdmin);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 16_384,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as CommunityNotificationAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth.userId, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `community_notification_${safeAction}`,
      resource: "community-notifications-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[community-notifications-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `community_notification_${safeAction}`,
      resource: "community-notifications-rpc",
      status: "failure",
      details: { action: safeAction, reason: "notification_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
