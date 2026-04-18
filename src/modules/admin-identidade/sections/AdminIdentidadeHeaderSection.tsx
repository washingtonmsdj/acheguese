/**
 * AdminIdentidadeHeaderSection Component
 * 
 * Header da página de governança de identidade
 */

import { RefreshCw, Loader2, UserCog } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AdminPageHeader } from "@/modules/admin/components";
import type { AdminIdentidadeHeaderSectionProps } from "./types";

interface Props extends AdminIdentidadeHeaderSectionProps {
  readonly isRefreshing: boolean;
  readonly onRefresh: () => void;
}

export function AdminIdentidadeHeaderSection({ isRefreshing, onRefresh }: Props) {
  return (
    <AdminPageHeader
      title="Governanca de Identidade"
      description="Cobertura administrativa oficial para profile como centro de identidade do ecossistema."
      icon={UserCog}
      actions={
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar
        </Button>
      }
    />
  );
}
