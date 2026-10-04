/**
 * EducationCapabilityGuard
 *
 * Guard visual para capabilities de Education.
 * Renderiza children apenas se a capability for permitida pelo nicho e plano.
 */

import React from 'react';
import { useEducationNicheBilling } from '../hooks/useEducationNicheBilling';
import type { EducationNicheCapability } from '../types';

export interface EducationCapabilityGuardProps {
  nicheKey: string | null | undefined;
  businessId: string;
  capability: EducationNicheCapability;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeMessage?: boolean;
}

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

  if (isLoading) {
    return (
      <div
        className="h-16 animate-pulse rounded-lg bg-territory-raised"
        aria-busy="true"
      >
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  const check = can(capability);

  if (check.allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradeMessage) {
    return (
      <div className="rounded-lg border border-dashed border-territory-border bg-territory-raised/70 p-4 text-center">
        <p className="text-sm text-territory-muted">{check.upgradeMessage}</p>
      </div>
    );
  }

  return null;
}

interface GuardWithFallbackProps {
  nicheKey: string | null | undefined;
  businessId: string;
  children: React.ReactNode;
}

function UnavailableCapabilityMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-territory-border bg-territory-raised/70 p-4 text-center text-sm text-territory-muted">
      {children}
    </div>
  );
}

export function LeadPipelineGuard(props: GuardWithFallbackProps) {
  return (
    <EducationCapabilityGuard
      {...props}
      capability="lead_pipeline"
      fallback={
        <UnavailableCapabilityMessage>
          Pipeline de leads não disponível para este nicho.
        </UnavailableCapabilityMessage>
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
        <UnavailableCapabilityMessage>
          Eventos públicos não disponíveis para este nicho.
        </UnavailableCapabilityMessage>
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
        <UnavailableCapabilityMessage>
          Agendamento de aula experimental não disponível.
        </UnavailableCapabilityMessage>
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
        <UnavailableCapabilityMessage>
          Upload de documentos requer plano Pro ou superior.
        </UnavailableCapabilityMessage>
      }
    />
  );
}

export function AnalyticsGuard(props: GuardWithFallbackProps) {
  return (
    <EducationCapabilityGuard
      {...props}
      capability="analytics_basic"
      fallback={
        <UnavailableCapabilityMessage>
          Analytics não disponível para este plano.
        </UnavailableCapabilityMessage>
      }
    />
  );
}

export default EducationCapabilityGuard;
