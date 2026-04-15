/**
 * Aplica migration e roda 5 testes do RPC invite_profile_member_by_email
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'xhdowzacfujckjelqhtd';

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

async function run() {
  // --- APLICAR MIGRATION ---
  console.log('=== APLICANDO MIGRATION ===');
  const sql = readFileSync('supabase/migrations/20260328000002_rpc_invite_member_secure.sql', 'utf-8');
  await query(sql);
  console.log('OK: migration aplicada\n');

  // Confirmar que RPC existe
  const check = await query(`
    SELECT routine_name, data_type
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'invite_profile_member_by_email';
  `);
  console.log('OK: RPC no banco:', JSON.stringify(check));
  console.log();

  // --- TESTES ---
  // Todos executados via Management API (sem auth.uid()), então:
  // - Teste 1 (não autenticado) vai retornar "Não autenticado" — correto
  // - Testes 2-5 também retornam "Não autenticado" via Management API
  // Para testes 2-5 usamos SET LOCAL role e set_config para simular auth.uid()

  // Buscar um profile_id business/professional real para usar nos testes
  const profiles = await query(`
    SELECT p.id, p.profile_type, p.user_id,
           au.email as owner_email
    FROM profiles p
    JOIN auth.users au ON au.id = p.user_id
    WHERE p.profile_type IN ('business', 'professional')
    LIMIT 1;
  `);

  // Buscar um usuário que NÃO seja owner desse perfil
  let testProfileId = null;
  let ownerUserId = null;
  let nonMemberEmail = null;
  let existingMemberEmail = null;

  if (profiles.length > 0) {
    testProfileId = profiles[0].id;
    ownerUserId = profiles[0].user_id;

    // Usuário que não é membro
    const others = await query(`
      SELECT au.id, au.email
      FROM auth.users au
      WHERE au.id != '${ownerUserId}'
        AND au.id NOT IN (
          SELECT user_id FROM profile_members WHERE profile_id = '${testProfileId}'
        )
      LIMIT 2;
    `);

    if (others.length >= 1) nonMemberEmail = others[0].email;

    // Usuário que já é membro
    const members = await query(`
      SELECT au.email
      FROM profile_members pm
      JOIN auth.users au ON au.id = pm.user_id
      WHERE pm.profile_id = '${testProfileId}'
      LIMIT 1;
    `);
    if (members.length > 0) existingMemberEmail = members[0].email;
  }

  console.log('=== CONTEXTO DOS TESTES ===');
  console.log('profile_id:', testProfileId ?? '(nenhum perfil business/professional encontrado)');
  console.log('owner_id:', ownerUserId ?? '-');
  console.log('email para teste de sucesso:', nonMemberEmail ?? '(nenhum usuário disponível)');
  console.log('email já membro:', existingMemberEmail ?? '(nenhum membro ainda)');
  console.log();

  // Helper: simular auth.uid() via set_config
  const asUser = (userId, sql) => `
    SET LOCAL role TO authenticated;
    SELECT set_config('request.jwt.claims', '{"sub":"${userId}","role":"authenticated"}', true);
    SELECT set_config('request.jwt.claim.sub', '${userId}', true);
    ${sql}
  `;

  // TESTE 1: Não autenticado (sem set_config de uid)
  console.log('--- TESTE 1: Não autenticado ---');
  const t1 = await query(`SELECT invite_profile_member_by_email('00000000-0000-0000-0000-000000000000', 'x@x.com', 'member');`);
  console.log('Resultado:', JSON.stringify(t1[0]?.invite_profile_member_by_email ?? t1));
  console.log();

  // TESTE 2: Email vazio
  console.log('--- TESTE 2: Email vazio ---');
  const t2 = await query(`
    SELECT set_config('request.jwt.claim.sub', '${ownerUserId ?? '00000000-0000-0000-0000-000000000000'}', true);
    SELECT invite_profile_member_by_email('${testProfileId ?? '00000000-0000-0000-0000-000000000000'}', '   ', 'member');
  `);
  const t2r = t2.find(r => r.invite_profile_member_by_email !== undefined);
  console.log('Resultado:', JSON.stringify(t2r?.invite_profile_member_by_email ?? t2));
  console.log();

  // TESTE 3: Role inválida (owner bloqueado)
  console.log('--- TESTE 3: Role owner bloqueada ---');
  const t3 = await query(`
    SELECT set_config('request.jwt.claim.sub', '${ownerUserId ?? '00000000-0000-0000-0000-000000000000'}', true);
    SELECT invite_profile_member_by_email('${testProfileId ?? '00000000-0000-0000-0000-000000000000'}', 'x@x.com', 'owner');
  `);
  const t3r = t3.find(r => r.invite_profile_member_by_email !== undefined);
  console.log('Resultado:', JSON.stringify(t3r?.invite_profile_member_by_email ?? t3));
  console.log();

  // TESTE 4: Email inexistente (com owner autenticado)
  console.log('--- TESTE 4: Email inexistente ---');
  if (testProfileId && ownerUserId) {
    const t4 = await query(`
      SELECT set_config('request.jwt.claim.sub', '${ownerUserId}', true);
      SELECT invite_profile_member_by_email('${testProfileId}', 'nao-existe-xpto99999@fake.com', 'member');
    `);
    const t4r = t4.find(r => r.invite_profile_member_by_email !== undefined);
    console.log('Resultado:', JSON.stringify(t4r?.invite_profile_member_by_email ?? t4));
  } else {
    console.log('SKIP: sem perfil disponível');
  }
  console.log();

  // TESTE 5: Usuário já membro
  console.log('--- TESTE 5: Usuário já membro ---');
  if (testProfileId && ownerUserId && existingMemberEmail) {
    const t5 = await query(`
      SELECT set_config('request.jwt.claim.sub', '${ownerUserId}', true);
      SELECT invite_profile_member_by_email('${testProfileId}', '${existingMemberEmail}', 'member');
    `);
    const t5r = t5.find(r => r.invite_profile_member_by_email !== undefined);
    console.log('Resultado:', JSON.stringify(t5r?.invite_profile_member_by_email ?? t5));
  } else {
    console.log('SKIP: sem membro existente para testar (perfil novo)');
  }
  console.log();

  // TESTE 6: Sucesso (adicionar membro real)
  console.log('--- TESTE 6: Sucesso ---');
  if (testProfileId && ownerUserId && nonMemberEmail) {
    const t6 = await query(`
      SELECT set_config('request.jwt.claim.sub', '${ownerUserId}', true);
      SELECT invite_profile_member_by_email('${testProfileId}', '${nonMemberEmail}', 'member');
    `);
    const t6r = t6.find(r => r.invite_profile_member_by_email !== undefined);
    console.log('Resultado:', JSON.stringify(t6r?.invite_profile_member_by_email ?? t6));

    // Confirmar no banco (sem expor user_id — só contar)
    const confirm = await query(`
      SELECT COUNT(*) as total_membros
      FROM profile_members
      WHERE profile_id = '${testProfileId}';
    `);
    console.log('Membros no perfil após insert:', confirm[0]?.total_membros);
  } else {
    console.log('SKIP: sem usuário disponível para adicionar');
  }
  console.log();

  console.log('=== CONCLUÍDO ===');
}

run().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
