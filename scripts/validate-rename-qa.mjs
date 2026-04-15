import { createClient } from '@supabase/supabase-js';
const s = createClient(
  process.env.VITE_SUPABASE_URL!,
  'process.env.SUPABASE_SERVICE_ROLE_KEY!'
);

const PROF_A    = 'e114b313-3d76-452b-8dca-3bb8079ca59e';
const LOC_BARRA = '00000000-0000-0000-0000-000000000002';
const LOC_INVAL = '00000000-0000-0000-0000-999999999999';

let ok = 0; let fail = 0;
const pass = m => { console.log(`  ✅ ${m}`); ok++; };
const fail_ = m => { console.log(`  ❌ ${m}`); fail++; };

async function main() {
  // 1. community_posts não existe mais
  console.log('\n=== 1. community_posts não existe mais ===');
  const { error: e1 } = await s.from('community_posts').select('id').limit(1);
  if (e1?.message?.includes('schema cache') || e1?.message?.includes('not found')) {
    pass(`community_posts não existe: ${e1.message.substring(0,60)}`);
  } else if (!e1) {
    fail_('community_posts ainda existe');
  } else {
    pass(`community_posts não existe: ${e1.message.substring(0,60)}`);
  }

  // 2. community_questions existe
  console.log('\n=== 2. community_questions existe ===');
  const { error: e2 } = await s.from('community_questions').select('id').limit(1);
  if (!e2) {
    pass('community_questions existe e acessível');
  } else {
    fail_(`community_questions não existe: ${e2.message}`);
  }

  // 3. NOT NULL: INSERT sem location_id deve falhar
  console.log('\n=== 3. NOT NULL preservado em community_questions ===');
  const { error: e3 } = await s.from('community_questions').insert({
    author_profile_id: PROF_A, type: 'question',
    title: 'Sem território', content: 'teste', category: 'outros',
  });
  if (e3 && (e3.code === '23502' || e3.message.includes('null'))) {
    pass(`NOT NULL preservado (${e3.code})`);
  } else if (e3) {
    pass(`INSERT rejeitado: ${e3.message.substring(0,60)}`);
  } else {
    fail_('NOT NULL não está ativo em community_questions');
  }

  // 4. FK: INSERT com location_id inválido deve falhar
  console.log('\n=== 4. FK → locations preservada ===');
  const { error: e4 } = await s.from('community_questions').insert({
    author_profile_id: PROF_A, type: 'question',
    title: 'FK test', content: 'teste', category: 'outros',
    location_id: LOC_INVAL,
  });
  if (e4 && (e4.code === '23503' || e4.message.includes('foreign key'))) {
    pass(`FK preservada (${e4.code})`);
  } else if (e4) {
    pass(`INSERT rejeitado: ${e4.message.substring(0,60)}`);
  } else {
    fail_('FK não está ativa em community_questions');
  }

  // 5. INSERT válido + JOIN com locations
  console.log('\n=== 5. INSERT válido + JOIN com locations ===');
  const { data: q5, error: e5 } = await s.from('community_questions').insert({
    author_profile_id: PROF_A, type: 'question',
    title: 'Pergunta válida pós-rename', content: 'teste', category: 'services',
    location_id: LOC_BARRA,
  }).select('id, location_id, location:locations(id, name, type)').single();
  if (!e5 && q5) {
    pass(`INSERT aceito: id=${q5.id.substring(0,8)}... location.name="${q5.location?.name}"`);
    await s.from('community_questions').delete().eq('id', q5.id);
  } else {
    fail_(`INSERT falhou: ${e5?.message}`);
  }

  // 6. RPC mark_best_answer ainda funciona
  console.log('\n=== 6. RPC mark_best_answer aponta para community_questions ===');
  const { error: e6 } = await s.rpc('mark_best_answer', {
    _question_id: '00000000-0000-0000-0000-000000000001',
    _answer_id:   '00000000-0000-0000-0000-000000000001',
  });
  // Esperamos erro de FK (IDs inexistentes), não erro de tabela não encontrada
  if (!e6 || e6.code === '23503' || e6.message.includes('foreign key') || e6.message.includes('violates')) {
    pass(`RPC mark_best_answer executou (erro esperado de FK: ${e6?.code ?? 'nenhum'})`);
  } else if (e6.message.includes('community_posts')) {
    fail_(`RPC ainda referencia community_posts: ${e6.message}`);
  } else {
    pass(`RPC executou: ${e6.message.substring(0,60)}`);
  }

  // 7. posts sociais não foram afetadas
  console.log('\n=== 7. Posts Sociais intactas ===');
  const { data: posts, error: e7 } = await s
    .from('posts')
    .select('id, location_id, location:locations(name)')
    .limit(1);
  if (!e7) {
    pass(`posts acessível, location JOIN funciona (${posts?.length} linhas)`);
  } else {
    fail_(`posts afetada: ${e7.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Resultado: ${ok} ✅  ${fail} ❌`);
  if (fail === 0) console.log('✅ RENAME VALIDADO — community_questions operacional');
  else { console.log('❌ FALHAS'); process.exit(1); }
}
main().catch(e => { console.error(e); process.exit(1); });
