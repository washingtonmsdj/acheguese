/**
 * BusinessCard
 * 
 * Card de empresa com informações completas
 */

import { motion } from "framer-motion";
import {
  Crown, BadgeCheck, Navigation, ThumbsUp, Star,
  Bookmark, Share2, Phone, Route,
} from "lucide-react";
import { DistanceBadge } from "@/core/geospatial/components/DistanceBadge";
import type { BusinessCardProps } from "../../sections/types";

export function BusinessCard({
  business,
  onClick,
  onToggleSave,
  isSaved,
  nearbyMode,
  index,
}: BusinessCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-5 hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group relative"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0 relative">
            {business.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            {business.premium && (
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning flex items-center justify-center">
                <Crown className="h-2.5 w-2.5 text-warning-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors font-heading">
                {business.name}
              </h3>
              {business.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{business.category}</span>
              <span>·</span>
              <span className={business.isOpen ? "text-success font-medium" : "text-destructive"}>
                {business.isOpen ? "Aberto" : "Fechado"}
              </span>
            </div>
          </div>
        </div>

        {/* Distance badge */}
        <div className="flex flex-col items-end gap-1">
          {business.distanceMeters !== undefined && nearbyMode ? (
            <DistanceBadge distanceMeters={business.distanceMeters} showIcon={true} />
          ) : (
            <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg">
              <Navigation className="h-3 w-3 text-primary" />
              <span className="text-sm font-bold text-primary">{business.distance}</span>
            </div>
          )}
          {business.walkTime !== "N/A" && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              🚶 {business.walkTime}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{business.description}</p>

      {/* Community signal */}
      <div className="flex items-center gap-1.5 mb-3 bg-secondary/50 rounded-lg px-3 py-2">
        <ThumbsUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{business.neighborRecs} vizinhos</span> recomendam · {business.lastVisit}
        </span>
      </div>

      {/* Tags + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {business.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full border border-border"
            >
              {tag}
            </span>
          ))}
          <span className="flex items-center gap-0.5 text-xs text-warning">
            <Star className="h-3 w-3 fill-warning" /> {business.rating}
            <span className="text-muted-foreground ml-0.5">({business.reviews})</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => onToggleSave(business.id, e)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            title="Salvar"
          >
            <Bookmark
              className={`h-4 w-4 ${isSaved ? "text-primary fill-primary" : "text-muted-foreground"}`}
            />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            title="Compartilhar"
          >
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            title="Ligar"
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            title="Traçar rota"
          >
            <Route className="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
