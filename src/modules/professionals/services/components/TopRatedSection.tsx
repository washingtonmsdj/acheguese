import { Star, Trophy } from "lucide-react";
import { getServiceCategoryIcon } from "@/modules/professionals/services/domain/professionalCategories";
import type { ProfessionalItem } from "@/modules/professionals/services/hooks/useServicos";

interface TopRatedSectionProps {
  topRated: ProfessionalItem[];
  onProfessionalClick: (professional: ProfessionalItem) => void;
  showSection: boolean;
}

export function TopRatedSection({
  topRated,
  onProfessionalClick,
  showSection,
}: TopRatedSectionProps) {
  if (!showSection || topRated.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 border-b">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="h-4 w-4 text-warning" />
        <h2 className="text-sm font-bold">Mais bem avaliados</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {topRated.map((professional) => (
          <div
            key={professional.id}
            onClick={() => onProfessionalClick(professional)}
            className="flex-shrink-0 w-32 bg-card rounded-xl border p-2 cursor-pointer hover:shadow-md transition-shadow"
          >
            {professional.photo ? (
              <img
                src={professional.photo}
                alt={professional.name}
                className="h-16 w-full rounded-lg object-cover mb-1"
                loading="lazy"
              />
            ) : (
              <div className="h-16 w-full rounded-lg bg-secondary flex items-center justify-center text-2xl mb-1">
                {getServiceCategoryIcon(professional.category)}
              </div>
            )}

            <p className="text-xs font-medium truncate">{professional.name}</p>

            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 text-warning fill-warning" />
              {professional.rating ? professional.rating.toFixed(1) : "0.0"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
