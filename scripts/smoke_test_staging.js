/**
 * Smoke tests de staging — Migration Rede/Filiais
 * Executa todos os cenários críticos diretamente no banco
 *
 * USO:
 *   SUPABASE_DB_PASSWORD=<senha> node scripts/smoke_test_staging.js
 */

import pg from 'pg';
const { Client } = pg;

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error('❌ SUPABASE_DB_PASSWORD não definida'); process.exit(1); }

const client = new Client({
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.xhdowzacfujckjelqhtd',
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

let passed = 0, failed = 0;
const ok  = (m) => { console.log(`  ✅ ${m}{'='.repeat(60)}\n${title}\n${'='.repeat(60)}`); }

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado ao banco de staging\n');

  // ── 1. CONSTRAINTS ──────────────────────────────────────────────────────────
  section('1. CONSTRAINTS DE INTEGRIDADE');

  // 1.1 standalone sem location_id deve falhar
  try {
    await client.query(`
      INSERT INTO business_data (profile_id, business_name, business_role, slug, status, category)
      VALUES (gen_random_uuid(), 'Teste Constraint', 'standalone', 'teste-constraint-fail', 'active', 'outros')
    `);
    fail('standalone sem location_id deveria ter falhado');
  } catch (e) {
    if (e.message.includes('check_standalone_has_location')) {
      ok('standalone sem location_id rejeitado (check_standalone_has_location)');
    } else {
      fail(`Erro inesperado: ${e.message}`);
    }
  }

  // 1.2 standalone com parent deve falhar
  try {
    const loc = await client.query(`SELECT id FROM locations WHERE type = 'district' LIMIT 1`);
    const locId = loc.rows[0]?.id;
    if (!locId) { fail('Nenhuma location disponível para teste'); }
    else {
      await client.query(`
        INSERT INTO business_data (profile_id, business_name, business_role, parent_business_id, location_id, slug, status, category)
        VALUES (gen_random_uuid(), 'Teste Constraint', 'standalone', gen_random_uuid(), $1, 'teste-constraint-fail-2', 'active', 'outros')
      `, [locId]);
      fail('standalone com parent deveria ter falhado');
    }
  } catch (e) {
    if (e.message.includes('check_standalone_no_parent') || e.message.includes('check_parent_is_brand_hub')) {
      ok('standalone com parent rejeitado');
    } else {
      fail(`Erro inesperado: ${e.message}`);
    }
  }

  // 1.3 brand_hub com location_id deve falhar
  try {
    const loc = await client.query(`SELECT id FROM locations WHERE type = 'district' LIMIT 1`);
    const locId = loc.rows[0]?.id;
    if (!locId) { fail('Nenhuma location disponível'); }
    else {
      await client.query(`
        INSERT INTO business_data (profile_id, business_name, business_role, location_id, slug, status, category)
        VALUES (gen_random_uuid(), 'Teste Brand Hub', 'brand_hub', $1, 'teste-brand-hub-fail', 'active', 'outros')
      `, [locId]);
      fail('brand_hub com location_id deveria ter falhado');
    }
  } catch (e) {
    if (e.message.includes('check_brand_hub_no_location')) {
      ok('brand_hub com location_id rejeitado (check_brand_hub_no_location)');
    } else {
      fail(`Erro inesperado: ${e.message}`);
    }
  }

  // ── 2. CASO CRÍTICO: SLUG REPETIDO EM BAIRROS DIFERENTES ────────────────────
  section('2. CASO CRÍTICO: SLUG REPETIDO EM BAIRROS DIFERENTES');

  // Buscar dois bairros distintos
  const locs = await client.query(`
    SELECT id, name, geographic_path FROM locations 
    WHERE type = 'district' AND status = 'active'
    ORDER BY name LIMIT 2
  `);

  if (locs.rows.length < 2) {
    fail('Menos de 2 bairros disponíveis para teste de slug repetido');
  } else {
    const loc1 = locs.rows[0];
    const loc2 = locs.rows[1];
    const testSlug = 'sabor-da-bahia-smoke-test';
    const profileId1 = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
    const profileId2 = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;

    // Criar profiles primeiro
    await client.query(`
      INSERT INTO profiles (id, user_id, profile_type, name)
      VALUES ($1, gen_random_uuid(), 'business', 'Smoke Test Empresa 1')
    `, [profileId1]);
    await client.query(`
      INSERT INTO profiles (id, user_id, profile_type, name)
      VALUES ($1, gen_random_uuid(), 'business', 'Smoke Test Empresa 2')
    `, [profileId2]);

    // 2.1 Criar empresa 1 no bairro 1
    try {
      await client.query(`
        INSERT INTO business_data (profile_id, business_name, business_role, location_id, slug, status, category)
        VALUES ($1, 'Smoke Test 1', 'standalone', $2, $3, 'active', 'outros')
      `, [profileId1, loc1.id, testSlug]);
      ok(`Empresa 1 criada: slug=${testSlug} bairro=${loc1.name}`);
    } catch (e) {
      fail(`Falha ao criar empresa 1: ${e.message}`);
    }

    // 2.2 Criar empresa 2 no bairro 2 com MESMO slug
    try {
      await client.query(`
        INSERT INTO business_data (profile_id, business_name, business_role, location_id, slug, status, category)
        VALUES ($1, 'Smoke Test 2', 'standalone', $2, $3, 'active', 'outros')
      `, [profileId2, loc2.id, testSlug]);
      ok(`Empresa 2 criada: slug=${testSlug} bairro=${loc2.name} (mesmo slug, bairro diferente)`);
    } catch (e) {
      fail(`Falha ao criar empresa 2 com mesmo slug em bairro diferente: ${e.message}`);
    }

    // 2.3 Verificar que ambas existem
    const both = await client.query(`
      SELECT bd.slug, l.name as bairro, l.geographic_path
      FROM business_data bd
      JOIN locations l ON l.id = bd.location_id
      WHERE bd.slug = $1 AND bd.status = 'active'
      ORDER BY l.name
    `, [testSlug]);

    if (both.rows.length === 2) {
      ok(`Ambas as empresas coexistem com slug=${testSlug}`);
      ok(`  Empresa 1: ${both.rows[0].bairro} (${both.rows[0].geographic_path})`);
      ok(`  Empresa 2: ${both.rows[1].bairro} (${both.rows[1].geographic_path})`);
    } else {
      fail(`Esperado 2 empresas, encontrado ${both.rows.length}`);
    }

    // 2.4 Tentar criar terceira empresa no bairro 1 com mesmo slug (deve falhar)
    const profileId3 = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
    await client.query(`
      INSERT INTO profiles (id, user_id, profile_type, name)
      VALUES ($1, gen_random_uuid(), 'business', 'Smoke Test Empresa 3')
    `, [profileId3]);
    try {
      await client.query(`
        INSERT INTO business_data (profile_id, business_name, business_role, location_id, slug, status, category)
        VALUES ($1, 'Smoke Test 3', 'standalone', $2, $3, 'active', 'outros')
      `, [profileId3, loc1.id, testSlug]);
      fail('Colisão de slug no mesmo bairro deveria ter falhado');
    } catch (e) {
      if (e.message.includes('idx_business_data_slug_per_location') || e.message.includes('unique')) {
        ok('Colisão de slug no mesmo bairro rejeitada (idx_business_data_slug_per_location)');
      } else {
        fail(`Erro inesperado na colisão: ${e.message}`);
      }
    }

    // Cleanup
    await client.query(`DELETE FROM business_data WHERE slug = $1`, [testSlug]);
    await client.query(`DELETE FROM profiles WHERE id IN ($1, $2, $3)`, [profileId1, profileId2, profileId3]);
  }

  // ── 3. CONVERSÃO STANDALONE → REDE ──────────────────────────────────────────
  section('3. CONVERSÃO STANDALONE → REDE');

  const loc = await client.query(`SELECT id, name FROM locations WHERE type = 'district' AND status = 'active' LIMIT 1`);
  const locId = loc.rows[0]?.id;
  const locName = loc.rows[0]?.name;

  if (!locId) {
    fail('Nenhuma location disponível para teste de conversão');
  } else {
    const profileStandalone = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
    const profileBrandHub = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;

    await client.query(`INSERT INTO profiles (id, user_id, profile_type, name) VALUES ($1, gen_random_uuid(), 'business', 'Standalone Original')`, [profileStandalone]);
    await client.query(`INSERT INTO profiles (id, user_id, profile_type, name) VALUES ($1, gen_random_uuid(), 'business', 'Marca Central')`, [profileBrandHub]);

    // Criar standalone
    await client.query(`
      INSERT INTO business_data (profile_id, business_name, business_role, location_id, slug, status, category)
      VALUES ($1, 'Standalone Original', 'standalone', $2, 'standalone-original-test', 'active', 'outros')
    `, [profileStandalone, locId]);
    ok(`Standalone criado: slug=standalone-original-test bairro=${locName}`);

    // Criar brand_hub (sem location_id)
    await client.query(`
      INSERT INTO business_data (profile_id, business_name, business_role, slug, status, category)
      VALUES ($1, 'Marca Central', 'brand_hub', 'marca-central-test', 'active', 'outros')
    `, [profileBrandHub]);
    ok('Brand hub criado: slug=marca-central-test (sem location_id)');

    // Converter standalone → branch
    await client.query(`
      UPDATE business_data 
      SET business_role = 'branch', parent_business_id = $1, is_headquarters = true, unit_name = $2
      WHERE profile_id = $3
    `, [profileBrandHub, `Unidade ${locName}`, profileStandalone]);
    ok('Standalone convertido para branch (URL preservada)');

    // Verificar que slug e location_id foram preservados
    const check = await client.query(`
      SELECT slug, location_id, business_role, is_headquarters, unit_name
      FROM business_data WHERE profile_id = $1
    `, [profileStandalone]);
    const row = check.rows[0];
    if (row.slug === 'standalone-original-test' && row.location_id === locId && row.business_role === 'branch') {
      ok('URL preservada após conversão: slug e location_id inalterados');
    } else {
      fail(`URL não preservada: slug=${row.slug} location_id=${row.location_id} role=${row.business_role}`);
    }

    // Cleanup
    await client.query(`DELETE FROM business_data WHERE profile_id IN ($1, $2)`, [profileStandalone, profileBrandHub]);
    await client.query(`DELETE FROM profiles WHERE id IN ($1, $2)`, [profileStandalone, profileBrandHub]);
  }

  // ── 4. BRAND_HUB FORA DE LISTAGENS TERRITORIAIS ─────────────────────────────
  section('4. BRAND_HUB FORA DE LISTAGENS TERRITORIAIS');

  // Verificar que a policy "Territorial businesses public read" existe
  const policies = await client.query(`
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'business_data'
    ORDER BY policyname
  `);
  const policyNames = policies.rows.map(r => r.policyname);

  if (policyNames.includes('Territorial businesses public read')) {
    ok('Policy "Territorial businesses public read" existe');
  } else {
    fail('Policy "Territorial businesses public read" NÃO encontrada');
  }

  if (policyNames.includes('Brand hubs public read')) {
    ok('Policy "Brand hubs public read" existe');
  } else {
    fail('Policy "Brand hubs public read" NÃO encontrada');
  }

  if (policyNames.includes('Profile members manage business')) {
    ok('Policy "Profile members manage business" existe');
  } else {
    fail('Policy "Profile members manage business" NÃO encontrada');
  }

  // Verificar que brand_hub não aparece em query territorial
  const loc2 = await client.query(`SELECT id FROM locations WHERE type = 'district' AND status = 'active' LIMIT 1`);
  const locId2 = loc2.rows[0]?.id;
  if (locId2) {
    const profileBH = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
    await client.query(`INSERT INTO profiles (id, user_id, profile_type, name) VALUES ($1, gen_random_uuid(), 'business', 'Brand Hub Test')`, [profileBH]);
    await client.query(`
      INSERT INTO business_data (profile_id, business_name, business_role, slug, status, category)
      VALUES ($1, 'Brand Hub Test', 'brand_hub', 'brand-hub-isolation-test', 'active', 'outros')
    `, [profileBH]);

    // Query territorial (como faria o BusinessService)
    const territorial = await client.query(`
      SELECT profile_id, business_role FROM business_data
      WHERE location_id = $1 AND status = 'active'
        AND business_role IN ('standalone', 'branch')
    `, [locId2]);

    const brandHubInTerritorial = territorial.rows.some(r => r.profile_id === profileBH);
    if (!brandHubInTerritorial) {
      ok('Brand hub NÃO aparece em query territorial (filtro business_role funciona)');
    } else {
      fail('Brand hub APARECE em query territorial — isolamento falhou');
    }

    // Cleanup
    await client.query(`DELETE FROM business_data WHERE profile_id = $1`, [profileBH]);
    await client.query(`DELETE FROM profiles WHERE id = $1`, [profileBH]);
  }

  // ── 5. POLICIES COM PROFILE_MEMBERS ─────────────────────────────────────────
  section('5. POLICIES COM PROFILE_MEMBERS');

  const pmCount = await client.query(`SELECT COUNT(*) as total FROM profile_members WHERE role IN ('owner', 'admin')`);
  const total = parseInt(pmCount.rows[0].total);
  if (total >= 2) {
    ok(`${total} profile_members com role owner/admin existem`);
  } else {
    fail(`Apenas ${total} profile_members — esperado >= 2`);
  }

  // Verificar que policy usa profile_members
  const policyDef = await client.query(`
    SELECT pg_get_expr(qual, 'business_data'::regclass) as using_expr
    FROM pg_policy 
    WHERE polname = 'Profile members manage business'
      AND polrelid = 'business_data'::regclass
  `);
  if (policyDef.rows.length > 0 && policyDef.rows[0].using_expr?.includes('profile_members')) {
    ok('Policy "Profile members manage business" referencia profile_members');
  } else {
    fail('Policy não referencia profile_members corretamente');
  }

  // ── 6. CRIAÇÃO DE BRANCH ─────────────────────────────────────────────────────
  section('6. CRIAÇÃO DE BRANCH');

  const locs2 = await client.query(`SELECT id, name FROM locations WHERE type = 'district' AND status = 'active' ORDER BY name LIMIT 2`);
  if (locs2.rows.length >= 2) {
    const pBrand = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
    const pBranch1 = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;
    const pBranch2 = (await client.query(`SELECT gen_random_uuid() as id`)).rows[0].id;

    await client.query(`INSERT INTO profiles (id, user_id, profile_type, name) VALUES ($1, gen_random_uuid(), 'business', 'Marca Branch Test')`, [pBrand]);
    await client.query(`INSERT INTO profiles (id, user_id, profile_type, name) VALUES ($1, gen_random_uuid(), 'business', 'Branch 1')`, [pBranch1]);
    await client.query(`INSERT INTO profiles (id, user_id, profile_type, name) VALUES ($1, gen_random_uuid(), 'business', 'Branch 2')`, [pBranch2]);

    await client.query(`
      INSERT INTO business_data (profile_id, business_name, business_role, slug, status, category)
      VALUES ($1, 'Marca Branch Test', 'brand_hub', 'marca-branch-test', 'active', 'outros')
    `, [pBrand]);

    try {
      await client.query(`
        INSERT INTO business_data (profile_id, business_name, business_role, parent_business_id, location_id, slug, status, category, is_headquarters, unit_name)
        VALUES ($1, 'Branch 1', 'branch', $2, $3, 'branch-test-slug', 'active', 'outros', true, $4)
      `, [pBranch1, pBrand, locs2.rows[0].id, `Unidade ${locs2.rows[0].name}`]);
      ok(`Branch 1 criada: bairro=${locs2.rows[0].name} is_headquarters=true`);
    } catch (e) {
      fail(`Falha ao criar branch 1: ${e.message}`);
    }

    try {
      await client.query(`
        INSERT INTO business_data (profile_id, business_name, business_role, parent_business_id, location_id, slug, status, category, is_headquarters, unit_name)
        VALUES ($1, 'Branch 2', 'branch', $2, $3, 'branch-test-slug', 'active', 'outros', false, $4)
      `, [pBranch2, pBrand, locs2.rows[1].id, `Unidade ${locs2.rows[1].name}`]);
      ok(`Branch 2 criada: bairro=${locs2.rows[1].name} mesmo slug, bairro diferente`);
    } catch (e) {
      fail(`Falha ao criar branch 2: ${e.message}`);
    }

    // Verificar get_brand_branches
    const branches = await client.query(`SELECT * FROM get_brand_branches($1)`, [pBrand]);
    if (branches.rows.length === 2) {
      ok(`get_brand_branches retornou ${branches.rows.length} branches`);
    } else {
      fail(`get_brand_branches retornou ${branches.rows.length} (esperado 2)`);
    }

    // Cleanup
    await client.query(`DELETE FROM business_data WHERE profile_id IN ($1, $2, $3)`, [pBrand, pBranch1, pBranch2]);
    await client.query(`DELETE FROM profiles WHERE id IN ($1, $2, $3)`, [pBrand, pBranch1, pBranch2]);
  } else {
    fail('Menos de 2 bairros disponíveis para teste de branch');
  }

  // ── RESULTADO FINAL ──────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULTADO: ${passed} passaram, ${failed} falharam`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n✅ STAGING PASSOU — migration pode ser promovida para produção');
  } else {
    console.log('\n❌ STAGING FALHOU — corrigir antes de promover para produção');
  }

  await client.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Erro fatal:', e.message);
  process.exit(1);
});
