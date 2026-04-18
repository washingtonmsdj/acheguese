/**
 * AdminMotoristasEmptySection
 * 
 * Empty state quando não há motoristas
 */

import { Card, CardContent } from "@/shared/components/ui/card";
import { Car } from "lucide-react";
import type { AdminMotoristasEmptySectionProps } from "./types";

export function AdminMotoristasEmptySection({
  filter,
}: AdminMotoristasEmptySectionProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Car className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum motorista encontrado</h3>
        <p className="text-muted-foreground text-center text-sm">
          Não há motoristas {filter !== "all" && `com status "${filter}"`}
        </p>
      </CardContent>
    </Card>
  );
}
