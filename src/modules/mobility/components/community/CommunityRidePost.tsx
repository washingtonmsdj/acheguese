import React, { useState } from "react";
import {
  Car,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Package,
  Calendar,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";
import { toast } from "sonner";

export type CommunityRideIntent = "offering" | "requesting";

export interface CommunityRidePostData {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorNeighborhood?: string;
  isVerified?: boolean;
  content: string;
  intent: CommunityRideIntent;
  origin?: string;
  destination?: string;
  departureTime?: string; // ISO string
  seatsAvailable?: number;
  rideType?: "viagem" | "carona_compartilhada" | "entrega" | "agendada";
  price?: number;
  createdAt: string;
  interestedCount?: number;
  hasJoined?: boolean;
}

interface CommunityRidePostProps {
  post: CommunityRidePostData;
  currentUserId?: string;
  onJoin?: (postId: string) => void;
  onCreateRide?: (postId: string, post: CommunityRidePostData) => void;
  onMessage?: (postId: string, authorProfileId: string) => void;
  onReport?: (postId: string) => void;
  compact?: boolean;
}

const intentConfig = {
  offering: {
    label: "Oferecendo Carona",
    color: "bg-teal-500/15 text-teal-400 border-teal-500/20",
    icon: Car,
    accentColor: "teal",
    actionLabel: "Quero essa carona!",
    actionColor:
      "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 shadow-teal-500/20",
  },
  requesting: {
    label: "Precisa de Carona",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: Users,
    accentColor: "amber",
    actionLabel: "Posso levar!",
    actionColor:
      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20",
  },
};

const rideTypeConfig: Record<string, { label: string; icon: LucideIcon }> = {
  viagem: { label: "Corrida", icon: Car },
  carona_compartilhada: { label: "Carona compartilhada", icon: Users },
  entrega: { label: "Entrega", icon: Package },
  agendada: { label: "Agendada", icon: Calendar },
};

function formatTime(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function CommunityRidePost({
  post,
  currentUserId,
  onJoin,
  onCreateRide,
  onMessage,
  onReport,
  compact = false,
}: CommunityRidePostProps) {
  const [joined, setJoined] = useState(post.hasJoined ?? false);
  const [interested, setInterested] = useState(post.interestedCount ?? 0);

  const cfg = intentConfig[post.intent];
  const IntentIcon = cfg.icon;
  const RideTypeIcon = post.rideType ? rideTypeConfig[post.rideType]?.icon : null;
  const rideTypeLabel = post.rideType ? rideTypeConfig[post.rideType]?.label : null;

  const handleJoin = () => {
    if (!currentUserId) {
      toast.error("Faça login para participar");
      return;
    }
    if (joined) {
      toast.info("Você já manifestou interesse nessa carona");
      return;
    }
    setJoined(true);
    setInterested((p) => p + 1);
    toast.success(
      post.intent === "offering"
        ? "Interesse registrado. O motorista entrará em contato."
        : "Oferta registrada. O passageiro será notificado.",
    );
    onJoin?.(post.id);
  };

  const handleCreateRide = () => {
    onCreateRide?.(post.id, post);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-[#1E2529] overflow-hidden transition-all hover:border-white/20",
        post.intent === "offering"
          ? "border-teal-500/15"
          : "border-amber-500/15",
        compact && "rounded-xl",
      )}
    >
      {/* Intent banner */}
      <div
        className={cn(
          "px-4 py-2 flex items-center justify-between border-b",
          post.intent === "offering"
            ? "bg-teal-500/5 border-teal-500/10"
            : "bg-amber-500/5 border-amber-500/10",
        )}
      >
        <div className="flex items-center gap-2">
          <IntentIcon
            className={cn(
              "h-3.5 w-3.5",
              post.intent === "offering" ? "text-teal-400" : "text-amber-400",
            )}
          />
          <span
            className={cn(
              "text-[0.65rem] font-bold uppercase tracking-wide",
              post.intent === "offering" ? "text-teal-400" : "text-amber-400",
            )}
          >
            {cfg.label}
          </span>
          {post.rideType && (
            <span className="flex items-center gap-1 text-[0.6rem] text-gray-500">
              {RideTypeIcon && <RideTypeIcon className="h-3 w-3" aria-hidden="true" />}
              {rideTypeLabel}
            </span>
          )}
        </div>
        {interested > 0 && (
          <span
            className={cn(
              "text-[0.6rem] font-semibold px-2 py-0.5 rounded-full",
              post.intent === "offering"
                ? "bg-teal-500/10 text-teal-400"
                : "bg-amber-500/10 text-amber-400",
            )}
          >
            {interested} interessado{interested > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className={cn("p-4", compact && "p-3")}>
        {/* Author */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
              post.intent === "offering"
                ? "bg-gradient-to-br from-teal-500 to-cyan-500"
                : "bg-gradient-to-br from-amber-500 to-orange-500",
            )}
          >
            {(post.authorName ?? '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white truncate">
                {post.authorName}
              </span>
              {post.isVerified && (
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-[0.65rem] text-gray-500">
              {post.authorNeighborhood && `${post.authorNeighborhood} - `}
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-200 leading-relaxed mb-3">
          {post.content}
        </p>

        {/* Route info */}
        {(post.origin || post.destination) && (
          <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              </div>
              <span className="text-xs text-gray-300 truncate">
                {post.origin || "Bairro"}
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-gray-300 truncate">
                {post.destination || "Destino"}
              </span>
            </div>
          </div>
        )}

        {/* Meta info row */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-[0.65rem] text-gray-500">
          {post.departureTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(post.departureTime)}</span>
            </div>
          )}
          {post.seatsAvailable !== undefined && post.intent === "offering" && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>
                {post.seatsAvailable} vaga{post.seatsAvailable > 1 ? "s" : ""}
              </span>
            </div>
          )}
          {post.price !== undefined && (
            <div className="flex items-center gap-1 font-semibold text-emerald-400">
              <span>{formatBrl(post.price)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleJoin}
            disabled={joined}
            className={cn(
              "flex-1 text-white font-semibold rounded-xl h-9 text-xs shadow-lg transition-all",
              joined
                ? "bg-white/10 text-gray-400 cursor-not-allowed shadow-none"
                : cfg.actionColor,
            )}
          >
            {joined ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Interesse
                registrado
              </>
            ) : (
              <>
                <IntentIcon className="h-3.5 w-3.5 mr-1.5" /> {cfg.actionLabel}
              </>
            )}
          </Button>

          {onCreateRide && post.intent === "requesting" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateRide}
              className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 rounded-xl h-9 text-xs"
            >
              <Car className="h-3.5 w-3.5 mr-1" /> Criar corrida
            </Button>
          )}

          {onMessage && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onMessage(post.id, post.id)}
              className="h-9 w-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
          )}

          {onReport && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onReport(post.id)}
              className="h-9 w-9 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              title="Reportar postagem"
            >
              <Flag className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
