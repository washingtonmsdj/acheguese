/**
 * TIPOS TYPESCRIPT PARA QUERIES OTIMIZADAS
 *
 * Tipos específicos para queries Supabase otimizadas.
 * Garante type safety e autocomplete para queries.
 */

// ============================================================================
// PROFILE QUERIES
// ============================================================================

export type ProfileQuery = {
  id: string;
  name: string;
  email: string;
  neighborhood: string;
  avatar_url: string | null;
  bio: string | null;
  type: string;
  is_verified: boolean;
  created_at: string;
};

export type ProfileBasic = Pick<
  ProfileQuery,
  "id" | "name" | "avatar_url" | "neighborhood"
>;

export type ProfilePublic = Omit<ProfileQuery, "email">;

// ============================================================================
// POST QUERIES
// ============================================================================

export type PostQuery = {
  id: string;
  author_profile_id: string;
  content: string;
  type: string;
  images: string[] | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
};

export type PostWithAuthor = PostQuery & {
  author: ProfileBasic;
};

export type PostBasic = Pick<
  PostQuery,
  "id" | "content" | "type" | "created_at"
>;

// ============================================================================
// COMMENT QUERIES
// ============================================================================

export type CommentQuery = {
  id: string;
  post_id: string;
  author_profile_id: string;
  content: string;
  created_at: string;
  likes_count: number;
};

export type CommentWithAuthor = CommentQuery & {
  author: ProfileBasic;
};

// ============================================================================
// RIDE QUERIES
// ============================================================================

export type RideRequestQuery = {
  id: string;
  passenger_profile_id: string;
  driver_profile_id: string | null;
  origin: string;
  destination: string;
  status: string;
  payment_method: string;
  created_at: string;
};

export type RideRequestWithDetails = RideRequestQuery & {
  passenger: ProfileBasic;
  driver?: ProfileBasic;
};

export type RideReportQuery = {
  id: string;
  ride_id: string;
  reporter_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
};

// ============================================================================
// COMPANY QUERIES
// ============================================================================

export type CompanyQuery = {
  id: string;
  owner_profile_id: string;
  name: string;
  description: string;
  category: string;
  neighborhood: string;
  phone: string;
  logo_url: string | null;
  subscription_plan: string;
};

export type CompanyWithOwner = CompanyQuery & {
  owner: ProfileBasic;
};

export type CompanyBasic = Pick<
  CompanyQuery,
  "id" | "name" | "category" | "neighborhood" | "logo_url"
>;

// ============================================================================
// CIVIC ALERT QUERIES
// ============================================================================

export type CivicAlertQuery = {
  id: string;
  author_profile_id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  location: string;
  created_at: string;
};

export type CivicAlertWithAuthor = CivicAlertQuery & {
  author: ProfileBasic;
};

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

export type NotificationQuery = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type NotificationUnread = Pick<
  NotificationQuery,
  "id" | "type" | "title" | "message" | "created_at"
>;

// ============================================================================
// DRIVER QUERIES
// ============================================================================

export type DriverQuery = {
  id: string;
  user_id: string;
  is_verified: boolean;
  rating: number;
  total_rides: number;
  status: string;
  created_at: string;
};

export type DriverWithProfile = DriverQuery & {
  profile: ProfileBasic;
};

// ============================================================================
// PAYMENT QUERIES
// ============================================================================

export type PaymentQuery = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
  description: string | null;
  created_at: string;
};

export type PaymentWithUser = PaymentQuery & {
  user: ProfileBasic;
};

// ============================================================================
// QUERY BUILDERS (Helpers)
// ============================================================================

/**
 * Helper para construir queries tipadas
 */
export const QueryFields = {
  profiles:
    "id, name, email, neighborhood, avatar_url, bio, type, is_verified, created_at",
  profilesBasic: "id, name, avatar_url, neighborhood",
  profilesPublic:
    "id, name, neighborhood, avatar_url, bio, type, is_verified, created_at",

  posts:
    "id, author_profile_id, content, type, images, created_at, updated_at, likes_count, comments_count",
  postsBasic: "id, content, type, created_at",

  comments: "id, post_id, author_profile_id, content, created_at, likes_count",

  rideRequests:
    "id, passenger_profile_id, driver_profile_id, origin, destination, status, payment_method, created_at",
  rideReports:
    "id, ride_id, reporter_id, reason, description, status, created_at",

  companies:
    "id, owner_profile_id, name, description, category, neighborhood, phone, logo_url, subscription_plan",
  companiesBasic: "id, name, category, neighborhood, logo_url",

  civicAlerts:
    "id, author_profile_id, title, description, category, severity, status, location, created_at",

  notifications: "id, user_id, type, title, message, read, created_at",
  notificationsUnread: "id, type, title, message, created_at",

  drivers: "id, user_id, is_verified, rating, total_rides, status, created_at",

  payments: "id, user_id, amount, method, status, description, created_at",
} as const;

/**
 * Helper para queries com relacionamentos
 */
export const QueryRelations = {
  postWithAuthor: `
    ${QueryFields.posts},
    author_profile:profiles!author_profile_id (${QueryFields.profilesBasic})
  `,

  commentWithAuthor: `
    ${QueryFields.comments},
    author_profile:profiles!author_profile_id (${QueryFields.profilesBasic})
  `,

  rideWithDetails: `
    ${QueryFields.rideRequests},
    passenger:profiles!passenger_profile_id (${QueryFields.profilesBasic}),
    driver:profiles!driver_profile_id (${QueryFields.profilesBasic})
  `,

  companyWithOwner: `
    ${QueryFields.companies},
    owner:profiles!owner_profile_id (${QueryFields.profilesBasic})
  `,

  civicAlertWithAuthor: `
    ${QueryFields.civicAlerts},
    author_profile:profiles!author_profile_id (${QueryFields.profilesBasic})
  `,

  driverWithProfile: `
    ${QueryFields.drivers},
    profile:profiles!user_id (${QueryFields.profilesBasic})
  `,

  paymentWithUser: `
    ${QueryFields.payments},
    user:profiles!user_id (${QueryFields.profilesBasic})
  `,
} as const;

// ============================================================================
// EXPORTS
// ============================================================================

// Todos os tipos já estão exportados inline acima
