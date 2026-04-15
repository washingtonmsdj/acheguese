/**
 * EDGE FUNCTION: admin-verify-profile
 * Verifica (badge) um perfil. Requer role admin (super_admin ou moderator).
 *
 * POST /functions/v1/admin-verify-profile
 * Body: { profile_id: string, reason?: string }
 * Headers: Authorization: Bearer <user_jwt>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdmin, jsonResponse, corsHeaders } from '../_shared/adminAuth.ts';

interface VerifyRequest {
  profile_id: string;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // 1. Validar admin
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  // 2. Parse body
  let body: VerifyRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.profile_id?.trim()) {
    return jsonResponse({ error: 'profile_id is required' }, 400);
  }

  // 3. Executar via service_role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc('verify_profile', {
    p_profile_id: body.profile_id,
    p_admin_user_id: authResult.userId,
    p_reason: body.reason?.trim() ?? null,
  });

  if (error) {
    console.error('[admin-verify-profile] RPC error:', error.message);
    return jsonResponse({ error: error.message }, 500);
  }

  console.log('[admin-verify-profile] Verified:', body.profile_id, 'by', authResult.userId);
  return jsonResponse(data);
});
