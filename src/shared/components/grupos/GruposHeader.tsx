import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs

interface GruposHeaderProps {
  onCreateClick: () => void;
}

export function GruposHeader({ onCreateClick }: GruposHeaderProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs

  return (
    <div className="sticky top-0 z-50 border-b bg-[#1E2529]/95 backdrop-blur-lg border-white/10">
      <div className="h-14 px-4 flex items-center justify-between max-w-3xl mx-auto">
        <button
          onClick={() => navigate(appUrls.community.feed)} // ✅ SSOT
          className="flex items-center gap-2 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-semibold">Grupos</span>
        </button>
        <Button
          size="sm"
          onClick={onCreateClick}
          className="bg-teal-500 hover:bg-teal-600 text-white gap-1.5"
        >
          <Plus className="w-4 h-4" /> Criar
        </Button>
      </div>
    </div>
  );
}
