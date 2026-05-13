import { Link } from "react-router-dom";
import { LogOut, Settings, User, Award, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { useCommunityProfile } from "@/core/profiles/hooks/useCommunityProfile";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth";

interface UserProfileDropdownProps {
  onLogout?: () => void;
}

export function UserProfileDropdown({ onLogout }: UserProfileDropdownProps) {
  const { activeProfile } = useSessionContext();
  const {
    profile: communityProfile,
    stats,
    badges,
    loading,
  } = useCommunityProfile();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    if (onLogout) onLogout();
    window.location.href = "/login";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="group focus:outline-none">
          <Avatar className="w-9 h-9 ring-2 ring-primary/30 hover:ring-primary transition-all cursor-pointer">
            <AvatarImage src={activeProfile?.avatarUrl} alt={activeProfile?.displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
              {getInitials(activeProfile?.displayName)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-start gap-3 py-2">
            <Avatar className="w-12 h-12">
              <AvatarImage src={activeProfile?.avatarUrl} alt={activeProfile?.displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(activeProfile?.displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{activeProfile?.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {communityProfile?.city}, {communityProfile?.neighborhood}
              </p>

              {!loading && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs font-semibold">
                      {stats.total_points}
                    </span>
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-semibold">
                      {stats.badges_count}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      badges
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/conta" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Minha conta
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/conta/preferencias" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Preferencias
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
