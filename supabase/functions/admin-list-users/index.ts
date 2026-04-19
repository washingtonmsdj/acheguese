/**
 * Edge Function: admin-list-users
 * 
 * Lista usuários com paginação (apenas para admins)
 * 
 * Substitui: AdminUserService.listUsers()
 * 
 * @security Requer role admin ou super_admin
 * @rateLimit 100 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListUsersRequest {
  page: number;
  pageSize: number;
  search?: string;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  profiles: any[];
  roles: any[];
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
    const body: ListUsersRequest = await req.json();
    const { page = 0, pageSize = 20, search } = body;

    // 7. Validar input
    if (page < 0 || pageSize < 1 || pageSize > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid pagination parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Buscar usuários do auth
    const { data: authData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
      page: page + 1, // Supabase auth usa 1-indexed
      perPage: pageSize,
    });

    if (authListError) {
      throw authListError;
    }

    const users = authData.users || [];
    const userIds = users.map(u => u.id);

    // 9. Buscar perfis desses usuários
    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select('id, user_id, username, full_name, avatar_url, created_at')
      .in('user_id', userIds);

    if (search) {
      profilesQuery = profilesQuery.or(
        `username.ilike.%${search}%,full_name.ilike.%${search}%`
      );
    }

    const { data: profilesData, error: profilesError } = await profilesQuery;

    if (profilesError) {
      throw profilesError;
    }

    // 10. Buscar roles dos usuários
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role_enum, granted_at')
      .in('user_id', userIds)
      .is('revoked_at', null);

    if (rolesError) {
      throw rolesError;
    }

    // 11. Combinar dados
    const adminUsers: AdminUser[] = users.map(authUser => {
      const userProfiles = profilesData?.filter(p => p.user_id === authUser.id) || [];
      const userRoles = rolesData?.filter(r => r.user_id === authUser.id) || [];

      return {
        id: authUser.id,
        email: authUser.email || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        profiles: userProfiles,
        roles: userRoles,
      };
    });

    // 12. Filtrar por search se necessário
    let filteredUsers = adminUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = adminUsers.filter(u => 
        u.email.toLowerCase().includes(searchLower) ||
        u.profiles.some(p => 
          p.username?.toLowerCase().includes(searchLower) ||
          p.full_name?.toLowerCase().includes(searchLower)
        )
      );
    }

    // 13. Audit log
    await supabaseAdmin.from('function_audit').insert({
      function_name: 'admin-list-users',
      user_id: user.id,
      input: { page, pageSize, search },
      success: true,
      duration_ms: 0, // TODO: calcular tempo real
    }).catch(err => console.error('Audit log error:', err));

    // 14. Retornar resultado
    return new Response(
      JSON.stringify({
        users: filteredUsers,
        total: authData.total || 0,
        page,
        pageSize,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in admin-list-users:', error);
    
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
