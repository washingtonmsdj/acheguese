/**
 * /perfil/identidades — Todas as identidades da conta
 *
 * Lista todos os perfis, permite criar novos, ativar, editar, abrir público.
 */

import { useNavigate } from 'react-router-dom';
import { useMultiProfileContext } from '@/core/profiles/contexts/multi-profile-runtime-context';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { buildProfileEditUrl, buildCanonicalPublicUrl, canHavePublicUrl } from '@/core/profiles/utils/publicProfileUrl';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import {
  User, Building2, Briefcase, Car, Plus, Edit, ExternalLink,
  CheckCircle2, Shield, Globe, Lock, ArrowLeft, Zap, Bike, Package,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MultiProfileRecord, ProfileType } from '@/core/profiles/services/multi-profile/types';
import {
  getProfileTypeIcon,
  getProfileTypeLabel,
  isProfileVerified,
} from '@/modules/profile/utils/profileDomainRules';

// Helpers para mapear tipo de perfil para ícone e label
function typeIcon(type: ProfileType) {
  return getProfileTypeIcon(type);
}

function typeLabel(type: ProfileType) {
  return getProfileTypeLabel(type);
}

function getInitials(name?: string) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function IdentityCard({ profile, isActive, onActivate, profileSettingsUrl }: {
  profile: MultiProfileRecord; isActive: boolean; onActivate: (id: string) => void; profileSettingsUrl: string;
}) {
  const navigate = useNavigate();
  const Icon = getProfileTypeIcon(profile);
  const profileLabel = getProfileTypeLabel(profile);
  const isVerified = isProfileVerified(profile);
  
  // ✅ SSOT: Usar função canônica para verificar se pode ter URL pública
  const publicUrl = buildCanonicalPublicUrl(profile);
  const canOpenPublicProfile = Boolean(publicUrl);
  
  // Verificar se é motoboy (motorista com moto habilitado para entregas)
  const isMotoboy = profile.profile_type === 'driver' && 
    (profile as any).vehicle_type === 'motorcycle' && 
    (profile as any).can_do_delivery !== false;

  return (
    <Card className={`transition-all ${isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback><Icon className="h-6 w-6" /></AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm">{profile.display_name}</span>
              {isActive && <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">Ativo</Badge>}
              {isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              {isMotoboy && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-orange-50 text-orange-600 border-orange-200">
                  <Bike className="h-3 w-3 mr-1" />Motoboy
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <span>{profile.handle ? `@${profile.handle}` : 'sem handle publico'}</span>
              <span>·</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{profileLabel}</Badge>
              <span>·</span>
              {profile.is_public
                ? <span className="flex items-center gap-0.5 text-green-600"><Globe className="h-3 w-3" />Público</span>
                : <span className="flex items-center gap-0.5 text-muted-foreground"><Lock className="h-3 w-3" />Privado</span>
              }
            </div>
            {profile.bio && <p className="text-xs text-muted-foreground line-clamp-1">{profile.bio}</p>}
            {profile.profile_type === 'driver' && (profile as any).vehicle_model && (
              <p className="text-xs text-muted-foreground">
                {(profile as any).vehicle_model} {(profile as any).vehicle_plate && `(${(profile as any).vehicle_plate})`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {!isActive && (
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => onActivate(profile.id)}>
              <Zap className="h-3 w-3" />Ativar
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => navigate(buildProfileEditUrl(profile.id))}>
            <Edit className="h-3 w-3" />Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-7"
            disabled={!canOpenPublicProfile}
            onClick={() => {
              if (!publicUrl) {
                toast.error('Perfil público indisponível para esta identidade');
                return;
              }
              navigate(publicUrl);
            }}
          >
            <ExternalLink className="h-3 w-3" />Ver público
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7 ml-auto" onClick={() => navigate(profileSettingsUrl)}>
            <Shield className="h-3 w-3" />Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PerfilIdentidadesPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { activeProfile, allProfiles, switchProfile, loading } = useMultiProfileContext();

  const handleActivate = async (id: string) => {
    const ok = await switchProfile(id);
    if (ok) toast.success('Perfil ativo alterado');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const byType = (t: ProfileType) => allProfiles.filter(p => p.profile_type === t);

  const sections: Array<{ 
    type: ProfileType; 
    createPath: string; 
    createLabel: string;
    subtitle?: string;
  }> = [
    { type: 'personal', createPath: '', createLabel: '', subtitle: 'Sua identidade principal' },
    { type: 'business', createPath: '/empresas/criar-empresa', createLabel: 'Nova empresa', subtitle: 'Empresas e negócios' },
    { type: 'professional', createPath: '/services/cadastrar', createLabel: 'Novo serviço', subtitle: 'Profissionais autônomos' },
    { type: 'driver', createPath: '/create-driver', createLabel: 'Ser motorista', subtitle: 'Motoristas e motoboys' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(appUrls.profile.central)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Minhas identidades</h1>
          <p className="text-xs text-muted-foreground">{allProfiles.length} perfil{allProfiles.length !== 1 ? 'is' : ''} na conta</p>
        </div>
      </div>

      <Separator />

      {sections.map(({ type, createPath, createLabel, subtitle }) => {
        const profiles = byType(type);
        const Icon = typeIcon(type);
        // Perfil pessoal: só mostra se já existe (não pode criar manualmente)
        if (type === 'personal' && profiles.length === 0) return null;
        // Outros tipos: sempre mostra a seção (para permitir criação)

        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <span className="text-sm font-semibold">{typeLabel(type)}</span>
                  {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
                </div>
                {profiles.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{profiles.length}</Badge>
                )}
              </div>
              {createPath && (
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => navigate(createPath)}>
                  <Plus className="h-3 w-3" />{createLabel}
                </Button>
              )}
            </div>

            {/* Card especial para criar motoboy quando há motoristas */}
            {type === 'driver' && profiles.length > 0 && (
              <Card className="border-dashed border-orange-200 bg-orange-50/30">
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-orange-100">
                        <Bike className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Quer fazer entregas?</p>
                        <p className="text-[10px] text-muted-foreground">Cadastre-se como motoboy</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1.5 text-xs h-7 border-orange-200 hover:bg-orange-100"
                      onClick={() => navigate('/create-driver?type=motoboy')}
                    >
                      <Package className="h-3 w-3" />
                      Ser motoboy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {profiles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center space-y-2">
                  <div className="p-3 rounded-full bg-muted w-fit mx-auto">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Nenhum perfil {typeLabel(type).toLowerCase()} ainda</p>
                  {createPath && (
                    <Button size="sm" onClick={() => navigate(createPath)} className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />{createLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {profiles.map(p => (
                  <IdentityCard
                    key={p.id}
                    profile={p}
                    isActive={activeProfile?.id === p.id}
                    onActivate={handleActivate}
                    profileSettingsUrl={appUrls.profile.settings()}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

