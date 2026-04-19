/**
 * Edge Function: admin-get-user-auth-summary
 * 
 * Busca resumo de autenticação de um usuário (apenas para admins)
 * 
 * Substitui: AdminProfileGovernanceService.loadAuthSummary()
 * 
 * @security Requer role admin ou super_admin
 * @rateLimit 200 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetAuthSummaryRequest {
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Obter token do header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Criar cliente com service_role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. Validar usuário
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Verificar role admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role_enum')
      .eq('user_id', user.id)
      .is('revoked_at', null);

    const isAdmin = roles?.some(r => ['admin', 'super_admin'].includes(r.role_enum));
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Parsear body
    const body: GetAuthSummaryRequest = await req.json();
    const { userId } = body;

    // 7. Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Buscar dados de auth do usuário
    const { data: authData, error: authGetError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authGetError) {
      if (authGetError.message.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw authGetError;
    }

    // 9. Montar resumo de autenticação
    const authSummary = {
      userId: authData.user.id,
      email: authData.user.email,
      emailConfirmed: !!authData.user.email_confirmed_at,
      emailConfirmedAt: authData.user.email_confirmed_at,
      phone: authData.user.phone,
      phoneConfirmed: !!authData.user.phone_confirmed_at,
      phoneConfirmedAt: authData.user.phone_confirmed_at,
      createdAt: authData.user.created_at,
      lastSignInAt: authData.user.last_sign_in_at,
      confirmedAt: authData.user.confirmed_at,
      identities: authData.user.identities?.map(identity => ({
        provider: identity.provider,
        createdAt: identity.created_at,
        lastSignInAt: identity.last_sign_in_at,
      })) || [],
      factors: authData.user.factors?.map(factor => ({
        id: factor.id,
        factorType: factor.factor_type,
        status: factor.status,
        createdAt: factor.created_at,
        updatedAt: factor.updated_at,
      })) || [],
      hasMFA: (authData.user.factors?.length || 0) > 0,
      appMetadata: authData.user.app_metadata,
      userMetadata: authData.user.user_metadata,
    };

    // 10. Audit log
    await supabaseAdmin.from('function_audit').insert({
      function_name: 'admin-get-user-auth-summary',
      user_id: user.id,
      input: { userId },
      success: true,
      duration_ms: 0,
    }).catch(err => console.error('Audit log error:', err));

    // 11. Retornar resultado
    return new Response(
      JSON.stringify({ summary: authSummary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in admin-get-user-auth-summary:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
