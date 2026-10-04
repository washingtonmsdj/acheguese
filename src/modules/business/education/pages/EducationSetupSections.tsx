import { FileText, Phone, School } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Textarea } from '@/shared/components/ui/textarea';

import type { EducationNicheConfig } from '../niches/types';
import {
  ACCESSIBILITY_OPTIONS,
  BASIC_RESOURCE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  EQUIPMENT_OPTIONS,
  FACILITY_OPTIONS,
  getInstitutionTypeForNiche,
  getSchoolNetworkOptions,
  normalizeSchoolNetworkForType,
  SCHOOL_TYPES,
  SHIFT_OPTIONS,
  type EducationInfrastructurePreset,
  type EducationSetupArrayField,
  type EducationSetupFormData,
} from './EducationSetupPage.model';
import {
  EducationNicheDetails,
  EducationOptionCheckboxGroup,
} from './EducationSetupControls';

type PatchEducationSetupForm = (patch: Partial<EducationSetupFormData>) => void;

type EducationInstitutionSectionProps = {
  formData: EducationSetupFormData;
  selectedNiche: EducationNicheConfig | null;
  selectableNiches: EducationNicheConfig[];
  businessId: string;
  onPatch: PatchEducationSetupForm;
};

const sectionCardClassName =
  'border-territory-border bg-territory-surface text-territory-ink shadow-sm';
const sectionTitleClassName = 'flex items-center gap-2 text-lg text-territory-ink';
const helperTextClassName = 'mt-1 text-xs text-territory-muted';
const separatorClassName = 'bg-territory-border';
const outlineActionClassName =
  'border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/40 hover:bg-territory-raised';

export function EducationInstitutionSection({
  formData,
  selectedNiche,
  selectableNiches,
  businessId,
  onPatch,
}: EducationInstitutionSectionProps) {
  return (
    <Card className={sectionCardClassName}>
      <CardHeader>
        <CardTitle className={sectionTitleClassName}>
          <School className="h-5 w-5 text-territory-brand" />
          Tipo de instituição
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="nicheKey">Tipo de instituição educacional</Label>
          <Select
            value={formData.nicheKey}
            onValueChange={(value) =>
              onPatch({
                nicheKey: value,
                institutionType: getInstitutionTypeForNiche(value),
              })
            }
          >
            <SelectTrigger id="nicheKey" data-testid="education-niche-trigger">
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
          <p className={helperTextClassName}>
            Esta escolha define os recursos do módulo; o tipo técnico é derivado automaticamente.
          </p>
        </div>

        {selectedNiche && (
          <EducationNicheDetails niche={selectedNiche} businessId={businessId} />
        )}
      </CardContent>
    </Card>
  );
}

type EducationDataSectionProps = {
  formData: EducationSetupFormData;
  isSchoolProfile: boolean;
  showEducationLevels: boolean;
  shiftLabel: string;
  ageGroupLabel: string;
  onPatch: PatchEducationSetupForm;
  onToggleArrayField: (field: EducationSetupArrayField, value: string) => void;
  onApplyPreset: (preset: EducationInfrastructurePreset) => void;
};

export function EducationDataSection({
  formData,
  isSchoolProfile,
  showEducationLevels,
  shiftLabel,
  ageGroupLabel,
  onPatch,
  onToggleArrayField,
  onApplyPreset,
}: EducationDataSectionProps) {
  if (!formData.nicheKey) {
    return null;
  }

  return (
    <Card className={sectionCardClassName}>
      <CardHeader>
        <CardTitle className={sectionTitleClassName}>
          <School className="h-5 w-5 text-territory-brand" />
          Dados educacionais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSchoolProfile && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="schoolType">Tipo escolar</Label>
                <Select
                  value={formData.schoolType}
                  onValueChange={(value) =>
                    onPatch({
                      schoolType: value,
                      schoolNetwork: normalizeSchoolNetworkForType(
                        value,
                        formData.schoolNetwork,
                      ),
                    })
                  }
                >
                  <SelectTrigger
                    id="schoolType"
                    data-testid="education-school-type-trigger"
                  >
                    <SelectValue placeholder="Pública, privada..." />
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
                  onValueChange={(value) => onPatch({ schoolNetwork: value })}
                >
                  <SelectTrigger
                    id="schoolNetwork"
                    data-testid="education-school-network-trigger"
                  >
                    <SelectValue placeholder="Municipal, estadual..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getSchoolNetworkOptions(formData.schoolType).map((network) => (
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
                <Label htmlFor="schoolInepCode">Código INEP</Label>
                <Input
                  id="schoolInepCode"
                  data-testid="education-school-inep"
                  value={formData.schoolInepCode}
                  onChange={(event) =>
                    onPatch({ schoolInepCode: event.target.value })
                  }
                  placeholder="Ex: 29193559"
                />
              </div>

              <div>
                <Label htmlFor="schoolSourceUrl">Fonte pública</Label>
                <Input
                  id="schoolSourceUrl"
                  data-testid="education-school-source-url"
                  value={formData.schoolSourceUrl}
                  onChange={(event) =>
                    onPatch({ schoolSourceUrl: event.target.value })
                  }
                  placeholder="URL do Censo, secretaria ou diretório público"
                />
              </div>
            </div>

            <Separator className={separatorClassName} />
          </>
        )}

        <div className="space-y-5">
          {showEducationLevels && (
            <EducationOptionCheckboxGroup
              title="Níveis educacionais"
              options={EDUCATION_LEVEL_OPTIONS}
              selected={formData.educationLevels}
              onToggle={(key) => onToggleArrayField('educationLevels', key)}
            />
          )}

          <EducationOptionCheckboxGroup
            title={`${shiftLabel}s ofertados`}
            options={SHIFT_OPTIONS}
            selected={formData.shifts}
            onToggle={(key) => onToggleArrayField('shifts', key)}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="ageRangeMin">{ageGroupLabel} mínima</Label>
              <Input
                id="ageRangeMin"
                data-testid="education-age-min"
                type="number"
                min={0}
                max={120}
                value={formData.ageRangeMin}
                onChange={(event) => onPatch({ ageRangeMin: event.target.value })}
                placeholder="Ex: 4"
              />
            </div>
            <div>
              <Label htmlFor="ageRangeMax">{ageGroupLabel} máxima</Label>
              <Input
                id="ageRangeMax"
                data-testid="education-age-max"
                type="number"
                min={0}
                max={120}
                value={formData.ageRangeMax}
                onChange={(event) => onPatch({ ageRangeMax: event.target.value })}
                placeholder="Ex: 17"
              />
            </div>
            <div>
              <Label htmlFor="enrollmentStatus">Situação de matrícula</Label>
              <Select
                value={
                  formData.enrollmentOpen === true
                    ? 'open'
                    : formData.enrollmentOpen === false
                      ? 'closed'
                      : 'unknown'
                }
                onValueChange={(value) =>
                  onPatch({
                    enrollmentOpen:
                      value === 'open' ? true : value === 'closed' ? false : null,
                  })
                }
              >
                <SelectTrigger id="enrollmentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Não informado</SelectItem>
                  <SelectItem value="open">Matrículas abertas</SelectItem>
                  <SelectItem value="closed">Matrículas fechadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className={separatorClassName} />

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-territory-ink">Presets rápidos</h4>
          <div className="flex flex-wrap gap-2">
            {isSchoolProfile && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={outlineActionClassName}
                  onClick={() => onApplyPreset('daycare')}
                >
                  Creche/CMEI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={outlineActionClassName}
                  onClick={() => onApplyPreset('basic_school')}
                >
                  Escola básica
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={outlineActionClassName}
              onClick={() => onApplyPreset('accessible')}
            >
              Acessibilidade
            </Button>
          </div>
        </div>

        <Separator className={separatorClassName} />

        <div className="space-y-5">
          <EducationOptionCheckboxGroup
            title="Recursos básicos"
            options={BASIC_RESOURCE_OPTIONS}
            selected={formData.schoolBasicResources}
            onToggle={(key) => onToggleArrayField('schoolBasicResources', key)}
          />

          <EducationOptionCheckboxGroup
            title="Acessibilidade"
            options={ACCESSIBILITY_OPTIONS}
            selected={formData.schoolAccessibilityFeatures}
            onToggle={(key) =>
              onToggleArrayField('schoolAccessibilityFeatures', key)
            }
          />

          <EducationOptionCheckboxGroup
            title="Equipamentos"
            options={EQUIPMENT_OPTIONS}
            selected={formData.schoolEquipmentFeatures}
            onToggle={(key) =>
              onToggleArrayField('schoolEquipmentFeatures', key)
            }
          />

          <EducationOptionCheckboxGroup
            title="Instalações"
            options={FACILITY_OPTIONS}
            selected={formData.schoolFacilityFeatures}
            onToggle={(key) =>
              onToggleArrayField('schoolFacilityFeatures', key)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

type EducationDescriptionSectionProps = {
  summary: string;
  summaryLabel: string;
  summaryPlaceholder: string;
  onPatch: PatchEducationSetupForm;
};

export function EducationDescriptionSection({
  summary,
  summaryLabel,
  summaryPlaceholder,
  onPatch,
}: EducationDescriptionSectionProps) {
  return (
    <Card className={sectionCardClassName}>
      <CardHeader>
        <CardTitle className={sectionTitleClassName}>
          <FileText className="h-5 w-5 text-territory-brand" />
          Descrição
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="summary">{summaryLabel}</Label>
          <Textarea
            id="summary"
            data-testid="education-summary"
            value={summary}
            onChange={(event) => onPatch({ summary: event.target.value })}
            placeholder={summaryPlaceholder}
            rows={4}
            maxLength={500}
          />
          <p className={`${helperTextClassName} text-right`}>
            {summary.length}/500 caracteres
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type EducationContactSectionProps = {
  whatsappNumber: string;
  onPatch: PatchEducationSetupForm;
};

export function EducationContactSection({
  whatsappNumber,
  onPatch,
}: EducationContactSectionProps) {
  return (
    <Card className={sectionCardClassName}>
      <CardHeader>
        <CardTitle className={sectionTitleClassName}>
          <Phone className="h-5 w-5 text-territory-brand" />
          Contato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="whatsappNumber">WhatsApp</Label>
          <Input
            id="whatsappNumber"
            data-testid="education-whatsapp"
            value={whatsappNumber}
            onChange={(event) => onPatch({ whatsappNumber: event.target.value })}
            placeholder="+5588999999999"
          />
          <p className={helperTextClassName}>
            Número que será exibido para contato na página pública.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
