import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Camera,
  CheckCircle2,
  Globe2,
  MapPin,
  Pencil,
  Users,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  buildProfileEditUrl,
  buildPublicProfileUrl,
} from "@/core/profiles/utils/publicProfileUrl";
import { getProfileTypeLabel } from "@/core/profiles/utils/profileDomainRules";
import { ProfileCompletenessWidget } from "@/modules/profile/components/ProfileCompletenessWidget";
import type { ProfileCompletenessRecord } from "@/modules/profile/hooks/useProfileCompleteness";

import type {
  MultiProfileRecord,
  Profile as RuntimeProfile,
} from "@/core/profiles/services/multi-profile/types";
import type { ProfileRow } from "@/core/profiles/services/types";
import type {
  AccountSnapshot,
  Context,
  Identity,
} from "@/modules/profile/sections/types";

interface ProfileHeaderCompactProps {
  activeProfile: MultiProfileRecord | RuntimeProfile | null;
  profile: MultiProfileRecord | RuntimeProfile | ProfileRow | null;
  allProfiles?: readonly (MultiProfileRecord | RuntimeProfile)[];
  userEmail: string;
  accountSnapshot: AccountSnapshot;
  identity: Identity | null;
  context: Context | null;
  notifications: {
    unread: number;
    highPriority: number;
    urgentPriority: number;
  };
  isVerified: boolean;
  canOpenPublicProfile: boolean;
  handle: string;
  territoryLabel?: string;
  reputation?: {
    score: number;
    level: number;
    rank?: string;
  };
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigate?: (path: string) => void;
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileHeaderCompact(props: ProfileHeaderCompactProps) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const activeProfile = props.activeProfile;
  const profile = props.profile;
  const displayName =
    activeProfile?.display_name || profile?.display_name || "Minha conta";
  const avatarUrl = activeProfile?.avatar_url || profile?.avatar_url;
  const bio = activeProfile?.bio || profile?.bio;
  const editorProfileId = activeProfile?.id ?? profile?.id;
  const profileCount = props.allProfiles?.length ?? (activeProfile ? 1 : 0);
  const completenessProfile: ProfileCompletenessRecord | null = activeProfile
    ? {
        id: activeProfile.id,
        display_name: activeProfile.display_name,
        avatar_url: activeProfile.avatar_url,
        bio: activeProfile.bio,
        location_id: activeProfile.location_id ?? null,
        location: activeProfile.location,
        contact_email: activeProfile.contact_email,
        phone: activeProfile.phone,
        website: activeProfile.website,
        is_public: activeProfile.is_public,
      }
    : null;

  const openEditor = () => {
    if (!editorProfileId) return;
    const path = buildProfileEditUrl(editorProfileId);
    if (props.onNavigate) {
      props.onNavigate(path);
      return;
    }
    navigate(path);
  };

  return (
    <section
      className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-6"
      data-account-identity
    >
      <div className="flex items-start gap-4 sm:items-center">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 border border-territory-border bg-territory-raised sm:h-24 sm:w-24">
            <AvatarImage src={avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-territory-raised text-xl font-semibold text-territory-ink sm:text-2xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-territory-surface bg-territory-brand text-white transition-colors hover:bg-territory-brand-strong"
            aria-label="Alterar foto de perfil"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={props.onAvatarChange}
            aria-label="Upload de foto de perfil"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
            Identidade ativa
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 truncate font-heading text-2xl font-semibold text-territory-ink sm:text-3xl">
              {displayName}
            </h1>
            {props.isVerified ? (
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-territory-brand"
                aria-label="Perfil verificado"
              />
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-territory-muted">
            {props.handle ? (
              <span>@{props.handle}</span>
            ) : (
              <span>Sem nome público</span>
            )}
            <span>{getProfileTypeLabel(activeProfile)}</span>
          </div>
          {bio ? (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-territory-muted">
              {bio}
            </p>
          ) : (
            <p className="mt-3 text-sm text-territory-muted">
              Complete sua apresentação para deixar sua identidade mais clara.
            </p>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {props.canOpenPublicProfile ? (
            <Button
              type="button"
              variant="outline"
              className="border-territory-border bg-territory-surface text-territory-ink"
              onClick={() => navigate(buildPublicProfileUrl(props.handle))}
            >
              <Globe2 className="mr-2 h-4 w-4" />
              Ver público
            </Button>
          ) : null}
          <Button type="button" onClick={openEditor}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 border-t border-territory-border pt-4 text-sm sm:grid-cols-3">
        <div className="flex min-h-11 items-center gap-2 text-territory-muted">
          <MapPin className="h-4 w-4 shrink-0 text-territory-brand" />
          <span className="truncate">
            {props.territoryLabel || "Território não definido"}
          </span>
        </div>
        <div className="flex min-h-11 items-center gap-2 text-territory-muted">
          <Users className="h-4 w-4 shrink-0 text-territory-brand" />
          <span>
            {profileCount === 1 ? "1 perfil" : `${profileCount} perfis`}
          </span>
        </div>
        <div className="flex min-h-11 items-center gap-2 text-territory-muted">
          <Bell className="h-4 w-4 shrink-0 text-territory-brand" />
          <span>
            {props.notifications.unread > 0
              ? `${props.notifications.unread} não lidas`
              : "Notificações em dia"}
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-2 sm:hidden">
        <Button type="button" className="min-h-11 flex-1" onClick={openEditor}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        {props.canOpenPublicProfile ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 border-territory-border bg-territory-surface text-territory-ink"
            onClick={() => navigate(buildPublicProfileUrl(props.handle))}
          >
            <Globe2 className="mr-2 h-4 w-4" />
            Ver público
          </Button>
        ) : null}
      </div>

      {completenessProfile ? (
        <div className="mt-4 border-t border-territory-border pt-4">
          <ProfileCompletenessWidget profile={completenessProfile} />
        </div>
      ) : null}
    </section>
  );
}
