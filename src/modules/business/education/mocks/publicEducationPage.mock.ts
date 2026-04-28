import type { EducationEvent, EducationProfile, EducationProgram } from '../types';

export interface EducationDetailPreview {
  slug: string;
  state: string;
  city: string;
  district: string;
  institutionName: string;
  profile: EducationProfile;
  programs: EducationProgram[];
  events: EducationEvent[];
  highlights: string[];
  stats: Array<{ label: string; value: string }>;
}

export const educationLandingPreviewProfiles: EducationProfile[] = [
  {
    id: 'preview-regular-school',
    business_id: 'preview-business-1',
    institution_type: 'Colegio Horizonte',
    niche_key: 'regular_school',
    support_level: 'basic_enabled',
    summary:
      'Ensino infantil ao medio com foco em projeto de vida, laboratorio maker e apoio pedagogico continuo.',
    whatsapp_number: '5571999887766',
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preview-language-school',
    business_id: 'preview-business-2',
    institution_type: 'StartUp Idiomas',
    niche_key: 'language_school',
    support_level: 'basic_enabled',
    summary:
      'Cursos de ingles e espanhol por niveis com aula experimental, turmas reduzidas e certificacao internacional.',
    whatsapp_number: '5571988776655',
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'preview-daycare',
    business_id: 'preview-business-3',
    institution_type: 'Espaco Primeiros Passos',
    niche_key: 'daycare',
    support_level: 'basic_enabled',
    summary:
      'Creche em periodo parcial e integral com rotina estruturada, relatorios diarios e equipe multidisciplinar.',
    whatsapp_number: '5571977665544',
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const educationDetailPreviewMap: Record<string, EducationDetailPreview> = {
  'colegio-horizonte': {
    slug: 'colegio-horizonte',
    state: 'ba',
    city: 'salvador',
    district: 'pituba',
    institutionName: 'Colegio Horizonte',
    profile: educationLandingPreviewProfiles[0],
    programs: [
      {
        id: 'program-1',
        education_profile_id: 'preview-regular-school',
        name: 'Ensino Fundamental I',
        description: 'Base academica com reforco de leitura, escrita e raciocinio logico.',
        age_group: '6 a 10 anos',
        shift: 'Manha e Tarde',
        modality: 'Presencial',
        available_slots: 18,
        price_from: 890,
        is_active: true,
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'program-2',
        education_profile_id: 'preview-regular-school',
        name: 'Ensino Medio Integrado',
        description: 'Trilha academica com preparacao ENEM, projeto de carreira e simulados mensais.',
        age_group: '15 a 17 anos',
        shift: 'Manha',
        modality: 'Presencial',
        available_slots: 12,
        price_from: 1290,
        is_active: true,
        display_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: 'event-1',
        education_profile_id: 'preview-regular-school',
        title: 'Open Day para Novas Familias',
        description: 'Visita guiada aos ambientes com equipe pedagogica e coordenacao.',
        starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ends_at: null,
        location: 'Unidade Pituba',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'event-2',
        education_profile_id: 'preview-regular-school',
        title: 'Aula Experimental Maker',
        description: 'Oficina pratica de robotica para alunos interessados.',
        starts_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        ends_at: null,
        location: 'Lab de Inovacao',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    highlights: [
      'Acompanhamento individual por coordenacao pedagogica',
      'Projeto socioemocional com encontros quinzenais',
      'Plataforma digital para comunicacao com familias',
      'Simulados e acompanhamento de desempenho por bimestre',
    ],
    stats: [
      { label: 'Alunos ativos', value: '850+' },
      { label: 'Taxa de rematricula', value: '92%' },
      { label: 'Anos de operacao', value: '18' },
      { label: 'Unidades', value: '2' },
    ],
  },
  'startup-idiomas': {
    slug: 'startup-idiomas',
    state: 'ba',
    city: 'salvador',
    district: 'caminho-das-arvores',
    institutionName: 'StartUp Idiomas',
    profile: educationLandingPreviewProfiles[1],
    programs: [
      {
        id: 'program-3',
        education_profile_id: 'preview-language-school',
        name: 'Ingles Teens',
        description: 'Turmas com foco em conversacao, listening e preparacao para certificacoes.',
        age_group: '12 a 17 anos',
        shift: 'Tarde e Noite',
        modality: 'Hibrido',
        available_slots: 16,
        price_from: 560,
        is_active: true,
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: 'event-3',
        education_profile_id: 'preview-language-school',
        title: 'Speaking Day',
        description: 'Aula aberta de conversacao para novos alunos.',
        starts_at: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        ends_at: null,
        location: 'Unidade Caminho das Arvores',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    highlights: [
      'Professores certificados internacionalmente',
      'Aulas por nivel com trilha de progresso',
      'Material digital e simulados periodicos',
      'Aula experimental para novos alunos',
    ],
    stats: [
      { label: 'Alunos ativos', value: '420+' },
      { label: 'Taxa de aprovacao', value: '95%' },
      { label: 'Anos de operacao', value: '9' },
      { label: 'Unidades', value: '1' },
    ],
  },
  'espaco-primeiros-passos': {
    slug: 'espaco-primeiros-passos',
    state: 'ba',
    city: 'salvador',
    district: 'stiep',
    institutionName: 'Espaco Primeiros Passos',
    profile: educationLandingPreviewProfiles[2],
    programs: [
      {
        id: 'program-4',
        education_profile_id: 'preview-daycare',
        name: 'Periodo Integral 2-5 anos',
        description: 'Rotina completa com alimentacao acompanhada e atividades psicomotoras.',
        age_group: '2 a 5 anos',
        shift: 'Integral',
        modality: 'Presencial',
        available_slots: 10,
        price_from: 1240,
        is_active: true,
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: 'event-4',
        education_profile_id: 'preview-daycare',
        title: 'Visita guiada para familias',
        description: 'Apresentacao da rotina, equipe e espacos de aprendizagem.',
        starts_at: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
        ends_at: null,
        location: 'Unidade Stiep',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    highlights: [
      'Ambiente monitorado e equipe especializada',
      'Relatorio diario de rotina e desenvolvimento',
      'Projeto ludico para desenvolvimento socioemocional',
      'Canal direto com coordenacao via WhatsApp',
    ],
    stats: [
      { label: 'Alunos ativos', value: '130+' },
      { label: 'Tempo medio de permanencia', value: '2.4 anos' },
      { label: 'Anos de operacao', value: '6' },
      { label: 'Unidades', value: '1' },
    ],
  },
};

export const educationPreviewRouteByProfileId: Record<
  string,
  { state: string; city: string; district: string; slug: string }
> = Object.values(educationDetailPreviewMap).reduce((acc, item) => {
  acc[item.profile.id] = {
    state: item.state,
    city: item.city,
    district: item.district,
    slug: item.slug,
  };
  return acc;
}, {} as Record<string, { state: string; city: string; district: string; slug: string }>);
