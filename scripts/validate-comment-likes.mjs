import { createAnonClient, createServiceRoleClient } from '../tools/supabase/supabase-client.mjs';

const s = createServiceRoleClient();

const PROF_A    = 'e114b313-3d76-452b-8dca-3bb8079ca59e';
const LOC_BARRA = '00000000-0000-0000-0000-000000000002';
const USER_A    = 'fa000000-0000-0000-0000-000000000001';

let ok = 0; let fail = 0;
const pass = m => { console.log(`  ✅ ${m}`); ok++; };
const fail_ = m => { console.log(`  ❌ ${m}`); fail++; };

async function main() {
  // Setup: criar pergunta e resposta temporárias
  const { data: q } = await s.from('community_questions').insert({
    author_profile_id: PROF_A, type: 'question',
    title: 'Teste likes', content: 'teste', category: 'outros',
    location_id: LOC_BARRA,
  }).select('id').single();

  const { data: c } = await s.from('comments').insert({
    post_id: q.id, author_profile_id: PROF_A, content: 'Resposta teste',
  }).select('id, likes_count').single();

  console.log(`Setup: question=${q.id.substring(0,8)} comment=${c.id.substring(0,8)} likes_count=${c.likes_count}`);

  // 1. Curtir resposta
  console.log('\n=== 1. Curtir resposta ===');
  const { error: e1 } = await s.from('comment_likes').insert({ comment_id: c.id, user_id: USER_A });
  if (!e1) {
    pass('Like inserido com sucesso');
    // Verificar contador
    const { data: after1 } = await s.from('comments').select('likes_count').eq('id', c.id).single();
    if (after1?.likes_count === 1) pass(`likes_count = ${after1.likes_count} (trigger funcionou)`);
    else fail_(`likes_count esperado 1, got ${after1?.likes_count}`);
  } else {
    fail_(`Like falhou: ${e1.message}`);
  }

  // 2. Não duplicar like
  console.log('\n=== 2. Não duplicar like (unique constraint) ===');
  const { error: e2 } = await s.from('comment_likes').insert({ comment_id: c.id, user_id: USER_A });
  if (e2?.code === '23505') {
    pass(`Duplicata rejeitada (${e2.code})`);
  } else if (e2) {
    pass(`Duplicata rejeitada: ${e2.message.substring(0,60)}`);
  } else {
    fail_('Duplicata foi aceita — unique constraint não está ativa');
  }

  // 3. Verificar estado liked por usuário
  console.log('\n=== 3. Estado liked por usuário ===');
  const { data: likeCheck } = await s.from('comment_likes')
    .select('id').eq('comment_id', c.id).eq('user_id', USER_A).maybeSingle();
  if (likeCheck) pass(`Usuário ${USER_A.substring(0,8)} curtiu: true`);
  else fail_('Like não encontrado');

  // 4. Descurtir
  console.log('\n=== 4. Descurtir ===');
  const { error: e4 } = await s.from('comment_likes')
    .delete().eq('comment_id', c.id).eq('user_id', USER_A);
  if (!e4) {
    pass('Unlike executado');
    const { data: after4 } = await s.from('comments').select('likes_count').eq('id', c.id).single();
    if (after4?.likes_count === 0) pass(`likes_count = ${after4.likes_count} (trigger decrementou)`);
    else fail_(`likes_count esperado 0, got ${after4?.likes_count}`);
  } else {
    fail_(`Unlike falhou: ${e4.message}`);
  }

  // 5. Estado liked = false após unlike
  console.log('\n=== 5. Estado liked = false após unlike ===');
  const { data: likeCheck2 } = await s.from('comment_likes')
    .select('id').eq('comment_id', c.id).eq('user_id', USER_A).maybeSingle();
  if (!likeCheck2) pass('liked = false confirmado');
  else fail_('Like ainda existe após unlike');

  // 6. RLS: anon não pode inserir
  console.log('\n=== 6. RLS: anon não pode inserir ===');
  const anon = createAnonClient();
  const { error: e6 } = await anon.from('comment_likes').insert({ comment_id: c.id, user_id: USER_A });
  if (e6) pass(`Anon rejeitado: ${e6.message.substring(0,60)}`);
  else fail_('Anon conseguiu inserir — RLS não está ativa');

  // Cleanup
  await s.from('comments').delete().eq('id', c.id);
  await s.from('community_questions').delete().eq('id', q.id);

  console.log('\n' + '='.repeat(60));
  console.log(`Resultado: ${ok} ✅  ${fail} ❌`);
  if (fail === 0) console.log('✅ comment_likes VALIDADO');
  else { console.log('❌ FALHAS'); process.exit(1); }
}
main().catch(e => { console.error(e); process.exit(1); });
