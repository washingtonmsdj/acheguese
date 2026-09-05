import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Plus, MessageCircle, AlertTriangle, Construction } from "lucide-react";
import { CreatePostModal } from "@/core/community-feed/components/CreatePostModal";
import { CreateAlertModal } from "@/core/community/alerts";
import { CreateIssueModal } from "@/core/community/issues";

interface UnifiedComposerProps {
  locationId?: string;
  locationScope?: "city" | "neighborhood" | "street";
  onPostCreated?: () => void;
  onAlertCreated?: () => void;
  onIssueCreated?: () => void;
  onOpenCreatePost?: () => void;
  onOpenAlertModal?: () => void;
  onOpenIssueModal?: () => void;
  canCreatePost?: boolean;
  canCreateAlert?: boolean;
  canCreateIssue?: boolean;
  onBlockedCreatePost?: () => void;
  onBlockedCreateAlert?: () => void;
  onBlockedCreateIssue?: () => void;
}

type ComposerType = "post" | "alert" | "issue" | null;

export function UnifiedComposer({
  locationId,
  locationScope,
  onPostCreated,
  onAlertCreated,
  onIssueCreated,
  onOpenCreatePost,
  onOpenAlertModal,
  onOpenIssueModal,
  canCreatePost = true,
  canCreateAlert = true,
  canCreateIssue = true,
  onBlockedCreatePost,
  onBlockedCreateAlert,
  onBlockedCreateIssue,
}: UnifiedComposerProps) {
  const [activeComposer, setActiveComposer] = useState<ComposerType>(null);

  const handleOpenComposer = (type: ComposerType) => {
    if (type === "post" && !canCreatePost) {
      onBlockedCreatePost?.();
      return;
    }

    if (type === "alert" && !canCreateAlert) {
      onBlockedCreateAlert?.();
      return;
    }

    if (type === "issue" && !canCreateIssue) {
      onBlockedCreateIssue?.();
      return;
    }

    if (type === "post" && onOpenCreatePost) {
      onOpenCreatePost();
      return;
    }

    if (type === "alert" && onOpenAlertModal) {
      onOpenAlertModal();
      return;
    }

    if (type === "issue" && onOpenIssueModal) {
      onOpenIssueModal();
      return;
    }

    setActiveComposer(type);
  };

  const handleCloseComposer = () => {
    setActiveComposer(null);
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
              <div className="font-medium">Conteúdo territorial</div>
              <div className="text-sm text-muted-foreground">
                Discussão, enquete, oportunidade...
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
                Infraestrutura, limpeza, seguranca...
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!onOpenCreatePost && (
        <CreatePostModal
          open={activeComposer === "post"}
          onClose={handleCloseComposer}
          canCreatePost={canCreatePost}
          canCreateAlert={canCreateAlert}
          canCreateIssue={canCreateIssue}
        />
      )}

      {!onOpenAlertModal && (
        <CreateAlertModal
          open={activeComposer === "alert"}
          onClose={handleCloseComposer}
          onAlertCreated={handleAlertCreated}
          locationId={locationId}
          city=""
          neighborhood={undefined}
          canCreate={canCreateAlert}
        />
      )}

      {!onOpenIssueModal && (
        <CreateIssueModal
          open={activeComposer === "issue"}
          onClose={handleCloseComposer}
          onIssueCreated={handleIssueCreated}
          locationId={locationId}
          city=""
          neighborhood={undefined}
          canCreate={canCreateIssue}
        />
      )}
    </>
  );
}
