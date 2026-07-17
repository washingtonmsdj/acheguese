import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
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
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth";

interface UserProfileDropdownProps {
  onLogout?: () => void;
}

export function UserProfileDropdown({ onLogout }: UserProfileDropdownProps) {
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();
  const profileLocation = [activeProfile?.neighborhood, activeProfile?.city]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(", ");

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
    navigate("/login", { replace: true });
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
              {profileLocation && (
                <p className="text-xs text-muted-foreground truncate">
                  {profileLocation}
                </p>
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
