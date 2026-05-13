import { Link } from "react-router-dom";
import { MapPin, Search, ChevronDown } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/shared/components/ui/tooltip";
import { NotificationDropdown } from "@/core/community/components/NotificationDropdown";

interface CommunityMobileHeaderProps {
  neighborhood?: string | null;
  avatarUrl?: string | null;
  userName?: string | null;
  onSearchClick: () => void;
  getInitials: (name?: string | null) => string;
}

export function CommunityMobileHeader({
  neighborhood,
  avatarUrl,
  userName,
  onSearchClick,
  getInitials,
}: CommunityMobileHeaderProps) {
  return (
    <div
      className="md:hidden sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(30, 37, 41, 0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        className="h-14 px-4 flex items-center justify-between border-b"
        style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}
      >
        <button
          className="flex items-center gap-1.5 text-left"
          aria-label={`LocalizaÃ§Ã£o atual: ${neighborhood || "Nordeste de Amaralina"}`}
        >
          <MapPin
            className="h-4 w-4 flex-shrink-0"
            style={{ color: "#4FD1C5" }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs leading-none" style={{ color: "#9CA3AF" }}>
              Complexo do Nordeste
            </p>
            <p
              className="text-sm font-semibold flex items-center gap-0.5 truncate"
              style={{ color: "#FFFFFF" }}
            >
              {neighborhood || "Nordeste de Amaralina"}
              <ChevronDown
                className="h-3 w-3 flex-shrink-0"
                style={{ color: "#9CA3AF" }}
                aria-hidden="true"
              />
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={onSearchClick}
                aria-label="Abrir busca (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-gray-400" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Buscar (Ctrl+K)</p>
            </TooltipContent>
          </Tooltip>

          <NotificationDropdown />

          <Link to="/conta" aria-label="Ir para minha conta">
            <Avatar className="h-8 w-8 border-2 border-teal-400/30">
              <AvatarImage
                src={avatarUrl || ""}
                alt={`Avatar de ${userName || "UsuÃ¡rio"}`}
              />
              <AvatarFallback className="text-xs bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </div>
  );
}

