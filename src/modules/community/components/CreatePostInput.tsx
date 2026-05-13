import React from "react";

import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Heart, Bell, Calendar, Wrench } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import {
  getCardClasses,
  getCardBackground,
} from "./styles/communityDesignSystem";
interface CreatePostInputProps {
  onOpenCreatePost: () => void;
  onOpenFavorRequest?: () => void;
  onOpenAlertModal?: () => void;
  onOpenEvent?: () => void;
  onOpenIssueModal?: () => void;
  locationScope?: string;
  showQuickActions?: boolean;
}

const CreatePostInput = React.forwardRef<HTMLDivElement, CreatePostInputProps>(
  (
    {
      onOpenCreatePost,
      onOpenFavorRequest,
      onOpenAlertModal,
      onOpenEvent,
      onOpenIssueModal,
      locationScope = "neighborhood",
      showQuickActions = true,
    },
    ref,
  ) => {
    const { activeProfile: profile } = useSessionContext();
    const { homeCity, homeDistrict } = useUserTerritory();
    const profileData = {
      name: profile?.name ?? null,
      city: homeCity?.name ?? null,
      street: profile?.street ?? null,
      neighborhood: homeDistrict?.name ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
    };
    const getInitials = (name?: string | null) => {
      if (!name) return "U";
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const getLocationData = () => {
      switch (locationScope) {
        case "city":
          return {
            preposition: "na",
            location: profileData.city || "sua cidade",
          };
        case "street":
          return { preposition: "na", location: profileData.street || "sua rua" };
        default:
          return {
            preposition: "no",
            location: profileData.neighborhood || "seu bairro",
          };
      }
    };

    const { preposition, location } = getLocationData();
    const displayName = profileData.name || "Usuário";
    const placeholderText = showQuickActions
      ? `O que tá acontecendo ${preposition} ${location}?`
      : `O que você viu de bom ${preposition} ${location} hoje?`;

    return (
      <Card
        className={getCardClasses("default")}
        style={getCardBackground("alt")}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="w-11 h-11 ring-2 ring-teal-400/30">
              <AvatarImage
                src={profileData.avatarUrl ?? undefined}
                alt={displayName}
              />
              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-pink-400 text-white font-semibold text-sm">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={onOpenCreatePost}
              className="flex-1 text-center px-4 py-3 rounded-full transition-all duration-200 hover:bg-white/10 text-[0.8rem]"
              style={{
                backgroundColor: "rgba(18, 24, 27, 0.8)",
                color: "#9CA3AF",
              }}
            >
              {placeholderText}
            </button>
          </div>
          {showQuickActions && (
            <>
              <h3
                className="text-[0.65rem] font-bold uppercase tracking-wide mb-2 text-center"
                style={{ color: "#4FD1C5" }}
              >
                AJUDA RÁPIDA NA VIZINHANÇA
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={onOpenFavorRequest || onOpenCreatePost}
                  className="rounded-lg h-16 font-bold text-[0.6rem] transition-all duration-200 hover:scale-105 border-2 flex flex-col items-center justify-center gap-1"
                  style={{
                    background: "transparent",
                    borderColor: "#4FD1C5",
                    color: "#4FD1C5",
                  }}
                >
                  <Heart className="h-4 w-4" />
                  PEDIR FAVOR
                </Button>
                <Button
                  onClick={onOpenAlertModal || onOpenCreatePost}
                  className="rounded-lg h-16 font-bold text-[0.6rem] transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center gap-1"
                  style={{
                    background:
                      "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                    color: "#FFFFFF",
                  }}
                >
                  <Bell className="h-4 w-4" />
                  ALERTA
                </Button>
                <Button
                  onClick={onOpenEvent || onOpenCreatePost}
                  className="rounded-lg h-16 font-bold text-[0.6rem] transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center gap-1"
                  style={{
                    background:
                      "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
                    color: "#FFFFFF",
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  EVENTO
                </Button>
                <Button
                  onClick={onOpenIssueModal || onOpenCreatePost}
                  className="rounded-lg h-16 font-bold text-[0.6rem] transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center gap-1"
                  style={{
                    background:
                      "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    color: "#FFFFFF",
                  }}
                >
                  <Wrench className="h-4 w-4" />
                  PROBLEMAS
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  },
);
CreatePostInput.displayName = "CreatePostInput";

export { CreatePostInput };
