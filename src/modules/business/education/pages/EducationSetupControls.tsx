import { motion } from 'framer-motion';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { EducationUpgradeBanner } from '../niches/components/EducationUpgradeBanner';
import type { EducationNicheConfig } from '../niches/types';

type EducationSetupHeaderProps = {
  onBack: () => void;
};

export function EducationSetupHeader({ onBack }: EducationSetupHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Button variant="ghost" size="sm" className="mb-4" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configurar Educacao
          </h1>
          <p className="text-sm text-gray-500">
            Configure os dados da sua instituicao
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function EducationSetupSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Skeleton className="h-8 w-1/3 mb-6" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function EducationNicheStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'full_enabled':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completo</Badge>;
    case 'basic_enabled':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Basico</Badge>;
    case 'beta':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Beta</Badge>;
    case 'planned':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Planejado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

type EducationNicheDetailsProps = {
  niche: EducationNicheConfig;
  businessId: string;
};

export function EducationNicheDetails({
  niche,
  businessId,
}: EducationNicheDetailsProps) {
  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{niche.displayName}</h4>
        <EducationNicheStatusBadge status={niche.supportLevel} />
      </div>
      <p className="text-xs text-muted-foreground mb-3">{niche.description}</p>

      <Separator className="my-2" />

      <div className="text-xs space-y-1">
        <p>
          <span className="font-medium">Limites:</span>{' '}
          {niche.entitlements.maxPrograms} programas,{' '}
          {niche.entitlements.maxEvents} eventos,{' '}
          {niche.entitlements.maxLeadsPerMonth} leads/mes
        </p>
        <p>
          <span className="font-medium">Capabilities:</span>{' '}
          {niche.enabledCapabilities.length} ativas
        </p>
      </div>

      {niche.isBeta && (
        <EducationUpgradeBanner
          nicheKey={niche.nicheKey}
          businessId={businessId}
          reason="feature_unavailable"
          variant="inline"
        />
      )}
    </div>
  );
}

type EducationOptionCheckboxGroupProps<T extends string> = {
  title: string;
  options: readonly { key: T; label: string }[];
  selected: readonly T[];
  onToggle: (key: T) => void;
};

export function EducationOptionCheckboxGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: EducationOptionCheckboxGroupProps<T>) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.key}
            className="flex items-center gap-2 rounded-md border px-3 py-2"
          >
            <Checkbox
              checked={selected.includes(option.key)}
              onCheckedChange={() => onToggle(option.key)}
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

type EducationSetupActionsProps = {
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export function EducationSetupActions({
  isSaving,
  onCancel,
  onSave,
}: EducationSetupActionsProps) {
  return (
    <div className="flex gap-4">
      <Button
        type="button"
        data-testid="education-save-setup"
        disabled={isSaving}
        onClick={onSave}
        className="flex-1 gap-2"
      >
        <Save className="w-4 h-4" />
        {isSaving ? 'Salvando...' : 'Salvar Configuracoes'}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
    </div>
  );
}
