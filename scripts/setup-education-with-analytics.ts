/**
 * Script: setup-education-with-analytics.ts
 * 
 * Cria dados completos de education (business, profile, programs, events, leads)
 * e aplica o seed de analytics para testar o funil de matrícula.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// IDs fixos para teste
const TEST_IDS = {
  business: '550e8400-e29b-41d4-a716-446655440000',
  profile: '550e8400-e29b-41d4-a716-446655440001',
  location: '550e8400-e29b-41d4-a716-446655440002',
};

async function setupLocation() {
  console.log('📍 Buscando location existente...');
  
  // Buscar uma location ativa
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, geographic_path')
    .eq('status', 'active')
    .limit(1)
    .single();
    
  if (error) {
    console.error('❌ Erro ao buscar location:', error.message);
    return null;
  }
  
  console.log('✓ Location encontrada:', data.name, `(${data.geographic_path})`);
  return data.id;
}

async function setupBusiness(locationId: string) {
  console.log('🏢 Verificando business existente...');
  
  // Tentar buscar business existente
  const { data: existing, error: existingError } = await supabase
    .from('business_data')
    .select('id')
    .eq('id', TEST_IDS.business)
    .maybeSingle();
    
  if (!existingError && existing) {
    console.log('✓ Business já existe:', existing.id);
    return existing.id;
  }
  
  // Buscar um profile de usuário existente
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .maybeSingle();
    
  if (userError || !userProfile) {
    console.error('❌ Erro: Nenhum usuário encontrado:', userError?.message);
    return null;
  }
  
  const { data, error } = await supabase
    .from('business_data')
    .upsert({
      id: TEST_IDS.business,
      profile_id: userProfile.id,
      business_name: 'Escola Horizonte',
      category: 'educacao',
      description: 'Escola completa com ensino fundamental e médio, focada em excelência acadêmica e formação integral dos alunos.',
      slug: 'escola-horizonte',
      status: 'active',
      location_id: locationId,
    }, { onConflict: 'id' })
    .select('id')
    .single();
    
  if (error) {
    console.error('❌ Erro ao criar business:', error.message);
    return null;
  }
  
  console.log('✓ Business criado:', data.id);
  return data.id;
}

async function setupEducationProfile() {
  console.log('🏫 Criando education profile...');
  
  const { data, error } = await supabase
    .from('education_profiles')
    .upsert({
      id: TEST_IDS.profile,
      business_id: TEST_IDS.business,
      institution_type: 'Escola Regular',
      niche_key: 'regular_school',
      support_level: 'full_enabled',
      summary: 'Escola completa com ensino fundamental e médio, focada em excelência acadêmica. Oferecemos turmas do 1º ao 9º ano do fundamental e ensino médio completo.',
      whatsapp_number: '71999999999',
      status: 'published',
      published_at: new Date().toISOString(),
      // Campos específicos de regular_school
      school_type: 'private_school',
      education_levels: ['elementary', 'high_school'],
      shifts: ['morning', 'afternoon', 'full_time'],
      age_range_min: 6,
      age_range_max: 18,
      enrollment_open: true,
    }, { onConflict: 'id' })
    .select('id')
    .single();
    
  if (error) {
    console.error('❌ Erro ao criar education profile:', error.message);
    return null;
  }
  
  console.log('✓ Education profile criado:', data.id);
  return data.id;
}

async function setupPrograms() {
  console.log('📚 Criando programs...');
  
  const programs = [
    { name: '1º Ano Fundamental', grade: '1º Ano', level: 'elementary', age: '6-7 anos', shift: 'morning' },
    { name: '2º Ano Fundamental', grade: '2º Ano', level: 'elementary', age: '7-8 anos', shift: 'morning' },
    { name: '3º Ano Fundamental', grade: '3º Ano', level: 'elementary', age: '8-9 anos', shift: 'morning' },
    { name: '4º Ano Fundamental', grade: '4º Ano', level: 'elementary', age: '9-10 anos', shift: 'afternoon' },
    { name: '5º Ano Fundamental', grade: '5º Ano', level: 'elementary', age: '10-11 anos', shift: 'afternoon' },
    { name: '6º Ano Fundamental', grade: '6º Ano', level: 'elementary', age: '11-12 anos', shift: 'morning' },
    { name: '7º Ano Fundamental', grade: '7º Ano', level: 'elementary', age: '12-13 anos', shift: 'morning' },
    { name: '8º Ano Fundamental', grade: '8º Ano', level: 'elementary', age: '13-14 anos', shift: 'afternoon' },
    { name: '9º Ano Fundamental', grade: '9º Ano', level: 'elementary', age: '14-15 anos', shift: 'afternoon' },
  ];
  
  const createdIds: string[] = [];
  
  for (const prog of programs) {
    const { data, error } = await supabase
      .from('education_programs')
      .insert({
        education_profile_id: TEST_IDS.profile,
        name: prog.name,
        description: `Turma de ${prog.grade} com foco em desenvolvimento integral.`,
        age_group: prog.age,
        shift: prog.shift,
        modality: 'presencial',
        education_level: prog.level,
        grade: prog.grade,
        class_name: `Turma ${prog.grade.charAt(0)}${String(Math.floor(Math.random() * 3) + 1).padStart(2, '0')}`,
        max_capacity: 25 + Math.floor(Math.random() * 10),
        current_enrollment: Math.floor(Math.random() * 20),
        schedule: prog.shift === 'morning' 
          ? '07:30 - 12:00' 
          : prog.shift === 'afternoon' 
            ? '13:30 - 18:00' 
            : '07:30 - 17:00',
        is_active: true,
        display_order: parseInt(prog.grade),
      })
      .select('id')
      .single();
      
    if (error) {
      console.error(`❌ Erro ao criar program ${prog.name}:`, error.message);
    } else if (data) {
      createdIds.push(data.id);
    }
  }
  
  console.log(`✓ ${createdIds.length} programs criados`);
  return createdIds;
}

async function setupEvents() {
  console.log('📅 Criando events...');
  
  const now = new Date();
  const events = [
    {
      title: 'Visita Guiada - Conheça a Escola',
      description: 'Venha conhecer nossa estrutura, salas de aula, laboratórios e áreas de lazer.',
      starts_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      ends_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      location: 'Escola Horizonte - Hall de Entrada',
      school_event_type: 'school_tour',
    },
    {
      title: 'Aula Experimental de Matemática',
      description: 'Aula demonstrativa com nossos professores para alunos do 6º ano.',
      starts_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      ends_at: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      location: 'Sala 201 - Bloco B',
      school_event_type: 'class_preview',
    },
    {
      title: 'Feira de Matrícula 2026',
      description: 'Evento especial com descontos para matrículas antecipadas.',
      starts_at: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      ends_at: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      location: 'Auditório Principal',
      school_event_type: 'enrollment_fair',
    },
  ];
  
  const createdIds: string[] = [];
  
  for (const evt of events) {
    const { data, error } = await supabase
      .from('education_events')
      .insert({
        education_profile_id: TEST_IDS.profile,
        title: evt.title,
        description: evt.description,
        starts_at: evt.starts_at.toISOString(),
        ends_at: evt.ends_at.toISOString(),
        location: evt.location,
        is_public: true,
        school_event_type: evt.school_event_type,
      })
      .select('id')
      .single();
      
    if (error) {
      console.error(`❌ Erro ao criar event ${evt.title}:`, error.message);
    } else if (data) {
      createdIds.push(data.id);
    }
  }
  
  console.log(`✓ ${createdIds.length} events criados`);
  return createdIds;
}

async function setupAnalytics(programIds: string[], eventIds: string[]) {
  console.log('\n📊 Criando analytics events...\n');
  
  // Limpar dados existentes
  await supabase.from('education_analytics_events')
    .delete()
    .eq('education_profile_id', TEST_IDS.profile);
  
  await supabase.from('education_leads')
    .delete()
    .eq('education_profile_id', TEST_IDS.profile);
  
  const events = [];
  const referrers = ['https://google.com', 'https://instagram.com', 'direct', 'https://achegue.se'];
  const locations = ['hero_section', 'sidebar', 'sticky_header'];
  const ctaLabels = ['Agendar visita', 'Solicitar orçamento'];
  const ctaLocations = ['programs_section', 'events_section', 'sidebar'];
  
  // 1. Profile Views (150)
  for (let i = 1; i <= 150; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 60 * 60 * 1000);
    events.push({
      education_profile_id: TEST_IDS.profile,
      business_id: TEST_IDS.business,
      niche_key: 'regular_school',
      event_type: 'profile_view',
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: `session_${i}_${date.toISOString().split('T')[0]}`,
      metadata: { referrer: referrers[i % 4] },
      created_at: date.toISOString()
    });
  }
  
  // 2. WhatsApp Clicks (45)
  for (let i = 1; i <= 45; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 3.3 * 60 * 60 * 1000);
    events.push({
      education_profile_id: TEST_IDS.profile,
      business_id: TEST_IDS.business,
      niche_key: 'regular_school',
      event_type: 'whatsapp_click',
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: `session_whatsapp_${i}_${date.toISOString().split('T')[0]}`,
      metadata: { button_location: locations[i % 3] },
      created_at: date.toISOString()
    });
  }
  
  // 3. CTA Clicks (30)
  for (let i = 1; i <= 30; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 5 * 60 * 60 * 1000);
    events.push({
      education_profile_id: TEST_IDS.profile,
      business_id: TEST_IDS.business,
      niche_key: 'regular_school',
      event_type: 'enrollment_cta_click',
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: `session_cta_${i}_${date.toISOString().split('T')[0]}`,
      metadata: { 
        ctaLabel: ctaLabels[i % 2],
        button_location: ctaLocations[i % 3]
      },
      created_at: date.toISOString()
    });
  }
  
  // 4. Program Views (60)
  for (let i = 1; i <= 60; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 2.5 * 60 * 60 * 1000);
    events.push({
      education_profile_id: TEST_IDS.profile,
      business_id: TEST_IDS.business,
      niche_key: 'regular_school',
      event_type: 'program_view',
      program_id: programIds[i % programIds.length],
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: `session_program_${i}_${date.toISOString().split('T')[0]}`,
      metadata: { program_name: `Turma ${(i % 9) + 1}º Ano` },
      created_at: date.toISOString()
    });
  }
  
  // 5. Event Views (25)
  for (let i = 1; i <= 25; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 6 * 60 * 60 * 1000);
    events.push({
      education_profile_id: TEST_IDS.profile,
      business_id: TEST_IDS.business,
      niche_key: 'regular_school',
      event_type: 'event_view',
      education_event_id: eventIds[i % eventIds.length],
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: `session_event_${i}_${date.toISOString().split('T')[0]}`,
      metadata: { event_title: ['Visita Guiada', 'Aula Experimental', 'Feira de Matrícula'][i % 3] },
      created_at: date.toISOString()
    });
  }
  
  // Inserir em lotes de 50
  for (let i = 0; i < events.length; i += 50) {
    const batch = events.slice(i, i + 50);
    const { error } = await supabase.from('education_analytics_events').insert(batch);
    if (error) {
      console.error(`❌ Erro ao inserir lote ${i/50 + 1}:`, error.message);
    }
  }
  
  console.log(`✓ ${events.length} analytics events criados`);
}

async function main() {
  console.log('🚀 Setup Education com Analytics\n');
  console.log('========================================\n');
  
  try {
    // 1. Location
    const locationId = await setupLocation();
    if (!locationId) {
      console.error('❌ Falha ao criar location');
      return;
    }
    
    // 2. Business
    const businessId = await setupBusiness(locationId);
    if (!businessId) {
      console.error('❌ Falha ao criar business');
      return;
    }
    
    // 3. Education Profile
    const profileId = await setupEducationProfile();
    if (!profileId) {
      console.error('❌ Falha ao criar education profile');
      return;
    }
    
    // 4. Programs
    const programIds = await setupPrograms();
    
    // 5. Events
    const eventIds = await setupEvents();
    
    // 6. Analytics
    await setupAnalytics(programIds, eventIds);
    
    console.log('\n========================================');
    console.log('✅ Setup completo!');
    console.log('========================================\n');
    console.log('Dados criados:');
    console.log(`  📍 Location: ${locationId}`);
    console.log(`  🏢 Business: ${businessId}`);
    console.log(`  🏫 Profile: ${profileId}`);
    console.log(`  📚 Programs: ${programIds.length}`);
    console.log(`  📅 Events: ${eventIds.length}`);
    console.log(`  📊 Analytics: 335 eventos`);
    console.log('\nURLs para testar:');
    console.log(`  Pública: /educacao/ba/salvador/pituba/escola-horizonte`);
    console.log(`  Dashboard: /perfil/empresas/${businessId}/education/analytics`);
    
  } catch (error) {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  }
}

main();
