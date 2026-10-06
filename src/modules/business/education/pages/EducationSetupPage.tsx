/**
 * EducationSetupPage
 *
 * Página de configuração inicial do perfil de Educação.
 * Rota: /central/empresas/:businessId/educacao/setup
 */

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/shared/hooks/use-toast';
import { useEducationProfile } from '../hooks/useEducationProfile';
import { EducationService } from '../services/EducationService';
import { EducationUrlService } from '../services/EducationUrlService';
import { EducationAdminReadError } from '../components/EducationAdminReadError';
import { getEducationProfileSetupValidationErrors } from '@/core/education';
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
import { getNicheByKey, getSelectableNiches } from '../niches/registry';
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
  const dashboardUrl = businessId
    ? EducationUrlService.buildAdminDashboardUrl(businessId)
    : null;

  const [formData, setFormData] = useState<EducationSetupFormData>(
    INITIAL_EDUCATION_SETUP_FORM,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setFormData({
      institutionType:
        getInstitutionTypeForNiche(profile.niche_key) ||
        profile.institution_type ||
        '',
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
    setFormData((previous) => ({ ...previous, ...patch }));
  };

  const toggleArrayField = (field: EducationSetupArrayField, value: string) => {
    setFormData((previous) => {
      switch (field) {
        case 'educationLevels':
          return {
            ...previous,
            educationLevels: toggleArrayValue(
              previous.educationLevels,
              value as EducationLevel,
            ),
          };
        case 'shifts':
          return {
            ...previous,
            shifts: toggleArrayValue(previous.shifts, value as SchoolShift),
          };
        case 'schoolBasicResources':
          return {
            ...previous,
            schoolBasicResources: toggleArrayValue(
              previous.schoolBasicResources,
              value as SchoolBasicResourceKey,
            ),
          };
        case 'schoolAccessibilityFeatures':
          return {
            ...previous,
            schoolAccessibilityFeatures: toggleArrayValue(
              previous.schoolAccessibilityFeatures,
              value as SchoolAccessibilityFeatureKey,
            ),
          };
        case 'schoolEquipmentFeatures':
          return {
            ...previous,
            schoolEquipmentFeatures: toggleArrayValue(
              previous.schoolEquipmentFeatures,
              value as SchoolEquipmentFeatureKey,
            ),
          };
        case 'schoolFacilityFeatures':
          return {
            ...previous,
            schoolFacilityFeatures: toggleArrayValue(
              previous.schoolFacilityFeatures,
              value as SchoolFacilityFeatureKey,
            ),
          };
        default:
          return previous;
      }
    });
  };

  const applyInfrastructurePreset = (preset: EducationInfrastructurePreset) => {
    setFormData((previous) =>
      applyEducationInfrastructurePreset(previous, preset),
    );
  };

  const saveSetup = async () => {
    if (!businessId) return;

    if (!formData.nicheKey) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o tipo de instituição educacional.',
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
    const ageRangeMin =
      formData.ageRangeMin === '' ? null : Number(formData.ageRangeMin);
    const ageRangeMax =
      formData.ageRangeMax === '' ? null : Number(formData.ageRangeMax);
    const setupValidationErrors = getEducationProfileSetupValidationErrors({
      ageRangeMin,
      ageRangeMax,
      schoolInepCode: supportsSchoolIdentity ? formData.schoolInepCode : null,
    });

    if (setupValidationErrors.length > 0) {
      toast({
        title: 'Revise os dados da instituição',
        description: setupValidationErrors[0].message,
        variant: 'destructive',
      });
      return;
    }

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
        schoolInepCode: supportsSchoolIdentity
          ? formData.schoolInepCode.trim() || undefined
          : undefined,
        schoolSourceUrl: supportsSchoolIdentity
          ? formData.schoolSourceUrl || undefined
          : undefined,
        educationLevels: supportsEducationLevels
          ? formData.educationLevels
          : undefined,
        shifts: formData.shifts,
        ageRangeMin: ageRangeMin ?? undefined,
        ageRangeMax: ageRangeMax ?? undefined,
        enrollmentOpen: formData.enrollmentOpen,
        schoolBasicResources: formData.schoolBasicResources,
        schoolAccessibilityFeatures: formData.schoolAccessibilityFeatures,
        schoolEquipmentFeatures: formData.schoolEquipmentFeatures,
        schoolFacilityFeatures: formData.schoolFacilityFeatures,
        summary: formData.summary,
        whatsappNumber: formData.whatsappNumber,
      });

      if (!result) {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as configurações.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Configuração salva',
        description: 'As alterações foram salvas com sucesso.',
      });
      void refetch();
      if (dashboardUrl) {
        navigate(dashboardUrl);
      }
    } catch {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void saveSetup();
  };

  const selectableNiches = getSelectableNiches();
  const selectedNiche = formData.nicheKey
    ? getNicheByKey(formData.nicheKey)
    : null;
  const isSchoolProfile = isSchoolProfileNiche(formData.nicheKey);
  const showEducationLevels = hasEducationLevels(formData.nicheKey);
  const summaryLabel =
    selectedNiche?.uiLabels.summaryLabel ?? 'Sobre a instituição';
  const summaryPlaceholder =
    selectedNiche?.uiLabels.summaryPlaceholder ??
    'Descreva a instituição, diferenciais, metodologia e formas de atendimento.';
  const shiftLabel = selectedNiche?.uiLabels.shiftLabel ?? 'Turno';
  const ageGroupLabel =
    selectedNiche?.uiLabels.ageGroupLabel ?? 'Faixa etária';

  const handleBack = () =>
    dashboardUrl ? navigate(dashboardUrl) : navigate(-1);

  if (isLoading) {
    return <EducationSetupSkeleton />;
  }

  if (isError) {
    return (
      <EducationAdminReadError
        title="Não foi possível carregar a configuração de Educação"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-6 text-territory-ink">
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
          />
        </div>
      </form>
    </div>
  );
}

export default EducationSetupPage;
