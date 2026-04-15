import React from "react";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { GrupoCard } from "./GrupoCard";

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

interface GruposListProps {
  groups: Group[];
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          {tab === "meus"
            ? "Você ainda não participa de nenhum grupo"
            : "Nenhum grupo encontrado"}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {tab === "meus"
            ? "Explore os grupos disponíveis e participe!"
            : "Seja o primeiro a criar um grupo!"}
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
      {groups.map((group) => (
        <GrupoCard key={group.id} group={group} onJoin={onJoin} />
      ))}
    </div>
  );
}
