import { Car, Package } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { StatusBadge } from "../../StatusBadge";

interface RideCardHeaderProps {
  status: string;
  isEntrega: boolean;
}

export const RideCardHeader = ({ status, isEntrega }: RideCardHeaderProps) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <StatusBadge status={status} size="md" />
      <Badge
        className={cn(
          "rounded-full px-2 text-[0.6rem]",
          isEntrega
            ? "bg-amber-500/20 text-amber-400"
            : "bg-teal-400/20 text-teal-400",
        )}
      >
        {isEntrega ? (
          <Package className="mr-1 h-3 w-3" />
        ) : (
          <Car className="mr-1 h-3 w-3" />
        )}
        {isEntrega ? "Entrega" : "Viagem"}
      </Badge>
    </div>
  );
};
