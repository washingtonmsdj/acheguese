import { ChevronRight, Home } from "lucide-react";

interface AdBreadcrumbProps {
  category?: string;
  neighborhood?: string;
}

export function AdBreadcrumb({ category, neighborhood }: AdBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground overflow-x-auto scrollbar-hide px-4 py-2">
      <Home className="h-3 w-3 shrink-0" />
      <ChevronRight className="h-2.5 w-2.5 shrink-0" />
      <span className="shrink-0">Classificados</span>
      {category && (
        <>
          <ChevronRight className="h-2.5 w-2.5 shrink-0" />
          <span className="shrink-0 capitalize">{category}</span>
        </>
      )}
      {neighborhood && (
        <>
          <ChevronRight className="h-2.5 w-2.5 shrink-0" />
          <span className="shrink-0 text-foreground font-medium">{neighborhood}</span>
        </>
      )}
    </div>
  );
}
