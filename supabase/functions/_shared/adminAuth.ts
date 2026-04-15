/**
 * ADMIN AUTH HELPER
 * Valida permissões administrativas para edge functions
 *
 * Tabela esperada: admin_users (user_id uuid, role text)
 * Roles válidas: 'super_admin', 'moderator'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  role?: 'super_admin' | 'moderator';
  error?: string;
}

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function validateAdmin(req: Request): Promise<AdminAuthResult> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAdmin: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[adminAuth] Token validation failed:', authError?.message);
      return { isAdmin: false, error: 'Invalid or expired token' };
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminUser) {
      console.warn('[adminAuth] User not in admin_users:', user.id);
      return { isAdmin: false, userId: user.id, error: 'User is not an admin' };
    }

    console.log('[adminAuth] Admin validated:', user.id, adminUser.role);
    return {
      isAdmin: true,
      userId: user.id,
      role: adminUser.role as 'super_admin' | 'moderator',
    };
  } catch (err: any) {
    console.error('[adminAuth] Unexpected error:', err.message);
    return { isAdmin: false, error: 'Authentication failed' };
  }
}

export async function requireAdmin(req: Request): Promise<AdminAuthResult | Response> {
  const result = await validateAdmin(req);

  if (!result.isAdmin) {
    return new Response(
      JSON.stringify({ error: result.error ?? 'Unauthorized' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return result;
}

export function corsHeaders(methods = 'POST, OPTIONS') {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
