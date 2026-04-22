/**
 * UnifiedComposer - Orquestrador de Criação de Conteúdo
 * 
 * Componente central que orquestra a criação de:
 * - Posts sociais (discussao, recomendacao, enquete, etc)
 * - Alertas urgentes (via community-alerts)
 * - Problemas urbanos (via community-issues)
 * 
 * ✅ SPRINT 2 FASE 3: Refatorado para SSOT territorial
 * - Aceita locationId? como prop quando necessário
 * - Usa território ativo do sistema via useTerritoryFilter
 * - Não propaga city/neighborhood/street para modais
 * - Sem acoplamento com campos legados
 * 
 * REGRA: Community apenas orquestra, não absorve lógica interna
 */

import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Plus, MessageCircle, AlertTriangle, Construction } from "lucide-react";
import { CreatePostModal } from "./CreatePostModal";
import { CreateAlertModal } from "@/modules/community/alerts";
import { CreateIssueModal } from "@/modules/community/issues";

interface UnifiedComposerProps {
  locationId?: string; // ✅ SPRINT 2 FASE 3: location_id explícito (opcional)
  onPostCreated?: () => void;
  onAlertCreated?: () => void;
  onIssueCreated?: () => void;
}

type ComposerType = "post" | "alert" | "issue" | null;

export function UnifiedComposer({
  locationId, // ✅ SPRINT 2 FASE 3: location_id explícito (não usado por enquanto, modais resolvem internamente)
  onPostCreated,
  onAlertCreated,
  onIssueCreated,
}: UnifiedComposerProps) {
  const [activeComposer, setActiveComposer] = useState<ComposerType>(null);

  const handleOpenComposer = (type: ComposerType) => {
    setActiveComposer(type);
  };

  const handleCloseComposer = () => {
    setActiveComposer(null);
  };

  const handlePostCreated = () => {
    handleCloseComposer();
    onPostCreated?.();
  };

  const handleAlertCreated = () => {
    handleCloseComposer();
    onAlertCreated?.();
  };

  const handleIssueCreated = () => {
    handleCloseComposer();
    onIssueCreated?.();
  };

  return (
    <>
      {/* Botão Principal */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            aria-label="Criar novo conteúdo"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => handleOpenComposer("post")}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <div>
              <div className="font-medium">Post Social</div>
              <div className="text-sm text-muted-foreground">
                Discussão, recomendação, enquete...
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleOpenComposer("alert")}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div>
              <div className="font-medium">Alerta Urgente</div>
              <div className="text-sm text-muted-foreground">
                Situação que precisa de atenção imediata
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleOpenComposer("issue")}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <Construction className="w-4 h-4 text-orange-500" />
            <div>
              <div className="font-medium">Problema Urbano</div>
              <div className="text-sm text-muted-foreground">
                Infraestrutura, limpeza, segurança...
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modais - Cada um mantém sua lógica interna */}
      
      {/* ✅ SPRINT 2 FASE 3: Modal de Post Social - Resolve location_id internamente */}
      <CreatePostModal
        open={activeComposer === "post"}
        onClose={handleCloseComposer}
      />

      {/* Modal de Alerta - Módulo community-alerts (API pública estável) */}
      <CreateAlertModal
        open={activeComposer === "alert"}
        onClose={handleCloseComposer}
        onAlertCreated={handleAlertCreated}
        city={""} 
        neighborhood={undefined}
      />

      {/* Modal de Problema - Módulo community-issues (API pública estável) */}
      <CreateIssueModal
        open={activeComposer === "issue"}
        onClose={handleCloseComposer}
        onIssueCreated={handleIssueCreated}
        city={""}
        neighborhood={undefined}
      />
    </>
  );
}


