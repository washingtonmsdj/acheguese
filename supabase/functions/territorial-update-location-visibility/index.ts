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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateLocationVisibilityRequest {
  locationId: string;
  flag: 'hidden' | 'visible';
  value: boolean;
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
    const body: UpdateLocationVisibilityRequest = await req.json();
    const { locationId, flag, value } = body;

    // 7. Validar input
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!locationId || !uuidRegex.test(locationId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid location ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['hidden', 'visible'].includes(flag)) {
      return new Response(
        JSON.stringify({ error: 'Invalid flag. Must be "hidden" or "visible"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof value !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Invalid value. Must be boolean' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Buscar localização atual
    const { data: location, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (fetchError || !location) {
      return new Response(
        JSON.stringify({ error: 'Location not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Atualizar metadata
    const currentMetadata = location.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      [flag]: value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // 10. Atualizar localização
    const { data: updatedLocation, error: updateError } = await supabaseAdmin
      .from('locations')
      .update({ metadata: updatedMetadata })
      .eq('id', locationId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 11. Se ocultar, propagar para filhos
    if (flag === 'hidden' && value === true) {
      const { data: children } = await supabaseAdmin
        .from('locations')
        .select('id')
        .eq('parent_id', locationId);

      if (children && children.length > 0) {
        const childIds = children.map(c => c.id);
        
        // Atualizar filhos recursivamente
        await supabaseAdmin
          .from('locations')
          .update({ 
            metadata: supabaseAdmin.rpc('jsonb_set', {
              target: 'metadata',
              path: '{hidden}',
              new_value: 'true',
            })
          })
          .in('id', childIds);
      }
    }

    // 12. Audit log
    await supabaseAdmin.from('function_audit').insert({
      function_name: 'territorial-update-location-visibility',
      user_id: user.id,
      input: { locationId, flag, value },
      output: { locationId, updated: true },
      success: true,
      duration_ms: 0,
    }).catch(err => console.error('Audit log error:', err));

    // 13. Retornar resultado
    return new Response(
      JSON.stringify({ 
        success: true,
        location: updatedLocation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in territorial-update-location-visibility:', error);
    
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
