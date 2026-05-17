/**
 * 📅 EVENTO DETAIL PAGE - REFATORADA PARA SSOT
 * 
 * Página de detalhes de um evento específico
 * 
 * ✅ SSOT: Usa EventsService ao invés de Supabase direto
 * ✅ Type-safe com interface Event do service
 * ✅ Segue arquitetura oficial
 * 
 * @version 2.0.0 - SSOT Compliant
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EventsService, type Event } from "@/core/community/services/CommunityEventsRuntimeService";

export default function EventoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // ✅ SSOT: Usa EventsService ao invés de Supabase direto
      const data = await EventsService.getEventById(id);

      if (data) {
        setEvento(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col">
        <Skeleton className="h-56 w-full" />
        <div className="px-4 mt-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </div>
      </div>
    );

  if (notFound || !evento)
    return <div className="p-4">Evento não encontrado.</div>;

  return (
    <div className="flex flex-col">
      <div className="relative h-56">
        {evento.image_url ? (
          <img
            src={evento.image_url}
            alt={evento.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center text-5xl">
            🎉
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-1.5 mb-2">
            <Badge className="capitalize bg-card/20 backdrop-blur text-white border-white/20 text-[10px]">
              {evento.category}
            </Badge>
            <Badge className="bg-primary text-primary-foreground text-[10px]">
              {evento.status === 'upcoming' ? 'Em breve' : 
               evento.status === 'ongoing' ? 'Acontecendo' : 
               evento.status === 'completed' ? 'Finalizado' : 'Cancelado'}
            </Badge>
          </div>
          <h1 className="text-xl font-bold font-display text-white">
            {evento.title}
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Data</p>
              <p className="text-xs font-semibold">
                {new Date(evento.date).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Horário</p>
              <p className="text-xs font-semibold">
                {new Date(evento.date).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Local</p>
              <p className="text-xs font-semibold">{evento.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Participantes</p>
              <p className="text-xs font-semibold">
                {confirmado
                  ? evento.current_participants + 1
                  : evento.current_participants}
                {evento.max_participants && `/${evento.max_participants}`}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold font-display mb-2">
            Sobre o evento
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {evento.description}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            className={`flex-1 ${confirmado ? "bg-success hover:bg-success/90" : ""}`}
            onClick={() => setConfirmado(!confirmado)}
          >
            {confirmado ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Presença confirmada
              </>
            ) : (
              "Confirmar presença"
            )}
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

