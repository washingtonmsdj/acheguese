/**
 * User Export Data - Edge Function
 *
 * LGPD Art. 18 subject-data export built from the canonical export matrix.
 * This implementation is intentionally NOT certified for production rollout
 * until every matrix section has integration coverage and the rollout marker
 * is explicitly promoted to true in a separately reviewed change.
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

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;
// deno-lint-ignore no-explicit-any
type QueryLike = PromiseLike<{ data: any; error: any }>;

type JsonRecord = Record<string, unknown>;

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function safeArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonRecord =>
        typeof entry === "object" && entry !== null
      )
    : [];
}

async function requireRows(section: string, query: QueryLike): Promise<JsonRecord[]> {
  const { data, error } = await query;
  if (error) {
    console.error("[user-export-data] required section failed", {
      section,
      code: typeof error?.code === "string" ? error.code : "unknown",
    });
    throw new Error(`EXPORT_SECTION_FAILED:${section}`);
  }
  return safeArray(data);
}

async function requireProfileRows(
  section: string,
  supabaseAdmin: SupabaseClient,
  table: string,
  columns: string,
  column: string,
  profileIds: string[],
): Promise<JsonRecord[]> {
  if (profileIds.length === 0) return [];
  return requireRows(
    section,
    supabaseAdmin.from(table).select(columns).in(column, profileIds),
  );
}

function pickStringArray(values: unknown[]): string[] {
  return values.filter((value): value is string =>
    typeof value === "string" && value.length > 0
  );
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
    ].filter(Boolean);

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
    ].filter(Boolean);

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
      source_id: row.source_id,
      source_reference: row.source_reference,
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

  const profiles = await requireRows(
    "profiles",
    supabaseAdmin
      .from("profiles")
      .select(
        "id,profile_type,name,display_name,username,bio,avatar_url,neighborhood,city,location_id,phone,whatsapp,is_active,verified_at,is_suspended,suspended,suspended_at,suspension_reason,suspended_until,reputation,pontos,street,created_at,updated_at,verified,handle,show_contact_email,show_phone,show_linked_profiles,show_business_links,show_professional_links,is_public,contact_email,website,location,state,country,reputation_score,trust_score,slug,public_location_visibility,short_bio,main_territory_location_id,community_reputation_score",
      )
      .eq("user_id", userId),
  );
  const profileIds = pickStringArray(profiles.map((row) => row.id));
  const profileIdSet = new Set(profileIds);

  const profileMembers = await requireRows(
    "profile_memberships",
    supabaseAdmin
      .from("profile_members")
      .select("profile_id,role,joined_at,is_active")
      .eq("user_id", userId),
  );
  const activeProfiles = await requireRows(
    "active_profile_selection",
    supabaseAdmin
      .from("user_active_profiles")
      .select("profile_id,created_at,updated_at")
      .eq("user_id", userId),
  );
  const roles = await requireRows(
    "roles",
    supabaseAdmin
      .from("user_roles")
      .select("role_enum,is_active,granted_at,expires_at,revoked_at,reason,created_at,updated_at")
      .eq("user_id", userId),
  );
  const residences = await requireRows(
    "residences",
    supabaseAdmin
      .from("user_residences")
      .select("id,country,is_primary,is_verified,verification_requested_at,created_at,updated_at,address_id,location_id")
      .eq("user_id", userId),
  );
  const addressIds = pickStringArray(residences.map((row) => row.address_id));
  const addresses = addressIds.length === 0
    ? []
    : await requireRows(
      "addresses",
      supabaseAdmin
        .from("addresses")
        .select("id,location_id,postal_code,street,number,complement,address_type,latitude,longitude,geocoded_at,geocoding_source,geocoding_confidence,is_verified,verified_at,created_at,updated_at,precision,verification_status,verified_reason,owner_user_id")
        .in("id", addressIds),
    );

  const consents = await requireRows(
    "consents",
    supabaseAdmin
      .from("user_consents")
      .select("id,consent_type,granted,granted_at,revoked_at,revoke_reason,terms_version,privacy_policy_version,created_at,updated_at")
      .eq("user_id", userId),
  );
  const notificationPreferences = await requireRows(
    "notification_preferences",
    supabaseAdmin
      .from("notification_preferences")
      .select("email_enabled,push_enabled,inapp_enabled,transactional_enabled,social_enabled,system_enabled,marketing_enabled,frequency,quiet_hours_start,quiet_hours_end,quiet_hours_days,created_at,updated_at")
      .eq("user_id", userId),
  );
  const mfaStatus = await requireRows(
    "mfa_status",
    supabaseAdmin
      .from("user_mfa_status")
      .select("mfa_enabled,mfa_method,enrolled_at,last_verified_at,backup_codes_generated,backup_codes_count,grace_period_expires_at,is_exempt,exemption_reason,exemption_granted_at,created_at,updated_at")
      .eq("user_id", userId),
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
  const professionalData = await requireProfileRows(
    "professional_profiles",
    supabaseAdmin,
    "professional_data",
    "id,profile_id,professional_name,service_category,service_subcategory,description,certifications,experience_years,education,price_range,service_areas,service_radius_km,available_hours,is_accepting_clients,is_verified,verified_at,rating,location_id,created_at,updated_at,profession,specialties,years_experience,services_offered,service_area,hourly_rate,accepts_remote,address_id,slug,price_type,visibility,availability_notes,portfolio_items,owner_user_id",
    "profile_id",
    profileIds,
  );
  const driverData = await requireProfileRows(
    "driver_profiles",
    supabaseAdmin,
    "driver_data",
    "id,profile_id,is_online,is_verified,subscription_active,vehicle,rating,total_rides,total_rides_completed,total_rides_cancelled,acceptance_rate,cancellation_rate,created_at,updated_at,license_category,license_expiry,license_state,vehicle_type,vehicle_model,vehicle_year,vehicle_color,is_available,documents_verified,documents_verified_at,background_check_status,background_check_date,can_do_delivery,can_do_rides",
    "profile_id",
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
  const classifieds = await requireProfileRows(
    "classifieds",
    supabaseAdmin,
    "classifieds",
    "id,seller_id,title,description,price,category,condition,photos,location_id,status,created_at,updated_at,is_active,slug,public_id,category_id,subcategory_id,reach,is_featured,profile_id",
    "profile_id",
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

  const ridesRaw = profileIds.length === 0
    ? []
    : await requireRows(
      "mobility",
      supabaseAdmin
        .from("ride_requests")
        .select("id,passenger_profile_id,driver_profile_id,route_id,status,suggested_price,final_price,available_seats,created_at,updated_at,pickup_location_id,dropoff_location_id,origin,destination,departure_time,payment_method,observation,ride_mode,source_type,pickup_confirmed_at,delivered_at,started_at,completed_at,cancelled_at")
        .or(
          `passenger_profile_id.in.(${profileIds.join(",")}),driver_profile_id.in.(${profileIds.join(",")})`,
        ),
    );
  const ordersRaw = profileIds.length === 0
    ? []
    : await requireRows(
      "orders",
      supabaseAdmin
        .from("orders")
        .select("id,customer_profile_id,merchant_profile_id,courier_profile_id,payment_mode,delivery_mode,logistics_status,financial_status,items_total,delivery_fee,discount_total,order_total,platform_fee_amount,merchant_net_amount,courier_amount,currency,payment_method,notes,failure_reason,cancellation_reason,paid_at,refunded_at,accepted_at,preparing_at,ready_for_pickup_at,picked_up_at,delivered_at,canceled_at,failed_at,created_at,updated_at,source_type,source_id,source_reference")
        .or(
          `customer_profile_id.in.(${profileIds.join(",")}),merchant_profile_id.in.(${profileIds.join(",")}),courier_profile_id.in.(${profileIds.join(",")})`,
        ),
    );

  const subscriptions = await requireRows(
    "subscriptions",
    supabaseAdmin
      .from("user_subscriptions")
      .select("id,plan_type,status,active,amount_cents,started_at,expires_at,created_at,updated_at,plan_code,canceled_at,trial_start,entity_family,vertical,subscription_scope,business_id,status_v2,price_cents,billing_period,trial_ends_at,current_period_start,current_period_end,cancel_at_period_end")
      .eq("user_id", userId),
  );
  const billingTransactions = await requireRows(
    "billing_transactions",
    supabaseAdmin
      .from("billing_transactions")
      .select("id,business_id,subscription_id,transaction_type,amount_cents,currency,status,created_at")
      .eq("user_id", userId),
  );
  const notifications = await requireRows(
    "notifications",
    supabaseAdmin
      .from("notifications")
      .select("id,type,title,message,is_read,created_at,priority,read,deleted_at,updated_at,category,action_url,action_label,read_at")
      .eq("user_id", userId),
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
  ]);

  const aiImageGenerations = await requireRows(
    "ai_image_generations",
    supabaseAdmin
      .from("ai_image_generations")
      .select("id,feature,mode,prompt,negative_prompt,model,reference_urls,generated_urls,selected_url,status,error_message,created_at,updated_at")
      .eq("user_id", userId),
  );
  const tryonGenerations = await requireRows(
    "tryon_generations",
    supabaseAdmin
      .from("tryon_generations")
      .select("id,product_image_url,category,target_gender,style,status,provider,generated_urls,selected_url,error_message,created_at,updated_at")
      .eq("user_id", userId),
  );
  const aiUsage = await requireRows(
    "ai_usage",
    supabaseAdmin
      .from("ai_usage_log")
      .select("id,feature,capability,model,status,tokens_in,tokens_out,latency_ms,error_code,error_message,created_at")
      .eq("user_id", userId),
  );
  const aiModeration = await requireRows(
    "ai_moderation",
    supabaseAdmin
      .from("ai_moderation_log")
      .select("id,feature,input_type,blocked,reason,severity,created_at")
      .eq("user_id", userId),
  );

  const analyticsEvents = await requireRows(
    "analytics_events",
    supabaseAdmin
      .from("analytics_events")
      .select("id,entity_type,entity_id,event_type,event_source,session_id,user_agent,referrer,latitude,longitude,city,state,country,created_at,event")
      .eq("user_id", userId)
      .limit(1000),
  );
  const analyticsSessions = await requireRows(
    "analytics_sessions",
    supabaseAdmin
      .from("analytics_sessions")
      .select("id,session_id,user_agent,first_seen_at,last_seen_at")
      .eq("user_id", userId)
      .limit(1000),
  );
  const piiAccess = await requireRows(
    "pii_access_summary",
    supabaseAdmin
      .from("pii_access_log")
      .select("table_name,field_name,operation,access_reason,access_reason_category,accessed_at,source,retention_until")
      .eq("subject_user_id", userId),
  );

  const mediaByUser = await requireRows(
    "media_assets_by_user",
    supabaseAdmin
      .from("media_assets")
      .select("id,preset,mime_type,byte_size,width,height,state,attached_at,deleted_at,created_at,updated_at")
      .eq("owner_user_id", userId),
  );
  const mediaByProfile = await requireProfileRows(
    "media_assets_by_profile",
    supabaseAdmin,
    "media_assets",
    "id,preset,mime_type,byte_size,width,height,state,attached_at,deleted_at,created_at,updated_at",
    "owner_profile_id",
    profileIds,
  );
  const mediaById = new Map<string, JsonRecord>();
  for (const row of [...mediaByUser, ...mediaByProfile]) {
    if (typeof row.id === "string") mediaById.set(row.id, row);
  }

  const verification = await requireProfileRows(
    "verification",
    supabaseAdmin,
    "verification",
    "verification_type,submitted_at,reviewed_at,status,review_reason,created_at,updated_at,profile_id",
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
  );
  const pushDevices = await requireRows(
    "push_devices",
    supabaseAdmin
      .from("push_subscriptions")
      .select("device_name,user_agent,is_active,created_at,last_used_at")
      .eq("user_id", userId),
  );

  const sections: JsonRecord = {
    account: mapAuthUser(authData.user as unknown as Record<string, unknown>),
    profiles,
    profile_memberships: profileMembers,
    active_profile_selection: activeProfiles,
    roles,
    residences: { residences, addresses },
    privacy_preferences: {
      consents,
      notification_preferences: notificationPreferences,
      mfa_status: mfaStatus,
    },
    business_profiles: { businesses, business_data: businessData },
    professional_profiles: professionalData,
    driver_profiles: driverData,
    authored_content: {
      posts,
      comments,
      community_posts: communityPosts,
      community_questions: communityQuestions,
      question_answers: questionAnswers,
      classifieds,
      events,
      vagas,
    },
    messages_sent: {
      marketplace_messages: messages,
      direct_messages: directMessages,
      group_messages: groupMessages,
    },
    mobility: sanitizeRides(ridesRaw, profileIdSet),
    orders: sanitizeOrders(ordersRaw, profileIdSet),
    billing: { subscriptions, transactions: billingTransactions },
    notifications,
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
    media_assets: [...mediaById.values()],
    verification,
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
    "emergency-contact names, phones and emails",
    "push endpoint/p256dh/auth credentials",
    "legacy public.user_sessions tracker",
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
