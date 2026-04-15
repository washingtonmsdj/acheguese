/**
 * 🎉 EVENT CARD COMPONENT (NÍVEL AAA)
 *
 * Card moderno para exibição de eventos
 *
 * Features:
 * - Design moderno com gradientes
 * - Animações Framer Motion
 * - Badges de status
 * - Informações completas
 * - Botão de mapa integrado
 * - Acessibilidade completa
 *
 * @version 1.0.0
 */

/**
 * 🎉 EVENT CARD COMPONENT (NÍVEL AAA) - SSOT COMPLIANT
 *
 * Card moderno para exibição de eventos
 *
 * Features:
 * - Design moderno com gradientes
 * - Animações Framer Motion
 * - Badges de status
 * - Informações completas
 * - Acessibilidade completa
 * 
 * ✅ SSOT: Usa tipo Event do EventsService
 *
 * @version 2.0.0 - SSOT Compliant
 */

import { memo } from "react";
import { Calendar, Clock, Users, ChevronRight, MapPin } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { motion } from "framer-motion";
import type { Event } from "@/core/events";

interface EventCardProps {
  evento: Event;
  index: number;
  onClick: () => void;
}

export const EventCard = memo(function EventCard({
  evento,
  index,
  onClick,
}: EventCardProps) {
  const eventDate = new Date(evento.date);
  const formattedDate = eventDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 5) * 0.05 }}
      onClick={onClick}
      className="bg-card rounded-xl border overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
      role="article"
      aria-label={`Evento: ${evento.title}`}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={evento.image_url || "/placeholder.svg"}
          alt={evento.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-sm font-bold text-white line-clamp-2">
            {evento.title}
          </h3>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
            {evento.status === 'upcoming' ? 'Em breve' : 
             evento.status === 'ongoing' ? 'Acontecendo' : 
             evento.status === 'completed' ? 'Finalizado' : 'Cancelado'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5">
        {/* Info row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>

            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {evento.current_participants}
              {evento.max_participants && `/${evento.max_participants}`}
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Location */}
        {evento.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{evento.location}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});
