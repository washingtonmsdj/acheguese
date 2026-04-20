/**
 * Edge Function: territorial-get-tree
 * 
 * Busca árvore completa de territórios (apenas para admins)
 * 
 * Substitui: territorial.queries.fetchTerritoryTree()
 * 
 * @security Requer role admin ou super_admin
 * @rateLimit 60 req/min
 * @cache 5 minutos
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
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

    // 6. Buscar todas as localizações
    const { data: locations, error: locError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .order('name');

    if (locError) {
      throw locError;
    }

    // 7. Buscar todos os grupos territoriais com cidade âncora
    const { data: groups, error: grpError } = await supabaseAdmin
      .from('territorial_groups')
      .select('*, anchor_city:locations!territorial_groups_anchor_city_id_fkey(name)');

    if (grpError) {
      throw grpError;
    }

    // 8. Buscar membros dos grupos
    const { data: members } = await supabaseAdmin
      .from('territorial_group_members')
      .select('group_id, location_id');

    // 9. Criar mapa de contagem de membros por grupo
    const memberCountMap = new Map<string, number>();
    const memberIdsMap = new Map<string, string[]>();

    if (members) {
      for (const member of members) {
        const count = memberCountMap.get(member.group_id) || 0;
        memberCountMap.set(member.group_id, count + 1);

        const ids = memberIdsMap.get(member.group_id) || [];
        ids.push(member.location_id);
        memberIdsMap.set(member.group_id, ids);
      }
    }

    // 10. Criar mapa de localizações por ID
    const locationMap = new Map();
    if (locations) {
      for (const loc of locations) {
        locationMap.set(loc.id, {
          ...loc,
          children: [],
          groups: [],
        });
      }
    }

    // 11. Construir hierarquia de localizações
    const rootLocations: any[] = [];
    
    if (locations) {
      for (const loc of locations) {
        const node = locationMap.get(loc.id);
        
        if (loc.parent_id) {
          const parent = locationMap.get(loc.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootLocations.push(node);
        }
      }
    }

    // 12. Adicionar grupos às localizações
    if (groups) {
      for (const group of groups) {
        const anchorLocation = locationMap.get(group.anchor_city_id);
        if (anchorLocation) {
          anchorLocation.groups.push({
            id: group.id,
            name: group.name,
            slug: group.slug,
            description: group.description,
            member_count: memberCountMap.get(group.id) || 0,
            member_ids: memberIdsMap.get(group.id) || [],
            metadata: group.metadata,
            created_at: group.created_at,
          });
        }
      }
    }

    // 13. Montar resultado
    const tree = {
      locations: rootLocations,
      stats: {
        total_locations: locations?.length || 0,
        total_groups: groups?.length || 0,
        total_members: members?.length || 0,
      },
    };

    // 14. Audit log
    await supabaseAdmin.from('function_audit').insert({
      function_name: 'territorial-get-tree',
      user_id: user.id,
      input: {},
      success: true,
      duration_ms: 0,
    }).catch(err => console.error('Audit log error:', err));

    // 15. Retornar resultado com cache header
    return new Response(
      JSON.stringify({ tree }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutos
        },
      }
    );

  } catch (error) {
    console.error('Error in territorial-get-tree:', error);
    
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

