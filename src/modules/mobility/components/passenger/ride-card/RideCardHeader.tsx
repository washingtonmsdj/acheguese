import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Car, Package } from "lucide-react";
import { StatusBadge } from "../../StatusBadge";
import { cn } from "@/shared/utils/cn";
import { RIDE_STATUS, type RideStatus } from "@/shared/types/constants";
interface RideCardHeaderProps {
  status: string;
  isEntrega: boolean;
}

export const RideCardHeader = ({ status, isEntrega }: RideCardHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <StatusBadge status={status as any} size="md" />
      <Badge
        className={cn(
          "text-[0.6rem] px-2 rounded-full",
          isEntrega
            ? "bg-amber-500/20 text-amber-400"
            : "bg-teal-400/20 text-teal-400",
        )}
      >
        {isEntrega ? (
          <Package className="h-3 w-3 mr-1" />
        ) : (
          <Car className="h-3 w-3 mr-1" />
        )}
        {isEntrega ? "Entrega" : "Viagem"}
      </Badge>
    </div>
  );
};
