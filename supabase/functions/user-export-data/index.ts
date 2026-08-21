/**
 * User Export Data - Edge Function
 *
 * LGPD Art. 18 subject-data export built from the canonical export matrix.
 * Rollout stays blocked until CI/typecheck/integration/smoke validation is
 * complete and the certification marker is promoted in a separate review.
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
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const FORMAT_VERSION = "2.0-draft";
const MATRIX_VERSION = "lgpd-export-matrix/v1";
const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;
const PAGE_SIZE = 500;
const MAX_ROWS_PER_SECTION = 50_000;

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;
// deno-lint-ignore no-explicit-any
type QueryBuilder = any;
type JsonRecord = Record<string, unknown>;
type PageResult = { data: unknown; error: { code?: string } | null };
type PageFactory = (from: number, to: number) => PromiseLike<PageResult>;
type FilterFactory = (query: QueryBuilder) => QueryBuilder;

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function safeArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonRecord =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry)
      )
    : [];
}

function pickStringArray(values: unknown[]): string[] {
  return values.filter((value): value is string =>
    typeof value === "string" && value.length > 0
  );
}

function dedupeRows(rows: JsonRecord[]): JsonRecord[] {
  const seen = new Set<string>();
  const result: JsonRecord[] = [];

  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id : null;
    const key = id ? `id:${id}` : JSON.stringify(row);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(row);
  }

  return result;
}

async function requireAllRows(
  section: string,
  pageFactory: PageFactory,
): Promise<JsonRecord[]> {
  const rows: JsonRecord[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await pageFactory(from, to);
    if (error) {
      console.error("[user-export-data] required section failed", {
        section,
        code: typeof error.code === "string" ? error.code : "unknown",
      });
      throw new Error(`EXPORT_SECTION_FAILED:${section}`);
    }

    const page = safeArray(data);
    rows.push(...page);
    if (rows.length > MAX_ROWS_PER_SECTION) {
      throw new Error(`EXPORT_SECTION_TOO_LARGE:${section}`);
    }
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function requireTableRows(
  section: string,
  supabaseAdmin: SupabaseClient,
  table: string,
  columns: string,
  filter: FilterFactory,
  orderColumn = "id",
): Promise<JsonRecord[]> {
  return requireAllRows(section, (from, to) => {
    let query = supabaseAdmin.from(table).select(columns);
    query = filter(query);
    if (orderColumn) {
      query = query.order(orderColumn, { ascending: true });
    }
    return query.range(from, to);
  });
}

async function requireUserRows(
  section: string,
  supabaseAdmin: SupabaseClient,
  table: string,
  columns: string,
  userId: string,
  userColumn = "user_id",
  orderColumn = "id",
): Promise<JsonRecord[]> {
  return requireTableRows(
    section,
    supabaseAdmin,
    table,
    columns,
    (query) => query.eq(userColumn, userId),
    orderColumn,
  );
}

async function requireProfileRows(
  section: string,
  supabaseAdmin: SupabaseClient,
  table: string,
  columns: string,
  profileColumn: string,
  profileIds: string[],
  orderColumn = "id",
): Promise<JsonRecord[]> {
  if (profileIds.length === 0) return [];
  return requireTableRows(
    section,
    supabaseAdmin,
    table,
    columns,
    (query) => query.in(profileColumn, profileIds),
    orderColumn,
  );
}

async function requireRowsByAnyProfileColumn(
  section: string,
  supabaseAdmin: SupabaseClient,
  table: string,
  columns: string,
  profileColumns: string[],
  profileIds: string[],
): Promise<JsonRecord[]> {
  if (profileIds.length === 0) return [];
  const parts = await Promise.all(
    profileColumns.map((column) =>
      requireProfileRows(
        `${section}:${column}`,
        supabaseAdmin,
        table,
        columns,
        column,
        profileIds,
      )
    ),
  );
  return dedupeRows(parts.flat());
}

function redactUserMetadata(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const blockedKey = /(token|secret|password|credential|authorization|api[_-]?key|refresh)/i;
  const result: JsonRecord = {};
  for (const [key, entry] of Object.entries(value as JsonRecord)) {
    if (blockedKey.test(key)) continue;
    if (
      entry === null ||
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      result[key] = entry;
    }
  }
  return result;
}

function mapAuthUser(user: Record<string, unknown>): JsonRecord {
  const identities = Array.isArray(user.identities)
    ? user.identities.map((identity) => {
        const row = identity as Record<string, unknown>;
        return {
          provider: row.provider ?? null,
          created_at: row.created_at ?? null,
          updated_at: row.updated_at ?? null,
          last_sign_in_at: row.last_sign_in_at ?? null,
        };
      })
    : [];

  const factors = Array.isArray(user.factors)
    ? user.factors.map((factor) => {
        const row = factor as Record<string, unknown>;
        return {
          status: row.status ?? null,
          friendly_name: row.friendly_name ?? null,
          factor_type: row.factor_type ?? null,
          created_at: row.created_at ?? null,
          updated_at: row.updated_at ?? null,
        };
      })
    : [];

  return {
    id: user.id ?? null,
    email: user.email ?? null,
    phone: user.phone ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    phone_confirmed_at: user.phone_confirmed_at ?? null,
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    user_metadata: redactUserMetadata(user.user_metadata),
    identities,
    factors,
  };
}

function sanitizeRides(rows: JsonRecord[], profileIds: Set<string>): JsonRecord[] {
  return rows.map((row) => {
    const passenger = typeof row.passenger_profile_id === "string"
      ? row.passenger_profile_id
      : null;
    const driver = typeof row.driver_profile_id === "string"
      ? row.driver_profile_id
      : null;
    const subjectRoles = [
      passenger && profileIds.has(passenger) ? "passenger" : null,
      driver && profileIds.has(driver) ? "driver" : null,
    ].filter((value): value is string => Boolean(value));

    return {
      id: row.id,
      subject_roles: subjectRoles,
      route_id: row.route_id,
      status: row.status,
      suggested_price: row.suggested_price,
      final_price: row.final_price,
      available_seats: row.available_seats,
      created_at: row.created_at,
      updated_at: row.updated_at,
      pickup_location_id: row.pickup_location_id,
      dropoff_location_id: row.dropoff_location_id,
      origin: row.origin,
      destination: row.destination,
      departure_time: row.departure_time,
      payment_method: row.payment_method,
      observation: row.observation,
      ride_mode: row.ride_mode,
      source_type: row.source_type,
      pickup_confirmed_at: row.pickup_confirmed_at,
      delivered_at: row.delivered_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
      cancelled_at: row.cancelled_at,
    };
  });
}

function sanitizeOrders(rows: JsonRecord[], profileIds: Set<string>): JsonRecord[] {
  return rows.map((row) => {
    const customer = typeof row.customer_profile_id === "string"
      ? row.customer_profile_id
      : null;
    const merchant = typeof row.merchant_profile_id === "string"
      ? row.merchant_profile_id
      : null;
    const courier = typeof row.courier_profile_id === "string"
      ? row.courier_profile_id
      : null;
    const subjectRoles = [
      customer && profileIds.has(customer) ? "customer" : null,
      merchant && profileIds.has(merchant) ? "merchant" : null,
      courier && profileIds.has(courier) ? "courier" : null,
    ].filter((value): value is string => Boolean(value));

    return {
      id: row.id,
      subject_roles: subjectRoles,
      payment_mode: row.payment_mode,
      delivery_mode: row.delivery_mode,
      logistics_status: row.logistics_status,
      financial_status: row.financial_status,
      items_total: row.items_total,
      delivery_fee: row.delivery_fee,
      discount_total: row.discount_total,
      order_total: row.order_total,
      platform_fee_amount: row.platform_fee_amount,
      merchant_net_amount: row.merchant_net_amount,
      courier_amount: row.courier_amount,
      currency: row.currency,
      payment_method: row.payment_method,
      notes: row.notes,
      failure_reason: row.failure_reason,
      cancellation_reason: row.cancellation_reason,
      paid_at: row.paid_at,
      refunded_at: row.refunded_at,
      accepted_at: row.accepted_at,
      preparing_at: row.preparing_at,
      ready_for_pickup_at: row.ready_for_pickup_at,
      picked_up_at: row.picked_up_at,
      delivered_at: row.delivered_at,
      canceled_at: row.canceled_at,
      failed_at: row.failed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      source_type: row.source_type,
    };
  });
}

function sanitizeReports(rows: JsonRecord[]): JsonRecord[] {
  return rows.map((row) => ({
    id: row.id,
    target_type: row.target_type,
    target_id: row.target_id,
    review_id: row.review_id,
    ride_id: row.ride_id,
    vaga_id: row.vaga_id,
    group_id: row.group_id,
    message_id: row.message_id,
    reason: row.reason,
    report_type: row.report_type,
    severity: row.severity,
    title: row.title,
    description: row.description ?? row.details,
    evidence_urls: row.evidence_urls,
    status: row.status,
    reported_at: row.reported_at,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function collectExport(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<{ payload: JsonRecord; sectionCount: number }> {
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (authError || !authData?.user) {
    throw new Error("EXPORT_AUTH_USER_UNAVAILABLE");
  }

  const profiles = await requireUserRows(
    "profiles",
    supabaseAdmin,
    "profiles",
    "id,profile_type,name,display_name,username,bio,avatar_url,neighborhood,city,location_id,phone,whatsapp,is_active,verified_at,is_suspended,suspended,suspended_at,suspension_reason,suspended_until,reputation,pontos,street,created_at,updated_at,verified,handle,show_contact_email,show_phone,show_linked_profiles,show_business_links,show_professional_links,is_public,contact_email,website,location,state,country,reputation_score,trust_score,slug,public_location_visibility,short_bio,main_territory_location_id,community_reputation_score",
    userId,
  );
  const profileIds = pickStringArray(profiles.map((row) => row.id));
  const profileIdSet = new Set(profileIds);

  const personalSocialProfiles = await requireUserRows(
    "personal_social_profiles",
    supabaseAdmin,
    "personal_social_profiles",
    "profile_id,name,display_name,username,avatar_url,short_bio,bio,main_territory_location_id,community_reputation_score,groups_count,created_at,updated_at",
    userId,
    "user_id",
    "profile_id",
  );
  const profileMembers = await requireUserRows(
    "profile_memberships",
    supabaseAdmin,
    "profile_members",
    "profile_id,role,joined_at,is_active",
    userId,
  );
  const activeProfiles = await requireUserRows(
    "active_profile_selection",
    supabaseAdmin,
    "user_active_profiles",
    "profile_id,created_at,updated_at",
    userId,
    "user_id",
    "profile_id",
  );
  const roles = await requireUserRows(
    "roles",
    supabaseAdmin,
    "user_roles",
    "role_enum,is_active,granted_at,expires_at,revoked_at,reason,created_at,updated_at",
    userId,
  );

  const residences = await requireUserRows(
    "residences",
    supabaseAdmin,
    "user_residences",
    "id,country,is_primary,is_verified,verification_requested_at,created_at,updated_at,address_id,location_id",
    userId,
  );
  const addressIds = pickStringArray(residences.map((row) => row.address_id));
  const addresses = addressIds.length === 0
    ? []
    : await requireTableRows(
      "addresses",
      supabaseAdmin,
      "addresses",
      "id,location_id,postal_code,street,number,complement,address_type,latitude,longitude,geocoded_at,geocoding_source,geocoding_confidence,is_verified,verified_at,created_at,updated_at,precision,verification_status,verified_reason",
      (query) => query.in("id", addressIds),
    );

  const consents = await requireUserRows(
    "consents",
    supabaseAdmin,
    "user_consents",
    "id,consent_type,granted,granted_at,revoked_at,revoke_reason,terms_version,privacy_policy_version,created_at,updated_at",
    userId,
  );
  const notificationPreferences = await requireUserRows(
    "notification_preferences",
    supabaseAdmin,
    "notification_preferences",
    "email_enabled,push_enabled,inapp_enabled,transactional_enabled,social_enabled,system_enabled,marketing_enabled,frequency,quiet_hours_start,quiet_hours_end,quiet_hours_days,created_at,updated_at",
    userId,
    "user_id",
    "created_at",
  );
  const mfaStatus = await requireUserRows(
    "mfa_status",
    supabaseAdmin,
    "user_mfa_status",
    "mfa_enabled,mfa_method,enrolled_at,last_verified_at,backup_codes_generated,backup_codes_count,grace_period_expires_at,is_exempt,exemption_reason,exemption_granted_at,created_at,updated_at",
    userId,
    "user_id",
    "created_at",
  );

  const businesses = await requireProfileRows(
    "businesses",
    supabaseAdmin,
    "businesses",
    "id,profile_id,slug,name,description,category,subcategoria,phone,whatsapp,email,website,instagram,facebook,location_id,address,neighborhood,cep,latitude,longitude,status,is_premium,is_verified,rating,total_reviews,total_products,created_at,updated_at",
    "profile_id",
    profileIds,
  );
  const businessData = await requireProfileRows(
    "business_data",
    supabaseAdmin,
    "business_data",
    "id,profile_id,business_name,description,category,subcategory,website,instagram,facebook,opening_hours,payment_methods,specialties,facilities,is_premium,is_verified,status,rating,total_reviews,total_products,slug,location_id,created_at,updated_at,legal_name,cnpj,tax_id,company_type,industry,employee_count,founded_year,business_address,business_city,business_state,business_zip,business_hours,address_id,business_role,is_headquarters,unit_name,latitude,longitude",
    "profile_id",
    profileIds,
  );
  const businessProducts = await requireProfileRows(
    "business_products",
    supabaseAdmin,
    "business_products",
    "id,profile_id,nome,descricao,preco,preco_promocional,imagem,categoria,estoque,ativo,destaque,promocao,created_at,updated_at",
    "profile_id",
    profileIds,
  );
  const businessStats = await requireProfileRows(
    "business_stats",
    supabaseAdmin,
    "business_stats",
    "id,profile_id,views_count,favorites_count,shares_count,updated_at,business_id",
    "profile_id",
    profileIds,
  );

  const professionalByProfile = await requireProfileRows(
    "professional_profiles:profile",
    supabaseAdmin,
    "professional_data",
    "id,profile_id,professional_name,service_category,service_subcategory,description,certifications,experience_years,education,price_range,service_areas,service_radius_km,available_hours,is_accepting_clients,is_verified,verified_at,rating,location_id,created_at,updated_at,profession,specialties,years_experience,services_offered,service_area,hourly_rate,accepts_remote,address_id,slug,price_type,visibility,availability_notes,portfolio_items,owner_user_id",
    "profile_id",
    profileIds,
  );
  const professionalByUser = await requireUserRows(
    "professional_profiles:owner",
    supabaseAdmin,
    "professional_data",
    "id,profile_id,professional_name,service_category,service_subcategory,description,certifications,experience_years,education,price_range,service_areas,service_radius_km,available_hours,is_accepting_clients,is_verified,verified_at,rating,location_id,created_at,updated_at,profession,specialties,years_experience,services_offered,service_area,hourly_rate,accepts_remote,address_id,slug,price_type,visibility,availability_notes,portfolio_items,owner_user_id",
    userId,
    "owner_user_id",
  );
  const professionalData = dedupeRows([...professionalByProfile, ...professionalByUser]);
  const professionalStats = await requireProfileRows(
    "professional_stats",
    supabaseAdmin,
    "professional_stats",
    "id,profile_id,views_count,contacts_count,favorites_count,shares_count,jobs_completed,response_rate,average_response_time,updated_at",
    "profile_id",
    profileIds,
  );

  const driverData = await requireProfileRows(
    "driver_data",
    supabaseAdmin,
    "driver_data",
    "id,profile_id,is_online,is_verified,subscription_active,vehicle,rating,total_rides,total_rides_completed,total_rides_cancelled,acceptance_rate,cancellation_rate,created_at,updated_at,license_number,license_category,license_expiry,license_state,vehicle_type,vehicle_plate,vehicle_model,vehicle_year,vehicle_color,is_available,documents_verified,documents_verified_at,background_check_status,background_check_date,can_do_delivery,can_do_rides",
    "profile_id",
    profileIds,
  );
  const driverProfiles = await requireProfileRows(
    "driver_profiles",
    supabaseAdmin,
    "driver_profiles",
    "id,profile_id,rating,total_rides,total_earnings,is_verified,created_at,updated_at",
    "profile_id",
    profileIds,
  );
  const driverAvailability = await requireProfileRows(
    "driver_availability",
    supabaseAdmin,
    "driver_availability",
    "profile_id,is_online,is_available,last_location_update,updated_at,last_seen_at,active_ride_id,busy_since,active_ride_mode",
    "profile_id",
    profileIds,
    "profile_id",
  );
  const driverRoutes = await requireProfileRows(
    "driver_routes",
    supabaseAdmin,
    "driver_routes",
    "id,driver_profile_id,origin,destination,waypoints,departure_time,available_seats,price_per_seat,status,recurrence,created_at,updated_at",
    "driver_profile_id",
    profileIds,
  );

  const posts = await requireProfileRows(
    "posts",
    supabaseAdmin,
    "posts",
    "id,author_profile_id,content,type,image_url,video_url,images,location_id,likes_count,comments_count,tags,confirmations_count,is_verified,is_published,created_at,updated_at,reach,content_intent,display_format,distribution_channels,content_payload,is_hidden,is_removed,removed_reason,removed_at,shares_count",
    "author_profile_id",
    profileIds,
  );
  const comments = await requireProfileRows(
    "comments",
    supabaseAdmin,
    "comments",
    "id,post_id,author_profile_id,content,parent_id,likes_count,replies_count,created_at,updated_at,is_best_answer,is_hidden,is_removed,removed_reason,removed_at",
    "author_profile_id",
    profileIds,
  );
  const communityPosts = await requireProfileRows(
    "community_posts",
    supabaseAdmin,
    "community_posts",
    "id,author_profile_id,type,content,tags,location_id,confirmations_count,is_verified,created_at,updated_at",
    "author_profile_id",
    profileIds,
  );
  const communityQuestions = await requireProfileRows(
    "community_questions",
    supabaseAdmin,
    "community_questions",
    "id,author_profile_id,type,content,tags,location_id,confirmations_count,is_verified,created_at,updated_at,title,description,category,resolved,answers_count",
    "author_profile_id",
    profileIds,
  );
  const questionAnswers = await requireProfileRows(
    "question_answers",
    supabaseAdmin,
    "question_answers",
    "id,question_id,author_profile_id,content,likes_count,is_best_answer,created_at,updated_at",
    "author_profile_id",
    profileIds,
  );
  const classifieds = await requireRowsByAnyProfileColumn(
    "classifieds",
    supabaseAdmin,
    "classifieds",
    "id,seller_id,title,description,price,category,condition,photos,location_id,status,created_at,updated_at,is_active,slug,public_id,category_id,subcategory_id,reach,is_featured,profile_id",
    ["profile_id", "seller_id"],
    profileIds,
  );
  const events = await requireProfileRows(
    "events",
    supabaseAdmin,
    "events",
    "id,organizer_profile_id,title,description,date,end_date,location,location_id,category,image_url,max_participants,current_participants,status,is_free,price,created_at,updated_at,event_date,subtitle,tags,duration_minutes,timezone,location_type,venue_name,address,neighborhood,city,state,zipcode,online_url,online_platform,location_instructions,waitlist_enabled,requirements,what_to_bring,age_restriction,dress_code,accessibility_info,published_at",
    "organizer_profile_id",
    profileIds,
  );
  const vagas = await requireProfileRows(
    "vagas",
    supabaseAdmin,
    "vagas",
    "id,titulo,empresa,descricao,location_id,contrato,modalidade,nivel,tags,salario_texto,salario_min,salario_max,beneficios,status,urgencia,destaque,created_at,updated_at,expires_at,categoria,vagas_quantidade,slug,contrato_tipo,salary_mode,application_channel,view_count,application_count,published_at,owner_profile_id",
    "owner_profile_id",
    profileIds,
  );
  const opportunitiesByUser = await requireUserRows(
    "work_opportunities:user",
    supabaseAdmin,
    "work_opportunities",
    "id,author_profile_id,opportunity_type,headline,description,professional_category,territory_location_id,reach,urgency,availability_notes,availability_start_at,availability_end_at,compensation_notes,visibility,status,is_feed_distributed,post_id,created_at,updated_at,published_at,closed_at",
    userId,
    "author_user_id",
  );
  const opportunitiesByProfile = await requireProfileRows(
    "work_opportunities:profile",
    supabaseAdmin,
    "work_opportunities",
    "id,author_profile_id,opportunity_type,headline,description,professional_category,territory_location_id,reach,urgency,availability_notes,availability_start_at,availability_end_at,compensation_notes,visibility,status,is_feed_distributed,post_id,created_at,updated_at,published_at,closed_at",
    "author_profile_id",
    profileIds,
  );
  const workOpportunities = dedupeRows([...opportunitiesByUser, ...opportunitiesByProfile]);
  const communicationPublications = await requireProfileRows(
    "communication_publications",
    supabaseAdmin,
    "communication_publications",
    "id,author_profile_id,location_id,publication_type,title,summary,body,source_url,status,trust_label,published_at,expires_at,created_at,updated_at,content_format",
    "author_profile_id",
    profileIds,
  );

  const directMessages = await requireProfileRows(
    "direct_messages_sent",
    supabaseAdmin,
    "community_direct_messages",
    "id,thread_id,sender_profile_id,body,is_removed,removed_at,removed_reason,created_at",
    "sender_profile_id",
    profileIds,
  );
  const messages = await requireProfileRows(
    "messages_sent",
    supabaseAdmin,
    "messages",
    "id,conversation_id,sender_profile_id,text,read_at,created_at",
    "sender_profile_id",
    profileIds,
  );
  const groupMessages = await requireProfileRows(
    "group_messages_sent",
    supabaseAdmin,
    "group_messages_new",
    "id,group_id,sender_profile_id,content,created_at,message_type,media_url,media_mime_type,audio_duration_seconds",
    "sender_profile_id",
    profileIds,
  );

  const communityMemberships = await requireUserRows(
    "community_memberships",
    supabaseAdmin,
    "community_memberships",
    "id,community_id,profile_id,role,status,join_method,verified_by_residence,requested_at,approved_at,joined_at,last_seen_at,created_at,updated_at",
    userId,
  );
  const groupMemberships = await requireProfileRows(
    "group_memberships",
    supabaseAdmin,
    "group_members_new",
    "id,group_id,member_profile_id,role,joined_at",
    "member_profile_id",
    profileIds,
  );
  const pollVotes = await requireUserRows(
    "community_poll_votes",
    supabaseAdmin,
    "community_poll_votes",
    "id,poll_id,option_id,created_at,profile_id",
    userId,
  );
  const issueSupports = await requireProfileRows(
    "community_issue_supports",
    supabaseAdmin,
    "community_issue_supports",
    "id,issue_id,profile_id,created_at",
    "profile_id",
    profileIds,
  );

  const profileFavorites = await requireUserRows(
    "profile_favorites",
    supabaseAdmin,
    "profile_favorites",
    "id,profile_id,created_at",
    userId,
  );
  const classifiedFavorites = await requireProfileRows(
    "classified_favorites",
    supabaseAdmin,
    "classified_favorites",
    "id,classified_id,profile_id,created_at",
    "profile_id",
    profileIds,
  );
  const professionalFavorites = await requireProfileRows(
    "professional_favorites",
    supabaseAdmin,
    "professional_favorites",
    "id,professional_id,profile_id,created_at",
    "profile_id",
    profileIds,
  );
  const eventFavorites = await requireProfileRows(
    "event_favorites",
    supabaseAdmin,
    "event_favorites",
    "id,event_id,profile_id,created_at",
    "profile_id",
    profileIds,
  );
  const touristSaved = await requireProfileRows(
    "tourist_point_saved_items",
    supabaseAdmin,
    "tourist_point_saved_items",
    "id,tourist_point_id,profile_id,created_at",
    "profile_id",
    profileIds,
  );
  const vagaSaved = await requireProfileRows(
    "vaga_saved_items",
    supabaseAdmin,
    "vaga_saved_items",
    "id,vaga_id,profile_id,created_at",
    "profile_id",
    profileIds,
  );
  const favoriteBusinesses = await requireUserRows(
    "user_favorite_businesses",
    supabaseAdmin,
    "user_favorite_businesses",
    "id,business_id,notify_on_promotions,notify_on_new_items,notes,tags,created_at,updated_at",
    userId,
  );

  const ridesRaw = await requireRowsByAnyProfileColumn(
    "mobility",
    supabaseAdmin,
    "ride_requests",
    "id,passenger_profile_id,driver_profile_id,route_id,status,suggested_price,final_price,available_seats,created_at,updated_at,pickup_location_id,dropoff_location_id,origin,destination,departure_time,payment_method,observation,ride_mode,source_type,pickup_confirmed_at,delivered_at,started_at,completed_at,cancelled_at",
    ["passenger_profile_id", "driver_profile_id"],
    profileIds,
  );
  const routeReservations = await requireProfileRows(
    "route_reservations",
    supabaseAdmin,
    "route_reservations",
    "id,route_id,passenger_profile_id,seats,status,created_at,updated_at",
    "passenger_profile_id",
    profileIds,
  );
  const ordersRaw = await requireRowsByAnyProfileColumn(
    "orders",
    supabaseAdmin,
    "orders",
    "id,customer_profile_id,merchant_profile_id,courier_profile_id,payment_mode,delivery_mode,logistics_status,financial_status,items_total,delivery_fee,discount_total,order_total,platform_fee_amount,merchant_net_amount,courier_amount,currency,payment_method,notes,failure_reason,cancellation_reason,paid_at,refunded_at,accepted_at,preparing_at,ready_for_pickup_at,picked_up_at,delivered_at,canceled_at,failed_at,created_at,updated_at,source_type",
    ["customer_profile_id", "merchant_profile_id", "courier_profile_id"],
    profileIds,
  );

  const subscriptions = await requireUserRows(
    "subscriptions",
    supabaseAdmin,
    "user_subscriptions",
    "id,plan_type,status,active,amount_cents,started_at,expires_at,created_at,updated_at,plan_code,canceled_at,trial_start,entity_family,vertical,subscription_scope,business_id,status_v2,price_cents,billing_period,trial_ends_at,current_period_start,current_period_end,cancel_at_period_end",
    userId,
  );
  const billingTransactions = await requireUserRows(
    "billing_transactions",
    supabaseAdmin,
    "billing_transactions",
    "id,business_id,subscription_id,transaction_type,amount_cents,currency,status,created_at",
    userId,
  );

  const notifications = await requireUserRows(
    "notifications",
    supabaseAdmin,
    "notifications",
    "id,type,title,message,is_read,created_at,priority,read,deleted_at,updated_at,category,action_url,action_label,read_at",
    userId,
  );
  const emailLogs = await requireUserRows(
    "email_logs",
    supabaseAdmin,
    "email_logs",
    "id,template,subject,status,created_at",
    userId,
  );

  const reportSections = await Promise.all([
    requireProfileRows(
      "community_reports_submitted",
      supabaseAdmin,
      "community_reports",
      "id,target_type,target_id,reporter_profile_id,reason,description,evidence_urls,status,reviewed_at,created_at,updated_at",
      "reporter_profile_id",
      profileIds,
    ),
    requireProfileRows(
      "direct_message_reports_submitted",
      supabaseAdmin,
      "community_direct_message_reports",
      "id,thread_id,message_id,reporter_profile_id,reason,description,status,reviewed_at,created_at,updated_at",
      "reporter_profile_id",
      profileIds,
    ),
    requireProfileRows(
      "review_reports_submitted",
      supabaseAdmin,
      "review_reports",
      "id,review_id,reporter_profile_id,reason,description,status,reviewed_at,created_at,updated_at",
      "reporter_profile_id",
      profileIds,
    ),
    requireProfileRows(
      "ride_reports_submitted",
      supabaseAdmin,
      "ride_reports",
      "id,ride_id,reporter_profile_id,reporter_type,report_type,severity,status,title,description,evidence_urls,reported_at,reviewed_at,created_at,updated_at",
      "reporter_profile_id",
      profileIds,
    ),
    requireProfileRows(
      "vaga_reports_submitted",
      supabaseAdmin,
      "vaga_reports",
      "id,vaga_id,reporter_profile_id,reason,description,status,reviewed_at,created_at,updated_at",
      "reporter_profile_id",
      profileIds,
    ),
    requireProfileRows(
      "group_message_reports_submitted",
      supabaseAdmin,
      "group_message_reports",
      "id,group_id,message_id,reporter_profile_id,reason,details,status,reviewed_at,created_at",
      "reporter_profile_id",
      profileIds,
    ),
  ]);

  const aiImageGenerations = await requireUserRows(
    "ai_image_generations",
    supabaseAdmin,
    "ai_image_generations",
    "id,feature,mode,prompt,negative_prompt,model,reference_urls,generated_urls,selected_url,status,error_message,created_at,updated_at",
    userId,
  );
  const tryonGenerations = await requireUserRows(
    "tryon_generations",
    supabaseAdmin,
    "tryon_generations",
    "id,product_image_url,category,target_gender,style,status,generated_urls,selected_url,error_message,created_at,updated_at",
    userId,
  );
  const aiUsage = await requireUserRows(
    "ai_usage",
    supabaseAdmin,
    "ai_usage_log",
    "id,feature,capability,model,status,tokens_in,tokens_out,latency_ms,error_code,created_at",
    userId,
  );
  const aiModeration = await requireUserRows(
    "ai_moderation",
    supabaseAdmin,
    "ai_moderation_log",
    "id,feature,input_type,blocked,reason,severity,created_at",
    userId,
  );

  const analyticsEvents = await requireUserRows(
    "analytics_events",
    supabaseAdmin,
    "analytics_events",
    "id,entity_type,entity_id,event_type,event_source,session_id,ip_address,user_agent,referrer,latitude,longitude,city,state,country,created_at,event",
    userId,
  );
  const analyticsSessions = await requireUserRows(
    "analytics_sessions",
    supabaseAdmin,
    "analytics_sessions",
    "id,session_id,ip_address,user_agent,first_seen_at,last_seen_at",
    userId,
  );

  const piiAccess = await requireUserRows(
    "pii_access_summary",
    supabaseAdmin,
    "pii_access_log",
    "id,table_name,field_name,operation,access_reason,access_reason_category,accessed_at,source,retention_until",
    userId,
    "subject_user_id",
    "accessed_at",
  );

  const mediaByUser = await requireUserRows(
    "media_assets:user",
    supabaseAdmin,
    "media_assets",
    "id,owner_profile_id,preset,mime_type,byte_size,width,height,state,attached_at,deleted_at,created_at,updated_at",
    userId,
    "owner_user_id",
  );
  const mediaByProfile = await requireProfileRows(
    "media_assets:profile",
    supabaseAdmin,
    "media_assets",
    "id,owner_profile_id,preset,mime_type,byte_size,width,height,state,attached_at,deleted_at,created_at,updated_at",
    "owner_profile_id",
    profileIds,
  );
  const mediaAssets = dedupeRows([...mediaByUser, ...mediaByProfile]);

  const verification = await requireProfileRows(
    "verification",
    supabaseAdmin,
    "verification",
    "verification_type,submitted_at,reviewed_at,status,review_reason,created_at,updated_at,profile_id",
    "profile_id",
    profileIds,
    "submitted_at",
  );

  const bannedUsers = await requireUserRows(
    "security:banned_users",
    supabaseAdmin,
    "banned_users",
    "id,reason,banned_at,expires_at,is_active",
    userId,
  );
  const sessionAnomalies = await requireUserRows(
    "security:session_anomalies",
    supabaseAdmin,
    "session_anomalies",
    "id,anomaly_type,severity,action_taken,auto_resolved,resolved_at,detected_at,created_at",
    userId,
  );
  const profileAudit = await requireProfileRows(
    "security:profile_audit",
    supabaseAdmin,
    "profile_audit_log",
    "id,profile_id,action,reason,performed_at",
    "profile_id",
    profileIds,
  );

  const emergencyContacts = await requireProfileRows(
    "emergency_contacts",
    supabaseAdmin,
    "emergency_contacts",
    "profile_id,relationship,is_primary,is_active,created_at,updated_at",
    "profile_id",
    profileIds,
    "created_at",
  );
  const pushDevices = await requireUserRows(
    "push_devices",
    supabaseAdmin,
    "push_subscriptions",
    "device_name,user_agent,is_active,created_at,last_used_at",
    userId,
    "user_id",
    "created_at",
  );

  const sections: JsonRecord = {
    account: mapAuthUser(authData.user as unknown as Record<string, unknown>),
    profiles: {
      profiles,
      personal_social_profiles: personalSocialProfiles,
    },
    profile_memberships: profileMembers,
    active_profile_selection: activeProfiles,
    roles,
    residences: { residences, addresses },
    privacy_preferences: {
      consents,
      notification_preferences: notificationPreferences,
      mfa_status: mfaStatus,
    },
    business_profiles: {
      businesses,
      business_data: businessData,
      products: businessProducts,
      stats: businessStats,
    },
    professional_profiles: {
      profiles: professionalData,
      stats: professionalStats,
    },
    driver_profiles: {
      data: driverData,
      profiles: driverProfiles,
      availability: driverAvailability,
      routes: driverRoutes,
    },
    authored_content: {
      posts,
      comments,
      community_posts: communityPosts,
      community_questions: communityQuestions,
      question_answers: questionAnswers,
      classifieds,
      events,
      vagas,
      work_opportunities: workOpportunities,
      communication_publications: communicationPublications,
    },
    messages_sent: {
      marketplace_messages: messages,
      direct_messages: directMessages,
      group_messages: groupMessages,
    },
    community_membership_and_actions: {
      memberships: communityMemberships,
      group_memberships: groupMemberships,
      poll_votes: pollVotes,
      issue_supports: issueSupports,
    },
    favorites_and_saved_items: {
      profiles: profileFavorites,
      classifieds: classifiedFavorites,
      professionals: professionalFavorites,
      events: eventFavorites,
      tourist_points: touristSaved,
      vagas: vagaSaved,
      businesses: favoriteBusinesses,
    },
    mobility: {
      rides: sanitizeRides(ridesRaw, profileIdSet),
      route_reservations: routeReservations.map((row) => ({
        id: row.id,
        route_id: row.route_id,
        seats: row.seats,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    },
    orders: sanitizeOrders(ordersRaw, profileIdSet),
    billing: { subscriptions, transactions: billingTransactions },
    notifications: { in_app: notifications, email: emailLogs },
    reports_submitted: sanitizeReports(reportSections.flat()),
    ai_activity: {
      image_generations: aiImageGenerations,
      tryon_generations: tryonGenerations,
      usage: aiUsage,
      moderation: aiModeration,
    },
    analytics: {
      events: analyticsEvents,
      sessions: analyticsSessions,
    },
    pii_access_summary: piiAccess,
    media_assets: mediaAssets,
    verification,
    security_state_summary: {
      bans: bannedUsers,
      session_anomalies: sessionAnomalies,
      profile_audit: profileAudit,
    },
    emergency_contacts: emergencyContacts,
    push_devices: pushDevices,
  };

  const redactions = [
    "provider/internal auth metadata and credentials",
    "third-party message bodies and conversation dumps",
    "counterparty profile identifiers in rides and orders",
    "recipient/proof-of-delivery data",
    "moderation reviewer/admin identifiers and internal notes",
    "billing provider identifiers and internal snapshots",
    "raw analytics metadata/properties",
    "storage paths, storage references and hashes",
    "live driver location precision",
    "emergency-contact names, phones and emails",
    "push endpoint/p256dh/auth credentials",
    "legacy session tracker",
    "raw application/security audit logs",
  ];

  return {
    payload: {
      export_metadata: {
        subject_user_id: userId,
        generated_at: new Date().toISOString(),
        lgpd_reference: "Art. 18, I",
        format_version: FORMAT_VERSION,
        matrix_version: MATRIX_VERSION,
        matrix_implementation_complete: LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE,
        pagination: {
          page_size: PAGE_SIZE,
          max_rows_per_section: MAX_ROWS_PER_SECTION,
          overflow_behavior: "fail-closed",
        },
        sections: Object.keys(sections),
        redactions,
      },
      data: sections,
    },
    sectionCount: Object.keys(sections).length,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 5, 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, 401, ALLOWED_METHODS, req);
  }

  const supabaseAdmin = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401, ALLOWED_METHODS, req);
  }

  const userId = authData.user.id;

  try {
    const { payload, sectionCount } = await collectExport(supabaseAdmin, userId);
    const json = JSON.stringify(payload, null, 2);
    const sizeBytes = new TextEncoder().encode(json).length;

    const { error: piiAuditError } = await supabaseAdmin.rpc("log_pii_access", {
      p_subject_user_id: userId,
      p_table_name: "subject_data_export",
      p_record_id: userId,
      p_operation: "EXPORT",
      p_reason: "LGPD Art. 18 - Direito de acesso aos dados",
      p_reason_category: "data_export",
      p_data_sample: null,
      p_source: "edge:user-export-data:v2",
    });
    if (piiAuditError) {
      throw new Error("EXPORT_AUDIT_FAILED");
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: "DATA_EXPORT_COMPLETED",
      resource: "user-export-data",
      status: "success",
      details: {
        formatVersion: FORMAT_VERSION,
        matrixVersion: MATRIX_VERSION,
        matrixComplete: LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE,
        sizeBytes,
        sectionCount,
      },
      ...getAuditInfo(req),
    });

    return new Response(json, {
      status: 200,
      headers: {
        ...responseHeaders(req),
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="meus-dados-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Export-Format-Version": FORMAT_VERSION,
        "X-Export-Matrix-Version": MATRIX_VERSION,
      },
    });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "EXPORT_FAILED";
    console.error("[user-export-data] export failed", { code });
    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: "DATA_EXPORT_FAILED",
      resource: "user-export-data",
      status: "failure",
      details: { code },
      ...getAuditInfo(req),
    });
    return jsonResponse(
      { error: "Export failed" },
      500,
      ALLOWED_METHODS,
      req,
    );
  }
});
