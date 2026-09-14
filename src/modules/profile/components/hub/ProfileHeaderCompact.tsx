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
} from "@/modules/profile/types/account";

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
      className="rounded-2xl border border-territory-border bg-territory-surface p-3 sm:p-5"
      data-account-identity
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 border border-territory-border bg-territory-raised sm:h-20 sm:w-20">
            <AvatarImage src={avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-territory-raised text-lg font-semibold text-territory-ink sm:text-xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-territory-surface bg-territory-brand text-white transition-colors hover:bg-territory-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
            aria-label="Alterar foto de perfil"
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
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
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="min-w-0 truncate font-heading text-xl font-bold tracking-[-0.025em] text-territory-ink sm:text-2xl">
              {displayName}
            </h2>
            {props.isVerified ? (
              <CheckCircle2
                className="h-[18px] w-[18px] shrink-0 text-territory-brand"
                aria-label="Perfil verificado"
              />
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm text-territory-muted">{props.userEmail}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-territory-muted">
            {props.handle ? <span>@{props.handle}</span> : <span>Sem nome público</span>}
            <span aria-hidden="true">·</span>
            <span>{getProfileTypeLabel(activeProfile)}</span>
          </div>
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

      <div className="mt-4 hidden gap-2 border-t border-territory-border pt-4 text-sm sm:grid sm:grid-cols-3">
        <div className="flex min-h-11 items-center gap-2 text-territory-muted">
          <MapPin className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          <span className="truncate">
            {props.territoryLabel || "Território não definido"}
          </span>
        </div>
        <div className="flex min-h-11 items-center gap-2 text-territory-muted">
          <Users className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          <span>{profileCount === 1 ? "1 perfil" : `${profileCount} perfis`}</span>
        </div>
        <div className="flex min-h-11 items-center gap-2 text-territory-muted">
          <Bell className="h-4 w-4 shrink-0 text-territory-brand" aria-hidden="true" />
          <span>
            {props.notifications.unread > 0
              ? `${props.notifications.unread} não lidas`
              : "Notificações em dia"}
          </span>
        </div>
      </div>

      {completenessProfile ? (
        <div className="mt-4 hidden border-t border-territory-border pt-4 md:block">
          <ProfileCompletenessWidget profile={completenessProfile} />
        </div>
      ) : null}
    </section>
  );
}
