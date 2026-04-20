/**
 * User Delete Account - Edge Function
 *
 * Implementa direito ao esquecimento (Art. 18 LGPD).
 * Realiza soft-delete imediato + agendamento de purge em 30 dias.
 *
 * @version 1.1.0
 * @lgpd Art. 18, VI - Direito de eliminação dos dados
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getAllSecurityHeaders,
  rateLimitMiddleware,
  errorResponse,
  auditLog,
  getAuditInfo,
} from "../_shared/security.ts";

const corsHeaders = getAllSecurityHeaders('POST, OPTIONS');

/** Extrai mensagem de erro de forma type-safe */
function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

interface DeleteRequest {
  reason?: string;
  confirmation: boolean; // Must be true
  export_first?: boolean; // If true, export data before deletion
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limit: 3 tentativas por dia
  const rateLimitResponse = await rateLimitMiddleware(req, 3, 24 * 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Parse request body
    const body: DeleteRequest = await req.json();

    if (!body.confirmation) {
      return errorResponse('Confirmation required to delete account', 400);
    }

    // Get JWT from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401);
    }

    const jwt = authHeader.replace('Bearer ', '');

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user's JWT
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Service role client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: userError } = await userClient.auth.getUser(jwt);
    if (userError || !user) {
      return errorResponse('Invalid token', 401);
    }

    const userId = user.id;
    const userEmail = user.email;

    // Verificar se usuário é admin - não permitir exclusão de admins
    const { data: isAdmin } = await serviceClient.rpc('is_admin', { _user_id: userId });
    if (isAdmin) {
      return errorResponse('Admin accounts cannot be deleted via self-service. Contact DPO.', 403);
    }

    // Verificar se tem businesses ativos (owner)
    const { data: activeBusinesses } = await serviceClient
      .from('businesses')
      .select('id, name')
      .eq('owner_id', userId)
      .eq('status', 'active');

    if (activeBusinesses && activeBusinesses.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Active businesses found',
          message: 'You must transfer or close your businesses before deleting your account',
          businesses: activeBusinesses.map(b => ({ id: b.id, name: b.name })),
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Verificar se é motorista com corridas pendentes
    const { data: pendingRides } = await serviceClient
      .from('ride_requests')
      .select('id, status')
      .eq('passenger_id', userId)
      .in('status', ['pending', 'accepted', 'in_progress']);

    if (pendingRides && pendingRides.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Pending rides found',
          message: 'You must complete or cancel pending rides before deleting your account',
          rides: pendingRides,
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Log audit
    const auditInfo = getAuditInfo(req);
    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'ACCOUNT_DELETION_REQUESTED',
      resource: 'user_delete_account',
      status: 'success',
      details: { reason: body.reason, export_first: body.export_first },
      ...auditInfo,
    });

    // Registrar acesso a PII
    await serviceClient.rpc('log_pii_access', {
      p_subject_user_id: userId,
      p_table_name: 'user_account',
      p_record_id: userId,
      p_operation: 'DELETE',
      p_reason: `LGPD Art. 18, VI - Exclusão de dados. Motivo: ${body.reason || 'Não informado'}`,
      p_reason_category: 'deletion_request',
      p_data_sample: userEmail ? `${userEmail.slice(0, 2)}***@${userEmail.split('@')[1]}` : null,
      p_source: 'edge:user-delete-account',
    });

    // Calcular data de purge (30 dias)
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + 30);

    // 1. Criar registro de deleção agendada
    const { error: scheduledError } = await serviceClient
      .from('user_deletion_schedule')
      .upsert({
        user_id: userId,
        requested_at: new Date().toISOString(),
        scheduled_purge_at: purgeDate.toISOString(),
        reason: body.reason,
        status: 'scheduled',
        export_requested: body.export_first || false,
      }, { onConflict: 'user_id' });

    if (scheduledError) {
      console.error('[user-delete-account] Failed to schedule deletion:', scheduledError);
    }

    // 2. Soft-delete em todas as tabelas principais
    const deletionResults: Record<string, { success: boolean; count?: number; error?: string }> = {};

    // 2.1 Profile
    try {
      const { error } = await serviceClient
        .from('profiles')
        .update({
          deleted_at: new Date().toISOString(),
          display_name: '[Deletado]',
          avatar_url: null,
          bio: null,
          phone: null,
          document_number: null,
          slug: `deleted-${userId.slice(0, 8)}`,
        })
        .eq('user_id', userId);
      deletionResults.profile = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.profile = { success: false, error: toErrorMessage(e) };
    }

    // 2.2 Revogar roles
    try {
      const { error } = await serviceClient
        .from('user_roles')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: userId,
          granted: false,
        })
        .eq('user_id', userId)
        .is('revoked_at', null);
      deletionResults.roles = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.roles = { success: false, error: toErrorMessage(e) };
    }

    // 2.3 Anonimizar addresses
    try {
      const { data: addresses } = await serviceClient
        .from('user_residences')
        .select('address_id')
        .eq('user_id', userId);
      
      for (const addr of addresses || []) {
        await serviceClient
          .from('addresses')
          .update({
            street: '[REMOVIDO]',
            number: '0',
            complement: null,
            neighborhood: '[REMOVIDO]',
            postal_code: '00000-000',
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', addr.address_id);
      }
      deletionResults.addresses = { success: true, count: addresses?.length };
    } catch (e: unknown) {
      deletionResults.addresses = { success: false, error: toErrorMessage(e) };
    }

    // 2.4 Anonimizar messages
    try {
      const { error } = await serviceClient
        .from('messages')
        .update({
          content: '[Mensagem removida - usuário deletado]',
          attachments: null,
          deleted_at: new Date().toISOString(),
        })
        .eq('sender_id', userId);
      deletionResults.messages = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.messages = { success: false, error: toErrorMessage(e) };
    }

    // 2.5 Anonimizar community posts
    try {
      const { error } = await serviceClient
        .from('community_posts')
        .update({
          content: '[Conteúdo removido - usuário deletado]',
          media_urls: null,
          deleted_at: new Date().toISOString(),
        })
        .eq('author_id', userId);
      deletionResults.community_posts = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.community_posts = { success: false, error: toErrorMessage(e) };
    }

    // 2.6 Anonimizar classifieds
    try {
      const { error } = await serviceClient
        .from('classifieds')
        .update({
          title: '[Anúncio removido]',
          description: '[Conteúdo removido - usuário deletado]',
          contact_info: null,
          images: null,
          status: 'deleted',
          deleted_at: new Date().toISOString(),
        })
        .eq('seller_id', userId);
      deletionResults.classifieds = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.classifieds = { success: false, error: toErrorMessage(e) };
    }

    // 2.7 Cancelar subscriptions
    try {
      const { error } = await serviceClient
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: 'Account deletion requested',
        })
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'past_due']);
      deletionResults.subscriptions = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.subscriptions = { success: false, error: toErrorMessage(e) };
    }

    // 2.8 Revogar todos os consentimentos
    try {
      const { error } = await serviceClient
        .from('user_consents')
        .update({
          granted: false,
          revoked_at: new Date().toISOString(),
          revoked_by: userId,
          revoke_reason: 'Account deletion',
        })
        .eq('user_id', userId)
        .is('revoked_at', null);
      deletionResults.consents = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.consents = { success: false, error: toErrorMessage(e) };
    }

    // 3. Desativar sessões
    try {
      const { error } = await serviceClient
        .from('user_sessions')
        .update({
          is_valid: false,
          revoked_at: new Date().toISOString(),
          revoke_reason: 'Account deletion',
        })
        .eq('user_id', userId)
        .eq('is_valid', true);
      deletionResults.sessions = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.sessions = { success: false, error: toErrorMessage(e) };
    }

    // 4. Marcar auth.user como deletado (não deletar ainda - purge em 30 dias)
    // Note: Não deletamos o auth.user imediatamente para permitir recuperação
    // e manter referências em logs de auditoria
    try {
      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user_metadata,
          account_status: 'scheduled_for_deletion',
          deletion_requested_at: new Date().toISOString(),
          scheduled_purge_at: purgeDate.toISOString(),
          deletion_reason: body.reason,
        },
        // Desabilitar login
        email_confirm: false,
        phone_confirm: false,
      });
      deletionResults.auth_user = { success: !error, error: error?.message };
    } catch (e: unknown) {
      deletionResults.auth_user = { success: false, error: toErrorMessage(e) };
    }

    // 5. Log final
    await serviceClient.from('application_logs').insert({
      level: 'info',
      message: `LGPD: Conta marcada para exclusão - usuário ${userId}`,
      user_id: userId,
      context: {
        scheduled_purge: purgeDate.toISOString(),
        reason: body.reason,
        results: deletionResults,
      },
      source: 'user-delete-account',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account scheduled for deletion',
        details: {
          user_id: userId,
          scheduled_purge_at: purgeDate.toISOString(),
          days_until_purge: 30,
          recovery_possible_until: purgeDate.toISOString(),
          deletion_results: deletionResults,
        },
        notice: 'Your account has been scheduled for permanent deletion. You have 30 days to recover your account by contacting support.',
      }, null, 2),
      {
        status: 200,
        headers: corsHeaders,
      }
    );

  } catch (error: unknown) {
    console.error('[user-delete-account]', error);
    return errorResponse('Deletion failed', 500, error);
  }
});

