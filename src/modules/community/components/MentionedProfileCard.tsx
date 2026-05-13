import React from "react";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Star, MapPin, Phone, MessageCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { DisputeMentionModal } from "./DisputeMentionModal";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";
interface MentionedProfile {
  id: string;
  name: string;
  avatar_url?: string;
  public_neighborhood?: string;
  user_type?: string;
  profissao?: string;
  telefone?: string;
  rating?: number;
  total_reviews?: number;
}

interface MentionedProfileCardProps {
  profile: MentionedProfile;
  mentionType?: "recommendation" | "tag" | "reference";
  rank?: number; // Posição no ranking (1, 2, 3...)
  postId?: string; // ID do post para contestação
  currentUserId?: string; // ID do usuário logado
}

export function MentionedProfileCard({
  profile,
  mentionType = "recommendation",
  rank,
  postId,
  currentUserId,
}: MentionedProfileCardProps) {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const isOwnProfile = currentUserId === profile.id;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankBadge = (position: number) => {
    const badges = {
      1: {
        emoji: "🥇",
        color:
          "from-yellow-500/20 to-yellow-600/20 border-yellow-500/40 text-yellow-400",
        label: "1º Mais Votado",
      },
      2: {
        emoji: "🥈",
        color:
          "from-gray-400/20 to-gray-500/20 border-gray-400/40 text-gray-300",
        label: "2º Mais Votado",
      },
      3: {
        emoji: "🥉",
        color:
          "from-orange-600/20 to-orange-700/20 border-orange-600/40 text-orange-400",
        label: "3º Mais Votado",
      },
    };
    return badges[position as keyof typeof badges];
  };

  const rankBadge = rank ? getRankBadge(rank) : null;

  return (
    <Link
      to={buildPublicProfileUrl(profile.id)}
      className={`block p-3 rounded-lg border transition-all ${
        rank === 1
          ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 hover:from-yellow-500/15 hover:to-yellow-600/15 ring-2 ring-yellow-500/20"
          : "border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 hover:from-teal-500/10 hover:to-cyan-500/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar
          className={`w-12 h-12 ring-2 ${rank === 1 ? "ring-yellow-400/40" : "ring-teal-400/30"}`}
        >
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white font-semibold">
            {getInitials(profile.name)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-white truncate">
              {profile.name}
            </h4>
            {rankBadge && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${rankBadge.color} border flex-shrink-0 font-bold`}
              >
                {rankBadge.emoji} {rankBadge.label}
              </span>
            )}
            {!rank && mentionType === "recommendation" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex-shrink-0">
                Recomendado
              </span>
            )}
          </div>

          {profile.profissao && (
            <p className="text-xs text-gray-400 mb-1">{profile.profissao}</p>
          )}

          {profile.public_neighborhood && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
              <MapPin className="w-3 h-3" />
              <span>{profile.public_neighborhood}</span>
            </div>
          )}

          {/* Rating */}
          {profile.rating && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-white">
                  {profile.rating ? profile.rating.toFixed(1) : "0.0"}
                </span>
              </div>
              {profile.total_reviews && (
                <span className="text-xs text-gray-500">
                  ({profile.total_reviews} avaliações)
                </span>
              )}
            </div>
          )}

          {/* Ações rápidas */}
          <div className="flex items-center gap-2">
            {profile.telefone && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`tel:${profile.telefone}`);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>Ligar</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                // Abrir chat
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Mensagem</span>
            </button>

            {/* Botão de Contestação - apenas se for o próprio profile mencionado */}
            {isOwnProfile && postId && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowDisputeModal(true);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30"
              >
                <Shield className="w-3 h-3" />
                <span>Contestar</span>
              </button>
            )}
          </div>

          {/* Modal de Contestação */}
          {isOwnProfile && postId && (
            <DisputeMentionModal
              open={showDisputeModal}
              onOpenChange={setShowDisputeModal}
              postId={postId}
              mentionedProfileId={profile.id}
              mentionedProfileName={profile.name}
            />
          )}
        </div>
      </div>
    </Link>
  );
}
