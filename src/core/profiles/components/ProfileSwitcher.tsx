/**
 * ✅ SSOT COMPLIANT - Migrado para useSessionContext
 * Removido: useUserProfiles, useActiveProfile (deprecated)
 */

import React from "react";
import { useSessionContext } from "@/core/session";
import { User, Car, Building, Briefcase } from "lucide-react";
import { logger } from "@/shared/utils/logger";

interface ProfileSwitcherProps {
  userId: string;
  onProfileChange?: () => void;
}

const profileIcons: Record<string, React.ElementType> = {
  personal: User,
  driver: Car,
  business: Building,
  professional: Briefcase,
  community: User,
};

const profileLabels: Record<string, string> = {
  personal: "Pessoal",
  driver: "Motorista",
  business: "Empresa",
  professional: "Profissional",
  community: "Comunidade",
};

export function ProfileSwitcher({
  userId: _userId,
  onProfileChange,
}: ProfileSwitcherProps) {
  const {
    profiles,
    isLoading: profilesLoading,
    activeProfile,
    switchProfile,
  } = useSessionContext();
  const [switching, setSwitching] = React.useState(false);

  const handleSwitchProfile = async (profileId: string) => {
    if (switching || profileId === activeProfile?.id) return;

    try {
      setSwitching(true);
      await switchProfile(profileId);
      onProfileChange?.();
    } catch (error) {
      logger.error("Erro ao trocar perfil:", error);
    } finally {
      setSwitching(false);
    }
  };

  if (profilesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
        Carregando perfis...
      </div>
    );
  }

  if (profiles.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase">
        Perfil Ativo
      </span>
      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => {
          const Icon = profileIcons[profile.profileType] || User;
          const isActive = profile.id === activeProfile?.id;

          return (
            <button
              key={profile.id}
              onClick={() => handleSwitchProfile(profile.id)}
              disabled={switching || isActive}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }
                ${switching ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <Icon className="h-4 w-4" />
              <span>
                {profileLabels[profile.profileType] || profile.profileType}
              </span>
              {isActive && (
                <span className="ml-1 h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
