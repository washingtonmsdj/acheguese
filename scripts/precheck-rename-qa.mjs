import { createClient } from '@supabase/supabase-js';
const s = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!'
);

async function main() {
  console.log('=== PRÉ-VALIDAÇÃO: rename community_posts → community_questions ===\n');

  // 1. Linhas em community_posts
  const { count: total } = await s.from('community_posts').select('*', { count: 'exact', head: true });
  console.log(`community_posts total rows: ${total}`);

  // 2. community_questions já existe?
  const { error: cqErr } = await s.from('community_questions').select('id').limit(1);
  console.log(`community_questions já existe: ${!cqErr} ${cqErr?.message ?? ''}`);

  // 3. community_polls ainda referencia posts.id (não community_posts)
  const { data: polls, error: pe } = await s.from('community_polls').select('id, post_id').limit(3);
  console.log(`community_polls rows: ${polls?.length ?? 0} (erro: ${pe?.message ?? 'nenhum'})`);

  // 4. Verificar triggers existentes em community_posts via pg_trigger
  // (não acessível via REST — documentar manualmente)
  console.log('\nTriggers conhecidos em community_posts:');
  console.log('  - update_community_posts_updated_at (base_schema)');
  console.log('  - trigger_update_answers_count (20240103000000_fix_community_qa_structure)');
  console.log('\nRPCs conhecidas que referenciam community_posts:');
  console.log('  - mark_best_answer() — atualiza community_posts.resolved');
  console.log('\nFKs conhecidas que referenciam community_posts:');
  console.log('  - community_polls.post_id → community_posts.id  [MIGRADA para posts.id em 000031]');
  console.log('  - community_posts.author_profile_id → profiles.id');
  console.log('  - community_posts.location_id → locations.id');
  console.log('  - community_posts.id ← community_polls.post_id  [já migrada]');

  console.log('\n✅ Pré-validação concluída');
}
main().catch(e => { console.error(e); process.exit(1); });
