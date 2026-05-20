import { Tag } from "lucide-react";
import type { PlanTier } from "@/core/billing/types";

interface Props {
  businessId: string;
  planType: PlanTier;
}

export default function CouponManager({ businessId: _, planType: __ }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <Tag className="h-10 w-10 opacity-40" />
      <p className="text-sm">Gerenciador de cupons em breve</p>
    </div>
  );
}
