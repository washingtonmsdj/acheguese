/**
 * Edge Function: admin-create-user
 * 
 * Cria novo usuário (apenas para super_admin)
 * 
 * Substitui: admin.mutations.createAdminUser()
 * 
 * @security Requer role super_admin
 * @rateLimit 10 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: 'user' | 'business' | 'driver' | 'moderator' | 'admin' | 'super_admin';
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

    // 5. Verificar role super_admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role_enum')
      .eq('user_id', user.id)
      .is('revoked_at', null);

    const isSuperAdmin = roles?.some(r => r.role_enum === 'super_admin');
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Parsear body
    const body: CreateUserRequest = await req.json();
    const { email, password, username, fullName, role } = body;

    // 7. Validar input
    if (!email || !password || !username || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar senha (mínimo 12 caracteres)
    if (password.length < 12) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 12 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar username (3-30 caracteres, alfanumérico + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Invalid username format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar role
    const validRoles = ['user', 'business', 'driver', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Verificar se email já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users.some(u => u.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Verificar se username já existe
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Username already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Criar usuário no auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email para usuários criados por admin
      user_metadata: {
        full_name: fullName,
        username,
      },
    });

    if (userError) {
      throw userError;
    }

    const newUserId = userData.user.id;

    // 11. Criar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUserId,
        username,
        full_name: fullName,
      });

    if (profileError) {
      // Rollback: deletar usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    // 12. Atribuir role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role_enum: role,
        granted_by: user.id,
      });

    if (roleError) {
      // Rollback: deletar usuário e perfil
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId);
      throw roleError;
    }

    // 13. Buscar dados completos do usuário criado
    const { data: newUserData } = await supabaseAdmin.auth.admin.getUserById(newUserId);
    const { data: newProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', newUserId)
      .single();
    const { data: newRoles } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', newUserId);

    const createdUser = {
      id: newUserId,
      email: newUserData?.user.email,
      created_at: newUserData?.user.created_at,
      email_confirmed_at: newUserData?.user.email_confirmed_at,
      profiles: [newProfile],
      roles: newRoles,
    };

    // 14. Audit log
    await supabaseAdmin.from('function_audit').insert({
      function_name: 'admin-create-user',
      user_id: user.id,
      input: { email, username, fullName, role }, // Não logar senha
      output: { userId: newUserId },
      success: true,
      duration_ms: 0,
    }).catch(err => console.error('Audit log error:', err));

    // 15. Retornar resultado
    return new Response(
      JSON.stringify({ 
        success: true,
        user: createdUser,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in admin-create-user:', error);
    
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
