/**
 * AdminIdentidadeDetailDialog Component
 * 
 * Dialog de detalhe do perfil com 8 cards
 */

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { AdminErrorState } from "@/core/admin/components";
import type { AdminIdentidadeDetailDialogProps } from "./types";
import {
  IdentityCard,
  GovernanceCard,
  LinkedEntitiesCard,
  UsernameHistoryCard,
  SecondaryEntitiesCard,
  ReputationSourcesCard,
  PreferenceScopesCard,
  CapabilityPreviewCard,
} from "../components/cards";

export function AdminIdentidadeDetailDialog({
  open,
  profileId,
  detail,
  loading,
  error,
  onOpenChange,
  onRetry,
}: AdminIdentidadeDetailDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Governanca de identidade</DialogTitle>
        </DialogHeader>
        {error ? (
          <AdminErrorState
            title="Falha ao carregar detalhe da identidade"
            description="O detalhe administrativo deste perfil nao foi retornado pelo dominio `profile`."
            onRetry={onRetry}
          />
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !detail ? (
          <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Nao foi possivel carregar o detalhe desta identidade.
          </div>
        ) : (
          <div className="grid max-h-[75vh] gap-4 overflow-y-auto pr-1 lg:grid-cols-2">
            <IdentityCard detail={detail} />
            <GovernanceCard detail={detail} />
            <LinkedEntitiesCard entities={detail.linkedEntities} />
            <UsernameHistoryCard history={detail.usernameHistory} />
            <SecondaryEntitiesCard residence={detail.residence} family={detail.family} />
            <ReputationSourcesCard sources={detail.reputationSources} />
            <PreferenceScopesCard scopes={detail.preferenceScopes} />
            <CapabilityPreviewCard capabilityPreview={detail.capabilityPreview} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
