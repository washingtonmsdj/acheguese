import { ScrollArea, ScrollBar } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/utils/cn";
import { SERVICE_CATEGORY_OPTIONS } from "@/modules/professionals/services/domain/professionalCategories";

interface ServiceCategoriesProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function ServiceCategories({
  selectedCategory,
  onCategoryChange,
}: ServiceCategoriesProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 px-4 py-3">
        {SERVICE_CATEGORY_OPTIONS.map((category) => {
          const Icon = category.icon;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all flex-shrink-0",
                selectedCategory === category.id
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border hover:border-primary/40",
              )}
              aria-pressed={selectedCategory === category.id}
              aria-label={`Filtrar por ${category.name}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium whitespace-nowrap">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
