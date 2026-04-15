/**
 * ADMIN AUTH HELPER
 * Valida permissões administrativas para edge functions
 *
 * Tabela esperada: admin_users (user_id uuid, role text)
 * Roles válidas: 'super_admin', 'moderator'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  getAllSecurityHeaders, 
  auditLog, 
  getAuditInfo,
  errorResponse,
} from './security.ts';

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
  const auditInfo = getAuditInfo(req);
  
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'admin_auth_failed',
        resource: 'admin_validation',
        status: 'failure',
        details: { reason: 'missing_auth_header' },
        ...auditInfo,
      });
      
      return { isAdmin: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseClient();

    // Valida token e obtém usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'admin_auth_failed',
        resource: 'admin_validation',
        status: 'failure',
        details: { reason: 'invalid_token', error: authError?.message },
        ...auditInfo,
      });
      
      return { isAdmin: false, error: 'Invalid or expired token' };
    }

    // Verifica se usuário é admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminUser) {
      auditLog({
        timestamp: new Date().toISOString(),
        userId: user.id,
        action: 'admin_auth_failed',
        resource: 'admin_validation',
        status: 'failure',
        details: { reason: 'not_admin' },
        ...auditInfo,
      });
      
      return { isAdmin: false, userId: user.id, error: 'User is not an admin' };
    }

    // Sucesso - registra auditoria
    auditLog({
      timestamp: new Date().toISOString(),
      userId: user.id,
      action: 'admin_auth_success',
      resource: 'admin_validation',
      status: 'success',
      details: { role: adminUser.role },
      ...auditInfo,
    });

    return {
      isAdmin: true,
      userId: user.id,
      role: adminUser.role as 'super_admin' | 'moderator',
    };
  } catch (err: any) {
    auditLog({
      timestamp: new Date().toISOString(),
      action: 'admin_auth_error',
      resource: 'admin_validation',
      status: 'failure',
      details: { error: err.message },
      ...auditInfo,
    });
    
    return { isAdmin: false, error: 'Authentication failed' };
  }
}

export async function requireAdmin(req: Request): Promise<AdminAuthResult | Response> {
  const result = await validateAdmin(req);

  if (!result.isAdmin) {
    return errorResponse(result.error ?? 'Unauthorized', 403);
  }

  return result;
}

// DEPRECATED: Use getCorsHeaders from ./security.ts
// Mantido para compatibilidade temporária
export function corsHeaders(methods = 'POST, OPTIONS') {
  console.warn('⚠️ corsHeaders is deprecated. Use getCorsHeaders from ./security.ts');
  
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';
  const isDev = Deno.env.get('DENO_ENV') === 'development';
  const defaultOrigin = isDev ? 'http://localhost:8080' : '';
  const origin = allowedOrigins || defaultOrigin || 'null';
  
  return {
    'Access-Control-Allow-Origin': origin.split(',')[0].trim(),
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: getAllSecurityHeaders(),
  });
}
