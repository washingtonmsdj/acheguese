import React from "react";
import { Link } from "react-router-dom";
import { Users, Lock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const CATEGORIES = [
  { id: "geral", label: "Geral", emoji: "💬" },
  { id: "vizinhanca", label: "Vizinhança", emoji: "🏘️" },
  { id: "pets", label: "Pets", emoji: "🐕" },
  { id: "esportes", label: "Esportes", emoji: "🚴" },
  { id: "familia", label: "Família", emoji: "👶" },
  { id: "seguranca", label: "Segurança", emoji: "🚨" },
  { id: "sustentabilidade", label: "Sustentabilidade", emoji: "🌱" },
  { id: "cultura", label: "Cultura", emoji: "🎭" },
];

interface Group {
  id: string;
  name: string;
  description?: string;
  category?: string;
  members_count?: number;
  avatar_url?: string;
  is_public?: boolean;
  is_member?: boolean;
}

interface GrupoCardProps {
  group: Group;
  onJoin: (e: React.MouseEvent, groupId: string) => void;
}

export function GrupoCard({ group, onJoin }: GrupoCardProps) {
  const getCategoryEmoji = (cat: string | null) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found?.emoji || "💬";
  };

  const getCategoryLabel = (cat: string | null) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found?.label || cat;
  };

  return (
    <Link
      to={`/grupos/${group.id}`}
      className="block bg-[#1E2529] border border-white/10 rounded-xl p-4 hover:border-teal-400/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-400/10 flex items-center justify-center text-2xl flex-shrink-0">
          {group.avatar_url ? (
            <img
              src={group.avatar_url}
              alt={`Avatar do grupo ${group.name}`}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            getCategoryEmoji(group.category || null)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-white truncate">
              {group.name}
            </h3>
            {!group.is_public && (
              <Lock className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            )}
          </div>

          {group.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
              {group.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.members_count || 0} membros
            </span>
            {group.category && (
              <span className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">
                {getCategoryLabel(group.category)}
              </span>
            )}
          </div>
        </div>

        {!group.is_member ? (
          <Button
            size="sm"
            onClick={(e) => onJoin(e, group.id)}
            className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-400/30 text-xs flex-shrink-0"
          >
            Entrar
          </Button>
        ) : (
          <span className="text-xs text-teal-400 bg-teal-400/10 px-2 py-1 rounded flex-shrink-0">
            Membro
          </span>
        )}
      </div>
    </Link>
  );
}
