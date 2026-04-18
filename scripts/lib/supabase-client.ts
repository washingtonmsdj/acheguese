/**
 * Helper centralizado para criar clientes Supabase em scripts
 * Usa variaveis de ambiente para evitar hardcoding de secrets
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variaveis de ambiente
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
 */
export function createServiceRoleClient(config: SupabaseConfig = {}) {
  const url = config.url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = config.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase URL e Service Role Key sao obrigatorios.\n' +
        'Configure as variaveis de ambiente:\n' +
        '  SUPABASE_SERVICE_ROLE_KEY\n' +
        '  SUPABASE_URL ou VITE_SUPABASE_URL\n' +
        'Carregue secrets locais com .\\scripts\\security\\Import-LocalSupabaseSecrets.ps1',
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
 * Cria cliente Supabase com anon key (acesso publico)
 */
export function createAnonClient(config: SupabaseConfig = {}) {
  const url = config.url || process.env.VITE_SUPABASE_URL;
  const anonKey = config.anonKey || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL e Anon Key sao obrigatorios.\n' +
        'Configure as variaveis de ambiente:\n' +
        '  VITE_SUPABASE_URL\n' +
        '  VITE_SUPABASE_PUBLISHABLE_KEY',
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
 * Retorna configuracoes do Supabase das variaveis de ambiente
 */
export function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    projectId: process.env.SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

