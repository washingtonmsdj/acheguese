/**
 * Edge Function: territorial-get-tree
 *
 * Busca árvore completa de territórios (apenas para admins)
 *
 * @security Requer role admin ou super_admin
 * @rateLimit 60 req/min
 * @cache 5 minutos
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, errorResponse, rateLimitMiddleware } from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') });
  }

  // Rate limiting via SSOT
  const rl = await rateLimitMiddleware(req, 60, 60000);
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: locations, error: locError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .order('name');

    if (locError) throw locError;

    const { data: groups, error: grpError } = await supabaseAdmin
      .from('territorial_groups')
      .select('*, anchor_city:locations!territorial_groups_anchor_city_id_fkey(name)');

    if (grpError) throw grpError;

    const { data: members } = await supabaseAdmin
      .from('territorial_group_members')
      .select('group_id, location_id');

    // Mapas de contagem e IDs de membros por grupo
    const memberCountMap = new Map<string, number>();
    const memberIdsMap = new Map<string, string[]>();

    for (const member of members ?? []) {
      memberCountMap.set(member.group_id, (memberCountMap.get(member.group_id) ?? 0) + 1);
      const ids = memberIdsMap.get(member.group_id) ?? [];
      ids.push(member.location_id);
      memberIdsMap.set(member.group_id, ids);
    }

    // Construir hierarquia
    const locationMap = new Map<string, Record<string, unknown>>();
    for (const loc of locations ?? []) {
      locationMap.set(loc.id, { ...loc, children: [], groups: [] });
    }

    const rootLocations: unknown[] = [];
    for (const loc of locations ?? []) {
      const node = locationMap.get(loc.id)!;
      if (loc.parent_id) {
        const parent = locationMap.get(loc.parent_id);
        if (parent) (parent.children as unknown[]).push(node);
      } else {
        rootLocations.push(node);
      }
    }

    for (const group of groups ?? []) {
      const anchor = locationMap.get(group.anchor_city_id);
      if (anchor) {
        (anchor.groups as unknown[]).push({
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          member_count: memberCountMap.get(group.id) ?? 0,
          member_ids: memberIdsMap.get(group.id) ?? [],
          metadata: group.metadata,
          created_at: group.created_at,
        });
      }
    }

    const tree = {
      locations: rootLocations,
      stats: {
        total_locations: locations?.length ?? 0,
        total_groups: groups?.length ?? 0,
        total_members: members?.length ?? 0,
      },
    };

    await supabaseAdmin.from('function_audit').insert({
      function_name: 'territorial-get-tree',
      user_id: userId,
      input: {},
      success: true,
      duration_ms: 0,
    }).catch((err: unknown) => console.error('Audit log error:', err));

    return new Response(
      JSON.stringify({ tree }),
      {
        headers: {
          ...getAllSecurityHeaders(),
          'Cache-Control': 'public, max-age=300',
        },
      }
    );

  } catch (error) {
    console.error('Error in territorial-get-tree:', error);
    return errorResponse('Internal server error', 500, error);
  }
});
