/**
 * Health Check Edge Function
 * 
 * Verifica saúde do sistema (database, storage, edge functions)
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database?: CheckResult;
    storage?: CheckResult;
    auth?: CheckResult;
  };
  version: string;
  uptime?: number;
}

interface CheckResult {
  status: 'healthy' | 'unhealthy';
  duration_ms: number;
  error?: string;
  details?: Record<string, any>;
}

const startTime = Date.now();

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check Database
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const dbDuration = Date.now() - dbStart;
      
      healthCheck.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        duration_ms: dbDuration,
        error: error?.message,
        details: {
          connected: !error,
          response_time_category: dbDuration < 100 ? 'excellent' : dbDuration < 500 ? 'good' : 'slow',
        },
      };

      if (error || dbDuration > 1000) {
        healthCheck.status = 'degraded';
      }
    } catch (error) {
      healthCheck.checks.database = {
        status: 'unhealthy',
        duration_ms: Date.now() - dbStart,
        error: error.message,
      };
      healthCheck.status = 'unhealthy';
    }

    // 2. Check Storage
    const storageStart = Date.now();
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 });
      
      const storageDuration = Date.now() - storageStart;
      
      healthCheck.checks.storage = {
        status: error ? 'unhealthy' : 'healthy',
        duration_ms: storageDuration,
        error: error?.message,
        details: {
          accessible: !error,
          response_time_category: storageDuration < 200 ? 'excellent' : storageDuration < 1000 ? 'good' : 'slow',
        },
      };

      if (error || storageDuration > 2000) {
        healthCheck.status = healthCheck.status === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    } catch (error) {
      healthCheck.checks.storage = {
        status: 'unhealthy',
        duration_ms: Date.now() - storageStart,
        error: error.message,
      };
      healthCheck.status = 'unhealthy';
    }

    // 3. Check Auth
    const authStart = Date.now();
    try {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      
      const authDuration = Date.now() - authStart;
      
      healthCheck.checks.auth = {
        status: error ? 'unhealthy' : 'healthy',
        duration_ms: authDuration,
        error: error?.message,
        details: {
          accessible: !error,
          response_time_category: authDuration < 200 ? 'excellent' : authDuration < 1000 ? 'good' : 'slow',
        },
      };

      if (error || authDuration > 2000) {
        healthCheck.status = healthCheck.status === 'unhealthy' ? 'unhealthy' : 'degraded';
      }
    } catch (error) {
      healthCheck.checks.auth = {
        status: 'unhealthy',
        duration_ms: Date.now() - authStart,
        error: error.message,
      };
      healthCheck.status = 'unhealthy';
    }

    // Determine HTTP status code
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                       healthCheck.status === 'degraded' ? 200 : 503;

    return new Response(
      JSON.stringify(healthCheck, null, 2),
      {
        status: statusCode,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks = {
      database: {
        status: 'unhealthy',
        duration_ms: 0,
        error: 'Failed to initialize health check',
      },
    };

    return new Response(
      JSON.stringify({
        ...healthCheck,
        error: error.message,
      }, null, 2),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
