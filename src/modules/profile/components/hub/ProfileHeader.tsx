/**
 * ProfileHeader - Cabecalho do hub de perfil
 *
 * Exibe avatar, nome, badges de status e acoes principais
 */

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, Globe, Pencil, Users } from 'lucide-react';
import { motion } from 'framer-motion';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { buildProfileEditUrl, buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { getProfileTypeLabel } from '@/modules/profile/utils/profileDomainRules';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';

import type { MultiProfileRecord } from '@/core/profiles/services/multi-profile/types';
import type { ProfileAccountSnapshot } from '@/core/profiles/views/ProfileAccountSnapshot';
import type { Context, Identity } from '@/modules/profile/sections/types';

interface ProfileHeaderProps {
  activeProfile: MultiProfileRecord | null;
  profile: MultiProfileRecord | null;
  userEmail: string;
  accountSnapshot: ProfileAccountSnapshot;
  identity: Identity | null;
  context: Context | null;
  notifications: { unread: number; highPriority: number; urgentPriority: number };
  allProfilesCount: number;
  isVerified: boolean;
  canOpenPublicProfile: boolean;
  handle: string;
  territoryLabel?: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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
      return 'Básico';
    case 'premium':
      return 'Premium';
    case 'enterprise':
      return 'Enterprise';
    default:
      return value ? value[0].toUpperCase() + value.slice(1) : 'Básico';
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

function getVerificationTone(status: string): string {
  switch (status) {
    case 'approved':
      return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700';
    case 'rejected':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    case 'pending':
      return 'border-amber-500/20 bg-amber-500/10 text-amber-700';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

function getVerificationLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Residência aprovada';
    case 'rejected':
      return 'Residência rejeitada';
    case 'pending':
      return 'Residência em análise';
    default:
      return 'Residência não enviada';
  }
}

export function ProfileHeader({
  activeProfile,
  profile,
  userEmail,
  accountSnapshot,
  identity,
  context,
  notifications,
  allProfilesCount,
  isVerified,
  canOpenPublicProfile,
  handle,
  territoryLabel,
  onAvatarChange,
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = activeProfile?.display_name || profile?.display_name || userEmail;
  const avatarUrl = activeProfile?.avatar_url || profile?.avatar_url;
  const bio = activeProfile?.bio || profile?.bio || 'Use este hub para coordenar identidade, operação, negócios, conteúdo e módulos ativos a partir do estado real atual da plataforma.';

  const openCanonicalEditor = () => {
    const editorProfileId = activeProfile?.id ?? profile?.id;
    if (!editorProfileId) {
      return;
    }
    navigate(buildProfileEditUrl(editorProfileId));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[28px] border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 shadow-sm"
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="text-2xl font-semibold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all hover:bg-black/40"
              aria-label="Alterar foto de perfil"
            >
              <Camera className="h-5 w-5 text-white opacity-0 transition-opacity hover:opacity-100" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
              aria-label="Upload de foto de perfil"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-3xl font-semibold tracking-tight text-foreground">
                {displayName}
              </h1>
              {isVerified ? (
                <Badge className="bg-emerald-500 px-2 text-[10px] text-white">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Verificado
                </Badge>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{getProfileTypeLabel(activeProfile)}</Badge>
              <Badge variant="outline" className={getAccountTone(accountSnapshot.accountState)}>
                {getAccountStateLabel(accountSnapshot.accountState)}
              </Badge>
              <Badge variant="outline">{formatPlanLabel(identity?.plan.type || context?.plan.type)}</Badge>
              <Badge variant="outline" className={getVerificationTone(accountSnapshot.verificationStatus)}>
                {getVerificationLabel(accountSnapshot.verificationStatus)}
              </Badge>
              <Badge variant="outline">
                {notifications.unread > 0 ? `${notifications.unread} notificações não lidas` : 'Inbox em dia'}
              </Badge>
            </div>

            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {bio}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {territoryLabel || 'Território ainda não configurado'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {allProfilesCount} perfil{allProfilesCount === 1 ? '' : 'is'} gerenciavel{allProfilesCount === 1 ? '' : 'eis'}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.highPriority + notifications.urgentPriority} alertas prioritários
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="gap-1.5" onClick={openCanonicalEditor}>
            <Pencil className="h-4 w-4" />
            Editar perfil
          </Button>
          {canOpenPublicProfile ? (
            <Button variant="outline" className="gap-1.5" onClick={() => navigate(buildPublicProfileUrl(handle))}>
              <Globe className="h-4 w-4" />
              Abrir público
            </Button>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
