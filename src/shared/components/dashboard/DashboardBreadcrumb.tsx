import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs

export function DashboardBreadcrumb() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <button
        onClick={() => navigate(appUrls.profile.central)} // ✅ SSOT
        className="hover:text-foreground transition-colors"
      >
        Perfil
      </button>
      <span>/</span>
      <span className="text-foreground font-medium">Dashboard da Empresa</span>
    </div>
  );
}
