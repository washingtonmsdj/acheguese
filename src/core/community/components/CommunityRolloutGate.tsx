/**
 * CommunityRolloutGate
 * 
 * Gate de acesso ao módulo Community.
 * Bloqueia acesso se:
 * - Usuário não tem endereço confirmado no bairro/grupo
 * - Módulo não está ativo na localização
 * 
 * DIFERENTE dos outros módulos:
 * - Empresas, Serviços, etc → Qualquer um pode VER
 * - Comunidade → SÓ moradores confirmados podem ACESSAR
 */

import { ReactNode } from 'react';
import { AlertTriangle, MapPin, Lock } from 'lucide-react';
import { useCommunityRollout } from '../hooks/useCommunityRollout';
import { useCommunityLocation } from '../hooks/useCommunityLocation';
import { useTerritoryResolutionLevel } from '@/core/location/hooks/useTerritoryResolutionLevel';
import { Button } from '@/shared/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAppUrls } from '@/core/routing/hooks';

interface CommunityRolloutGateProps {
  children: ReactNode;
}

export function CommunityRolloutGate({ children }: CommunityRolloutGateProps) {
  const { hasActiveLocation, activeLocationName: locationName } = useCommunityLocation();
  const { isBlocked, blockReason, isLoading } = useCommunityRollout();
  const resolution = useTerritoryResolutionLevel();
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  if (isLoading || resolution.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  const blockedByResolution = resolution.level === 'none' || resolution.level === 'city';
  const shouldBlock = !hasActiveLocation || isBlocked || blockedByResolution;

  if (shouldBlock) {
    const finalReason = blockedByResolution
      ? 'Ações da comunidade exigem território de bairro/grupo canônico. Complete seu endereço para liberar recursos locais.'
      : blockReason;

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-10 text-center gap-6">
        <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-800 max-w-md">
          <Lock className="h-12 w-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
          
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
            Acesso Restrito
          </h3>
          
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
            {finalReason || 'O módulo Comunidade está disponível apenas para moradores confirmados do bairro.'}
          </p>

          {(!hasActiveLocation || blockedByResolution) && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 p-3 rounded mb-4">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                Você pode usar o site normalmente em nível de cidade, mas recursos comunitários locais exigem bairro/grupo resolvido.
              </span>
            </div>
          )}

          <Button 
            onClick={() => navigate(appUrls.profile.settings())}
            className="w-full"
          >
            Confirmar Endereço
          </Button>
        </div>

        <div className="text-xs text-muted-foreground max-w-md">
          <AlertTriangle className="h-4 w-4 inline mr-1" />
          A Comunidade é um espaço exclusivo para moradores verificados. 
          Outros módulos (Empresas, Serviços, etc.) estão disponíveis para todos.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
