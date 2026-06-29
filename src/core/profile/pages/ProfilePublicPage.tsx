import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  Globe2,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/shared/utils/cn';
import { getProfileTypeLabel } from '@/core/profile/utils/profileDomainRules';
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';

import type { ProfileRow as Profile } from '@/core/profiles/services/types';
import type { ProfileType as RuntimeProfileType } from '@/core/profiles/services/multi-profile/types';

interface ProfilePublicPageProps {
  profile: Profile;
}

type PublicLocationVisibility = 'hidden' | 'city_only' | 'district';

type ProfileWithPublicLocation = Profile & {
  public_location_visibility?: PublicLocationVisibility | null;
  public_city?: string | null;
  public_state?: string | null;
  public_neighborhood?: string | null;
};

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatMemberSince(date?: string | null): string {
  if (!date) return 'Data desconhecida';
  return new Date(date).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

function getProfileTypeBadgeColor(profileType?: string | null): string {
  switch (profileType) {
    case 'business':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case 'professional':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    case 'driver':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    default:
      return 'border-border bg-background/80 text-muted-foreground';
  }
}

function toRuntimeProfileType(profileType?: string | null): RuntimeProfileType {
  switch (profileType) {
    case 'business':
    case 'professional':
    case 'driver':
      return profileType;
    case 'personal':
    default:
      return 'personal';
  }
}

function buildLocationLabel(profile: ProfileWithPublicLocation): string | null {
  const visibility = profile.public_location_visibility ?? 'city_only';

  if (visibility === 'hidden') return null;

  const cityState = [profile.public_city, profile.public_state].filter(Boolean).join(' / ');

  if (visibility === 'district') {
    return [profile.public_neighborhood, cityState].filter(Boolean).join(', ') || null;
  }

  return cityState || null;
}

export function ProfilePublicPage({ profile }: ProfilePublicPageProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  const publicProfile = profile as ProfileWithPublicLocation;
  const locationLabel = useMemo(() => buildLocationLabel(publicProfile), [publicProfile]);
  const profileTypeLabel = getProfileTypeLabel(toRuntimeProfileType(profile.profile_type));
  const reputationScore = profile.reputation ?? 0;
  const reputationLevel = Math.max(1, Math.floor(reputationScore / 100) + 1);
  const hasReputation = reputationScore > 0;
  const displayName = profile.name || profile.username || 'Perfil';
  const publicHandle = profile.username ? `@${profile.username}` : '@perfil';

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(appUrls.home);
  };

  const handleShare = async () => {
    const url = new URL(buildPublicProfileUrl(profile.username), window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${displayName}`,
          text: profile.bio || `Confira o perfil de ${displayName}`,
          url,
        });
        return;
      } catch {
        // User cancelled native share.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link do perfil copiado');
    } catch {
      toast.error('Nao foi possivel copiar o link');
    }
  };

  return (
    <>
      <Helmet>
        <title>{displayName} ({publicHandle}) | Perfil publico</title>
        <meta name="description" content={profile.bio || `Perfil publico de ${displayName}`} />
        <meta property="og:title" content={`${displayName} (${publicHandle})`} />
        <meta property="og:description" content={profile.bio || `Perfil publico de ${displayName}`} />
        {profile.avatar_url ? <meta property="og:image" content={profile.avatar_url} /> : null}
      </Helmet>

      <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-full bg-background/70 backdrop-blur" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </header>

          <main className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_360px] lg:items-start">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-xl shadow-black/5 backdrop-blur"
            >
              <div className="relative min-h-[220px] overflow-hidden bg-gradient-to-br from-emerald-500/25 via-sky-500/10 to-amber-500/20 p-6 sm:min-h-[280px] sm:p-8">
                <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-background/30 blur-3xl" />
                <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />

                <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn('rounded-full px-3 py-1 text-xs font-semibold backdrop-blur', getProfileTypeBadgeColor(profile.profile_type))}>
                      {profileTypeLabel}
                    </Badge>
                    {profile.verified ? (
                      <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Verificado
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                    <Avatar className="h-28 w-28 border-4 border-background/90 shadow-2xl sm:h-36 sm:w-36">
                      <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback className="bg-background text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 pb-1">
                      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-background/65 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                        <Globe2 className="h-3.5 w-3.5" />
                        Perfil publico
                      </p>
                      <h1 className="text-3xl font-black leading-none tracking-tight text-foreground sm:text-5xl">
                        {displayName}
                      </h1>
                      <p className="mt-3 text-base font-medium text-muted-foreground sm:text-lg">{publicHandle}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-8">
                {profile.bio ? (
                  <div className="rounded-3xl border border-border/70 bg-background/65 p-5">
                    <p className="text-base leading-7 text-foreground sm:text-lg">{profile.bio}</p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-border bg-background/60 p-5 text-sm text-muted-foreground">
                    Este perfil ainda nao publicou uma bio.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {locationLabel ? (
                    <InfoTile icon={MapPin} label="Localizacao publica" value={locationLabel} />
                  ) : null}
                  {profile.created_at ? (
                    <InfoTile icon={Calendar} label="Na comunidade desde" value={formatMemberSince(profile.created_at)} />
                  ) : null}
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1 gap-2 rounded-2xl" onClick={() => toast.info('Contato publico ainda nao esta disponivel neste perfil')}>
                    <MessageCircle className="h-4 w-4" />
                    Enviar mensagem
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 rounded-2xl" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    Compartilhar perfil
                  </Button>
                </div>
              </div>
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="space-y-4"
            >
              <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5 shadow-lg shadow-black/5 backdrop-blur">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Sinais publicos</h2>
                </div>
                <div className="mt-4 space-y-3">
                  <SignalRow label="Identidade" value={profile.verified ? 'Verificada' : 'Nao verificada'} />
                  <SignalRow label="Tipo" value={profileTypeLabel} />
                  <SignalRow label="Localizacao" value={locationLabel ? 'Visivel' : 'Oculta'} />
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5 shadow-lg shadow-black/5 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  <h2 className="font-semibold text-foreground">Reputacao</h2>
                </div>
                {hasReputation ? (
                  <div className="mt-4 grid gap-3">
                    <StatCard icon={Star} label="Score" value={reputationScore} color="text-amber-600" />
                    <StatCard icon={TrendingUp} label="Nivel" value={reputationLevel} color="text-sky-600" />
                    <StatCard icon={Award} label="Status" value={reputationLevel >= 5 ? 'Destaque' : 'Em crescimento'} color="text-emerald-600" />
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                    A reputacao publica ainda nao possui dados suficientes.
                  </p>
                )}
              </div>
            </motion.aside>
          </main>
        </div>
      </div>
    </>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/45 px-3 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', color)} />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}
