import type { EducationLevel, EducationNicheKey } from '../contracts';

export interface SchoolStageOption {
  value: string;
  label: string;
  educationLevel: EducationLevel;
}

export const SCHOOL_STAGE_OTHER_VALUE = '__other__';

const REGULAR_STAGE_OPTIONS: SchoolStageOption[] = [
  { value: 'creche', label: 'Creche', educationLevel: 'early_childhood' },
  { value: 'pre-escola', label: 'Pre-escola', educationLevel: 'early_childhood' },
  { value: '1-ano', label: '1º ano', educationLevel: 'elementary_1' },
  { value: '2-ano', label: '2º ano', educationLevel: 'elementary_1' },
  { value: '3-ano', label: '3º ano', educationLevel: 'elementary_1' },
  { value: '4-ano', label: '4º ano', educationLevel: 'elementary_1' },
  { value: '5-ano', label: '5º ano', educationLevel: 'elementary_1' },
  { value: '6-ano', label: '6º ano', educationLevel: 'elementary_2' },
  { value: '7-ano', label: '7º ano', educationLevel: 'elementary_2' },
  { value: '8-ano', label: '8º ano', educationLevel: 'elementary_2' },
  { value: '9-ano', label: '9º ano', educationLevel: 'elementary_2' },
  {
    value: 'eja-fund-iniciais',
    label: 'EJA - Ensino Fundamental (anos iniciais)',
    educationLevel: 'middle_school',
  },
  {
    value: 'eja-fund-finais',
    label: 'EJA - Ensino Fundamental (anos finais)',
    educationLevel: 'middle_school',
  },
  { value: 'eja-ensino-medio', label: 'EJA - Ensino Medio', educationLevel: 'middle_school' },
  { value: '1-serie-medio', label: '1ª serie do Ensino Medio', educationLevel: 'high_school' },
  { value: '2-serie-medio', label: '2ª serie do Ensino Medio', educationLevel: 'high_school' },
  { value: '3-serie-medio', label: '3ª serie do Ensino Medio', educationLevel: 'high_school' },
];

const DAYCARE_STAGE_OPTIONS: SchoolStageOption[] = [
  { value: 'creche', label: 'Creche', educationLevel: 'early_childhood' },
  { value: 'pre-escola', label: 'Pre-escola', educationLevel: 'early_childhood' },
];

export function isSchoolNiche(nicheKey?: EducationNicheKey | null): boolean {
  return nicheKey === 'regular_school' || nicheKey === 'daycare';
}

export function getSchoolStageOptions(nicheKey?: EducationNicheKey | null): SchoolStageOption[] {
  if (nicheKey === 'daycare') return DAYCARE_STAGE_OPTIONS;
  if (nicheKey === 'regular_school') return REGULAR_STAGE_OPTIONS;
  return [];
}
