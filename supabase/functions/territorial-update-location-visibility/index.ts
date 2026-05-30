/**
 * Edge Function: territorial-update-location-visibility
 * 
 * Atualiza visibilidade de uma localização (apenas para admins)
 * 
 * Substitui: territorial.mutations.updateLocationVisibility()
 * 
 * @security Requer role admin ou super_admin
 * @rateLimit 100 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  errorResponse,
  getAllSecurityHeaders,
  isValidUUID,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

interface UpdateLocationVisibilityRequest {
  locationId?: string;
  id?: string;
  flag: CanonicalVisibilityFlag;
  value: boolean;
}

type CanonicalVisibilityFlag = 'is_selector_active' | 'is_landing_enabled' | 'is_navigable';
const ALLOWED_METHODS = 'POST, OPTIONS';

function normalizeCanonicalFlag(flag: UpdateLocationVisibilityRequest['flag']): CanonicalVisibilityFlag | null {
  if (flag === 'is_selector_active' || flag === 'is_landing_enabled' || flag === 'is_navigable') {
    return flag;
  }

  return null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  // Rate limiting via SSOT
  const rl = await rateLimitMiddleware(req, 100, 60000);
  if (rl) return rl;

  // Autenticação e autorização via SSOT
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const rawBody = await readJsonBody<UpdateLocationVisibilityRequest>(req, {
      maxBytes: 4096,
      methods: ALLOWED_METHODS,
    });
    if (!rawBody.ok) return rawBody.response;

    const body = rawBody.data;
    const locationId = body.locationId ?? body.id;
    const { flag, value } = body;
    const canonicalFlag = normalizeCanonicalFlag(flag);

    if (!locationId || !isValidUUID(locationId)) {
      return errorResponse('Invalid location ID', 400);
    }

    if (!canonicalFlag) {
      return errorResponse('Invalid flag. Must be a canonical visibility flag', 400);
    }

    if (typeof value !== 'boolean') {
      return errorResponse('Invalid value. Must be boolean', 400);
    }

    const { data: location, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (fetchError || !location) {
      return errorResponse('Location not found', 404);
    }

    const updatedMetadata: Record<string, unknown> = {
      ...(location.metadata || {}),
      updated_by: userId,
      updated_at: new Date().toISOString(),
      [canonicalFlag]: value,
    };

    const { data: updatedLocation, error: updateError } = await supabaseAdmin
      .from('locations')
      .update({ metadata: updatedMetadata })
      .eq('id', locationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Propagar ocultação de seletor para filhos diretos (apenas 1 nível).
    if (canonicalFlag === 'is_selector_active' && value === false) {
      const { data: children } = await supabaseAdmin
        .from('locations')
        .select('id, metadata')
        .eq('parent_id', locationId);

      if (children && children.length > 0) {
        for (const child of children) {
          await supabaseAdmin
            .from('locations')
            .update({
              metadata: {
                ...(child.metadata || {}),
                is_selector_active: false,
                updated_by: userId,
                updated_at: new Date().toISOString(),
              },
            })
            .eq('id', child.id);
        }
      }
    }

    await supabaseAdmin.from('function_audit').insert({
      function_name: 'territorial-update-location-visibility',
      user_id: userId,
      input: { locationId, flag, value },
      output: { locationId, updated: true },
      success: true,
      duration_ms: 0,
    }).catch((err: unknown) => console.error('Audit log error:', err));

    return new Response(
      JSON.stringify({ success: true, location: updatedLocation }),
      { headers: getAllSecurityHeaders(ALLOWED_METHODS, req) }
    );

  } catch (error) {
    console.error('Error in territorial-update-location-visibility:', error);
    return errorResponse('Internal server error', 500, error);
  }
});

