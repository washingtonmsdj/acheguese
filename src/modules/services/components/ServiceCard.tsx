import { MessageCircle, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";
import { ViewOnMapButton } from "@/core/maps/components/ViewOnMapButton";
import { getServiceCategoryIcon } from "@/modules/services/domain/professionalCategories";
import type { ProfessionalItem } from "@/modules/services/hooks/useServicos";

interface ServiceCardProps {
  professional: ProfessionalItem;
  index: number;
  onProfessionalClick: (professional: ProfessionalItem) => void;
}

export function ServiceCard({
  professional,
  index,
  onProfessionalClick,
}: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 5) * 0.05 }}
      onClick={() => onProfessionalClick(professional)}
      className="flex gap-3 bg-card rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      {professional.photo ? (
        <img
          src={professional.photo}
          alt={professional.name}
          className="h-16 w-16 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center text-2xl">
          {getServiceCategoryIcon(professional.category)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold truncate">{professional.name}</h3>
        <p className="text-xs text-primary font-medium">
          {professional.service}
        </p>

        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 text-warning fill-warning" />
            {professional.rating ? professional.rating.toFixed(1) : "0.0"} (
            {professional.totalAvaliacoes})
          </span>
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {professional.neighborhood}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-xs font-semibold">
            {professional.priceMedio}
          </span>

          <div className="flex items-center gap-2">
            {professional.whatsapp && (
              <a
                href={`https://wa.me/55${professional.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                WhatsApp
              </a>
            )}

            <ViewOnMapButton
              latitude={professional.latitude}
              longitude={professional.longitude}
              itemId={professional.id}
              itemType="service"
              itemName={professional.name}
              size="sm"
              variant="outline"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
