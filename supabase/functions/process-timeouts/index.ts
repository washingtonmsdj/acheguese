/**
 * EDGE FUNCTION: Process Dispatch Timeouts
 * 
 * Processa timeouts de dispatch de corridas automaticamente.
 * Deve ser chamada a cada 1 minuto via cron externo.
 * 
 * Endpoint: https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/process-timeouts
 * 
 * SEGURANÇA: Requer header x-cron-secret para autenticação
 * 
 * Configuração de cron externo (exemplo):
 * - cron-job.org
 * - EasyCron
 * - GitHub Actions
 * - Vercel Cron
 * 
 * Frequência: A cada 1 minuto
 * Timeout ajustado: 60 segundos (alinhado com frequência do cron)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

// Secret para autenticação do cron (deve ser configurado no Supabase Dashboard)
const CRON_SECRET = Deno.env.get('CRON_SECRET') || ''

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // HARDENING: Validar secret do cron
    const cronSecret = req.headers.get('x-cron-secret')
    
    if (!CRON_SECRET) {
      console.warn('[SECURITY] CRON_SECRET not configured - endpoint is unprotected!')
    } else if (cronSecret !== CRON_SECRET) {
      console.error('[SECURITY] Invalid cron secret')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Unauthorized',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const startTime = Date.now()

    // Executar process_dispatch_timeouts
    const { data, error } = await supabaseClient.rpc('process_dispatch_timeouts')

    const executionTime = Date.now() - startTime

    if (error) {
      console.error('Error processing timeouts:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          executionTime
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const processed = data?.length || 0
    
    console.log(`[${new Date().toISOString()}] Processed ${processed} timeout(s) in ${executionTime}ms`)
    
    if (processed > 0) {
      data.forEach((result: any) => {
        console.log(`  - Ride: ${result.ride_id} | Action: ${result.action} | ${result.details}`)
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed,
        results: data,
        timestamp: new Date().toISOString(),
        executionTime
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
