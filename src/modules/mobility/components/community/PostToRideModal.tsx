import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Car,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  ArrowRight,
  Share2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type {
  CommunityRideIntent,
  CommunityRidePostData,
} from "./CommunityRidePost";

const SUGGESTED_MESSAGES = {
  offering: [
    "Vou ao mercado às 18h, alguém precisa de carona?",
    "Indo para o centro amanhã cedo, posso levar alguém!",
    "Saindo agora do bairro, tenho 2 vagas disponíveis.",
    "Vou buscar as crianças na escola às 17h, tem mais alguém?",
  ],
  requesting: [
    "Preciso de carona para o hospital às 8h, alguém pode me ajudar?",
    "Alguém vai ao centro hoje? Preciso de carona!",
    "Perdeu o ônibus, preciso chegar no trabalho urgente.",
    "Preciso levar compras do mercado, alguém tem carro?",
  ],
};

interface PostToRideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (
    data: Omit<
      CommunityRidePostData,
      | "id"
      | "authorName"
      | "authorAvatar"
      | "createdAt"
      | "interestedCount"
      | "hasJoined"
    >,
  ) => void;
  authorName?: string;
  authorNeighborhood?: string;
  isVerified?: boolean;
}

export function PostToRideModal({
  open,
  onOpenChange,
  onPublish,
  authorName,
  authorNeighborhood,
  isVerified = false,
}: PostToRideModalProps) {
  const [intent, setIntent] = useState<CommunityRideIntent>("offering");
  const [content, setContent] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("");
  const [rideType, setRideType] = useState<"viagem" | "carona_compartilhada">(
    "carona_compartilhada",
  );
  const [shareToFeed, setShareToFeed] = useState(true);

  const reset = () => {
    setContent("");
    setOrigin("");
    setDestination("");
    setDepartureTime("");
    setSeats("1");
    setPrice("");
    setIntent("offering");
    setRideType("carona_compartilhada");
    setShareToFeed(true);
  };

  const handleSuggestedMessage = (msg: string) => setContent(msg);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !destination) return;
    onPublish({
      content: content.trim(),
      intent,
      origin: origin || undefined,
      destination,
      departureTime: departureTime
        ? new Date(departureTime).toISOString()
        : undefined,
      seatsAvailable: intent === "offering" ? parseInt(seats) : undefined,
      rideType,
      price: price ? parseFloat(price) : undefined,
      authorNeighborhood: authorNeighborhood || "Comunidade local",
      isVerified,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="bg-[#1E2529] border-white/10 text-white max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="h-5 w-5 text-teal-400" />
            Publicar no Feed da Comunidade
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">
            Sua postagem aparecerá no feed do bairro e gerará uma solicitação de
            mobilidade.
          </p>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Compartilhe esta corrida na comunidade
        </DialogDescription>

        <form onSubmit={handlePublish} className="space-y-4">
          {/* Intent toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">Você está…</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIntent("offering")}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                  intent === "offering"
                    ? "border-teal-400 bg-teal-400/10"
                    : "border-white/10 hover:border-white/20",
                )}
              >
                <Car
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    intent === "offering" ? "text-teal-400" : "text-gray-500",
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      intent === "offering" ? "text-teal-400" : "text-gray-400",
                    )}
                  >
                    Oferecendo Carona
                  </p>
                  <p className="text-[0.55rem] text-gray-500">
                    Tenho vaga no carro
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIntent("requesting")}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                  intent === "requesting"
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-white/10 hover:border-white/20",
                )}
              >
                <Users
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    intent === "requesting"
                      ? "text-amber-400"
                      : "text-gray-500",
                  )}
                />
                <div>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      intent === "requesting"
                        ? "text-amber-400"
                        : "text-gray-400",
                    )}
                  >
                    Precisando de Carona
                  </p>
                  <p className="text-[0.55rem] text-gray-500">
                    Preciso de uma viagem
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Suggested messages */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              Sugestões rápidas
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_MESSAGES[intent].map((msg, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestedMessage(msg)}
                  className="text-[0.6rem] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:border-teal-400/50 hover:text-teal-400 transition-all bg-white/[0.02] hover:bg-teal-500/5 text-left"
                >
                  {msg.length > 40 ? msg.slice(0, 40) + "…" : msg}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400">
              Sua mensagem para a comunidade *
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                intent === "offering"
                  ? "Ex: Vou ao mercado às 18h, alguém precisa de carona?"
                  : "Ex: Preciso chegar ao hospital às 9h, alguém pode me ajudar?"
              }
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none h-20"
              maxLength={280}
              required
            />
            <p className="text-[0.6rem] text-gray-600 text-right">
              {content.length}/280
            </p>
          </div>

          {/* Route */}
          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                Origem
              </Label>
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="De onde?"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-xs"
              />
            </div>
            <ArrowRight className="h-4 w-4 text-gray-600 mb-2.5" />
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5 text-amber-400" />
                Destino *
              </Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Para onde?"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-xs"
                required
              />
            </div>
          </div>

          {/* Time & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horário
              </Label>
              <Input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {intent === "offering" ? "Valor (R$)" : "Valor máx. (R$)"}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-xs"
              />
            </div>
          </div>

          {/* Seats (only for offering) */}
          {intent === "offering" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="h-3 w-3 text-teal-400" />
                Vagas disponíveis
              </Label>
              <div className="flex gap-2">
                {["1", "2", "3", "4"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeats(n)}
                    className={cn(
                      "flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                      seats === n
                        ? "border-teal-400 bg-teal-400/10 text-teal-400"
                        : "border-white/10 text-gray-500 hover:border-white/20",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Share to community toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <Share2 className="h-4 w-4 text-teal-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-white">
                Publicar no Feed do Bairro
              </p>
              <p className="text-[0.6rem] text-gray-500">
                Vizinhos verão sua postagem no feed da comunidade
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShareToFeed((p) => !p)}
              className={cn(
                "w-10 h-5.5 rounded-full transition-all relative flex-shrink-0",
                shareToFeed ? "bg-teal-500" : "bg-white/10",
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                  shareToFeed ? "left-[calc(100%-1.125rem)]" : "left-0.5",
                )}
              />
            </button>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full text-white font-semibold rounded-xl h-11 shadow-lg transition-all",
              intent === "offering"
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 shadow-teal-500/20"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20",
            )}
          >
            {intent === "offering" ? (
              <Car className="h-4 w-4 mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Publicar no Bairro
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
