/**
 * Script: apply-education-analytics-seed.ts
 * 
 * Aplica o seed de analytics para o módulo Education usando o cliente Supabase.
 * Este script é uma alternativa ao psql quando não está disponível.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: VITE_SUPABASE_URL e SUPABASE_SECRET_KEY devem estar definidos em .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configurações do seed
const SEED_CONFIG = {
  businessId: '550e8400-e29b-41d4-a716-446655440000',
  profileId: '550e8400-e29b-41d4-a716-446655440001',
  nicheKey: 'regular_school',
};

// Gerar session ID único
function generateSessionId(prefix: string, index: number, date: Date): string {
  const dateStr = date.toISOString().split('T')[0];
  const hash = Buffer.from(`${prefix}_${index}_${dateStr}`).toString('base64').substring(0, 16);
  return `session_${hash}`;
}

async function cleanupExistingData() {
  console.log('🧹 Limpando dados existentes...');
  
  const { error: eventsError } = await supabase
    .from('education_analytics_events')
    .delete()
    .eq('education_profile_id', SEED_CONFIG.profileId);
    
  if (eventsError) {
    console.error('❌ Erro ao limpar eventos:', eventsError.message);
  } else {
    console.log('✓ Eventos de analytics removidos');
  }
  
  const { error: leadsError } = await supabase
    .from('education_leads')
    .delete()
    .eq('education_profile_id', SEED_CONFIG.profileId);
    
  if (leadsError) {
    console.error('❌ Erro ao limpar leads:', leadsError.message);
  } else {
    console.log('✓ Leads de teste removidos');
  }
}

async function createTestLeads(): Promise<string[]> {
  console.log('👥 Criando leads de teste...');
  
  const leadIds: string[] = [];
  const statuses = ['new', 'contacted', 'visited', 'proposal_sent', 'enrolled'] as const;
  const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'];
  const shifts = ['manha', 'tarde', 'integral'];
  
  for (let i = 1; i <= 20; i++) {
    const statusIndex = i <= 5 ? 4 : i <= 8 ? 3 : i <= 12 ? 2 : i <= 15 ? 1 : 0;
    
    const { data, error } = await supabase
      .from('education_leads')
      .insert({
        education_profile_id: SEED_CONFIG.profileId,
        full_name: `Responsável Teste ${i}`,
        email: `responsavel${i}@teste.com`,
        phone: `(71) 99999-${String(i).padStart(4, '0')}`,
        child_name: `Aluno Teste ${i}`,
        child_age: 6 + (i % 12),
        interest_note: i <= 5 ? 'Interesse em matrícula imediata' : 
                       i <= 10 ? 'Quero visitar a escola' : 
                       i <= 15 ? 'Comparando opções' : 'Entrar em contato',
        status: statuses[statusIndex],
        desired_grade: grades[i % 5],
        desired_shift: shifts[i % 3],
        created_at: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select('id')
      .single();
      
    if (error) {
      console.error(`❌ Erro ao criar lead ${i}:`, error.message);
    } else if (data) {
      leadIds.push(data.id);
    }
  }
  
  console.log(`✓ ${leadIds.length} leads criados`);
  return leadIds;
}

async function createProfileViews() {
  console.log('👁️ Criando profile views...');
  
  const events = [];
  const referrers = ['https://google.com', 'https://instagram.com', 'direct', 'https://achegue.se'];
  
  for (let i = 1; i <= 150; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 60 * 60 * 1000);
    
    events.push({
      education_profile_id: SEED_CONFIG.profileId,
      business_id: SEED_CONFIG.businessId,
      niche_key: SEED_CONFIG.nicheKey,
      event_type: 'profile_view',
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: generateSessionId('profile', i, date),
      metadata: { referrer: referrers[i % 4] },
      created_at: date.toISOString()
    });
  }
  
  const { error } = await supabase
    .from('education_analytics_events')
    .insert(events);
    
  if (error) {
    console.error('❌ Erro ao criar profile views:', error.message);
  } else {
    console.log('✓ 150 profile views criados');
  }
}

async function createWhatsAppClicks() {
  console.log('📱 Criando WhatsApp clicks...');
  
  const events = [];
  const locations = ['hero_section', 'sidebar', 'sticky_header'];
  
  for (let i = 1; i <= 45; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 3.3 * 60 * 60 * 1000);
    
    events.push({
      education_profile_id: SEED_CONFIG.profileId,
      business_id: SEED_CONFIG.businessId,
      niche_key: SEED_CONFIG.nicheKey,
      event_type: 'whatsapp_click',
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: generateSessionId('whatsapp', i * 3, date),
      metadata: { button_location: locations[i % 3] },
      created_at: date.toISOString()
    });
  }
  
  const { error } = await supabase
    .from('education_analytics_events')
    .insert(events);
    
  if (error) {
    console.error('❌ Erro ao criar WhatsApp clicks:', error.message);
  } else {
    console.log('✓ 45 WhatsApp clicks criados');
  }
}

async function createCTAClicks() {
  console.log('🖱️ Criando CTA clicks...');
  
  const events = [];
  const labels = ['Agendar visita', 'Solicitar orcamento'];
  const locations = ['programs_section', 'events_section', 'sidebar'];
  
  for (let i = 1; i <= 30; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 5 * 60 * 60 * 1000);
    
    events.push({
      education_profile_id: SEED_CONFIG.profileId,
      business_id: SEED_CONFIG.businessId,
      niche_key: SEED_CONFIG.nicheKey,
      event_type: 'enrollment_cta_click',
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: generateSessionId('cta', i * 5, date),
      metadata: { 
        ctaLabel: labels[i % 2],
        button_location: locations[i % 3]
      },
      created_at: date.toISOString()
    });
  }
  
  const { error } = await supabase
    .from('education_analytics_events')
    .insert(events);
    
  if (error) {
    console.error('❌ Erro ao criar CTA clicks:', error.message);
  } else {
    console.log('✓ 30 CTA clicks criados');
  }
}

async function createProgramViews() {
  console.log('📚 Criando program views...');
  
  // Buscar programas existentes
  const { data: programs, error: programsError } = await supabase
    .from('education_programs')
    .select('id')
    .eq('education_profile_id', SEED_CONFIG.profileId)
    .limit(10);
    
  if (programsError || !programs || programs.length === 0) {
    console.log('⚠️ Nenhum programa encontrado, pulando program views');
    return;
  }
  
  const events = [];
  
  for (let i = 1; i <= 60; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 2.5 * 60 * 60 * 1000);
    const program = programs[i % programs.length];
    
    events.push({
      education_profile_id: SEED_CONFIG.profileId,
      business_id: SEED_CONFIG.businessId,
      niche_key: SEED_CONFIG.nicheKey,
      event_type: 'program_view',
      program_id: program.id,
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: generateSessionId('program', i * 2, date),
      metadata: { program_name: `Turma ${(i % 9) + 1}º Ano` },
      created_at: date.toISOString()
    });
  }
  
  const { error } = await supabase
    .from('education_analytics_events')
    .insert(events);
    
  if (error) {
    console.error('❌ Erro ao criar program views:', error.message);
  } else {
    console.log('✓ 60 program views criados');
  }
}

async function createEventViews() {
  console.log('📅 Criando event views...');
  
  // Buscar eventos existentes
  const { data: events_list, error: eventsError } = await supabase
    .from('education_events')
    .select('id')
    .eq('education_profile_id', SEED_CONFIG.profileId)
    .limit(5);
    
  if (eventsError || !events_list || events_list.length === 0) {
    console.log('⚠️ Nenhum evento encontrado, pulando event views');
    return;
  }
  
  const events = [];
  const titles = ['Visita Guiada', 'Aula Experimental', 'Feira de Matrícula'];
  
  for (let i = 1; i <= 25; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 6 * 60 * 60 * 1000);
    const event = events_list[i % events_list.length];
    
    events.push({
      education_profile_id: SEED_CONFIG.profileId,
      business_id: SEED_CONFIG.businessId,
      niche_key: SEED_CONFIG.nicheKey,
      event_type: 'event_view',
      education_event_id: event.id,
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: generateSessionId('event', i * 4, date),
      metadata: { event_title: titles[i % 3] },
      created_at: date.toISOString()
    });
  }
  
  const { error } = await supabase
    .from('education_analytics_events')
    .insert(events);
    
  if (error) {
    console.error('❌ Erro ao criar event views:', error.message);
  } else {
    console.log('✓ 25 event views criados');
  }
}

async function createLeadSubmittedEvents(leadIds: string[]) {
  console.log('📝 Criando lead submitted events...');
  
  const events = [];
  const grades = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'];
  
  for (let i = 0; i < leadIds.length; i++) {
    const date = new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000);
    
    events.push({
      education_profile_id: SEED_CONFIG.profileId,
      business_id: SEED_CONFIG.businessId,
      niche_key: SEED_CONFIG.nicheKey,
      event_type: 'lead_submitted',
      lead_id: leadIds[i],
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: generateSessionId('lead', (i + 1) * 7, date),
      metadata: { 
        form_location: 'lead_modal',
        hasGuardian: i < 15,
        desiredGrade: grades[i % 5]
      },
      created_at: date.toISOString()
    });
  }
  
  const { error } = await supabase
    .from('education_analytics_events')
    .insert(events);
    
  if (error) {
    console.error('❌ Erro ao criar lead submitted events:', error.message);
  } else {
    console.log(`✓ ${leadIds.length} lead submitted events criados`);
  }
}

async function createEventInterestEvents() {
  console.log('⭐ Criando event interest events...');
  
  // Buscar eventos existentes
  const { data: events_list, error: eventsError } = await supabase
    .from('education_events')
    .select('id')
    .eq('education_profile_id', SEED_CONFIG.profileId)
    .limit(5);
    
  if (eventsError || !events_list || events_list.length === 0) {
    console.log('⚠️ Nenhum evento encontrado, pulando event interest');
    return;
  }
  
  const events = [];
  const interestTypes = ['confirmed_attendance', 'request_info', 'share_event'];
  
  for (let i = 1; i <= 15; i++) {
    const date = new Date(Date.now() - (i % 30) * 24 * 60 * 60 * 1000 - i * 2 * 60 * 60 * 1000);
    const event = events_list[i % events_list.length];
    
    events.push({
      education_profile_id: SEED_CONFIG.profileId,
      business_id: SEED_CONFIG.businessId,
      niche_key: SEED_CONFIG.nicheKey,
      event_type: 'event_interest',
      education_event_id: event.id,
      source_page: '/educacao/ba/salvador/escola-horizonte',
      session_id: generateSessionId('interest', i * 8, date),
      metadata: { interest_type: interestTypes[i % 3] },
      created_at: date.toISOString()
    });
  }
  
  const { error } = await supabase
    .from('education_analytics_events')
    .insert(events);
    
  if (error) {
    console.error('❌ Erro ao criar event interest events:', error.message);
  } else {
    console.log('✓ 15 event interest events criados');
  }
}

async function verifyData() {
  console.log('\n📊 Verificando dados criados...');
  
  const { data: counts, error } = await supabase
    .from('education_analytics_events')
    .select('event_type, count')
    .eq('education_profile_id', SEED_CONFIG.profileId)
    .group('event_type');
    
  if (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
    return;
  }
  
  console.log('\nEventos criados:');
  if (counts) {
    counts.forEach((row: any) => {
      console.log(`  ${row.event_type}: ${row.count}`);
    });
  }
  
  const { count: totalEvents } = await supabase
    .from('education_analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('education_profile_id', SEED_CONFIG.profileId);
    
  console.log(`\nTotal: ${totalEvents} eventos`);
}

async function main() {
  console.log('🚀 Aplicando seed de analytics para Education\n');
  console.log('========================================\n');
  
  try {
    // 1. Limpar dados existentes
    await cleanupExistingData();
    
    // 2. Criar leads
    const leadIds = await createTestLeads();
    
    // 3. Criar eventos de analytics
    await createProfileViews();
    await createWhatsAppClicks();
    await createCTAClicks();
    await createProgramViews();
    await createEventViews();
    await createLeadSubmittedEvents(leadIds);
    await createEventInterestEvents();
    
    // 4. Verificar dados
    await verifyData();
    
    console.log('\n========================================');
    console.log('✅ Seed aplicado com sucesso!');
    console.log('========================================\n');
    console.log('Próximos passos:');
    console.log('  1. Acesse: /educacao/ba/salvador/escola-horizonte');
    console.log('  2. Dashboard: /perfil/empresas/[business-id]/education/analytics');
    console.log('  3. Verifique o funil de conversão\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao aplicar seed:', error);
    process.exit(1);
  }
}

main();
