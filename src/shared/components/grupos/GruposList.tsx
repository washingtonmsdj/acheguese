import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { GrupoCardEnhanced } from "./GrupoCardEnhanced";

interface GroupLike {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
  members_count: number;
  posts_count: number;
  avatar_url?: string | null;
  description?: string | null;
  is_private: boolean;
  is_member: boolean;
  join_policy?: string | null;
  posting_policy?: string | null;
  member_visibility?: string | null;
  media_policy?: string | null;
  capabilities?: Record<string, boolean> | null;
}

interface GruposListProps {
  groups: GroupLike[];
  isLoading: boolean;
  tab: "todos" | "meus";
  getGroupHref: (groupId: string) => string;
  onJoin: (e: React.MouseEvent, groupId: string) => void;
  onTabChange: (tab: "todos" | "meus") => void;
}

export function GruposList({
  groups,
  isLoading,
  tab,
  getGroupHref,
  onJoin,
  onTabChange,
}: GruposListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-16 text-center">
        <Users className="mx-auto mb-4 h-16 w-16 text-gray-600" />
        <h3 className="mb-2 text-lg font-semibold text-white">
          {tab === "meus"
            ? "Voce ainda nao participa de nenhum grupo"
            : "Nenhum grupo encontrado"}
        </h3>
        <p className="mb-4 text-sm text-gray-400">
          {tab === "meus"
            ? "Explore os grupos disponiveis e participe."
            : "Seja o primeiro a criar um grupo."}
        </p>
        {tab === "meus" && (
          <Button
            onClick={() => onTabChange("todos")}
            variant="outline"
            size="sm"
            className="border-teal-400/30 text-teal-400"
          >
            Explorar grupos
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {groups.map((group, index) => (
        <GrupoCardEnhanced
          key={group.id}
          group={group}
          variant="grid"
          index={index}
          onClick={() => navigate(getGroupHref(group.id))}
          onJoin={onJoin}
        />
      ))}
    </div>
  );
}
