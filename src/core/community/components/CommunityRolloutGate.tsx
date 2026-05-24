/**
 * CommunityRolloutGate
 *
 * Gate de acesso ao módulo Comunidade.
 * A leitura pública pode existir em nível de cidade, mas ações comunitárias
 * locais exigem bairro ou grupo territorial resolvido.
 */

import type { ReactNode } from 'react';
import { AlertTriangle, Lock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCommunityRollout } from '../hooks/useCommunityRollout';
import { useCommunityLocation } from '../hooks/useCommunityLocation';
import { useTerritoryResolutionLevel } from '@/core/location/hooks/useTerritoryResolutionLevel';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { Button } from '@/shared/components/ui/button';

interface CommunityRolloutGateProps {
  children: ReactNode;
}

export function CommunityRolloutGate({ children }: CommunityRolloutGateProps) {
  const { hasActiveLocation } = useCommunityLocation();
  const { isBlocked, blockReason, isLoading } = useCommunityRollout();
  const resolution = useTerritoryResolutionLevel();
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  if (isLoading || resolution.loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  const blockedByResolution = resolution.level === 'none' || resolution.level === 'city';
  const shouldBlock = !hasActiveLocation || isBlocked || blockedByResolution;

  if (shouldBlock) {
    const finalReason = blockedByResolution
      ? 'Ações da comunidade exigem território de bairro ou grupo. Confirme seu endereço para liberar recursos locais.'
      : blockReason;

    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/20">
          <Lock className="mx-auto mb-4 h-12 w-12 text-amber-600 dark:text-amber-400" />

          <h3 className="mb-2 text-lg font-semibold text-amber-900 dark:text-amber-100">
            Acesso restrito
          </h3>

          <p className="mb-4 text-sm text-amber-800 dark:text-amber-200">
            {finalReason || 'O módulo Comunidade está disponível apenas para moradores confirmados do bairro.'}
          </p>

          {(!hasActiveLocation || blockedByResolution) && (
            <div className="mb-4 flex items-center gap-2 rounded bg-amber-100 p-3 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                Você pode usar o site em nível de cidade, mas recursos comunitários locais exigem bairro ou grupo resolvido.
              </span>
            </div>
          )}

          <Button onClick={() => navigate(appUrls.profile.addresses)} className="w-full">
            Confirmar endereço
          </Button>
        </div>

        <div className="max-w-md text-xs text-muted-foreground">
          <AlertTriangle className="mr-1 inline h-4 w-4" />
          A Comunidade é um espaço exclusivo para moradores verificados. Outros módulos
          como Empresas e Serviços continuam disponíveis para todos.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
