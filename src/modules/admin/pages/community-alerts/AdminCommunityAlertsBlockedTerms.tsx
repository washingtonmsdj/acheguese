import { Ban, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import type { BlockedTermItem } from "./AdminCommunityAlerts.types";

interface AdminCommunityAlertsBlockedTermsProps {
  blockedTerms?: BlockedTermItem[];
  newBlockedTerm: string;
  isAdding: boolean;
  isRemoving: boolean;
  isToggling: boolean;
  onNewBlockedTermChange: (value: string) => void;
  onAddBlockedTerm: () => void;
  onRemoveBlockedTerm: (termId: string) => void;
  onToggleBlockedTerm: (termId: string, isActive: boolean) => void;
}

export function AdminCommunityAlertsBlockedTerms({
  blockedTerms,
  newBlockedTerm,
  isAdding,
  isRemoving,
  isToggling,
  onNewBlockedTermChange,
  onAddBlockedTerm,
  onRemoveBlockedTerm,
  onToggleBlockedTerm,
}: AdminCommunityAlertsBlockedTermsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="h-5 w-5" />
          Termos Bloqueados
        </CardTitle>
        <CardDescription>
          Gerencie termos que nao podem ser usados em alertas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Novo termo bloqueado..."
            value={newBlockedTerm}
            onChange={(event) => onNewBlockedTermChange(event.target.value)}
          />
          <Button
            onClick={onAddBlockedTerm}
            disabled={isAdding || !newBlockedTerm.trim()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {blockedTerms && blockedTerms.length > 0 ? (
          <div className="space-y-2">
            {blockedTerms.map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                    {term.term}
                  </code>
                  {!term.is_active && <Badge variant="outline">Inativo</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleBlockedTerm(term.id, !term.is_active)}
                    disabled={isToggling}
                  >
                    {term.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemoveBlockedTerm(term.id)}
                    disabled={isRemoving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum termo bloqueado cadastrado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
