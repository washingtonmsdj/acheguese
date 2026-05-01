import type {
  EducationEvent,
  EducationLevel,
  EducationProfile,
  EducationProgram,
  SchoolNetwork,
  SchoolShift,
  SchoolBasicResourceKey,
  SchoolAccessibilityFeatureKey,
  SchoolEquipmentFeatureKey,
  SchoolFacilityFeatureKey,
} from '../types';

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

interface PublicSchoolSeed {
  slug: string;
  name: string;
  network: SchoolNetwork;
  district: 'nordeste-de-amaralina' | 'santa-cruz';
  address: string;
  phone: string;
  email?: string;
  inep: string;
  levels: EducationLevel[];
  shifts: SchoolShift[];
  summary?: string;
  sourceUrl: string;
  basicResources?: SchoolBasicResourceKey[];
  accessibilityFeatures?: SchoolAccessibilityFeatureKey[];
  equipmentFeatures?: SchoolEquipmentFeatureKey[];
  facilityFeatures?: SchoolFacilityFeatureKey[];
}

const NOW = '2026-04-29T00:00:00.000Z';

const sourceByInep = (slug: string, inep: string) => `https://escolas.com.br/${slug}-${inep}`;

const PUBLIC_SCHOOLS_COMPLEXO: PublicSchoolSeed[] = [
  {
    slug: 'cmei-dalia-de-menezes',
    name: 'Centro Municipal de Educacao Infantil Dalia de Menezes',
    network: 'municipal',
    district: 'nordeste-de-amaralina',
    address: 'Rua Sao Jose do Nordeste, SN, Nordeste de Amaralina',
    phone: '(71) 3202-0120',
    email: 'cmeidaliademenezes.creorla@gmail.com',
    inep: '29412277',
    levels: ['early_childhood'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('centro-municipal-de-educacao-infantil-dalia-de-menezes', '29412277'),
  },
  {
    slug: 'colegio-estadual-professor-carlos-sant-anna-tempo-integral',
    name: 'Colegio Estadual Professor Carlos Sant Anna Tempo Integral',
    network: 'state',
    district: 'nordeste-de-amaralina',
    address: 'Rua Alto dos Coqueiros, 372, Nordeste de Amaralina',
    phone: '(71) 3346-1969',
    inep: '29191084',
    levels: ['elementary_2', 'middle_school'],
    shifts: ['morning', 'afternoon', 'evening'],
    sourceUrl: sourceByInep('colegio-estadual-professor-carlos-sant-anna-tempo-integral', '29191084'),
  },
  {
    slug: 'escola-municipal-maria-amalia-paiva',
    name: 'Escola Municipal Maria Amalia Paiva',
    network: 'municipal',
    district: 'nordeste-de-amaralina',
    address: 'Rua Doutor Edgard Barros, 40, Nordeste de Amaralina',
    phone: '(71) 3202-0119',
    email: 'esc-mariaamaliapaiva@salvador.ba.gov.br',
    inep: '29193559',
    levels: ['elementary_1', 'elementary_2', 'middle_school'],
    shifts: ['morning', 'afternoon', 'evening'],
    sourceUrl: sourceByInep('escola-municipal-maria-amalia-paiva', '29193559'),
  },
  {
    slug: 'escola-municipal-professora-anita-barbuda',
    name: 'Escola Municipal Professora Anita Barbuda',
    network: 'municipal',
    district: 'nordeste-de-amaralina',
    address: 'Rua Sao Policarpo, SN, Nordeste de Amaralina',
    phone: '(71) 3202-0117',
    email: 'esc-anitabarbuda@salvador.ba.gov.br',
    inep: '29336597',
    levels: ['elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-professora-anita-barbuda', '29336597'),
  },
  {
    slug: 'cmei-vale-das-pedrinhas',
    name: 'Centro Municipal de Educacao Infantil Vale das Pedrinhas',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Gilberto Maltez, SN, Santa Cruz',
    phone: '(71) 3202-0136',
    inep: '29474590',
    levels: ['early_childhood'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('centro-municipal-de-educacao-infantil-vale-das-pedrinhas', '29474590'),
  },
  {
    slug: 'colegio-estadual-general-dionisio-cerqueira-tempo-integral',
    name: 'Colegio Estadual General Dionisio Cerqueira Tempo Integral',
    network: 'state',
    district: 'santa-cruz',
    address: 'Rua do Futuro Alto Santa Cruz, 475, Santa Cruz',
    phone: '(71) 3354-9400',
    inep: '29192617',
    levels: ['elementary_2', 'high_school'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('colegio-estadual-general-dionisio-cerqueira-tempo-integral', '29192617'),
  },
  {
    slug: 'escola-municipal-artur-de-sales',
    name: 'Escola Municipal Artur de Sales',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Antonio Carlos Magalhaes, 393, Santa Cruz',
    phone: '(71) 3202-0127',
    inep: '29186315',
    levels: ['early_childhood', 'elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-artur-de-sales', '29186315'),
  },
  {
    slug: 'escola-municipal-centro-social-neusa-nery',
    name: 'Escola Municipal Centro Social Neusa Nery',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Catargo, 44, Santa Cruz',
    phone: '(71) 3202-0134',
    email: 'esc-csneusanery@salvador.ba.gov.br',
    inep: '29181224',
    levels: ['elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-centro-social-neusa-nery', '29181224'),
  },
  {
    slug: 'escola-municipal-comunitaria-cristo-redentor',
    name: 'Escola Municipal Comunitaria Cristo Redentor',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Doutor Antonio Cavalcante, 19, Santa Cruz',
    phone: '(71) 3202-0133',
    email: 'esc-ccristoredentor@salvador.ba.gov.br',
    inep: '29190240',
    levels: ['early_childhood', 'elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-comunitaria-cristo-redentor', '29190240'),
  },
  {
    slug: 'escola-municipal-cristo-e-vida',
    name: 'Escola Municipal Cristo e Vida',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Antonio Carlos Pedreira, 01, Santa Cruz',
    phone: '(71) 3202-0132',
    email: 'esc-cristovida@salvador.ba.gov.br',
    inep: '29415497',
    levels: ['early_childhood', 'elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-cristo-e-vida', '29415497'),
  },
  {
    slug: 'escola-municipal-jose-calazans-brandao-da-silva',
    name: 'Escola Municipal Jose Calazans Brandao da Silva',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua do Futuro, SN, Santa Cruz',
    phone: '(71) 3202-0135',
    email: 'esc-josecalazans@salvador.ba.gov.br',
    inep: '29193168',
    levels: ['elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-jose-calazans-brandao-da-silva', '29193168'),
  },
  {
    slug: 'escola-municipal-santo-andre',
    name: 'Escola Municipal Santo Andre',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Vinte e Seis de Abril, 133, Santa Cruz',
    phone: '(71) 3202-0129',
    inep: '29188318',
    levels: ['elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-santo-andre', '29188318'),
  },
  {
    slug: 'escola-municipal-sao-pedro-nolasco',
    name: 'Escola Municipal Sao Pedro Nolasco',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Doutor Benjamin Goncalves, 248, Santa Cruz',
    phone: '(71) 3202-0131',
    email: 'esc-spedronolasco@salvador.ba.gov.br',
    inep: '29187982',
    levels: ['early_childhood', 'elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-sao-pedro-nolasco', '29187982'),
  },
  {
    slug: 'escola-municipal-teodoro-sampaio',
    name: 'Escola Municipal Teodoro Sampaio',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Doutor Armando Colavolpe, 265, Santa Cruz',
    phone: '(71) 3202-0130',
    email: 'esc-tsampaio@salvador.ba.gov.br',
    inep: '29198836',
    levels: ['middle_school'],
    shifts: ['morning', 'afternoon', 'evening'],
    sourceUrl: sourceByInep('escola-municipal-teodoro-sampaio', '29198836'),
  },
  {
    slug: 'escola-municipal-vale-das-pedrinhas',
    name: 'Escola Municipal Vale das Pedrinhas',
    network: 'municipal',
    district: 'santa-cruz',
    address: 'Rua Vinte e Um de Agosto, 140, Vale das Pedrinhas, Santa Cruz',
    phone: '(71) 3202-0128',
    email: 'esc-valepedrinhas@salvador.ba.gov.br',
    inep: '29194547',
    levels: ['early_childhood', 'elementary_1'],
    shifts: ['morning', 'afternoon'],
    sourceUrl: sourceByInep('escola-municipal-vale-das-pedrinhas', '29194547'),
  },
];

function networkLabel(network: SchoolNetwork): string {
  switch (network) {
    case 'municipal':
      return 'Rede municipal';
    case 'state':
      return 'Rede estadual';
    case 'federal':
      return 'Rede federal';
    case 'private':
      return 'Rede privada';
    default:
      return 'Rede nao informada';
  }
}

function levelLabel(level: EducationLevel): string {
  const labels: Record<EducationLevel, string> = {
    early_childhood: 'Educacao Infantil',
    elementary_1: 'Ensino Fundamental - Anos Iniciais',
    elementary_2: 'Ensino Fundamental - Anos Finais',
    middle_school: 'EJA',
    high_school: 'Ensino Medio',
    technical: 'Tecnico',
  };
  return labels[level];
}

function shiftLabel(shift: SchoolShift): string {
  const labels: Record<SchoolShift, string> = {
    morning: 'Manha',
    afternoon: 'Tarde',
    evening: 'Noite',
    full_day: 'Integral',
  };
  return labels[shift];
}

function summarizeSchool(school: PublicSchoolSeed): string {
  const network = networkLabel(school.network);
  const levels = school.levels.map(levelLabel).join(', ');
  const shifts = school.shifts.map(shiftLabel).join(', ');
  return `${network}. Etapas: ${levels || 'Nao informado'}. Turnos: ${shifts || 'Nao informado'}. INEP: ${school.inep}.`;
}

function toProfile(school: PublicSchoolSeed): EducationProfile {
  const defaultBasicResources: SchoolBasicResourceKey[] = school.basicResources ?? [];
  const defaultAccessibility: SchoolAccessibilityFeatureKey[] = school.accessibilityFeatures ?? [];
  const defaultEquipment: SchoolEquipmentFeatureKey[] = school.equipmentFeatures ?? [];
  const defaultFacilities: SchoolFacilityFeatureKey[] = school.facilityFeatures ?? [];

  const profileId = `00000000-0000-4000-8000-${school.inep.padStart(12, '0')}`;

  return {
    id: profileId,
    business_id: null,
    institution_type: school.name,
    niche_key: 'regular_school',
    support_level: 'basic_enabled',
    summary: school.summary ?? summarizeSchool(school),
    whatsapp_number: school.phone,
    status: 'published',
    published_at: NOW,
    created_at: NOW,
    updated_at: NOW,
    school_type: school.network === 'private' ? 'private' : 'public',
    school_network: school.network,
    school_inep_code: school.inep,
    school_source_url: school.sourceUrl,
    school_source_updated_at: NOW,
    education_levels: school.levels,
    shifts: school.shifts,
    age_range_min: null,
    age_range_max: null,
    enrollment_open: false,
    school_basic_resources: defaultBasicResources,
    school_accessibility_features: defaultAccessibility,
    school_equipment_features: defaultEquipment,
    school_facility_features: defaultFacilities,
  };
}

function levelGrades(level: EducationLevel): Array<{ name: string; grade: string | null }> {
  switch (level) {
    case 'early_childhood':
      return [
        { name: 'Creche', grade: null },
        { name: 'Pre-escola', grade: null },
      ];
    case 'elementary_1':
      return [
        { name: '1o ano', grade: null },
        { name: '2o ano', grade: null },
        { name: '3o ano', grade: null },
        { name: '4o ano', grade: null },
        { name: '5o ano', grade: null },
      ];
    case 'elementary_2':
      return [
        { name: '6o ano', grade: null },
        { name: '7o ano', grade: null },
        { name: '8o ano', grade: null },
        { name: '9o ano', grade: null },
      ];
    case 'middle_school':
      return [{ name: 'EJA', grade: null }];
    case 'high_school':
      return [
        { name: '1a serie do Ensino Medio', grade: null },
        { name: '2a serie do Ensino Medio', grade: null },
        { name: '3a serie do Ensino Medio', grade: null },
      ];
    case 'technical':
      return [{ name: 'Curso Tecnico', grade: null }];
    default:
      return [{ name: levelLabel(level), grade: null }];
  }
}

function toPrograms(school: PublicSchoolSeed, profileId: string): EducationProgram[] {
  const shift = school.shifts.map(shiftLabel).join(', ');

  return school.levels.flatMap((level, levelIndex) =>
    levelGrades(level).map((entry, gradeIndex) => {
      const sequence = String(levelIndex * 100 + gradeIndex + 1).padStart(4, '0');
      const programSuffix = `${school.inep}${sequence}`.padStart(12, '0');
      return {
        id: `00000000-0000-4001-9000-${programSuffix}`,
        education_profile_id: profileId,
        name: entry.name,
        description: null,
        age_group: null,
        shift,
        modality: 'Presencial',
        available_slots: null,
        price_from: null,
        is_active: true,
        display_order: levelIndex * 10 + gradeIndex + 1,
        created_at: NOW,
        updated_at: NOW,
        education_level: level,
        grade: entry.grade,
        class_name: null,
        max_capacity: null,
        current_enrollment: null,
        schedule: shift,
      };
    })
  );
}

function toDetailPreview(school: PublicSchoolSeed): EducationDetailPreview {
  const profile = toProfile(school);
  const programs = toPrograms(school, profile.id);
  return {
    slug: school.slug,
    state: 'ba',
    city: 'salvador',
    district: school.district,
    institutionName: school.name,
    profile,
    programs,
    events: [],
    highlights: [
      networkLabel(school.network),
      `Codigo INEP ${school.inep}`,
      school.address,
      `Contato ${school.phone}`,
    ],
    stats: [
      { label: 'Rede', value: networkLabel(school.network).replace('Rede ', '') },
      { label: 'Turnos', value: school.shifts.map(shiftLabel).join('/') },
    ],
  };
}

export const educationLandingPreviewProfiles: EducationProfile[] = PUBLIC_SCHOOLS_COMPLEXO.map(toProfile);

export const educationDetailPreviewMap: Record<string, EducationDetailPreview> =
  PUBLIC_SCHOOLS_COMPLEXO.reduce((acc, school) => {
    acc[school.slug] = toDetailPreview(school);
    return acc;
  }, {} as Record<string, EducationDetailPreview>);

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

/**
 * MOCK FICTICIO DE EXEMPLO (NAO UTILIZAR EM PRODUCAO/DADOS REAIS)
 * Mantido apenas para referencia de interface visual e testes locais.
 */
export const educationExampleMock: EducationDetailPreview = {
  slug: 'escola-exemplo-ficticia',
  state: 'ba',
  city: 'salvador',
  district: 'exemplo',
  institutionName: 'Escola Exemplo Ficticia',
  profile: {
    id: '11111111-1111-4111-8111-111111111111',
    business_id: null,
    institution_type: 'Escola Exemplo Ficticia',
    niche_key: 'regular_school',
    support_level: 'basic_enabled',
    summary: 'EXEMPLO FICTICIO para demonstracao de layout.',
    whatsapp_number: null,
    status: 'draft',
    published_at: null,
    created_at: NOW,
    updated_at: NOW,
    school_type: 'public',
    school_network: 'municipal',
    school_inep_code: null,
    school_source_url: null,
    school_source_updated_at: null,
    education_levels: ['elementary_1'],
    shifts: ['morning'],
    age_range_min: null,
    age_range_max: null,
    enrollment_open: false,
    school_basic_resources: [],
    school_accessibility_features: [],
    school_equipment_features: [],
    school_facility_features: [],
  },
  programs: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      education_profile_id: '11111111-1111-4111-8111-111111111111',
      name: 'EXEMPLO - 1o ano',
      description: null,
      age_group: null,
      shift: 'Manha',
      modality: 'Presencial',
      available_slots: null,
      price_from: null,
      is_active: true,
      display_order: 1,
      created_at: NOW,
      updated_at: NOW,
      education_level: 'elementary_1',
      grade: null,
      class_name: null,
      max_capacity: null,
      current_enrollment: null,
      schedule: 'Manha',
    },
  ],
  events: [],
  highlights: ['EXEMPLO FICTICIO - nao corresponde a escola real.'],
  stats: [{ label: 'Status', value: 'Exemplo' }],
};
