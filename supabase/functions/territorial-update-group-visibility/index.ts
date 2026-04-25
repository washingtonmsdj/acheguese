/**
 * Edge Function: territorial-update-group-visibility
 * 
 * Atualiza visibilidade de um grupo territorial (apenas para admins)
 * 
 * Substitui: territorial.mutations.updateGroupVisibility()
 * 
 * @security Requer role admin ou super_admin
 * @rateLimit 100 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, errorResponse, isValidUUID, rateLimitMiddleware } from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

interface UpdateGroupVisibilityRequest {
  groupId?: string;
  id?: string;
  flag: 'is_selector_active' | 'is_landing_enabled' | 'is_navigable' | 'hidden' | 'visible';
  value: boolean;
}

type CanonicalVisibilityFlag = 'is_selector_active' | 'is_landing_enabled' | 'is_navigable';

function normalizeCanonicalFlag(flag: UpdateGroupVisibilityRequest['flag']): CanonicalVisibilityFlag | null {
  if (flag === 'is_selector_active' || flag === 'is_landing_enabled' || flag === 'is_navigable') {
    return flag;
  }

  return null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') });
  }

  // Rate limiting via SSOT
  const rl = await rateLimitMiddleware(req, 100, 60000);
  if (rl) return rl;

  // Autenticação e autorização via SSOT
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: getAllSecurityHeaders() }
      );
    }

    // Criar cliente admin para operações de escrita
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body: UpdateGroupVisibilityRequest = await req.json();
    const groupId = body.groupId ?? body.id;
    const { flag, value } = body;
    const canonicalFlag = normalizeCanonicalFlag(flag);

    if (!groupId || !isValidUUID(groupId)) {
      return errorResponse('Invalid group ID', 400);
    }

    if (!canonicalFlag && !['hidden', 'visible'].includes(flag)) {
      return errorResponse('Invalid flag. Must be canonical visibility flag or legacy "hidden/visible"', 400);
    }

    if (typeof value !== 'boolean') {
      return errorResponse('Invalid value. Must be boolean', 400);
    }

    const { data: group, error: fetchError } = await supabaseAdmin
      .from('territorial_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (fetchError || !group) {
      return errorResponse('Group not found', 404);
    }

    const legacyVisibilityPatch = flag === 'hidden'
      ? { hidden: value }
      : { visible: value };

    const updatedMetadata: Record<string, unknown> = {
      ...(group.metadata || {}),
      updated_by: userId,
      updated_at: new Date().toISOString(),
      ...(canonicalFlag ? { [canonicalFlag]: value } : legacyVisibilityPatch),
    };

    const { data: updatedGroup, error: updateError } = await supabaseAdmin
      .from('territorial_groups')
      .update({ metadata: updatedMetadata })
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabaseAdmin.from('function_audit').insert({
      function_name: 'territorial-update-group-visibility',
      user_id: userId,
      input: { groupId, flag, value },
      output: { groupId, updated: true },
      success: true,
      duration_ms: 0,
    }).catch((err: unknown) => console.error('Audit log error:', err));

    return new Response(
      JSON.stringify({ success: true, group: updatedGroup }),
      { headers: getAllSecurityHeaders() }
    );

  } catch (error) {
    console.error('Error in territorial-update-group-visibility:', error);
    return errorResponse('Internal server error', 500, error);
  }
});

