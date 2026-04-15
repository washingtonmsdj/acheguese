import { createClient } from '@supabase/supabase-js';
const s = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!'
);
const PROF_A = 'e114b313-3d76-452b-8dca-3bb8079ca59e';
const LOC_BARRA = '00000000-0000-0000-0000-000000000002';
const USER_A = 'fa000000-0000-0000-0000-000000000001';

let ok = 0; let fail = 0;
const pass = m => { console.log(`  ✅ ${m}`); ok++; };
const fail_ = m => { console.log(`  ❌ ${m}`); fail++; };

async function main() {
  // Setup: criar pergunta
  const { data: q } = await s.from('community_questions').insert({
    author_profile_id: PROF_A, type: 'question',
    title: 'Teste respostas canônicas', content: 'teste', category: 'outros',
    location_id: LOC_BARRA,
  }).select('id, answers_count').single();
  console.log(`Setup: question=${q.id.substring(0,8)} answers_count=${q.answers_count}`);

  // 1. Criar resposta em question_answers
  console.log('\n=== 1. Criar resposta em question_answers ===');
  const { data: a1, error: e1 } = await s.from('question_answers').insert({
    question_id: q.id, author_profile_id: PROF_A, content: 'Resposta canônica',
  }).select('id, question_id, content, likes_count, is_best_answer').single();
  if (!e1 && a1) {
    pass(`Resposta criada: id=${a1.id.substring(0,8)} question_id=${a1.question_id.substring(0,8)}`);
    // Verificar answers_count
    const { data: qAfter } = await s.from('community_questions').select('answers_count').eq('id', q.id).single();
    if (qAfter?.answers_count === 1) pass(`answers_count = ${qAfter.answers_count} (trigger funcionou)`);
    else fail_(`answers_count esperado 1, got ${qAfter?.answers_count}`);
  } else {
    fail_(`Criar resposta falhou: ${e1?.message}`);
  }

  // 2. Listar respostas por question_id
  console.log('\n=== 2. Listar respostas por question_id ===');
  const { data: answers, error: e2 } = await s.from('question_answers')
    .select('id, content, likes_count, is_best_answer').eq('question_id', q.id);
  if (!e2) pass(`Listagem: ${answers?.length} resposta(s)`);
  else fail_(`Listagem falhou: ${e2.message}`);

  // 3. Like em question_answer_likes
  console.log('\n=== 3. Like em question_answer_likes ===');
  const { error: e3 } = await s.from('question_answer_likes').insert({ answer_id: a1.id, user_id: USER_A });
  if (!e3) {
    pass('Like inserido');
    const { data: aAfter } = await s.from('question_answers').select('likes_count').eq('id', a1.id).single();
    if (aAfter?.likes_count === 1) pass(`likes_count = ${aAfter.likes_count} (trigger funcionou)`);
    else fail_(`likes_count esperado 1, got ${aAfter?.likes_count}`);
  } else {
    fail_(`Like falhou: ${e3.message}`);
  }

  // 4. Unique constraint
  console.log('\n=== 4. Unique constraint (sem duplicata) ===');
  const { error: e4 } = await s.from('question_answer_likes').insert({ answer_id: a1.id, user_id: USER_A });
  if (e4?.code === '23505') pass(`Duplicata rejeitada (${e4.code})`);
  else fail_('Duplicata aceita — unique constraint não ativa');

  // 5. Unlike
  console.log('\n=== 5. Unlike ===');
  const { error: e5 } = await s.from('question_answer_likes').delete().eq('answer_id', a1.id).eq('user_id', USER_A);
  if (!e5) {
    pass('Unlike executado');
    const { data: aAfter2 } = await s.from('question_answers').select('likes_count').eq('id', a1.id).single();
    if (aAfter2?.likes_count === 0) pass(`likes_count = ${aAfter2.likes_count} (trigger decrementou)`);
    else fail_(`likes_count esperado 0, got ${aAfter2?.likes_count}`);
  } else {
    fail_(`Unlike falhou: ${e5.message}`);
  }

  // 6. mark_best_answer via RPC
  console.log('\n=== 6. mark_best_answer via RPC ===');
  const { error: e6 } = await s.rpc('mark_best_answer', { _question_id: q.id, _answer_id: a1.id });
  if (!e6) {
    const { data: aAfter3 } = await s.from('question_answers').select('is_best_answer').eq('id', a1.id).single();
    const { data: qAfter3 } = await s.from('community_questions').select('resolved').eq('id', q.id).single();
    if (aAfter3?.is_best_answer) pass(`is_best_answer = true`);
    else fail_('is_best_answer não foi marcado');
    if (qAfter3?.resolved) pass(`question.resolved = true`);
    else fail_('question.resolved não foi marcado');
  } else {
    fail_(`mark_best_answer falhou: ${e6.message}`);
  }

  // 7. FK: resposta com question_id inválido deve falhar
  console.log('\n=== 7. FK: question_id inválido rejeitado ===');
  const { error: e7 } = await s.from('question_answers').insert({
    question_id: '00000000-0000-0000-0000-999999999999',
    author_profile_id: PROF_A, content: 'FK test',
  });
  if (e7?.code === '23503') pass(`FK rejeitada (${e7.code})`);
  else fail_('FK não está ativa');

  // Cleanup
  await s.from('question_answers').delete().eq('question_id', q.id);
  await s.from('community_questions').delete().eq('id', q.id);

  console.log('\n' + '='.repeat(60));
  console.log(`Resultado: ${ok} ✅  ${fail} ❌`);
  if (fail === 0) console.log('✅ question_answers VALIDADO');
  else { console.log('❌ FALHAS'); process.exit(1); }
}
main().catch(e => { console.error(e); process.exit(1); });
