import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface GruposHeaderProps {
  onCreateClick: () => void;
}

export function GruposHeader({ onCreateClick }: GruposHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-[#1E2529]/95 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <button
          onClick={() => navigate("/comunidade")}
          className="flex items-center gap-2 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-semibold">Grupos</span>
        </button>
        <Button
          size="sm"
          onClick={onCreateClick}
          className="gap-1.5 bg-teal-500 text-white hover:bg-teal-600"
        >
          <Plus className="h-4 w-4" /> Criar
        </Button>
      </div>
    </div>
  );
}
