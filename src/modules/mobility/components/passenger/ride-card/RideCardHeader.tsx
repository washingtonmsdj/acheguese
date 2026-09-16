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
    <div className="mb-4 flex items-center justify-between gap-2">
      <StatusBadge status={status} size="md" />
      <Badge
        variant="outline"
        className={cn(
          "rounded-full px-2 text-[0.6rem]",
          isEntrega
            ? "border-warning/30 bg-warning/10 text-warning"
            : "border-category-mobility/30 bg-category-mobility/10 text-category-mobility",
        )}
      >
        {isEntrega ? (
          <Package className="mr-1 h-3 w-3" aria-hidden="true" />
        ) : (
          <Car className="mr-1 h-3 w-3" aria-hidden="true" />
        )}
        {isEntrega ? "Entrega" : "Viagem"}
      </Badge>
    </div>
  );
};
