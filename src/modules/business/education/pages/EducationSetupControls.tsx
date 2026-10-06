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
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
        onClick={onBack}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-territory-brand shadow-sm">
          <Settings className="h-5 w-5 text-territory-on-image" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-territory-ink">
            Configurar Educação
          </h1>
          <p className="text-sm text-territory-muted">
            Configure os dados da sua instituição
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function EducationSetupSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Skeleton className="mb-6 h-8 w-1/3" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function EducationNicheStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'full_enabled':
      return (
        <Badge className="border-territory-success/25 bg-territory-success/10 text-territory-success hover:bg-territory-success/15">
          Completo
        </Badge>
      );
    case 'basic_enabled':
      return (
        <Badge className="border-territory-brand/25 bg-territory-brand/10 text-territory-brand hover:bg-territory-brand/15">
          Básico
        </Badge>
      );
    case 'beta':
      return (
        <Badge className="border-territory-warning/30 bg-territory-warning/10 text-territory-warning hover:bg-territory-warning/15">
          Beta
        </Badge>
      );
    case 'planned':
      return (
        <Badge className="border-territory-border bg-territory-raised text-territory-muted hover:bg-territory-raised">
          Planejado
        </Badge>
      );
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
    <div className="mt-4 rounded-lg border border-dashed border-territory-border bg-territory-raised/70 p-4 text-territory-ink">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-medium">{niche.displayName}</h4>
        <EducationNicheStatusBadge status={niche.supportLevel} />
      </div>
      <p className="mb-3 text-xs text-territory-muted">{niche.description}</p>

      <Separator className="my-2 bg-territory-border" />

      <div className="space-y-1 text-xs text-territory-muted">
        <p>
          <span className="font-medium text-territory-ink">Limites:</span>{' '}
          {niche.entitlements.maxPrograms} programas,{' '}
          {niche.entitlements.maxEvents} eventos,{' '}
          {niche.entitlements.maxLeadsPerMonth} leads/mês
        </p>
        <p>
          <span className="font-medium text-territory-ink">Recursos habilitados:</span>{' '}
          {niche.enabledCapabilities.length} ativos
        </p>
      </div>

      {niche.isBeta && (
        <div className="mt-3">
          <EducationUpgradeBanner
            nicheKey={niche.nicheKey}
            businessId={businessId}
            reason="feature_unavailable"
            variant="inline"
          />
        </div>
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
      <h4 className="text-sm font-semibold text-territory-ink">{title}</h4>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.key}
            className="flex items-center gap-2 rounded-md border border-territory-border bg-territory-surface px-3 py-2 text-territory-ink transition-colors hover:border-territory-brand/40 hover:bg-territory-raised"
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
};

export function EducationSetupActions({
  isSaving,
  onCancel,
}: EducationSetupActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        type="submit"
        data-testid="education-save-setup"
        disabled={isSaving}
        className="flex-1 gap-2 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
      >
        <Save className="h-4 w-4" />
        {isSaving ? 'Salvando...' : 'Salvar configurações'}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
      >
        Cancelar
      </Button>
    </div>
  );
}
