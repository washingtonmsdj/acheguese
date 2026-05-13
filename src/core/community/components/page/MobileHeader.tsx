import React, { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { LocationDisplay } from "./LocationDisplay";

const NotificationDropdown = lazy(() =>
  import("@/components/community/NotificationDropdown").then((m) => ({
    default: m.NotificationDropdown,
  })),
);

interface MobileHeaderProps {
  neighborhood?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  userName?: string | null;
  getInitials: (name?: string | null) => string;
}

export function MobileHeader({
  neighborhood,
  city,
  avatarUrl,
  userName,
  getInitials,
}: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-50 border-b bg-[#1E2529]/95 backdrop-blur-lg border-white/10">
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5">
        <LocationDisplay neighborhood={neighborhood} city={city} />

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/mensagens"
            className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105"
            aria-label="Mensagens"
          >
            <MessageCircle
              className="h-4.5 w-4.5 text-gray-400"
              aria-hidden="true"
            />
          </Link>

          <Suspense fallback={<div className="w-10 h-10" />}>
            <NotificationDropdown />
          </Suspense>

          <Link to="/conta" aria-label="Minha conta">
            <Avatar className="h-8 w-8 border-2 border-teal-400/30">
              <AvatarImage src={avatarUrl || ""} alt={userName || "Avatar"} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-teal-400 to-cyan-400 text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
