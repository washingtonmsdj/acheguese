/**
 * EducationSetupPage
 * 
 * Pagina de configuracao inicial do perfil de educacao.
 * Rota: /central/empresas/:businessId/education/setup
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {  Settings,
  Save,
  ArrowLeft,
  Phone,
  FileText,
  School,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useToast } from '@/shared/hooks/use-toast';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { EducationService } from '../services/EducationService';
import type {
  EducationLevel,
  SchoolShift,
  SchoolNetwork,
  SchoolType,
  SchoolBasicResourceKey,
  SchoolAccessibilityFeatureKey,
  SchoolEquipmentFeatureKey,
  SchoolFacilityFeatureKey,
} from '../types';
import { getSelectableNiches, getNicheByKey } from '../niches/registry';
import { EducationUpgradeBanner } from '../niches/components/EducationUpgradeBanner';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';

const INSTITUTION_TYPES = [
  { value: 'school', label: 'Escola' },
  { value: 'university', label: 'Universidade' },
  { value: 'course', label: 'Curso/Preparatório' },
  { value: 'language_school', label: 'Escola de Idiomas' },
  { value: 'daycare', label: 'Creche/Berçário' },
  { value: 'other', label: 'Outro' },
];

const SCHOOL_TYPES = [
  { value: 'public', label: 'Publica' },
  { value: 'private', label: 'Privada' },
  { value: 'community', label: 'Comunitaria' },
  { value: 'charter', label: 'Conveniada' },
];

const SCHOOL_NETWORKS = [
  { value: 'municipal', label: 'Municipal' },
  { value: 'state', label: 'Estadual' },
  { value: 'federal', label: 'Federal' },
  { value: 'private', label: 'Privada' },
];

const EDUCATION_LEVEL_OPTIONS: { key: EducationLevel; label: string }[] = [
  { key: 'early_childhood', label: 'Educacao Infantil' },
  { key: 'elementary_1', label: 'Ensino Fundamental - Anos Iniciais' },
  { key: 'elementary_2', label: 'Ensino Fundamental - Anos Finais' },
  { key: 'middle_school', label: 'EJA' },
  { key: 'high_school', label: 'Ensino Medio' },
  { key: 'technical', label: 'Tecnico' },
];

const SHIFT_OPTIONS: { key: SchoolShift; label: string }[] = [
  { key: 'morning', label: 'Manha' },
  { key: 'afternoon', label: 'Tarde' },
  { key: 'evening', label: 'Noite' },
  { key: 'full_day', label: 'Integral' },
];

const BASIC_RESOURCE_OPTIONS: { key: SchoolBasicResourceKey; label: string }[] = [
  { key: 'water_supply', label: 'Abastecimento de agua' },
  { key: 'electricity', label: 'Energia eletrica' },
  { key: 'sewage', label: 'Esgoto' },
  { key: 'waste_collection', label: 'Coleta de lixo' },
];

const ACCESSIBILITY_OPTIONS: { key: SchoolAccessibilityFeatureKey; label: string }[] = [
  { key: 'handrails_guardrails', label: 'Corrimao e guarda-corpos' },
  { key: 'elevator', label: 'Elevador' },
  { key: 'tactile_flooring', label: 'Pisos tateis' },
  { key: 'wide_doors_80cm', label: 'Portas com vao livre >= 80cm' },
  { key: 'ramps', label: 'Rampas' },
  { key: 'sound_signage', label: 'Sinalizacao sonora' },
  { key: 'tactile_signage', label: 'Sinalizacao tatil' },
  { key: 'visual_signage', label: 'Sinalizacao visual' },
];

const EQUIPMENT_OPTIONS: { key: SchoolEquipmentFeatureKey; label: string }[] = [
  { key: 'computer', label: 'Computador' },
  { key: 'copier', label: 'Copiadora' },
  { key: 'printer', label: 'Impressora' },
  { key: 'multifunction_printer', label: 'Impressora multifuncional' },
  { key: 'scanner', label: 'Scanner' },
  { key: 'dvd_player', label: 'DVD' },
  { key: 'sound_system', label: 'Aparelho de som' },
  { key: 'television', label: 'Aparelho de televisao' },
  { key: 'digital_whiteboard', label: 'Lousa digital' },
  { key: 'multimedia_projector', label: 'Projetor multimidia' },
  { key: 'desktop_computer', label: 'Computador desktop' },
  { key: 'notebook', label: 'Notebook' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'internet', label: 'Internet' },
  { key: 'satellite_dish', label: 'Antena parabolica' },
];

const FACILITY_OPTIONS: { key: SchoolFacilityFeatureKey; label: string }[] = [
  { key: 'library', label: 'Biblioteca' },
  { key: 'reading_room', label: 'Sala de leitura' },
  { key: 'science_lab', label: 'Laboratorio de ciencias' },
  { key: 'computer_lab', label: 'Laboratorio de informatica' },
  { key: 'kitchen', label: 'Cozinha' },
  { key: 'cafeteria', label: 'Refeitorio' },
  { key: 'pool', label: 'Piscina' },
  { key: 'playground', label: 'Parque infantil' },
  { key: 'sports_court', label: 'Quadra de esportes' },
  { key: 'covered_sports_court', label: 'Quadra coberta' },
  { key: 'open_sports_court', label: 'Quadra descoberta' },
  { key: 'covered_courtyard', label: 'Patio coberto' },
  { key: 'open_courtyard', label: 'Patio descoberto' },
  { key: 'auditorium', label: 'Auditorio' },
  { key: 'green_area', label: 'Area verde' },
  { key: 'multiuse_room', label: 'Sala multiuso' },
  { key: 'art_room', label: 'Sala/atelie de artes' },
  { key: 'music_room', label: 'Sala de musica/coral' },
  { key: 'dance_studio', label: 'Sala de danca' },
  { key: 'principal_office', label: 'Sala de diretoria' },
  { key: 'secretary_office', label: 'Sala de secretaria' },
  { key: 'teacher_room', label: 'Sala de professores' },
  { key: 'student_rest_room', label: 'Sala de repouso para alunos' },
  { key: 'aee_resource_room', label: 'Sala de recursos AEE' },
  { key: 'bathroom', label: 'Banheiro' },
  { key: 'child_bathroom', label: 'Banheiro infantil' },
  { key: 'accessible_bathroom_pcd', label: 'Banheiro acessivel PCD' },
  { key: 'staff_bathroom', label: 'Banheiro exclusivo funcionarios' },
  { key: 'bathroom_with_shower', label: 'Banheiro/vestiario com chuveiro' },
  { key: 'pantry', label: 'Despensa' },
  { key: 'warehouse', label: 'Almoxarifado' },
  { key: 'student_dormitory', label: 'Dormitorio de aluno' },
  { key: 'teacher_dormitory', label: 'Dormitorio de professor' },
  { key: 'open_recreation_area', label: 'Terreirao (area aberta de recreacao)' },
  { key: 'animal_nursery', label: 'Viveiro/criacao de animais' },
];

export function EducationSetupPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile, isLoading, refetch } = useEducationProfile(businessId);

  const [formData, setFormData] = useState({
    institutionType: '',
    nicheKey: '',
    schoolType: '',
    schoolNetwork: '',
    schoolInepCode: '',
    schoolSourceUrl: '',
    educationLevels: [] as EducationLevel[],
    shifts: [] as SchoolShift[],
    ageRangeMin: '',
    ageRangeMax: '',
    enrollmentOpen: false,
    schoolBasicResources: [] as SchoolBasicResourceKey[],
    schoolAccessibilityFeatures: [] as SchoolAccessibilityFeatureKey[],
    schoolEquipmentFeatures: [] as SchoolEquipmentFeatureKey[],
    schoolFacilityFeatures: [] as SchoolFacilityFeatureKey[],
    summary: '',
    whatsappNumber: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      institutionType: profile.institution_type ?? '',
      nicheKey: profile.niche_key ?? '',
      schoolType: profile.school_type ?? '',
      schoolNetwork: profile.school_network ?? '',
      schoolInepCode: profile.school_inep_code ?? '',
      schoolSourceUrl: profile.school_source_url ?? '',
      educationLevels: profile.education_levels ?? [],
      shifts: profile.shifts ?? [],
      ageRangeMin: profile.age_range_min?.toString() ?? '',
      ageRangeMax: profile.age_range_max?.toString() ?? '',
      enrollmentOpen: profile.enrollment_open ?? false,
      schoolBasicResources: profile.school_basic_resources ?? [],
      schoolAccessibilityFeatures: profile.school_accessibility_features ?? [],
      schoolEquipmentFeatures: profile.school_equipment_features ?? [],
      schoolFacilityFeatures: profile.school_facility_features ?? [],
      summary: profile.summary ?? '',
      whatsappNumber: profile.whatsapp_number ?? '',
    });
  }, [profile]);

  const toggleArrayField = <T extends string>(field: keyof typeof formData, value: T) => {
    setFormData((prev) => {
      const current = prev[field] as T[];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const applyInfrastructurePreset = (preset: 'daycare' | 'basic_school' | 'accessible') => {
    if (preset === 'daycare') {
      setFormData((prev) => ({
        ...prev,
        schoolBasicResources: ['water_supply', 'electricity', 'sewage', 'waste_collection'] as any,
        schoolAccessibilityFeatures: ['ramps', 'wide_doors_80cm'] as any,
        schoolEquipmentFeatures: ['computer', 'internet', 'printer'] as any,
        schoolFacilityFeatures: ['bathroom', 'child_bathroom', 'playground', 'kitchen', 'cafeteria', 'library'] as any,
      }));
      return;
    }
    if (preset === 'basic_school') {
      setFormData((prev) => ({
        ...prev,
        schoolBasicResources: ['water_supply', 'electricity', 'sewage', 'waste_collection'] as any,
        schoolAccessibilityFeatures: ['ramps'] as any,
        schoolEquipmentFeatures: ['computer', 'internet', 'multimedia_projector', 'printer'] as any,
        schoolFacilityFeatures: ['bathroom', 'library', 'science_lab', 'computer_lab', 'sports_court', 'cafeteria'] as any,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      schoolBasicResources: ['water_supply', 'electricity', 'sewage', 'waste_collection'] as any,
      schoolAccessibilityFeatures: ['ramps', 'wide_doors_80cm', 'tactile_flooring', 'visual_signage', 'accessible_bathroom_pcd'] as any,
      schoolEquipmentFeatures: ['computer', 'internet', 'multimedia_projector'] as any,
      schoolFacilityFeatures: ['bathroom', 'accessible_bathroom_pcd', 'library', 'computer_lab', 'multiuse_room'] as any,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!formData.institutionType || !formData.nicheKey) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Selecione o tipo de instituicao e o nicho.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await EducationService.saveSetupProfile({
        businessId,
        institutionType: formData.institutionType,
        nicheKey: formData.nicheKey,
        schoolType: (formData.schoolType || undefined) as SchoolType | undefined,
        schoolNetwork: (formData.schoolNetwork || undefined) as SchoolNetwork | undefined,
        schoolInepCode: formData.schoolInepCode || undefined,
        schoolSourceUrl: formData.schoolSourceUrl || undefined,
        educationLevels: formData.educationLevels,
        shifts: formData.shifts,
        ageRangeMin: formData.ageRangeMin ? Number(formData.ageRangeMin) : undefined,
        ageRangeMax: formData.ageRangeMax ? Number(formData.ageRangeMax) : undefined,
        enrollmentOpen: formData.enrollmentOpen,
        schoolBasicResources: formData.schoolBasicResources,
        schoolAccessibilityFeatures: formData.schoolAccessibilityFeatures,
        schoolEquipmentFeatures: formData.schoolEquipmentFeatures,
        schoolFacilityFeatures: formData.schoolFacilityFeatures,
        summary: formData.summary,
        whatsappNumber: formData.whatsappNumber,
      });
      if (result) {
        toast({
          title: 'Configuração salva',
          description: 'As alterações foram salvas com sucesso.',
        });
        refetch();
        navigate(`/central/empresas/${businessId}/education`);
      } else {
        toast({
          title: 'Erro ao salvar',
          description: 'Nao foi possivel salvar as configuracoes.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectableNiches = getSelectableNiches();
  const selectedNiche = formData.nicheKey ? getNicheByKey(formData.nicheKey) : null;

  // Helper para status do nicho
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full_enabled':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completo</Badge>;
      case 'basic_enabled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Básico</Badge>;
      case 'beta':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Beta</Badge>;
      case 'planned':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Planejado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(`/central/empresas/${businessId}/education`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurar Educação</h1>
            <p className="text-sm text-gray-500">
              Configure os dados da sua instituição
            </p>
          </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Tipo de Instituição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="w-5 h-5 text-blue-500" />
                Tipo de Instituição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="institutionType">Tipo</Label>
                <Select
                  value={formData.institutionType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, institutionType: value })
                  }
                >
                  <SelectTrigger id="institutionType">
                    <SelectValue placeholder="Selecione o tipo de instituição" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nicheKey">Nicho</Label>
                <Select
                  value={formData.nicheKey}
                  onValueChange={(value) =>
                    setFormData({ ...formData, nicheKey: value })
                  }
                >
                  <SelectTrigger id="nicheKey">
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableNiches.map((niche) => (
                      <SelectItem key={niche.nicheKey} value={niche.nicheKey}>
                        {niche.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  O nicho define as funcionalidades disponíveis para sua instituição.
                </p>
              </div>

              {/* Detalhes do Nicho Selecionado */}
              {selectedNiche && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{selectedNiche.displayName}</h4>
                    {getStatusBadge(selectedNiche.supportLevel)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {selectedNiche.description}
                  </p>
                  
                  <Separator className="my-2" />
                  
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Limites:</span> {selectedNiche.entitlements.maxPrograms} programas, {selectedNiche.entitlements.maxEvents} eventos, {selectedNiche.entitlements.maxLeadsPerMonth} leads/mês</p>
                    <p><span className="font-medium">Capabilities:</span> {selectedNiche.enabledCapabilities.length} ativas</p>
                  </div>

                  {selectedNiche.isBeta && (
                    <EducationUpgradeBanner
                      nicheKey={selectedNiche.nicheKey}
                      businessId={businessId || ''}
                      reason="feature_unavailable"
                      variant="inline"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados escolares */}
          {(formData.nicheKey === 'regular_school' || formData.nicheKey === 'daycare') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <School className="w-5 h-5 text-blue-500" />
                  Dados da Escola
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="schoolType">Tipo</Label>
                    <Select
                      value={formData.schoolType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, schoolType: value })
                      }
                    >
                      <SelectTrigger id="schoolType">
                        <SelectValue placeholder="Publica, privada..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="schoolNetwork">Rede administrativa</Label>
                    <Select
                      value={formData.schoolNetwork}
                      onValueChange={(value) =>
                        setFormData({ ...formData, schoolNetwork: value })
                      }
                    >
                      <SelectTrigger id="schoolNetwork">
                        <SelectValue placeholder="Municipal, estadual..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHOOL_NETWORKS.map((network) => (
                          <SelectItem key={network.value} value={network.value}>
                            {network.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="schoolInepCode">Codigo INEP</Label>
                    <Input
                      id="schoolInepCode"
                      value={formData.schoolInepCode}
                      onChange={(e) =>
                        setFormData({ ...formData, schoolInepCode: e.target.value })
                      }
                      placeholder="Ex: 29193559"
                    />
                  </div>

                  <div>
                    <Label htmlFor="schoolSourceUrl">Fonte publica</Label>
                    <Input
                      id="schoolSourceUrl"
                      value={formData.schoolSourceUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, schoolSourceUrl: e.target.value })
                      }
                      placeholder="URL do Censo, secretaria ou diretorio publico"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold">Niveis educacionais</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {EDUCATION_LEVEL_OPTIONS.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            checked={formData.educationLevels.includes(option.key)}
                            onCheckedChange={() => toggleArrayField('educationLevels', option.key)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">Turnos ofertados</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {SHIFT_OPTIONS.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            checked={formData.shifts.includes(option.key)}
                            onCheckedChange={() => toggleArrayField('shifts', option.key)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="ageRangeMin">Idade minima (anos)</Label>
                      <Input
                        id="ageRangeMin"
                        type="number"
                        min={0}
                        max={120}
                        value={formData.ageRangeMin}
                        onChange={(e) => setFormData({ ...formData, ageRangeMin: e.target.value })}
                        placeholder="Ex: 4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ageRangeMax">Idade maxima (anos)</Label>
                      <Input
                        id="ageRangeMax"
                        type="number"
                        min={0}
                        max={120}
                        value={formData.ageRangeMax}
                        onChange={(e) => setFormData({ ...formData, ageRangeMax: e.target.value })}
                        placeholder="Ex: 17"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <Checkbox
                          checked={formData.enrollmentOpen}
                          onCheckedChange={(checked) => setFormData({ ...formData, enrollmentOpen: Boolean(checked) })}
                        />
                        <span className="text-sm">Matricula aberta</span>
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Presets rapidos</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => applyInfrastructurePreset('daycare')}>
                      Creche/CMEI
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyInfrastructurePreset('basic_school')}>
                      Escola basica
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyInfrastructurePreset('accessible')}>
                      Escola acessivel
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold">Recursos basicos</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {BASIC_RESOURCE_OPTIONS.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            checked={formData.schoolBasicResources.includes(option.key)}
                            onCheckedChange={() => toggleArrayField('schoolBasicResources', option.key)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">Acessibilidade</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {ACCESSIBILITY_OPTIONS.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            checked={formData.schoolAccessibilityFeatures.includes(option.key)}
                            onCheckedChange={() => toggleArrayField('schoolAccessibilityFeatures', option.key)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">Equipamentos</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {EQUIPMENT_OPTIONS.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            checked={formData.schoolEquipmentFeatures.includes(option.key)}
                            onCheckedChange={() => toggleArrayField('schoolEquipmentFeatures', option.key)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold">Instalacoes</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {FACILITY_OPTIONS.map((option) => (
                        <label key={option.key} className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            checked={formData.schoolFacilityFeatures.includes(option.key)}
                            onCheckedChange={() => toggleArrayField('schoolFacilityFeatures', option.key)}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="summary">Sobre a instituição</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  placeholder="Descreva sua instituição, diferenciais, metodologia..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formData.summary.length}/500 caracteres
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                  placeholder="+5588999999999"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número que será exibido para contato na página pública.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/central/empresas/${businessId}/education`)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EducationSetupPage;

