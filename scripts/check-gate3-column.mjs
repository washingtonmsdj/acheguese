import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

console.log('Verificando coluna failed_delivery_metadata...\n');

// Tentar inserir/atualizar diretamente
const { data: rides, error } = await supabase
  .from('ride_requests')
  .select('id, status, failed_delivery_metadata')
  .limit(1);

if (error) {
  console.log('❌ Erro ao consultar:', error.message);
  if (error.message.includes('failed_delivery_metadata')) {
    console.log('\n⚠️  Coluna failed_delivery_metadata NÃO existe no banco');
    console.log('   A migration precisa ser aplicada novamente');
  }
} else {
  console.log('✅ Coluna failed_delivery_metadata existe');
  console.log('   Dados:', rides);
}
