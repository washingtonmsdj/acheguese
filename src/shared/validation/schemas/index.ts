/**
 * Schemas de validação
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

// Post schemas
export {
  CreatePostSchema,
  UpdatePostSchema,
  GetPostsSchema,
} from "./post.schema";
export type {
  CreatePostInput,
  UpdatePostInput,
  GetPostsInput,
} from "./post.schema";

// Comment schemas
export {
  CreateCommentSchema,
  UpdateCommentSchema,
  GetCommentsSchema,
} from "./comment.schema";
export type {
  CreateCommentInput,
  UpdateCommentInput,
  GetCommentsInput,
} from "./comment.schema";

// Profile schemas
export {
  CreateProfileSchema,
  UpdateProfileSchema,
  GetProfilesSchema,
} from "./profile.schema";
export type {
  CreateProfileInput,
  UpdateProfileInput,
  GetProfilesInput,
} from "./profile.schema";

// Business schemas - REMOVED: Import directly from @/modules/business/schemas/business.schema
// Review schemas
export {
  CreateReviewSchema,
  UpdateReviewSchema,
  GetReviewsSchema,
} from "./review.schema";
export type {
  CreateReviewInput,
  UpdateReviewInput,
  GetReviewsInput,
} from "./review.schema";

// User schemas
export {
  RegisterUserSchema,
  LoginUserSchema,
  UpdatePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "./user.schema";
export type {
  RegisterUserInput,
  LoginUserInput,
  UpdatePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./user.schema";

// Lost & Found schemas
export { NovoAchadoPerdidoSchema } from "./lostfound.schema";
export type { NovoAchadoPerdidoInput } from "./lostfound.schema";

// DPO schemas
export { DPOContactSchema } from "./dpo.schema";
export type { DPOContactInput } from "./dpo.schema";
