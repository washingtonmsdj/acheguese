/**
 * AccountHealthPanel - Painel de saúde da conta
 * 
 * Exibe estado, verificação, plano e reputação
 */

import { Badge } from '@/shared/components/ui/badge';
import { SectionFrame } from './SectionFrame';
import { getProfileTypeLabel } from '@/modules/profile/utils/profileDomainRules';

import type { MultiProfileRecord } from '@/core/profiles/services/multi-profile/types';
import type { ProfileAccountSnapshot } from '@/core/profiles/views/ProfileAccountSnapshot';

interface AccountHealthPanelProps {
  accountSnapshot: ProfileAccountSnapshot;
  identity: any;
  context: any;
  activeProfile: MultiProfileRecord | null;
  roles: string[];
}

function formatPlanLabel(value?: string | null): string {
  switch (value) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'delivery':
      return 'Delivery';
    case 'basic':
      return 'Basico';
    case 'premium':
      return 'Premium';
    case 'enterprise':
      return 'Enterprise';
    default:
      return value ? value[0].toUpperCase() + value.slice(1) : 'Basico';
  }
}

function getAccountStateLabel(state: ProfileAccountSnapshot['accountState']): string {
  switch (state) {
    case 'active':
      return 'Conta ativa';
    case 'blocked':
      return 'Conta bloqueada';
    case 'suspended':
      return 'Conta suspensa';
    default:
      return 'Conta inativa';
  }
}

function getAccountTone(state: ProfileAccountSnapshot['accountState']): string {
  switch (state) {
    case 'active':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
    case 'blocked':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    case 'suspended':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-700';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

export function AccountHealthPanel({
  accountSnapshot,
  identity,
  context,
  activeProfile,
  roles,
}: AccountHealthPanelProps) {
  return (
    <SectionFrame
      title="Saude da conta"
      description="Estado atual, verificacao, reputacao e sinais de risco do perfil ativo."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado da conta</p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {getAccountStateLabel(accountSnapshot.accountState)}
              </p>
            </div>
            <Badge variant="outline" className={getAccountTone(accountSnapshot.accountState)}>
              {accountSnapshot.accountState}
            </Badge>
          </div>
          {accountSnapshot.suspensionReason && (
            <p className="mt-3 text-xs text-muted-foreground">Motivo: {accountSnapshot.suspensionReason}</p>
          )}
          {accountSnapshot.suspendedUntil && (
            <p className="mt-1 text-xs text-muted-foreground">
              Suspensa ate {new Date(accountSnapshot.suspendedUntil).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano do perfil</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {formatPlanLabel(identity?.plan.type || context?.plan.type)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Premium: {identity?.plan.isPremium || context?.plan.isPremium ? 'sim' : 'nao'}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reputacao</p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {identity?.reputation.score ?? context?.reputation.score ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Nivel {identity?.reputation.level ?? context?.reputation.level ?? 1}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Contexto atual</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-[10px]">
              Tipo: {getProfileTypeLabel(activeProfile)}
            </Badge>
            {roles.length > 0 ? (
              roles.map((role) => (
                <Badge key={role} variant="outline" className="text-[10px]">
                  Papel: {role}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Papel padrao do usuario
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Permissoes efetivas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {identity?.permissions?.map((permission: any) => (
              <Badge
                key={permission.key}
                variant={permission.allowed ? 'default' : 'outline'}
                className="text-[10px]"
              >
                {permission.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}
