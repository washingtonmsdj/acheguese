/**
 * EducationSetupPage
 *
 * Pagina de configuracao inicial do perfil de educacao.
 * Rota: /central/empresas/:businessId/educacao/setup
 */

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/hooks/use-toast';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { EducationService } from '../services/EducationService';
import { EducationUrlService } from '../services/EducationUrlService';
import { EducationAdminReadError } from '../components/EducationAdminReadError';
import type {
  EducationLevel,
  SchoolShift,
  SchoolNetwork,
  SchoolType,
  SchoolBasicResourceKey,
  SchoolAccessibilityFeatureKey,
  SchoolEquipmentFeatureKey,
  SchoolFacilityFeatureKey,
} from '@/core/education';
import {
  INITIAL_EDUCATION_SETUP_FORM,
  applyEducationInfrastructurePreset,
  getInstitutionTypeForNiche,
  hasEducationLevels,
  isSchoolProfileNiche,
  normalizeSchoolNetworkForType,
  type EducationInfrastructurePreset,
  type EducationSetupArrayField,
  type EducationSetupFormData,
  toggleArrayValue,
} from './EducationSetupPage.model';
import { getSelectableNiches, getNicheByKey } from '../niches/registry';
import {
  EducationSetupActions,
  EducationSetupHeader,
  EducationSetupSkeleton,
} from './EducationSetupControls';
import {
  EducationContactSection,
  EducationDataSection,
  EducationDescriptionSection,
  EducationInstitutionSection,
} from './EducationSetupSections';

export function EducationSetupPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useEducationProfile(businessId);
  const dashboardUrl = businessId ? EducationUrlService.buildAdminDashboardUrl(businessId) : null;

  const [formData, setFormData] = useState<EducationSetupFormData>(
    INITIAL_EDUCATION_SETUP_FORM,
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      institutionType:
        getInstitutionTypeForNiche(profile.niche_key) || profile.institution_type || '',
      nicheKey: profile.niche_key ?? '',
      schoolType: profile.school_type ?? '',
      schoolNetwork: profile.school_network ?? '',
      schoolInepCode: profile.school_inep_code ?? '',
      schoolSourceUrl: profile.school_source_url ?? '',
      educationLevels: profile.education_levels ?? [],
      shifts: profile.shifts ?? [],
      ageRangeMin: profile.age_range_min?.toString() ?? '',
      ageRangeMax: profile.age_range_max?.toString() ?? '',
      enrollmentOpen: profile.enrollment_open ?? null,
      schoolBasicResources: profile.school_basic_resources ?? [],
      schoolAccessibilityFeatures: profile.school_accessibility_features ?? [],
      schoolEquipmentFeatures: profile.school_equipment_features ?? [],
      schoolFacilityFeatures: profile.school_facility_features ?? [],
      summary: profile.summary ?? '',
      whatsappNumber: profile.whatsapp_number ?? '',
    });
  }, [profile]);

  const patchFormData = (patch: Partial<EducationSetupFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const toggleArrayField = (field: EducationSetupArrayField, value: string) => {
    setFormData((prev) => {
      switch (field) {
        case 'educationLevels':
          return { ...prev, educationLevels: toggleArrayValue(prev.educationLevels, value as EducationLevel) };
        case 'shifts':
          return { ...prev, shifts: toggleArrayValue(prev.shifts, value as SchoolShift) };
        case 'schoolBasicResources':
          return { ...prev, schoolBasicResources: toggleArrayValue(prev.schoolBasicResources, value as SchoolBasicResourceKey) };
        case 'schoolAccessibilityFeatures':
          return { ...prev, schoolAccessibilityFeatures: toggleArrayValue(prev.schoolAccessibilityFeatures, value as SchoolAccessibilityFeatureKey) };
        case 'schoolEquipmentFeatures':
          return { ...prev, schoolEquipmentFeatures: toggleArrayValue(prev.schoolEquipmentFeatures, value as SchoolEquipmentFeatureKey) };
        case 'schoolFacilityFeatures':
          return { ...prev, schoolFacilityFeatures: toggleArrayValue(prev.schoolFacilityFeatures, value as SchoolFacilityFeatureKey) };
        default:
          return prev;
      }
    });
  };

  const applyInfrastructurePreset = (preset: EducationInfrastructurePreset) => {
    setFormData((prev) => applyEducationInfrastructurePreset(prev, preset));
  };

  const saveSetup = async () => {
    if (!businessId) return;
    if (!formData.nicheKey) {
      toast({
        title: 'Campo obrigatorio',
        description: 'Selecione o tipo de instituicao educacional.',
        variant: 'destructive',
      });
      return;
    }

    const supportsSchoolIdentity = isSchoolProfileNiche(formData.nicheKey);
    const supportsEducationLevels = hasEducationLevels(formData.nicheKey);
    const normalizedNetwork = normalizeSchoolNetworkForType(
      formData.schoolType,
      formData.schoolNetwork,
    );

    setIsSaving(true);
    try {
      const result = await EducationService.saveSetupProfile({
        businessId,
        institutionType: getInstitutionTypeForNiche(formData.nicheKey),
        nicheKey: formData.nicheKey,
        schoolType: supportsSchoolIdentity
          ? ((formData.schoolType || undefined) as SchoolType | undefined)
          : undefined,
        schoolNetwork: supportsSchoolIdentity
          ? ((normalizedNetwork || undefined) as SchoolNetwork | undefined)
          : undefined,
        schoolInepCode: supportsSchoolIdentity ? formData.schoolInepCode || undefined : undefined,
        schoolSourceUrl: supportsSchoolIdentity ? formData.schoolSourceUrl || undefined : undefined,
        educationLevels: supportsEducationLevels ? formData.educationLevels : undefined,
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
          title: 'Configuracao salva',
          description: 'As alteracoes foram salvas com sucesso.',
        });
        refetch();
        if (dashboardUrl) {
          navigate(dashboardUrl);
        }
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
        description: 'Ocorreu um erro ao salvar as configuracoes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void saveSetup();
  };

  const selectableNiches = getSelectableNiches();
  const selectedNiche = formData.nicheKey ? getNicheByKey(formData.nicheKey) : null;
  const isSchoolProfile = isSchoolProfileNiche(formData.nicheKey);
  const showEducationLevels = hasEducationLevels(formData.nicheKey);
  const summaryLabel = selectedNiche?.uiLabels.summaryLabel ?? 'Sobre a instituicao';
  const summaryPlaceholder =
    selectedNiche?.uiLabels.summaryPlaceholder ??
    'Descreva a instituicao, diferenciais, metodologia e formas de atendimento.';
  const shiftLabel = selectedNiche?.uiLabels.shiftLabel ?? 'Turno';
  const ageGroupLabel = selectedNiche?.uiLabels.ageGroupLabel ?? 'Faixa etaria';

  const handleBack = () => (dashboardUrl ? navigate(dashboardUrl) : navigate(-1));

  if (isLoading) {
    return <EducationSetupSkeleton />;
  }

  if (isError) {
    return (
      <EducationAdminReadError
        title="Nao foi possivel carregar a configuracao de Educacao"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <EducationSetupHeader onBack={handleBack} />

      <form onSubmit={handleSubmit} data-testid="education-setup-form">
        <div className="space-y-6">
          <EducationInstitutionSection
            formData={formData}
            selectedNiche={selectedNiche}
            selectableNiches={selectableNiches}
            businessId={businessId || ''}
            onPatch={patchFormData}
          />

          <EducationDataSection
            formData={formData}
            isSchoolProfile={isSchoolProfile}
            showEducationLevels={showEducationLevels}
            shiftLabel={shiftLabel}
            ageGroupLabel={ageGroupLabel}
            onPatch={patchFormData}
            onToggleArrayField={toggleArrayField}
            onApplyPreset={applyInfrastructurePreset}
          />

          <EducationDescriptionSection
            summary={formData.summary}
            summaryLabel={summaryLabel}
            summaryPlaceholder={summaryPlaceholder}
            onPatch={patchFormData}
          />

          <EducationContactSection
            whatsappNumber={formData.whatsappNumber}
            onPatch={patchFormData}
          />
          <EducationSetupActions
            isSaving={isSaving}
            onCancel={handleBack}
            onSave={() => void saveSetup()}
          />
        </div>
      </form>
    </div>
  );
}

export default EducationSetupPage;
