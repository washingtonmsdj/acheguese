import { FileText, Phone, School } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
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
  SCHOOL_NETWORKS,
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

export function EducationInstitutionSection({
  formData,
  selectedNiche,
  selectableNiches,
  businessId,
  onPatch,
}: EducationInstitutionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <School className="w-5 h-5 text-blue-500" />
          Tipo de Instituicao
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="nicheKey">Tipo de instituicao educacional</Label>
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
          <p className="text-xs text-gray-500 mt-1">
            Esta escolha define as capacidades do modulo; o tipo tecnico e derivado automaticamente.
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <School className="w-5 h-5 text-blue-500" />
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
                  onValueChange={(value) => onPatch({ schoolType: value })}
                >
                  <SelectTrigger
                    id="schoolType"
                    data-testid="education-school-type-trigger"
                  >
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
                  onValueChange={(value) => onPatch({ schoolNetwork: value })}
                >
                  <SelectTrigger
                    id="schoolNetwork"
                    data-testid="education-school-network-trigger"
                  >
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
                  data-testid="education-school-inep"
                  value={formData.schoolInepCode}
                  onChange={(event) =>
                    onPatch({ schoolInepCode: event.target.value })
                  }
                  placeholder="Ex: 29193559"
                />
              </div>

              <div>
                <Label htmlFor="schoolSourceUrl">Fonte publica</Label>
                <Input
                  id="schoolSourceUrl"
                  data-testid="education-school-source-url"
                  value={formData.schoolSourceUrl}
                  onChange={(event) =>
                    onPatch({ schoolSourceUrl: event.target.value })
                  }
                  placeholder="URL do Censo, secretaria ou diretorio publico"
                />
              </div>
            </div>

            <Separator />
          </>
        )}

        <div className="space-y-5">
          {showEducationLevels && (
            <EducationOptionCheckboxGroup
              title="Niveis educacionais"
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
              <Label htmlFor="ageRangeMin">{ageGroupLabel} minima</Label>
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
              <Label htmlFor="ageRangeMax">{ageGroupLabel} maxima</Label>
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
            <div className="flex items-end">
              <label className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Checkbox
                  checked={formData.enrollmentOpen}
                  onCheckedChange={(checked) =>
                    onPatch({ enrollmentOpen: Boolean(checked) })
                  }
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
            {isSchoolProfile && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyPreset('daycare')}
                >
                  Creche/CMEI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyPreset('basic_school')}
                >
                  Escola basica
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onApplyPreset('accessible')}
            >
              Acessibilidade
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-5">
              <EducationOptionCheckboxGroup
                title="Recursos basicos"
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
            title="Instalacoes"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Descricao
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
          <p className="text-xs text-gray-500 mt-1 text-right">
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
            data-testid="education-whatsapp"
            value={whatsappNumber}
            onChange={(event) => onPatch({ whatsappNumber: event.target.value })}
            placeholder="+5588999999999"
          />
          <p className="text-xs text-gray-500 mt-1">
            Numero que sera exibido para contato na pagina publica.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
