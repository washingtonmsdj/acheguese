import React from "react";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { Profile } from "@/modules/profile/types";

interface ProfileLoadingStateProps {
  loading: boolean;
  profile: Profile | null;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

export function ProfileLoadingState({
  loading,
  profile,
  onNavigateHome,
  onNavigateLogin,
}: ProfileLoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Perfil não encontrado</h2>
        <p className="text-muted-foreground mb-4">
          Não há perfis cadastrados no sistema ainda.
        </p>
        <div className="flex gap-2">
          <Button onClick={onNavigateHome}>Voltar ao início</Button>
          <Button variant="outline" onClick={onNavigateLogin}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
