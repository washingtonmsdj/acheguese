#!/usr/bin/env tsx

/**
 * VALIDAÇÃO FINAL DO BANCO
 * Executa queries de validação e gera evidências
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executarValidacao() {
  console.log('🔍 VALIDAÇÃO FINAL DO BANCO\n');

  try {
    // 1. Views públicas
    console.log('1. VIEWS PÚBLICAS');
    const views = ['public_profiles', 'public_business_profiles', 'public_professional_profiles', 'public_driver_profiles', 'public_profile_links'];
    for (const view of views) {
      const { data, error } = await supabase.from(view).select('*', { count: 'exact', head: true });
      console.log(`   ${view}: ${error ? 'ERRO' : `✅ ${data?.length || 0} registros`}`);
    }

    // 2. Perfis por tipo
    console.log('\n2. PERFIS POR TIPO');
    const { data: perfis } = await supabase
      .from('profiles')
      .select('profile_type, is_public, is_active');
    
    const stats: any = {};
    perfis?.forEach((p: any) => {
      if (!stats[p.profile_type]) stats[p.profile_type] = { total: 0, publicos: 0, ativos: 0 };
      stats[p.profile_type].total++;
      if (p.is_public) stats[p.profile_type].publicos++;
      if (p.is_active) stats[p.profile_type].ativos++;
    });

    for (const [tipo, stat] of Object.entries(stats)) {
      console.log(`   ${tipo}: ${(stat as any).total} total, ${(stat as any).publicos} públicos, ${(stat as any).ativos} ativos`);
    }

    // 3. Extensões
    console.log('\n3. EXTENSÕES');
    const { data: business } = await supabase.from('business_data').select('*', { count: 'exact', head: true });
    const { data: professional } = await supabase.from('professional_data').select('*', { count: 'exact', head: true });
    const { data: driver } = await supabase.from('driver_data').select('*', { count: 'exact', head: true });
    console.log(`   business_data: ${business?.length || 0} registros`);
    console.log(`   professional_data: ${professional?.length || 0} registros`);
    console.log(`   driver_data: ${driver?.length || 0} registros`);

    // 4. Members
    console.log('\n4. MEMBERS');
    const { data: members } = await supabase
      .from('profile_members')
      .select('role');
    
    const memberStats: any = {};
    members?.forEach((m: any) => {
      memberStats[m.role] = (memberStats[m.role] || 0) + 1;
    });

    for (const [role, count] of Object.entries(memberStats)) {
      console.log(`   ${role}: ${count} membros`);
    }

    // 5. Links
    console.log('\n5. LINKS');
    const { data: links } = await supabase
      .from('profile_links')
      .select('link_type, is_public');
    
    const linkStats: any = {};
    links?.forEach((l: any) => {
      if (!linkStats[l.link_type]) linkStats[l.link_type] = { total: 0, publicos: 0 };
      linkStats[l.link_type].total++;
      if (l.is_public) linkStats[l.link_type].publicos++;
    });

    for (const [tipo, stat] of Object.entries(linkStats)) {
      console.log(`   ${tipo}: ${(stat as any).total} total, ${(stat as any).publicos} públicos`);
    }

    // 6. RPCs disponíveis
    console.log('\n6. RPCs DISPONÍVEIS');
    const rpcs = [
      'create_profile_with_extension',
      'transfer_profile_ownership',
      'delete_profile',
      'update_profile_handle'
    ];

    for (const rpc of rpcs) {
      try {
        // Tentar chamar com parâmetros inválidos para verificar se existe
        await supabase.rpc(rpc as any, {});
      } catch (error: any) {
        const existe = !error.message?.includes('Could not find the function');
        console.log(`   ${rpc}: ${existe ? '✅ Existe' : '❌ Não encontrado'}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ VALIDAÇÃO CONCLUÍDA');
    console.log('='.repeat(80) + '\n');

    const resultado = {
      data: new Date().toISOString(),
      views_publicas: views.length,
      perfis: stats,
      extensoes: {
        business: business?.length || 0,
        professional: professional?.length || 0,
        driver: driver?.length || 0
      },
      members: memberStats,
      links: linkStats
    };

    const fs = await import('fs');
    fs.writeFileSync('VALIDACAO_BANCO_FINAL.json', JSON.stringify(resultado, null, 2), 'utf-8');
    console.log('📄 Validação salva em: VALIDACAO_BANCO_FINAL.json\n');

  } catch (error) {
    console.error('❌ ERRO:', error);
    process.exit(1);
  }
}

executarValidacao();
