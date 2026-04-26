/**
 * 🛡️ ADMIN SECTION GUARD
 *
 * Componente para controlar visibilidade de seções do admin
 * baseado em capabilities habilitadas.
 *
 * @version 1.0.0
 */

import { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Lock, Settings } from 'lucide-react';
import type { AdminSection, NicheCapability } from '../../types';
import { AdminSectionVisibilityService } from '../AdminSectionVisibilityService';

interface AdminSectionGuardProps {
  section: AdminSection;
  enabledCapabilities: NicheCapability[];
  missingCapabilities?: NicheCapability[];
  children: ReactNode;
  onConfigure?: () => void;
  fallback?: ReactNode;
}

/**
 * Guard que controla visibilidade de seções do admin.
 *
 * Uso:
 * ```tsx
 * <AdminSectionGuard
 *   section="pizza_flavors"
 *   enabledCapabilities={profile.enabled_capabilities}
 *   missingCapabilities={profile.missing_capabilities}
 *   onConfigure={() => startFlavorConfiguration()}
 * >
 *   <PizzaFlavorsManager />
 * </AdminSectionGuard>
 * ```
 */
export function AdminSectionGuard({
  section,
  enabledCapabilities,
  missingCapabilities = [],
  children,
  onConfigure,
  fallback,
}: AdminSectionGuardProps) {
  const visibility = AdminSectionVisibilityService.getSectionVisibility(
    section,
    enabledCapabilities,
  );

  // Seção visível - renderizar conteúdo
  if (visibility.is_visible) {
    return <>{children}</>;
  }

  // Seção não visível - verificar se pode ser configurada
  const canConfigure = visibility.missing_capabilities.some((cap) =>
    missingCapabilities.includes(cap),
  );

  if (!canConfigure) {
    // Não pode configurar - não mostrar nada ou fallback
    return fallback ? <>{fallback}</> : null;
  }

  // Pode configurar - mostrar prompt
  const message = AdminSectionVisibilityService.getUpgradeMessageForSection(
    section,
    missingCapabilities,
  );

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-900">
        <p className="mb-3">{message}</p>
        {onConfigure && (
          <Button
            size="sm"
            variant="outline"
            onClick={onConfigure}
            className="border-amber-300 hover:bg-amber-100"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
