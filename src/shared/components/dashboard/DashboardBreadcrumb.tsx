import React from "react";
import { useNavigate } from "react-router-dom";

export function DashboardBreadcrumb() {
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      <button
        onClick={() => navigate("/conta")}
        className="transition-colors hover:text-foreground"
      >
        Conta
      </button>
      <span>/</span>
      <span className="font-medium text-foreground">Dashboard da Empresa</span>
    </div>
  );
}
