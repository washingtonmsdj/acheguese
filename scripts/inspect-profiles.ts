#!/usr/bin/env tsx

/**
 * INSPEÇÃO DE PERFIS EXISTENTES
 * Mostra os perfis que já existem no banco
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfiles() {
  console.log('🔍 INSPEÇÃO DE PERFIS EXISTENTES\n');

  // 1. Ver perfis via view pública
  console.log('=== PERFIS PÚBLICOS ===');
  const { data: profiles, error } = await supabase
    .from('public_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.log(`❌ Erro: ${error.message}`);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Nenhum perfil encontrado');
    console.log('   Crie perfis usando a UI ou via RPC após autenticação\n');
    return;
  }

  console.log(`📊 Total: ${profiles.length} perfis\n`);

  for (const profile of profiles) {
    console.log(`┌─ Perfil: ${profile.display_name || 'Sem nome'}`);
    console.log(`│  Handle: @${profile.handle || 'sem-handle'}`);
    console.log(`│  Tipo: ${profile.profile_type}`);
    console.log(`│  Verificado: ${profile.is_verified ? '✅' : '❌'}`);
    console.log(`│  Suspenso: ${profile.is_suspended ? '⚠️  SIM' : '✅ NÃO'}`);
    console.log(`│  Privacidade:`);
    console.log(`│    - Email: ${profile.privacy_show_email ? '👁️  Público' : '🔒 Privado'}`);
    console.log(`│    - Telefone: ${profile.privacy_show_phone ? '👁️  Público' : '🔒 Privado'}`);
    console.log(`│    - Localização: ${profile.privacy_show_location ? '👁️  Público' : '🔒 Privado'}`);
    console.log(`│  Criado: ${new Date(profile.created_at).toLocaleDateString('pt-BR')}`);
    console.log(`└─\n`);
  }

  // 2. Ver perfis business
  console.log('=== PERFIS BUSINESS ===');
  const { data: business, error: businessError } = await supabase
    .from('public_business_profiles')
    .select('*')
    .limit(5);

  if (businessError) {
    console.log(`❌ Erro: ${businessError.message}`);
  } else if (!business || business.length === 0) {
    console.log('⚠️  Nenhum perfil business encontrado\n');
  } else {
    console.log(`📊 Total: ${business.length} perfis business\n`);
    for (const b of business) {
      console.log(`  • @${b.handle} - ${b.business_name || 'Sem nome'}`);
      console.log(`    CNPJ: ${b.cnpj || 'N/A'}`);
      console.log(`    Categoria: ${b.category || 'N/A'}\n`);
    }
  }

  // 3. Ver perfis professional
  console.log('=== PERFIS PROFESSIONAL ===');
  const { data: professional, error: profError } = await supabase
    .from('public_professional_profiles')
    .select('*')
    .limit(5);

  if (profError) {
    console.log(`❌ Erro: ${profError.message}`);
  } else if (!professional || professional.length === 0) {
    console.log('⚠️  Nenhum perfil professional encontrado\n');
  } else {
    console.log(`📊 Total: ${professional.length} perfis professional\n`);
    for (const p of professional) {
      console.log(`  • @${p.handle} - ${p.display_name}`);
      console.log(`    Registro: ${p.professional_registration || 'N/A'}\n`);
    }
  }

  // 4. Ver perfis driver
  console.log('=== PERFIS DRIVER ===');
  const { data: drivers, error: driverError } = await supabase
    .from('public_driver_profiles')
    .select('*')
    .limit(5);

  if (driverError) {
    console.log(`❌ Erro: ${driverError.message}`);
  } else if (!drivers || drivers.length === 0) {
    console.log('⚠️  Nenhum perfil driver encontrado\n');
  } else {
    console.log(`📊 Total: ${drivers.length} perfis driver\n`);
    for (const d of drivers) {
      console.log(`  • @${d.handle} - ${d.display_name}`);
      console.log(`    CNH: ${d.driver_license || 'N/A'}`);
      console.log(`    Veículo: ${d.vehicle_model || 'N/A'}\n`);
    }
  }

  // 5. Ver vínculos públicos
  console.log('=== VÍNCULOS PÚBLICOS ===');
  const { data: links, error: linksError } = await supabase
    .from('public_profile_links')
    .select('*')
    .limit(10);

  if (linksError) {
    console.log(`❌ Erro: ${linksError.message}`);
  } else if (!links || links.length === 0) {
    console.log('⚠️  Nenhum vínculo encontrado\n');
  } else {
    console.log(`📊 Total: ${links.length} vínculos\n`);
    for (const link of links) {
      console.log(`  • ${link.link_type}: ${link.url}`);
      console.log(`    Perfil: @${link.profile_handle}\n`);
    }
  }

  console.log('✅ INSPEÇÃO COMPLETA');
}

inspectProfiles().catch(console.error);

