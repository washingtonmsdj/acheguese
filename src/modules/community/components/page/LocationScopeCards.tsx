import React, { memo } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Home } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface LocationScopeCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
}

const LocationScopeCard = memo(
  ({ icon: Icon, label, value, isActive, onClick }: LocationScopeCardProps) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all border-2 min-w-0",
        isActive
          ? "border-teal-400 bg-gradient-to-br from-teal-400/20 to-cyan-400/10 shadow-lg shadow-teal-400/20"
          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
      )}
      aria-pressed={isActive}
      aria-label={`Filtrar por ${label}: ${value}`}
    >
      <Icon
        className={cn(
          "w-5 h-5 flex-shrink-0",
          isActive ? "text-teal-400" : "text-gray-400",
        )}
        aria-hidden="true"
      />
      <div className="text-center min-w-0 w-full">
        <p className="text-[10px] leading-tight text-gray-400 line-clamp-2">
          {label}
        </p>
        <p
          className={cn(
            "text-xs font-semibold truncate w-full",
            isActive ? "text-teal-300" : "text-gray-200",
          )}
        >
          {value}
        </p>
      </div>
    </motion.button>
  ),
);

LocationScopeCard.displayName = "LocationScopeCard";

interface LocationScopeCardsProps {
  city?: string | null;
  neighborhood?: string | null;
  currentScope: string;
  onScopeChange: (scope: "city" | "neighborhood" | "street") => void;
}

export function LocationScopeCards({
  city,
  neighborhood,
  currentScope,
  onScopeChange,
}: LocationScopeCardsProps) {
  return (
    <motion.div
      className="mb-4 grid grid-cols-3 gap-2 sm:gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <LocationScopeCard
        icon={Building2}
        label="Toda a cidade"
        value={city || "Cidade"}
        isActive={currentScope === "city"}
        onClick={() => onScopeChange("city")}
      />
      <LocationScopeCard
        icon={MapPin}
        label="Todo o bairro"
        value={neighborhood || "Bairro"}
        isActive={currentScope === "neighborhood"}
        onClick={() => onScopeChange("neighborhood")}
      />
      <LocationScopeCard
        icon={Home}
        label="Minha rua"
        value="Rua"
        isActive={currentScope === "street"}
        onClick={() => onScopeChange("street")}
      />
    </motion.div>
  );
}
