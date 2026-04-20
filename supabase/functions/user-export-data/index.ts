/**
 * User Export Data - Edge Function
 *
 * Implementa direito de acesso (Art. 18 LGPD).
 * Exporta todos os dados pessoais do usuário em formato JSON.
 *
 * @version 1.1.0
 * @lgpd Art. 18, I - Direito de acesso aos dados
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getAllSecurityHeaders,
  rateLimitMiddleware,
  isValidUUID,
  errorResponse,
  auditLog,
  getAuditInfo,
} from "../_shared/security.ts";

const corsHeaders = getAllSecurityHeaders('POST, OPTIONS');

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limit: 5 requests por hora por usuário
  const rateLimitResponse = rateLimitMiddleware(req, 5, 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Get JWT from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401);
    }

    const jwt = authHeader.replace('Bearer ', '');

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user's JWT (for validation)
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Service role client (for data export)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: userError } = await userClient.auth.getUser(jwt);
    if (userError || !user) {
      return errorResponse('Invalid token', 401);
    }

    const userId = user.id;

    // Log audit
    const auditInfo = getAuditInfo(req);
    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'DATA_EXPORT_REQUEST',
      resource: 'user_export_data',
      status: 'success',
      ...auditInfo,
    });

    // Registrar acesso a PII
    await serviceClient.rpc('log_pii_access', {
      p_subject_user_id: userId,
      p_table_name: 'all_user_data',
      p_record_id: userId,
      p_operation: 'EXPORT',
      p_reason: 'LGPD Art. 18 - Direito de acesso aos dados',
      p_reason_category: 'data_export',
      p_data_sample: null,
      p_source: 'edge:user-export-data',
    });

    // Coletar dados de todas as tabelas relacionadas ao usuário
  const userData: Record<string, unknown> = {
      export_metadata: {
        user_id: userId,
        email: user.email,
        exported_at: new Date().toISOString(),
        lgpd_reference: 'Art. 18, I',
        format_version: '1.0',
      },
    };

    // 1. Dados do auth.users (via admin API)
    const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId);
    if (!authError && authUser) {
      userData.auth_user = {
        id: authUser.user.id,
        email: authUser.user.email,
        phone: authUser.user.phone,
        email_confirmed_at: authUser.user.email_confirmed_at,
        phone_confirmed_at: authUser.user.phone_confirmed_at,
        created_at: authUser.user.created_at,
        updated_at: authUser.user.updated_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        app_metadata: authUser.user.app_metadata,
        user_metadata: authUser.user.user_metadata,
        identities: authUser.user.identities?.map(i => ({
          provider: i.provider,
          identity_data: i.identity_data,
          last_sign_in_at: i.last_sign_in_at,
          created_at: i.created_at,
        })),
        factors: authUser.user.factors?.map(f => ({
          id: f.id,
          status: f.status,
          friendly_name: f.friendly_name,
          factor_type: f.factor_type,
          created_at: f.created_at,
          updated_at: f.updated_at,
        })),
      };
    }

    // 2. Profile
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (profile) userData.profile = profile;

    // 3. User Roles
    const { data: roles } = await serviceClient
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);
    if (roles?.length) userData.roles = roles;

    // 4. Addresses
    const { data: addresses } = await serviceClient
      .from('addresses')
      .select('*, user_residences!inner(*)')
      .eq('user_residences.user_id', userId);
    if (addresses?.length) userData.addresses = addresses;

    // 5. Businesses (se for dono)
    const { data: businesses } = await serviceClient
      .from('businesses')
      .select('*, business_data(*), business_gallery(*)')
      .eq('owner_id', userId);
    if (businesses?.length) userData.businesses = businesses;

    // 6. Gastronomy
    const { data: gastronomy } = await serviceClient
      .from('gastronomy_profiles')
      .select('*, menus(*), gastronomy_subscriptions(*)')
      .eq('business_id', userId);
    if (gastronomy?.length) userData.gastronomy = gastronomy;

    // 7. Classifieds
    const { data: classifieds } = await serviceClient
      .from('classifieds')
      .select('*')
      .eq('seller_id', userId);
    if (classifieds?.length) userData.classifieds = classifieds;

    // 8. Professional
    const { data: professional } = await serviceClient
      .from('professional_data')
      .select('*, professional_jobs(*), professional_stats(*)')
      .eq('user_id', userId);
    if (professional?.length) userData.professional = professional;

    // 9. Mobility (motorista)
    const { data: driverProfile } = await serviceClient
      .from('driver_profiles')
      .select('*, driver_vehicles(*), driver_availability(*)')
      .eq('user_id', userId);
    if (driverProfile?.length) userData.driver_profile = driverProfile;

    // 10. Ride requests (como passageiro)
    const { data: rideRequests } = await serviceClient
      .from('ride_requests')
      .select('*, ride_offers(*), mobility_messages(*)')
      .eq('passenger_id', userId);
    if (rideRequests?.length) userData.ride_requests = rideRequests;

    // 11. Notifications
    const { data: notifications } = await serviceClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    if (notifications?.length) userData.notifications = notifications;

    // 12. Messages
    const { data: conversations } = await serviceClient
      .from('conversation_participants')
      .select('*, conversations(*), messages(*)')
      .eq('user_id', userId);
    if (conversations?.length) userData.conversations = conversations;

    // 13. Community posts
    const { data: communityPosts } = await serviceClient
      .from('community_posts')
      .select('*, community_comments(*), community_reactions(*)')
      .eq('author_id', userId);
    if (communityPosts?.length) userData.community_posts = communityPosts;

    // 14. Events created
    const { data: events } = await serviceClient
      .from('events')
      .select('*')
      .eq('organizer_id', userId);
    if (events?.length) userData.events = events;

    // 15. Billing/Subscriptions
    const { data: subscriptions } = await serviceClient
      .from('user_subscriptions')
      .select('*, billing_transactions(*)')
      .eq('user_id', userId);
    if (subscriptions?.length) userData.subscriptions = subscriptions;

    // 16. User Consents
    const { data: consents } = await serviceClient
      .from('user_consents')
      .select('*')
      .eq('user_id', userId);
    if (consents?.length) userData.consents = consents;

    // 17. Sessions
    const { data: sessions } = await serviceClient
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId);
    if (sessions?.length) userData.sessions = sessions;

    // 18. Analytics events (anonymized)
    const { data: analytics } = await serviceClient
      .from('analytics_events')
      .select('event_type, event_name, created_at, metadata')
      .eq('user_id', userId)
      .limit(1000);
    if (analytics?.length) userData.analytics = analytics;

    // 19. Application logs
    const { data: appLogs } = await serviceClient
      .from('application_logs')
      .select('level, message, created_at')
      .eq('user_id', userId)
      .limit(1000);
    if (appLogs?.length) userData.application_logs = appLogs;

    // 20. PII Access Logs
    const { data: piiLogs } = await serviceClient
      .from('pii_access_log')
      .select('*')
      .eq('subject_user_id', userId);
    if (piiLogs?.length) userData.pii_access_log = piiLogs;

    // Calcular tamanho do arquivo
    const jsonString = JSON.stringify(userData, null, 2);
    const sizeInBytes = new TextEncoder().encode(jsonString).length;

    // Registrar exportação na tabela de audit (opcional)
    try {
      await serviceClient.from('application_logs').insert({
        level: 'info',
        message: `LGPD: Dados exportados para usuário ${userId}`,
        user_id: userId,
        context: { size_bytes: sizeInBytes, tables_exported: Object.keys(userData).length },
        source: 'user-export-data',
      });
    } catch {
      // Não falhar se logging falhar
    }

    return new Response(
      JSON.stringify(userData, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="meus-dados-${userId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json"`,
          'X-Export-Size': String(sizeInBytes),
          'X-Export-Tables': String(Object.keys(userData).length),
        },
      }
    );

  } catch (error: unknown) {
    console.error('[user-export-data]', error);
    return errorResponse('Export failed', 500, error);
  }
});

