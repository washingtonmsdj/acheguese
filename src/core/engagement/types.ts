export interface SavedPost {
  id: string;
  post_id: string;
  saver_profile_id: string;
  created_at: string;
}

export interface PostEngagementResult {
  success: boolean;
  error?: string;
}
