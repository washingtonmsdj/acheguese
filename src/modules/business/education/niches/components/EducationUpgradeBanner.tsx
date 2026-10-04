/**
 * EducationUpgradeBanner
 *
 * Banner de upgrade para bloqueios por plano ou nicho.
 * Reutilizável em setup, dashboard, programas, eventos, etc.
 */

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  AlertTriangle,
  Lock,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import type { EducationNicheCapability } from '../types';
import { getRecordValue } from '@/shared/utils/recordLookup';

export type UpgradeReason =
  | 'plan_denied'
  | 'niche_denied'
  | 'limit_reached'
  | 'feature_unavailable';

export interface EducationUpgradeBannerProps {
  nicheKey: string | null | undefined;
  businessId: string;
  reason: UpgradeReason;
  feature?: EducationNicheCapability | string;
  currentCount?: number;
  maxCount?: number;
  onUpgrade?: () => void;
  variant?: 'banner' | 'card' | 'inline';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function EducationUpgradeBanner({
  reason,
  feature,
  currentCount,
  maxCount,
  onUpgrade,
  variant = 'banner',
  dismissible = false,
  onDismiss,
}: EducationUpgradeBannerProps) {
  const config = getBannerConfig(reason, feature, currentCount, maxCount);
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  switch (variant) {
    case 'card':
      return (
        <CardVariant
          config={config}
          onUpgrade={onUpgrade}
          onDismiss={dismissible ? handleDismiss : undefined}
        />
      );
    case 'inline':
      return <InlineVariant config={config} onUpgrade={onUpgrade} />;
    case 'banner':
    default:
      return (
        <BannerVariant
          config={config}
          onUpgrade={onUpgrade}
          onDismiss={dismissible ? handleDismiss : undefined}
        />
      );
  }
}

interface VariantProps {
  config: BannerConfig;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

function BannerVariant({ config, onUpgrade, onDismiss }: VariantProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${config.surfaceClassName} ${config.borderClassName}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconClassName}`}>{config.icon}</div>
        <div className="min-w-0 flex-1">
          <h4 className={`font-heading font-medium ${config.titleClassName}`}>
            {config.title}
          </h4>
          <p className={`mt-1 text-sm ${config.messageClassName}`}>
            {config.message}
          </p>

          {config.showAction && onUpgrade && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={onUpgrade}
                className="gap-1 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Fazer upgrade
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Button>

              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
                >
                  Ignorar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardVariant({ config, onUpgrade, onDismiss }: VariantProps) {
  return (
    <div
      className={`rounded-xl border-2 border-dashed p-6 text-center ${config.surfaceClassName} ${config.borderClassName}`}
    >
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.iconSurfaceClassName}`}
      >
        {React.cloneElement(config.icon as React.ReactElement, {
          className: `h-6 w-6 ${config.iconClassName}`,
          'aria-hidden': true,
        })}
      </div>

      <h3 className={`font-heading text-lg font-semibold ${config.titleClassName}`}>
        {config.title}
      </h3>

      <p className={`mt-2 text-sm ${config.messageClassName}`}>
        {config.message}
      </p>

      {config.showAction && onUpgrade && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            onClick={onUpgrade}
            className="gap-2 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Fazer upgrade
          </Button>

          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
              className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised hover:text-territory-ink"
            >
              Depois
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function InlineVariant({ config, onUpgrade }: VariantProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-md px-3 py-2 text-sm ${config.surfaceClassName}`}
    >
      <span className={config.iconClassName}>{config.icon}</span>
      <span className={config.messageClassName}>{config.message}</span>

      {config.showAction && onUpgrade && (
        <Button
          variant="link"
          size="sm"
          className="ml-auto h-auto p-0 text-territory-brand hover:text-territory-brand/80"
          onClick={onUpgrade}
        >
          Fazer upgrade
          <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

interface BannerConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  showAction: boolean;
  surfaceClassName: string;
  borderClassName: string;
  iconClassName: string;
  iconSurfaceClassName: string;
  titleClassName: string;
  messageClassName: string;
}

function getBannerConfig(
  reason: UpgradeReason,
  feature?: string,
  currentCount?: number,
  maxCount?: number,
): BannerConfig {
  const featureName = feature ? getFeatureDisplayName(feature) : 'esta funcionalidade';

  switch (reason) {
    case 'plan_denied':
      return {
        icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
        title: 'Funcionalidade premium',
        message: `${featureName} está disponível apenas em planos pagos. Faça upgrade para desbloquear.`,
        showAction: true,
        surfaceClassName: 'bg-territory-sun/12',
        borderClassName: 'border-territory-sun/45',
        iconClassName: 'text-territory-warning',
        iconSurfaceClassName: 'bg-territory-sun/20',
        titleClassName: 'text-territory-ink',
        messageClassName: 'text-territory-muted',
      };

    case 'niche_denied':
      return {
        icon: <GraduationCap className="h-5 w-5" aria-hidden="true" />,
        title: 'Não disponível para este nicho',
        message: `${featureName} não é compatível com o nicho selecionado. Escolha outro nicho ou entre em contato.`,
        showAction: false,
        surfaceClassName: 'bg-territory-info/10',
        borderClassName: 'border-territory-info/25',
        iconClassName: 'text-territory-info',
        iconSurfaceClassName: 'bg-territory-info/15',
        titleClassName: 'text-territory-ink',
        messageClassName: 'text-territory-muted',
      };

    case 'limit_reached':
      return {
        icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
        title: 'Limite atingido',
        message:
          currentCount !== undefined && maxCount !== undefined
            ? `Você atingiu o limite de ${maxCount} itens (${currentCount}/${maxCount}). Faça upgrade para adicionar mais.`
            : 'Você atingiu o limite do seu plano. Faça upgrade para continuar.',
        showAction: true,
        surfaceClassName: 'bg-territory-error/10',
        borderClassName: 'border-territory-error/25',
        iconClassName: 'text-territory-error',
        iconSurfaceClassName: 'bg-territory-error/15',
        titleClassName: 'text-territory-ink',
        messageClassName: 'text-territory-muted',
      };

    case 'feature_unavailable':
    default:
      return {
        icon: <Lock className="h-5 w-5" aria-hidden="true" />,
        title: 'Funcionalidade indisponível',
        message: `${featureName} não está disponível no momento. Entre em contato com o suporte para mais informações.`,
        showAction: false,
        surfaceClassName: 'bg-territory-raised/70',
        borderClassName: 'border-territory-border',
        iconClassName: 'text-territory-muted',
        iconSurfaceClassName: 'bg-territory-raised',
        titleClassName: 'text-territory-ink',
        messageClassName: 'text-territory-muted',
      };
  }
}

function getFeatureDisplayName(feature: string): string {
  const names: Record<string, string> = {
    basic_programs_catalog: 'Catálogo de programas',
    lead_capture: 'Captura de leads',
    lead_pipeline: 'Pipeline de leads',
    events_public: 'Eventos públicos',
    trial_class_booking: 'Agendamento de aula experimental',
    whatsapp_cta: 'Botão WhatsApp',
    document_upload_pre_enrollment: 'Upload de documentos',
    guardian_portal_basic: 'Portal do responsável',
    schedule_public: 'Grade horária pública',
    attendance_tracking: 'Controle de frequência',
    gradebook: 'Boletim escolar',
    transport_tracking: 'Rastreamento de transporte',
    payment_installments: 'Parcelamento',
    analytics_basic: 'Analytics básico',
    analytics_advanced: 'Analytics avançado',
  };

  return getRecordValue(names, feature) ?? feature;
}

export interface LimitBannerProps {
  nicheKey: string | null | undefined;
  businessId: string;
  type: 'programs' | 'events' | 'leads';
  current: number;
  max: number;
  onUpgrade?: () => void;
}

export function ProgramsLimitBanner(props: LimitBannerProps) {
  const { current, max, onUpgrade } = props;

  if (current < max) return null;

  return (
    <EducationUpgradeBanner
      {...props}
      reason="limit_reached"
      feature="basic_programs_catalog"
      currentCount={current}
      maxCount={max}
      onUpgrade={onUpgrade}
    />
  );
}

export function EventsLimitBanner(props: LimitBannerProps) {
  const { current, max, onUpgrade } = props;

  if (current < max) return null;

  return (
    <EducationUpgradeBanner
      {...props}
      reason="limit_reached"
      feature="events_public"
      currentCount={current}
      maxCount={max}
      onUpgrade={onUpgrade}
    />
  );
}

export function LeadsLimitBanner(props: LimitBannerProps) {
  const { current, max, onUpgrade } = props;

  if (current < max) return null;

  return (
    <EducationUpgradeBanner
      {...props}
      reason="limit_reached"
      feature="lead_capture"
      currentCount={current}
      maxCount={max}
      onUpgrade={onUpgrade}
    />
  );
}

export default EducationUpgradeBanner;
