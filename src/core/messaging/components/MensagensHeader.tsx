import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";

interface MensagensHeaderProps {
  totalUnreadCount: number;
  hasUnreadMessages: boolean;
  shouldShowSearch: boolean;
  search: string;
  onSearchChange: (search: string) => void;
}

export function MensagensHeader({
  totalUnreadCount,
  hasUnreadMessages,
  shouldShowSearch,
  search,
  onSearchChange,
}: MensagensHeaderProps) {
  return (
    <div className="px-4 pt-5 pb-3">
      <div className="flex items-center gap-3 mb-3">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Mensagens
        </h1>
        {hasUnreadMessages && (
          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
            {totalUnreadCount}
          </Badge>
        )}
      </div>

      {shouldShowSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 text-sm rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
