import { Badge } from "@/shared/components/ui/badge";
import { Shield, Star, AlertTriangle, Sparkles, User } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface PassengerTrustBadgeProps {
  trustLevel: string;
  rating?: number;
  totalRides?: number;
  className?: string;
}

const TRUST_LEVELS = {
  new: {
    label: "Novo",
    icon: User,
    color: "bg-gray-500/20 text-gray-600 border-gray-500/30",
  },
  beginner: {
    label: "Iniciante",
    icon: User,
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  },
  regular: {
    label: "Regular",
    icon: Star,
    color: "bg-slate-500/20 text-slate-600 border-slate-500/30",
  },
  reliable: {
    label: "Confiável",
    icon: Shield,
    color: "bg-green-500/20 text-green-600 border-green-500/30",
  },
  trusted: {
    label: "Verificado",
    icon: Sparkles,
    color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  },
  caution: {
    label: "Atenção",
    icon: AlertTriangle,
    color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  },
  low_rating: {
    label: "Baixo Rating",
    icon: AlertTriangle,
    color: "bg-red-500/20 text-red-600 border-red-500/30",
  },
};

export function PassengerTrustBadge({
  trustLevel,
  rating,
  totalRides,
  className,
}: PassengerTrustBadgeProps) {
  const level =
    TRUST_LEVELS[trustLevel as keyof typeof TRUST_LEVELS] || TRUST_LEVELS.new;
  const Icon = level.icon;

  return (
    <Badge
      variant="outline"
      className={cn("text-xs px-2 py-0.5", level.color, className)}
    >
      <Icon className="h-3 w-3 mr-1" />
      {level.label}
      {rating && <span className="ml-1">★ {rating.toFixed(1)}</span>}
      {totalRides !== undefined && <span className="ml-1">({totalRides})</span>}
    </Badge>
  );
}
