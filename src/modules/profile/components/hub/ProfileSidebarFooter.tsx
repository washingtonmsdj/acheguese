/**
 * ProfileSidebarFooter - Footer da sidebar do perfil
 *
 * Exibe ações rápidas no rodapé da sidebar:
 * - Link para perfil público
 * - Link para editar perfil
 * - Link para configurações
 */

import { Globe, Pencil, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { buildProfileEditUrl, buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";

interface ProfileSidebarFooterProps {
  profileId: string | null;
  handle: string;
  canOpenPublicProfile: boolean;
  className?: string;
}

export function ProfileSidebarFooter({
  profileId,
  handle,
  canOpenPublicProfile,
  className,
}: ProfileSidebarFooterProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  const handleEditProfile = () => {
    if (!profileId) return;
    navigate(buildProfileEditUrl(profileId));
  };

  const handleOpenPublicProfile = () => {
    if (!canOpenPublicProfile) return;
    navigate(buildPublicProfileUrl(handle));
  };

  const handleOpenSettings = () => {
    navigate(appUrls.settings);
  };

  return (
    <div className={className}>
      <Separator className="mb-3" />
      <div className="space-y-1 px-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
          onClick={handleEditProfile}
          disabled={!profileId}
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar perfil
        </Button>

        {canOpenPublicProfile ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={handleOpenPublicProfile}
          >
            <Globe className="h-3.5 w-3.5" />
            Ver perfil público
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
          onClick={handleOpenSettings}
        >
          <Settings className="h-3.5 w-3.5" />
          Configurações
        </Button>
      </div>
    </div>
  );
}
