/**
 * Interaction Service Types
 */

export interface Comment {
  id: string;
  post_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  content: string;
}

export class InteractionError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "InteractionError";
    this.code = code;
    this.status = status;
  }
}
