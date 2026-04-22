/**
 * ClassifiedCardSkeleton - Loading skeleton para ClassifiedCard
 * 
 * SSOT: Componente de loading state
 * Sem gambiarras: Código limpo e reutilizável
 */

import { Skeleton } from "@/shared/components/ui/skeleton";

export function ClassifiedCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
