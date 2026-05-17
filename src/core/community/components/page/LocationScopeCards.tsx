import React, { memo } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Home } from "lucide-react";
import { COMMUNITY_LOCATION_SCOPE_COPY } from "@/core/community/utils/communityCopy";
import { cn } from "@/shared/utils/cn";

interface LocationScopeCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const LocationScopeCard = memo(
  ({ icon: Icon, label, value, isActive, onClick, disabled = false }: LocationScopeCardProps) => (
    <motion.button
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cn(
        "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all border-2 min-w-0",
        disabled
          ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-100 hover:border-amber-300/35 hover:bg-amber-300/[0.1]"
          : isActive
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
  isTerritorialGroup?: boolean;
  street?: string | null;
  streetAvailable?: boolean;
  currentScope: string;
  onScopeChange: (scope: "city" | "neighborhood" | "street") => void;
}

export function LocationScopeCards({
  city,
  neighborhood,
  isTerritorialGroup = false,
  street,
  streetAvailable = false,
  currentScope,
  onScopeChange,
}: LocationScopeCardsProps) {
  const neighborhoodLabel = isTerritorialGroup
    ? COMMUNITY_LOCATION_SCOPE_COPY.neighborhoodGroupLabel
    : COMMUNITY_LOCATION_SCOPE_COPY.neighborhoodLabel;
  const neighborhoodFallback = isTerritorialGroup
    ? COMMUNITY_LOCATION_SCOPE_COPY.neighborhoodGroupFallbackValue
    : COMMUNITY_LOCATION_SCOPE_COPY.neighborhoodFallbackValue;

  return (
    <motion.div
      className="mb-4 grid grid-cols-3 gap-2 sm:gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <LocationScopeCard
        icon={Building2}
        label={COMMUNITY_LOCATION_SCOPE_COPY.cityLabel}
        value={city || COMMUNITY_LOCATION_SCOPE_COPY.cityFallbackValue}
        isActive={currentScope === "city"}
        onClick={() => onScopeChange("city")}
      />
      <LocationScopeCard
        icon={MapPin}
        label={neighborhoodLabel}
        value={neighborhood || neighborhoodFallback}
        isActive={currentScope === "neighborhood"}
        onClick={() => onScopeChange("neighborhood")}
      />
      <LocationScopeCard
        icon={Home}
        label={COMMUNITY_LOCATION_SCOPE_COPY.streetLabel}
        value={
          streetAvailable
            ? street || COMMUNITY_LOCATION_SCOPE_COPY.streetFallbackValue
            : COMMUNITY_LOCATION_SCOPE_COPY.streetMissingValue
        }
        isActive={streetAvailable && currentScope === "street"}
        onClick={() => onScopeChange("street")}
        disabled={!streetAvailable}
      />
    </motion.div>
  );
}
