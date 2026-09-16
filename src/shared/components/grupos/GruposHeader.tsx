import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface GruposHeaderProps {
  onCreateClick: () => void;
  backHref: string;
}

export function GruposHeader({ onCreateClick, backHref }: GruposHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentParams = new URLSearchParams(location.search);
  const isCommunityTabGroups =
    location.pathname.startsWith("/comunidade/") &&
    currentParams.get("tab") === "grupos";

  const handleBack = () => {
    if (isCommunityTabGroups) {
      const params = new URLSearchParams(location.search);
      params.set("tab", "feed");
      navigate(`${location.pathname}?${params.toString()}`);
      return;
    }
    navigate(backHref);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-territory-border bg-territory-surface/95 backdrop-blur-lg">
      <div className="mx-auto flex min-h-13 w-full max-w-6xl min-w-0 items-center justify-between gap-2.5 px-3 sm:min-h-14 sm:px-4 md:px-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex min-w-0 items-center gap-2 rounded-lg px-1 text-territory-ink transition-colors hover:text-territory-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-focus"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
          <span className="truncate text-sm font-semibold sm:text-base">Grupos</span>
        </button>
        <Button
          size="sm"
          onClick={onCreateClick}
          className="h-8 shrink-0 gap-1.5 bg-territory-brand px-2.5 text-xs font-semibold text-[hsl(var(--territory-on-image))] hover:bg-territory-brand-strong sm:h-9 sm:px-3 sm:text-sm"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          Criar
        </Button>
      </div>
    </div>
  );
}
