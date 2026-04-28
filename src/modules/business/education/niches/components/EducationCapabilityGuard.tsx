/**
 * EducationCapabilityGuard
 * 
 * Guard visual para capabilities de education.
 * Renderiza children apenas se capability for permitida (nicho + plano).
 */

import React from 'react';
import { useEducationNicheBilling } from '../hooks/useEducationNicheBilling';
import type { EducationNicheCapability } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface EducationCapabilityGuardProps {
  nicheKey: string | null | undefined;
  businessId: string;
  capability: EducationNicheCapability;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeMessage?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export function EducationCapabilityGuard({
  nicheKey,
  businessId,
  capability,
  children,
  fallback,
  showUpgradeMessage = true,
}: EducationCapabilityGuardProps) {
  const { can, isLoading } = useEducationNicheBilling({
    nicheKey,
    businessId,
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded h-16" aria-busy="true">
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }
  
  const check = can(capability);
  
  // Capability permitida
  if (check.allowed) {
    return <>{children}</>;
  }
  
  // Capability negada - mostra fallback ou mensagem de upgrade
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgradeMessage) {
    return (
      <div className="p-4 bg-muted/50 border border-dashed rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          {check.upgradeMessage}
        </p>
      </div>
    );
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIANTES ESPECÍFICAS
// ═══════════════════════════════════════════════════════════════════════════

interface GuardWithFallbackProps {
  nicheKey: string | null | undefined;
  businessId: string;
  children: React.ReactNode;
}

export function LeadPipelineGuard(props: GuardWithFallbackProps) {
  return (
    <EducationCapabilityGuard
      {...props}
      capability="lead_pipeline"
      fallback={
        <div className="p-4 text-center text-muted-foreground">
          Pipeline de leads não disponível para este nicho.
        </div>
      }
    />
  );
}

export function EventsPublicGuard(props: GuardWithFallbackProps) {
  return (
    <EducationCapabilityGuard
      {...props}
      capability="events_public"
      fallback={
        <div className="p-4 text-center text-muted-foreground">
          Eventos públicos não disponíveis para este nicho.
        </div>
      }
    />
  );
}

export function TrialClassBookingGuard(props: GuardWithFallbackProps) {
  return (
    <EducationCapabilityGuard
      {...props}
      capability="trial_class_booking"
      fallback={
        <div className="p-4 text-center text-muted-foreground">
          Agendamento de aula experimental não disponível.
        </div>
      }
    />
  );
}

export function DocumentUploadGuard(props: GuardWithFallbackProps) {
  return (
    <EducationCapabilityGuard
      {...props}
      capability="document_upload_pre_enrollment"
      fallback={
        <div className="p-4 text-center text-muted-foreground">
          Upload de documentos requer plano Pro ou superior.
        </div>
      }
    />
  );
}

export function AnalyticsGuard(props: GuardWithFallbackProps) {
  return (
    <EducationCapabilityGuard
      {...props}
      capability="basic_programs_catalog"
      fallback={
        <div className="p-4 text-center text-muted-foreground">
          Analytics não disponível para este plano.
        </div>
      }
    />
  );
}

export default EducationCapabilityGuard;
