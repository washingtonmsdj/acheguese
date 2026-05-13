/**
 * ModuleProfileGate
 *
 * Wrapper que resolve automaticamente o perfil correto para um módulo.
 * Lida com os 3 estados: loading, missing (CTA criar), select (seletor).
 *
 * Uso:
 *   <ModuleProfileGate
 *     type="business"
 *     createPath="/central/empresas/nova"
 *     createLabel="Criar empresa"
 *   >
 *     {(profile) => <MinhaPageDeEmpresa profile={profile} />}
 *   </ModuleProfileGate>
 */

import { useNavigate } from 'react-router-dom';
import { useModuleProfile } from '../hooks/useModuleProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Building2, Briefcase, Car, User, Plus, ChevronRight } from 'lucide-react';
import type { Profile, ProfileType } from '../services/multi-profile/types';
import { toast } from 'sonner';

function typeLabel(t: ProfileType): string {
  switch (t) {
    case "personal":
      return "Pessoal";
    case "business":
      return "Empresa";
    case "professional":
      return "Profissional";
    case "driver":
      return "Motorista";
    default:
      return "Perfil";
  }
}

function typeIcon(t: ProfileType) {
  switch (t) {
    case "personal":
      return User;
    case "business":
      return Building2;
    case "professional":
      return Briefcase;
    case "driver":
      return Car;
    default:
      return User;
  }
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface ModuleProfileGateProps {
  type: ProfileType;
  createPath: string;
  createLabel: string;
  children: (profile: Profile) => React.ReactNode;
}

export function ModuleProfileGate({
  type, createPath, createLabel, children,
}: ModuleProfileGateProps) {
  const navigate = useNavigate();
  const { profile, profiles, state, selectProfile } = useModuleProfile(type);
  const Icon = typeIcon(type);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (state === 'missing') {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Nenhum perfil {typeLabel(type).toLowerCase()}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Você precisa de um perfil {typeLabel(type).toLowerCase()} para acessar esta área.
          </p>
        </div>
        <Button onClick={() => navigate(createPath)} className="gap-2">
          <Plus className="h-4 w-4" />{createLabel}
        </Button>
      </div>
    );
  }

  if (state === 'select') {
    return (
      <div className="max-w-sm mx-auto px-4 py-8 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Qual perfil usar?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Você tem {profiles.length} perfis {typeLabel(type).toLowerCase()}. Escolha com qual deseja operar.
          </p>
        </div>
        <div className="space-y-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={async () => {
                await selectProfile(p.id);
                toast.success(`Operando como ${p.display_name}`);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border hover:bg-muted/40 transition-all text-left"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="text-sm">{getInitials(p.display_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.display_name}</p>
                <p className="text-xs text-muted-foreground">@{p.handle}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // state === 'resolved'
  return <>{children(profile!)}</>;
}
