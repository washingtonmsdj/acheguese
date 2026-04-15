/**
 * Types para SocialInteractionsService - GATE 3 FASE 3C
 *
 * Tipos para interações sociais usando profile_id consistentemente
 */

// ============================================================================
// POST LIKES
// ============================================================================

export interface PostLike {
  id: string;
  post_id: string;
  liker_profile_id: string;
  created_at: string;
}

export interface PostLikeWithProfile extends PostLike {
  profile: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// ============================================================================
// SAVED POSTS
// ============================================================================

export interface SavedPost {
  id: string;
  post_id: string;
  saver_profile_id: string;
  created_at: string;
}

export interface SavedPostWithProfile extends SavedPost {
  profile: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// ============================================================================
// GROUP MEMBERS
// ============================================================================

export interface GroupMember {
  id: string;
  group_id: string;
  member_profile_id: string;
  role: string;
  joined_at: string;
}

export interface GroupMemberWithProfile extends GroupMember {
  profile: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// ============================================================================
// GROUP MESSAGES
// ============================================================================

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_profile_id: string;
  content: string;
  created_at: string;
}

export interface GroupMessageWithProfile extends GroupMessage {
  profile: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface CreateGroupMessageData {
  groupId: string;
  content: string;
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface SocialInteractionStats {
  likesGiven: number;
  postsSaved: number;
  groupsJoined: number;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkInteractionResult {
  likes: Set<string>;
  saved: Set<string>;
  memberships: Set<string>;
}

// ============================================================================
// SERVICE RESPONSES
// ============================================================================

export interface SocialInteractionResponse {
  success: boolean;
  error?: string;
}

export interface SocialInteractionDataResponse<
  T,
> extends SocialInteractionResponse {
  data?: T;
}
