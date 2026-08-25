/**
 * Edge Function: territorial-get-tree
 *
 * Returns the flat territorial management dataset consumed by the admin UI.
 * The browser rebuilds hierarchy locally so locations must remain a flat list.
 *
 * @security Requer role admin ou super_admin
 * @rateLimit 60 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  errorResponse,
  getAllSecurityHeaders,
  getRequiredEnv,
  rateLimitMiddleware,
  requireHttpMethod,
} from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

const ALLOWED_METHODS = 'POST, OPTIONS';
type Metadata = Record<string, unknown>;

function metadataOf(value: unknown): Metadata {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Metadata
    : {};
}

/**
 * Keep Edge serialization aligned with the public territorial visibility SSOT:
 * selector visibility is opt-in, while landing/navigation are opt-out.
 */
function isSelectorActive(metadata: Metadata): boolean {
  return metadata.is_selector_active === true;
}

function isLandingEnabled(metadata: Metadata): boolean {
  return metadata.is_landing_enabled !== false;
}

function isNavigable(metadata: Metadata): boolean {
  return metadata.is_navigable !== false;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rl = await rateLimitMiddleware(req, 60, 60_000);
  if (rl) return rl;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  try {
    const supabaseAdmin = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const [locationsResult, groupsResult, membersResult] = await Promise.all([
      supabaseAdmin.from('locations').select('*').order('name'),
      supabaseAdmin
        .from('territorial_groups')
        .select('*, anchor_city:locations!territorial_groups_anchor_city_id_fkey(name)')
        .order('name'),
      supabaseAdmin
        .from('territorial_group_members')
        .select('group_id, location_id'),
    ]);

    if (locationsResult.error) throw locationsResult.error;
    if (groupsResult.error) throw groupsResult.error;
    if (membersResult.error) throw membersResult.error;

    const memberIdsMap = new Map<string, string[]>();
    for (const member of membersResult.data ?? []) {
      const ids = memberIdsMap.get(member.group_id) ?? [];
      ids.push(member.location_id);
      memberIdsMap.set(member.group_id, ids);
    }

    const locations = (locationsResult.data ?? []).map((location) => {
      const metadata = metadataOf(location.metadata);
      return {
        id: location.id,
        name: location.name,
        slug: location.slug,
        type: location.type,
        parent_id: location.parent_id,
        geographic_path: location.geographic_path,
        status: location.status,
        is_selector_active: isSelectorActive(metadata),
        is_landing_enabled: isLandingEnabled(metadata),
        is_navigable: isNavigable(metadata),
        metadata,
      };
    });

    const groups = (groupsResult.data ?? []).map((group) => {
      const metadata = metadataOf(group.metadata);
      const anchorCity = Array.isArray(group.anchor_city)
        ? group.anchor_city[0]
        : group.anchor_city;
      const memberIds = memberIdsMap.get(group.id) ?? [];

      return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        type: 'group',
        parent_id: group.anchor_city_id,
        status: group.status,
        is_selector_active: isSelectorActive(metadata),
        is_landing_enabled: isLandingEnabled(metadata),
        is_navigable: isNavigable(metadata),
        member_count: memberIds.length,
        member_ids: memberIds,
        anchor_city_name: anchorCity?.name ?? null,
        metadata,
      };
    });

    const groupMembers = Object.fromEntries(memberIdsMap.entries());

    await supabaseAdmin.from('function_audit').insert({
      function_name: 'territorial-get-tree',
      user_id: userId,
      input: {},
      output: {
        locations: locations.length,
        groups: groups.length,
        members: membersResult.data?.length ?? 0,
      },
      success: true,
      duration_ms: 0,
    }).then(() => {}, (err: unknown) => console.error('Audit log error:', err));

    return new Response(
      JSON.stringify({ locations, groups, groupMembers }),
      {
        status: 200,
        headers: {
          ...getAllSecurityHeaders(ALLOWED_METHODS, req),
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch (error) {
    console.error('Error in territorial-get-tree:', error);
    return errorResponse('Internal server error', 500, error);
  }
});
