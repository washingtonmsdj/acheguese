import type {
  EducationLevel,
  EducationNicheKey,
  SchoolAccessibilityFeatureKey,
  SchoolBasicResourceKey,
  SchoolEquipmentFeatureKey,
  SchoolFacilityFeatureKey,
  SchoolShift,
} from '@/core/education';

export type EducationSetupFormData = {
  institutionType: string;
  nicheKey: string;
  schoolType: string;
  schoolNetwork: string;
  schoolInepCode: string;
  schoolSourceUrl: string;
  educationLevels: EducationLevel[];
  shifts: SchoolShift[];
  ageRangeMin: string;
  ageRangeMax: string;
  enrollmentOpen: boolean;
  schoolBasicResources: SchoolBasicResourceKey[];
  schoolAccessibilityFeatures: SchoolAccessibilityFeatureKey[];
  schoolEquipmentFeatures: SchoolEquipmentFeatureKey[];
  schoolFacilityFeatures: SchoolFacilityFeatureKey[];
  summary: string;
  whatsappNumber: string;
};

export type EducationSetupArrayField =
  | 'educationLevels'
  | 'shifts'
  | 'schoolBasicResources'
  | 'schoolAccessibilityFeatures'
  | 'schoolEquipmentFeatures'
  | 'schoolFacilityFeatures';

export type EducationInfrastructurePreset =
  | 'daycare'
  | 'basic_school'
  | 'accessible';

export const INITIAL_EDUCATION_SETUP_FORM: EducationSetupFormData = {
  institutionType: '',
  nicheKey: '',
  schoolType: '',
  schoolNetwork: '',
  schoolInepCode: '',
  schoolSourceUrl: '',
  educationLevels: [],
  shifts: [],
  ageRangeMin: '',
  ageRangeMax: '',
  enrollmentOpen: false,
  schoolBasicResources: [],
  schoolAccessibilityFeatures: [],
  schoolEquipmentFeatures: [],
  schoolFacilityFeatures: [],
  summary: '',
  whatsappNumber: '',
};

const EDUCATION_INFRASTRUCTURE_PRESETS: Record<
  EducationInfrastructurePreset,
  Pick<
    EducationSetupFormData,
    | 'schoolBasicResources'
    | 'schoolAccessibilityFeatures'
    | 'schoolEquipmentFeatures'
    | 'schoolFacilityFeatures'
  >
> = {
  daycare: {
    schoolBasicResources: ['water_supply', 'electricity', 'sewage', 'waste_collection'],
    schoolAccessibilityFeatures: ['ramps', 'wide_doors_80cm'],
    schoolEquipmentFeatures: ['computer', 'internet', 'printer'],
    schoolFacilityFeatures: [
      'bathroom',
      'child_bathroom',
      'playground',
      'kitchen',
      'cafeteria',
      'library',
    ],
  },
  basic_school: {
    schoolBasicResources: ['water_supply', 'electricity', 'sewage', 'waste_collection'],
    schoolAccessibilityFeatures: ['ramps'],
    schoolEquipmentFeatures: ['computer', 'internet', 'multimedia_projector', 'printer'],
    schoolFacilityFeatures: [
      'bathroom',
      'library',
      'science_lab',
      'computer_lab',
      'sports_court',
      'cafeteria',
    ],
  },
  accessible: {
    schoolBasicResources: ['water_supply', 'electricity', 'sewage', 'waste_collection'],
    schoolAccessibilityFeatures: [
      'ramps',
      'wide_doors_80cm',
      'tactile_flooring',
      'visual_signage',
    ],
    schoolEquipmentFeatures: ['computer', 'internet', 'multimedia_projector'],
    schoolFacilityFeatures: [
      'bathroom',
      'accessible_bathroom_pcd',
      'library',
      'computer_lab',
      'multiuse_room',
    ],
  },
};

export function applyEducationInfrastructurePreset(
  formData: EducationSetupFormData,
  preset: EducationInfrastructurePreset,
): EducationSetupFormData {
  return {
    ...formData,
    ...resolveEducationInfrastructurePreset(preset),
  };
}

function resolveEducationInfrastructurePreset(
  preset: EducationInfrastructurePreset,
): Pick<
  EducationSetupFormData,
  | 'schoolBasicResources'
  | 'schoolAccessibilityFeatures'
  | 'schoolEquipmentFeatures'
  | 'schoolFacilityFeatures'
> {
  switch (preset) {
    case 'daycare':
      return EDUCATION_INFRASTRUCTURE_PRESETS.daycare;
    case 'basic_school':
      return EDUCATION_INFRASTRUCTURE_PRESETS.basic_school;
    case 'accessible':
      return EDUCATION_INFRASTRUCTURE_PRESETS.accessible;
  }
}

export const INSTITUTION_TYPES = [
  { value: 'school', label: 'Escola' },
  { value: 'daycare', label: 'Creche/Bercario' },
  { value: 'language_school', label: 'Escola de Idiomas' },
  { value: 'prep_course', label: 'Curso Pre-vestibular' },
  { value: 'technical_school', label: 'Escola Tecnica' },
  { value: 'tutoring_center', label: 'Centro de Reforco' },
  { value: 'music_school', label: 'Escola de Musica' },
  { value: 'sports_school', label: 'Escola de Esportes' },
  { value: 'university', label: 'Universidade' },
  { value: 'other', label: 'Outro' },
];

const SCHOOL_PROFILE_NICHES: EducationNicheKey[] = ['regular_school', 'daycare'];
const EDUCATION_LEVEL_NICHES: EducationNicheKey[] = ['regular_school', 'daycare', 'technical_school'];

export function isSchoolProfileNiche(nicheKey: string): nicheKey is EducationNicheKey {
  return SCHOOL_PROFILE_NICHES.includes(nicheKey as EducationNicheKey);
}

export function hasEducationLevels(nicheKey: string): nicheKey is EducationNicheKey {
  return EDUCATION_LEVEL_NICHES.includes(nicheKey as EducationNicheKey);
}

export const SCHOOL_TYPES = [
  { value: 'public', label: 'Pública' },
  { value: 'private', label: 'Privada' },
  { value: 'community', label: 'Comunitária' },
  { value: 'charter', label: 'Conveniada' },
];

export const SCHOOL_NETWORKS = [
  { value: 'municipal', label: 'Municipal' },
  { value: 'state', label: 'Estadual' },
  { value: 'federal', label: 'Federal' },
  { value: 'private', label: 'Privada' },
];

export const EDUCATION_LEVEL_OPTIONS: { key: EducationLevel; label: string }[] = [
  { key: 'early_childhood', label: 'Educação Infantil' },
  { key: 'elementary_1', label: 'Ensino Fundamental - Anos Iniciais' },
  { key: 'elementary_2', label: 'Ensino Fundamental - Anos Finais' },
  { key: 'middle_school', label: 'EJA' },
  { key: 'high_school', label: 'Ensino Médio' },
  { key: 'technical', label: 'Técnico' },
];

export const SHIFT_OPTIONS: { key: SchoolShift; label: string }[] = [
  { key: 'morning', label: 'Manhã' },
  { key: 'afternoon', label: 'Tarde' },
  { key: 'evening', label: 'Noite' },
  { key: 'full_day', label: 'Integral' },
];

export const BASIC_RESOURCE_OPTIONS: { key: SchoolBasicResourceKey; label: string }[] = [
  { key: 'water_supply', label: 'Abastecimento de água' },
  { key: 'electricity', label: 'Energia elétrica' },
  { key: 'sewage', label: 'Esgoto' },
  { key: 'waste_collection', label: 'Coleta de lixo' },
];

export const ACCESSIBILITY_OPTIONS: { key: SchoolAccessibilityFeatureKey; label: string }[] = [
  { key: 'handrails_guardrails', label: 'Corrimão e guarda-corpos' },
  { key: 'elevator', label: 'Elevador' },
  { key: 'tactile_flooring', label: 'Pisos táteis' },
  { key: 'wide_doors_80cm', label: 'Portas com vao livre >= 80cm' },
  { key: 'ramps', label: 'Rampas' },
  { key: 'sound_signage', label: 'Sinalização sonora' },
  { key: 'tactile_signage', label: 'Sinalização tatil' },
  { key: 'visual_signage', label: 'Sinalização visual' },
];

export const EQUIPMENT_OPTIONS: { key: SchoolEquipmentFeatureKey; label: string }[] = [
  { key: 'computer', label: 'Computador' },
  { key: 'copier', label: 'Copiadora' },
  { key: 'printer', label: 'Impressora' },
  { key: 'multifunction_printer', label: 'Impressora multifuncional' },
  { key: 'scanner', label: 'Scanner' },
  { key: 'dvd_player', label: 'DVD' },
  { key: 'sound_system', label: 'Aparelho de som' },
  { key: 'television', label: 'Aparelho de televisão' },
  { key: 'digital_whiteboard', label: 'Lousa digital' },
  { key: 'multimedia_projector', label: 'Projetor multimídia' },
  { key: 'desktop_computer', label: 'Computador desktop' },
  { key: 'notebook', label: 'Notebook' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'internet', label: 'Internet' },
  { key: 'satellite_dish', label: 'Antena parabólica' },
];

export const FACILITY_OPTIONS: { key: SchoolFacilityFeatureKey; label: string }[] = [
  { key: 'library', label: 'Biblioteca' },
  { key: 'reading_room', label: 'Sala de leitura' },
  { key: 'science_lab', label: 'Laboratório de ciencias' },
  { key: 'computer_lab', label: 'Laboratório de informatica' },
  { key: 'kitchen', label: 'Cozinha' },
  { key: 'cafeteria', label: 'Refeitorio' },
  { key: 'pool', label: 'Piscina' },
  { key: 'parking', label: 'Estacionamento/garagem' },
  { key: 'accessible_parking', label: 'Vaga de estacionamento acessível' },
  { key: 'playground', label: 'Parque infantil' },
  { key: 'sports_court', label: 'Quadra de esportes' },
  { key: 'covered_sports_court', label: 'Quadra coberta' },
  { key: 'open_sports_court', label: 'Quadra descoberta' },
  { key: 'covered_courtyard', label: 'Pátio coberto' },
  { key: 'open_courtyard', label: 'Pátio descoberto' },
  { key: 'auditorium', label: 'Auditório' },
  { key: 'green_area', label: 'Área verde' },
  { key: 'multiuse_room', label: 'Sala multiuso' },
  { key: 'art_room', label: 'Sala/ateliê de artes' },
  { key: 'music_room', label: 'Sala de música/coral' },
  { key: 'dance_studio', label: 'Sala de dança' },
  { key: 'principal_office', label: 'Sala de diretoria' },
  { key: 'secretary_office', label: 'Sala de secretaria' },
  { key: 'teacher_room', label: 'Sala de professores' },
  { key: 'student_rest_room', label: 'Sala de repouso para alunos' },
  { key: 'aee_resource_room', label: 'Sala de recursos AEE' },
  { key: 'bathroom', label: 'Banheiro' },
  { key: 'child_bathroom', label: 'Banheiro infantil' },
  { key: 'accessible_bathroom_pcd', label: 'Banheiro acessível PCD' },
  { key: 'staff_bathroom', label: 'Banheiro exclusivo funcionários' },
  { key: 'bathroom_with_shower', label: 'Banheiro/vestiario com chuveiro' },
  { key: 'pantry', label: 'Despensa' },
  { key: 'warehouse', label: 'Almoxarifado' },
  { key: 'student_dormitory', label: 'Dormitorio de aluno' },
  { key: 'teacher_dormitory', label: 'Dormitorio de professor' },
  { key: 'open_recreation_area', label: 'Terreirao (area aberta de recreacao)' },
  { key: 'animal_nursery', label: 'Viveiro/criacao de animais' },
];

export function toggleArrayValue<T extends string>(items: readonly T[], value: T): T[] {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}
