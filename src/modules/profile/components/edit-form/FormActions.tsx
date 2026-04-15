import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Loader2 } from "lucide-react";

interface FormActionsProps {
  loading: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function FormActions({ loading, onSave, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button variant="outline" onClick={onCancel} disabled={loading}>
        Cancelar
      </Button>
      <Button onClick={onSave} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
