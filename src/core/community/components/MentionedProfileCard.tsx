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
import { buildTelUrl, openContactUrl } from "@/shared/utils/contactLinks";

interface MentionedProfile {
  id: string;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
  public_neighborhood?: string;
  location?: string | null;
  user_type?: string;
  type?: string;
  profissao?: string;
  telefone?: string;
  rating?: number;
  total_reviews?: number;
}

interface MentionedProfileCardProps {
  profile: MentionedProfile;
  mentionType?: "recommendation" | "tag" | "reference";
  rank?: number;
  postId?: string;
  currentUserId?: string;
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
        color:
          "from-yellow-500/20 to-yellow-600/20 border-yellow-500/40 text-yellow-400",
        label: "1\u00ba Mais votado",
      },
      2: {
        color:
          "from-gray-400/20 to-gray-500/20 border-gray-400/40 text-gray-300",
        label: "2\u00ba Mais votado",
      },
      3: {
        color:
          "from-orange-600/20 to-orange-700/20 border-orange-600/40 text-orange-400",
        label: "3\u00ba Mais votado",
      },
    };
    return badges[position as keyof typeof badges];
  };

  const rankBadge = rank ? getRankBadge(rank) : null;
  const publicProfileUrl = profile.username
    ? buildPublicProfileUrl(profile.username)
    : null;
  const avatarUrl = profile.avatar_url ?? profile.avatar ?? undefined;
  const neighborhood = profile.public_neighborhood ?? profile.location;
  const cardClassName = `block p-3 rounded-lg border transition-all ${
    rank === 1
      ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 hover:from-yellow-500/15 hover:to-yellow-600/15 ring-2 ring-yellow-500/20"
      : "border-teal-500/20 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 hover:from-teal-500/10 hover:to-cyan-500/10"
  }`;

  const avatar = (
    <Avatar
      className={`w-12 h-12 ring-2 ${rank === 1 ? "ring-yellow-400/40" : "ring-teal-400/30"}`}
    >
      <AvatarImage src={avatarUrl} />
      <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white font-semibold">
        {getInitials(profile.name)}
      </AvatarFallback>
    </Avatar>
  );

  const profileDetails = (
    <>
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-semibold text-sm text-white truncate">
          {profile.name}
        </h4>
        {rankBadge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${rankBadge.color} border flex-shrink-0 font-bold`}
          >
            {rankBadge.label}
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

      {neighborhood && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin className="w-3 h-3" />
          <span>{neighborhood}</span>
        </div>
      )}

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
              ({profile.total_reviews} avalia\u00e7\u00f5es)
            </span>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      <div className={cardClassName}>
        <div className="flex items-start gap-3">
          {publicProfileUrl ? (
            <Link to={publicProfileUrl} aria-label={`Abrir perfil de ${profile.name}`}>
              {avatar}
            </Link>
          ) : (
            avatar
          )}

          <div className="flex-1 min-w-0">
            {publicProfileUrl ? (
              <Link to={publicProfileUrl} className="block">
                {profileDetails}
              </Link>
            ) : (
              profileDetails
            )}

            <div className="flex items-center gap-2">
              {profile.telefone && (
                <button
                  onClick={() => {
                    const url = buildTelUrl(profile.telefone);
                    openContactUrl(url);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>Ligar</span>
                </button>
              )}
              <button
                onClick={() => {
                  // Chat opening is still owned by the messaging flow.
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Mensagem</span>
              </button>

              {isOwnProfile && postId && (
                <button
                  onClick={() => {
                    setShowDisputeModal(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30"
                >
                  <Shield className="w-3 h-3" />
                  <span>Contestar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && postId && (
        <DisputeMentionModal
          open={showDisputeModal}
          onOpenChange={setShowDisputeModal}
          postId={postId}
          mentionedProfileId={profile.id}
          mentionedProfileName={profile.name}
        />
      )}
    </>
  );
}
