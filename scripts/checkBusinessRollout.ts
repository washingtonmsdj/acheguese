import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBusinessRollout() {
  console.log('🔍 Verificando rollout do módulo BUSINESS...\n');

  const salvadorId = '63c41c29-adce-40f5-a552-e52d176123c3';

  // Buscar rollout de business em Salvador
  const { data: rollout, error } = await supabase
    .from('module_rollouts')
    .select('*')
    .eq('module_key', 'business')
    .eq('location_id', salvadorId)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar rollout:', error.message);
    return;
  }

  if (!rollout) {
    console.log('❌ Rollout de BUSINESS não encontrado em Salvador!');
    console.log('   Isso explica por que activeMemberIds retorna Array(0)');
    return;
  }

  console.log('✅ Rollout de BUSINESS encontrado:');
  console.log(JSON.stringify(rollout, null, 2));
}

checkBusinessRollout();
