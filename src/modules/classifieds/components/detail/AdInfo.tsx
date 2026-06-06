import React from "react";
import { MapPin, Clock, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { formatBrlNoCents } from "@/shared/utils/currency";

interface AdInfoProps {
  title: string;
  price: number;
  description: string;
  category: string;
  status: string;
  neighborhood: string;
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Disponível",
    color: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  reservado: {
    label: "Reservado",
    color: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  vendido: {
    label: "Vendido",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays}d atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
  return `${Math.floor(diffDays / 30)}m atrás`;
}

export function AdInfo({
  title,
  price,
  description,
  category,
  status,
  neighborhood,
  createdAt,
}: AdInfoProps) {
  const statusData = getRecordValue(statusConfig, status) ?? statusConfig.active;
  const timeAgo = createdAt ? getTimeAgo(createdAt) : "";

  return (
    <div className="px-4 -mt-4 relative z-10">
      {/* Price card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-2xl border shadow-lg p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  statusData.color,
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", statusData.dot)}
                />
                {statusData.label}
              </div>
              <span className="text-[10px] text-muted-foreground capitalize">
                {category}
              </span>
            </div>
            <h1 className="text-lg font-bold font-display leading-tight">
              {title}
            </h1>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Preço
            </p>
            <p className="text-2xl font-bold text-primary font-display">
              {formatBrlNoCents(price)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            {neighborhood && (
              <span className="flex items-center gap-1 text-[11px]">
                <MapPin className="h-3.5 w-3.5" />
                {neighborhood}
              </span>
            )}
            {timeAgo && (
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="h-3.5 w-3.5" />
                {timeAgo}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Description */}
      {description && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4"
        >
          <h2 className="text-sm font-bold font-display mb-2">Descrição</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {description}
          </p>
        </motion.div>
      )}
    </div>
  );
}
