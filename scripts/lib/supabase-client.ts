/**
 * Helper centralizado para criar clientes Supabase em scripts
 * Usa variÃ¡veis de ambiente para evitar hardcoding de secrets
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variÃ¡veis de ambiente
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../../.env.local') });
dotenv.config({ path: resolve(__dirname, '../../.env.remote') });

export interface SupabaseConfig {
  url?: string;
  serviceRoleKey?: string;
  anonKey?: string;
}

/**
 * Cria cliente Supabase com service role key (acesso total)
 * Usa variÃ¡veis de ambiente por padrÃ£o
 */
export function createServiceRoleClient(config: SupabaseConfig = {}) {
  const url = config.url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = config.serviceRoleKey || 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase URL e Service Role Key sÃ£o obrigatÃ³rios.\n' +
      'Configure as variÃ¡veis de ambiente:\n' +
      '  SUPABASE_SERVICE_ROLE_KEY (recomendado)\n' +
      '  ou VITE_SUPABASE_SERVICE_ROLE_KEY (deprecated)\n' +
      '  SUPABASE_URL ou VITE_SUPABASE_URL\n' +
      'Carregue secrets locais com .\\scripts\\security\\Import-LocalSupabaseSecrets.ps1'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Cria cliente Supabase com anon key (acesso pÃºblico)
 * Usa variÃ¡veis de ambiente por padrÃ£o
 */
export function createAnonClient(config: SupabaseConfig = {}) {
  const url = config.url || process.env.VITE_SUPABASE_URL;
  const anonKey = config.anonKey || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL e Anon Key sÃ£o obrigatÃ³rios.\n' +
      'Configure as variÃ¡veis de ambiente:\n' +
      '  VITE_SUPABASE_URL\n' +
      '  VITE_SUPABASE_PUBLISHABLE_KEY'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Retorna configuraÃ§Ãµes do Supabase das variÃ¡veis de ambiente
 */
export function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    projectId: process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

