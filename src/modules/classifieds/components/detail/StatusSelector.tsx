import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ALERT_STATUS } from "@/shared/types/constants";
interface StatusSelectorProps {
  currentStatus: string;
  updating: boolean;
  onStatusChange: (status: string) => void;
}

export function StatusSelector({
  currentStatus,
  updating,
  onStatusChange,
}: StatusSelectorProps) {
  return (
    <div className="mt-3 pt-3 border-t">
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1 block">
        Alterar status
      </label>
      <Select
        value={currentStatus}
        onValueChange={onStatusChange}
        disabled={updating}
      >
        <SelectTrigger className="h-9 rounded-xl text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALERT_STATUS.ACTIVE}>✅ Disponível</SelectItem>
          <SelectItem value="reservado">⏳ Reservado</SelectItem>
          <SelectItem value="vendido">🏷️ Vendido</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
