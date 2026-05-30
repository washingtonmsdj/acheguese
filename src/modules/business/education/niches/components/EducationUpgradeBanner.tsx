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
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useEducationNicheBilling } from '../hooks/useEducationNicheBilling';
import type { EducationNicheCapability } from '../types';
import { getRecordValue } from '@/shared/utils/recordLookup';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function EducationUpgradeBanner({
  nicheKey,
  businessId,
  reason,
  feature,
  currentCount,
  maxCount,
  onUpgrade,
  variant = 'banner',
  dismissible = false,
  onDismiss,
}: EducationUpgradeBannerProps) {
  const { subscription, niche } = useEducationNicheBilling({
    nicheKey,
    businessId,
  });
  
  const config = getBannerConfig(reason, feature, currentCount, maxCount);
  
  // Se dismissible e usuário dispensou, não renderiza
  const [dismissed, setDismissed] = React.useState(false);
  
  if (dismissed) return null;
  
  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };
  
  // Renderização por variante
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
      return (
        <InlineVariant 
          config={config} 
          onUpgrade={onUpgrade}
        />
      );
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

// ═══════════════════════════════════════════════════════════════════════════
// VARIANTES DE UI
// ═══════════════════════════════════════════════════════════════════════════

interface VariantProps {
  config: BannerConfig;
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

function BannerVariant({ config, onUpgrade, onDismiss }: VariantProps) {
  return (
    <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconColor}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${config.titleColor}`}>
            {config.title}
          </h4>
          <p className={`mt-1 text-sm ${config.messageColor}`}>
            {config.message}
          </p>
          
          {config.showAction && onUpgrade && (
            <div className="mt-3 flex items-center gap-3">
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="gap-1"
              >
                <Sparkles className="h-4 w-4" />
                Fazer Upgrade
                <ArrowRight className="h-3 w-3" />
              </Button>
              
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onDismiss}
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
    <div className={`rounded-xl border-2 border-dashed p-6 text-center ${config.bgColor}`}>
      <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.iconBgColor}`}>
        {React.cloneElement(config.icon as React.ReactElement, { 
          className: `h-6 w-6 ${config.iconColor}` 
        })}
      </div>
      
      <h3 className={`text-lg font-semibold ${config.titleColor}`}>
        {config.title}
      </h3>
      
      <p className={`mt-2 text-sm ${config.messageColor}`}>
        {config.message}
      </p>
      
      {config.showAction && onUpgrade && (
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={onUpgrade} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Fazer Upgrade
          </Button>
          
          {onDismiss && (
            <Button variant="outline" onClick={onDismiss}>
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
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${config.bgColor}`}>
      {config.icon}
      <span className={config.messageColor}>{config.message}</span>
      
      {config.showAction && onUpgrade && (
        <Button 
          variant="link" 
          size="sm" 
          className="h-auto p-0 ml-auto"
          onClick={onUpgrade}
        >
          Fazer Upgrade
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

interface BannerConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  showAction: boolean;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  iconBgColor: string;
  titleColor: string;
  messageColor: string;
}

function getBannerConfig(
  reason: UpgradeReason,
  feature?: string,
  currentCount?: number,
  maxCount?: number
): BannerConfig {
  const featureName = feature ? getFeatureDisplayName(feature) : 'esta funcionalidade';
  
  switch (reason) {
    case 'plan_denied':
      return {
        icon: <Sparkles className="h-5 w-5" />,
        title: 'Funcionalidade Premium',
        message: `${featureName} está disponível apenas em planos pagos. Faça upgrade para desbloquear.`,
        showAction: true,
        bgColor: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBgColor: 'bg-amber-100 dark:bg-amber-900/30',
        titleColor: 'text-amber-900 dark:text-amber-100',
        messageColor: 'text-amber-700 dark:text-amber-300',
      };
      
    case 'niche_denied':
      return {
        icon: <GraduationCap className="h-5 w-5" />,
        title: 'Não Disponível para este Nicho',
        message: `${featureName} não é compatível com o nicho selecionado. Escolha outro nicho ou entre em contato.`,
        showAction: false,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
        titleColor: 'text-blue-900 dark:text-blue-100',
        messageColor: 'text-blue-700 dark:text-blue-300',
      };
      
    case 'limit_reached':
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        title: 'Limite Atingido',
        message: currentCount !== undefined && maxCount !== undefined
          ? `Você atingiu o limite de ${maxCount} itens (${currentCount}/${maxCount}). Faça upgrade para adicionar mais.`
          : 'Você atingiu o limite do seu plano. Faça upgrade para continuar.',
        showAction: true,
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        iconBgColor: 'bg-red-100 dark:bg-red-900/30',
        titleColor: 'text-red-900 dark:text-red-100',
        messageColor: 'text-red-700 dark:text-red-300',
      };
      
    case 'feature_unavailable':
    default:
      return {
        icon: <Lock className="h-5 w-5" />,
        title: 'Funcionalidade Indisponível',
        message: `${featureName} não está disponível no momento. Entre em contato com o suporte para mais informações.`,
        showAction: false,
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400',
        iconBgColor: 'bg-gray-100 dark:bg-gray-800',
        titleColor: 'text-gray-900 dark:text-gray-100',
        messageColor: 'text-gray-600 dark:text-gray-400',
      };
  }
}

function getFeatureDisplayName(feature: string): string {
  const names: Record<string, string> = {
    'basic_programs_catalog': 'Catálogo de programas',
    'lead_capture': 'Captura de leads',
    'lead_pipeline': 'Pipeline de leads',
    'events_public': 'Eventos públicos',
    'trial_class_booking': 'Agendamento de aula experimental',
    'whatsapp_cta': 'Botão WhatsApp',
    'document_upload_pre_enrollment': 'Upload de documentos',
    'guardian_portal_basic': 'Portal do responsável',
    'schedule_public': 'Grade horária pública',
    'attendance_tracking': 'Controle de frequência',
    'gradebook': 'Boletim escolar',
    'transport_tracking': 'Rastreamento de transporte',
    'payment_installments': 'Parcelamento',
    'analytics_basic': 'Analytics básico',
    'analytics_advanced': 'Analytics avançado',
  };
  
  return getRecordValue(names, feature) ?? feature;
}

// ═══════════════════════════════════════════════════════════════════════════
// BANNERS ESPECÍFICOS
// ═══════════════════════════════════════════════════════════════════════════

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
