import React from "react";
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
}

interface GruposListProps {
  groups: GroupLike[];
  isLoading: boolean;
  tab: "todos" | "meus";
  onJoin: (e: React.MouseEvent, groupId: string) => void;
  onTabChange: (tab: "todos" | "meus") => void;
}

export function GruposList({
  groups,
  isLoading,
  tab,
  onJoin,
  onTabChange,
}: GruposListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="py-16 text-center">
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
    <div className="space-y-3">
      {groups.map((group, index) => (
        <GrupoCardEnhanced
          key={group.id}
          group={group}
          variant="list"
          index={index}
          onClick={() => {}}
          onJoin={onJoin}
        />
      ))}
    </div>
  );
}
