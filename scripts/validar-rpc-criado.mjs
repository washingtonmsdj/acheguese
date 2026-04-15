/**
 * Validar que RPC invite_profile_member_by_email foi criado
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'xhdowzacfujckjelqhtd';

async function validar() {
  console.log('🔍 Validando RPC criado...\n');

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          SELECT 
            routine_name,
            routine_type,
            data_type
          FROM information_schema.routines
          WHERE routine_schema = 'public'
            AND routine_name = 'invite_profile_member_by_email';
        `,
      }),
    });

    const result = await response.json();
    
    if (result.length > 0) {
      console.log('✅ RPC encontrado no banco:\n');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n✅ Migration aplicada com sucesso!');
      console.log('\n📋 Próximo passo: Testar fluxo completo na UI');
      console.log('   1. Login como owner de perfil business');
      console.log('   2. Ir em /perfil/configuracoes → tab Membros');
      console.log('   3. Adicionar membro por email');
      console.log('   4. Verificar que user_id NÃO aparece em DevTools');
    } else {
      console.log('❌ RPC não encontrado. Migration pode não ter sido aplicada.');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

validar();
