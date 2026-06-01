import React, { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Car,
  Package,
  MapPin,
  Clock,
  DollarSign,
  Banknote,
  CreditCard,
  Calendar,
  Users,
  Navigation,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import type { RideType, PaymentMethod } from "@/core/mobility/types";
import { BoardingPointsPanel, type BoardingPoint } from "./BoardingPointsPanel";
import { TrustRideFilter, type TrustPreference } from "./TrustRideFilter";
import { RouteEstimateCard } from "./index";
import type { GeolocationCoordinates } from "@/modules/mobility/hooks/useGeolocation";
import { PAYMENT_METHOD } from "@/shared/types/constants";
import { AddressService } from "@/core/address/services/AddressService";
import { logger } from "@/shared/utils/logger";
import { usePriceEstimate } from "@/core/pricing/hooks/usePriceEstimate";
import type { PriceEstimateRequest } from "@/core/pricing/types";
import { geocodingService } from "@/core/maps/services/MapGeocodingAdapter";
import type { CreateRideRequestData } from "@/modules/mobility/hooks/useMobilidade";

const rideTypeOptions: {
  value: RideType;
  label: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
}[] = [
  { value: "viagem", label: "Viagem", icon: <Car className="h-4 w-4" />, color: "border-primary bg-primary/10 text-primary", desc: "Corrida rápida" },
  { value: "entrega", label: "Entrega", icon: <Package className="h-4 w-4" />, color: "border-warning bg-warning/10 text-warning", desc: "Enviar objetos" },
  { value: "agendada", label: "Agendada", icon: <Calendar className="h-4 w-4" />, color: "border-accent bg-accent/10 text-accent", desc: "Para o futuro" },
  { value: "carona_compartilhada", label: "Compartilhada", icon: <Users className="h-4 w-4" />, color: "border-secondary bg-secondary/10 text-secondary-foreground", desc: "Economize mais" },
];

interface CreateRideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRideRequestData) => void | Promise<void>;
  initialType?: RideType;
}

export function CreateRideModal({ open, onOpenChange, onSubmit, initialType = "viagem" }: CreateRideModalProps) {
  const addressService = new AddressService();

  const [type, setType] = useState<RideType>(initialType);
  const [showPointSelector, setShowPointSelector] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<BoardingPoint | null>(null);

  // Origem
  const [origin, setOrigin] = useState("");
  const [originCoords, setOriginCoords] = useState<GeolocationCoordinates | null>(null);
  const [originLocationId, setOriginLocationId] = useState<string>("");
  const [loadingOriginGps, setLoadingOriginGps] = useState(false);
  const [geocodingOrigin, setGeocodingOrigin] = useState(false);

  // Destino
  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<GeolocationCoordinates | null>(null);
  const [destinationLocationId, setDestinationLocationId] = useState<string>("");
  const [geocodingDestination, setGeocodingDestination] = useState(false);

  // Outros campos
  const [departureTime, setDepartureTime] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHOD.PIX);
  const [observation, setObservation] = useState("");
  const [seats, setSeats] = useState("1");
  const [trustPreference, setTrustPreference] = useState<TrustPreference>("qualquer");
  const [userEditedPrice, setUserEditedPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setType(initialType);
  }, [initialType, open]);

  // Auto-capturar GPS na origem ao abrir o modal
  // Auto-preencher horário para viagens imediatas
  useEffect(() => {
    if (type !== "agendada" && !departureTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      setDepartureTime(now.toISOString().slice(0, 16));
    }
  }, [type, departureTime]);

  // Estimativa de preço
  const priceEstimateRequest: PriceEstimateRequest | null = React.useMemo(() => {
    if (!originCoords || !destinationCoords) return null;
    return {
      mode: type === "entrega" ? "delivery" : "ride",
      origin: { latitude: originCoords.latitude, longitude: originCoords.longitude },
      destination: { latitude: destinationCoords.latitude, longitude: destinationCoords.longitude },
      options: { includeBreakdown: true, applyPeakHours: true },
    };
  }, [originCoords, destinationCoords, type]);

  const { data: priceEstimate } = usePriceEstimate(priceEstimateRequest, { enabled: !!priceEstimateRequest });

  useEffect(() => {
    if (priceEstimate && !userEditedPrice) {
      setSuggestedPrice(priceEstimate.estimatedPrice.toFixed(2));
    }
  }, [priceEstimate, userEditedPrice]);

  useEffect(() => {
    setUserEditedPrice(false);
  }, [originCoords, destinationCoords]);

  // Helper: inferir location_id a partir de geocoding
  const inferLocationId = useCallback(
    (info: ReturnType<typeof geocodingService.extractLocationInfo>): string | undefined => {
      return info.locationId ?? undefined;
    },
    [],
  );

  const resolveTypedAddress = useCallback(
    async (
      text: string,
      kind: "origin" | "destination",
    ): Promise<
      | {
          locationId: string;
          coords: GeolocationCoordinates;
          displayName: string;
        }
      | null
    > => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        return null;
      }

      if (kind === "origin") {
        setGeocodingOrigin(true);
      } else {
        setGeocodingDestination(true);
      }

      try {
        const results = await geocodingService.geocode(trimmedText);
        const bestMatch = results.find((result) => result.locationId) ?? results[0];

        if (!bestMatch) {
          toast.error("Endereço não encontrado. Tente ser mais específico.");
          return null;
        }

        if (!bestMatch.locationId) {
          toast.error("Esse endereço ainda não foi reconciliado com um território atendido.");
          return null;
        }

        const coords = {
          latitude: bestMatch.latitude,
          longitude: bestMatch.longitude,
          accuracy: 0,
        };

        if (kind === "origin") {
          setOrigin(bestMatch.displayName);
          setOriginCoords(coords);
          setOriginLocationId(bestMatch.locationId);
        } else {
          setDestination(bestMatch.displayName);
          setDestinationCoords(coords);
          setDestinationLocationId(bestMatch.locationId);
        }

        return {
          locationId: bestMatch.locationId,
          coords,
          displayName: bestMatch.displayName,
        };
      } catch (error) {
        logger.error("CreateRideModal.resolveTypedAddress", error as Error, {
          kind,
          text: trimmedText,
        });
        toast.error("Não foi possível validar o endereço informado.");
        return null;
      } finally {
        if (kind === "origin") {
          setGeocodingOrigin(false);
        } else {
          setGeocodingDestination(false);
        }
      }
    },
    [],
  );

  // Capturar GPS e geocodificar para origem
  const captureOriginGps = useCallback(async () => {
    setLoadingOriginGps(true);
    try {
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          reject,
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
      setOriginCoords(coords);
      const result = await geocodingService.reverseGeocode(coords.latitude, coords.longitude);
      if (result) {
        setOrigin(geocodingService.formatCompactAddress(result));
        const info = geocodingService.extractLocationInfo(result);
        const locId = inferLocationId(info);
        if (locId) setOriginLocationId(locId);
      }
    } catch {
      // GPS falhou silenciosamente — usuário digita manualmente
    } finally {
      setLoadingOriginGps(false);
    }
  }, [inferLocationId]);

  useEffect(() => {
    if (!open) return;
    if (origin || originCoords) return;
    captureOriginGps();
  }, [open, origin, originCoords, captureOriginGps]);

  // Criar address canônico
  const createAddress = async (
    locationId: string,
    street: string,
    coords: GeolocationCoordinates | null
  ): Promise<string> => {
    const hasCoords = !!(coords?.latitude && coords?.longitude);
    const hasText = street.trim().length > 0;
    const addressType: 'exact' | 'approximate' | 'gps_only' =
      hasCoords && !hasText ? 'gps_only' : 'approximate';

    const addr = await addressService.createAddress({
      location_id: locationId,
      street: addressType !== 'gps_only' ? street : null,
      address_type: addressType,
      latitude: coords?.latitude || null,
      longitude: coords?.longitude || null,
      geocoding_source: hasCoords ? 'gps' : 'manual',
    });
    return addr.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalOrigin = selectedPoint
      ? `${selectedPoint.name} - ${selectedPoint.address}`
      : origin;

    if (!finalOrigin.trim() || !destination.trim()) return;
    if (type === "agendada" && !departureTime) return;

    setSubmitting(true);
    try {
      let resolvedOriginCoords = originCoords;
      let resolvedDestinationCoords = destinationCoords;
      let pickupLocId = originLocationId;
      let dropoffLocId = destinationLocationId;
      const originLookupText = selectedPoint ? selectedPoint.address : finalOrigin;

      if (!resolvedOriginCoords || !pickupLocId) {
        const resolved = await resolveTypedAddress(originLookupText, "origin");
        if (!resolved) {
          return;
        }
        pickupLocId = resolved.locationId;
        resolvedOriginCoords = resolved.coords;
      }

      if (!resolvedDestinationCoords || !dropoffLocId) {
        const resolved = await resolveTypedAddress(destination, "destination");
        if (!resolved) {
          return;
        }
        dropoffLocId = resolved.locationId;
        resolvedDestinationCoords = resolved.coords;
      }

      if (!pickupLocId || !dropoffLocId) {
        toast.error("Origem e destino precisam estar reconciliados com um território atendido.");
        return;
      }

      if (!resolvedOriginCoords || !resolvedDestinationCoords) {
        toast.error("Nao foi possivel validar as coordenadas da rota.");
        return;
      }

      const [pickupAddressId, dropoffAddressId] = await Promise.all([
        createAddress(pickupLocId, finalOrigin, resolvedOriginCoords),
        createAddress(dropoffLocId, destination, resolvedDestinationCoords),
      ]);

      const obs = [
        observation || "",
        trustPreference !== "qualquer"
          ? `[Preferência: ${trustPreference === "verificado" ? "Motorista Verificado" : "Vizinho do Bairro"}]`
          : "",
      ].filter(Boolean).join(" ");

      await onSubmit({
        origin: finalOrigin,
        destination,
        departure_time: new Date(departureTime || Date.now()).toISOString(),
        suggested_price: suggestedPrice ? parseFloat(suggestedPrice) : undefined,
        type,
        payment_method: paymentMethod,
        observation: obs || undefined,
        available_seats: type === "carona_compartilhada" ? parseInt(seats) : undefined,
        origin_lat: resolvedOriginCoords.latitude,
        origin_lng: resolvedOriginCoords.longitude,
        destination_lat: resolvedDestinationCoords.latitude,
        destination_lng: resolvedDestinationCoords.longitude,
        search_radius_km: 5,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocId,
        dropoff_location_id: dropoffLocId,
      });

      // Reset
      setOrigin(""); setDestination(""); setDepartureTime(""); setSuggestedPrice("");
      setObservation(""); setSeats("1"); setSelectedPoint(null);
      setTrustPreference("qualquer"); setOriginCoords(null); setDestinationCoords(null);
      setOriginLocationId(""); setDestinationLocationId(""); setUserEditedPrice(false);
      onOpenChange(false);
    } catch (err: unknown) {
      logger.error("CreateRideModal.handleSubmit", err);
      toast.error(err instanceof Error ? err.message : "Erro ao criar corrida. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOpt = rideTypeOptions.find((o) => o.value === type);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setShowPointSelector(false); }}>
      <DialogContent className="bg-card border-border text-foreground max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {showPointSelector ? "Ponto de embarque" : "Nova solicitação"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">Solicite uma nova corrida</DialogDescription>

        {showPointSelector ? (
          <div className="space-y-4">
            <BoardingPointsPanel
              selectable
              selectedId={selectedPoint?.id}
              onSelect={(point) => { setSelectedPoint(point); setShowPointSelector(false); }}
            />
            <Button variant="ghost" onClick={() => setShowPointSelector(false)} className="w-full text-muted-foreground rounded-xl">
              Voltar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2">
              {rideTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left",
                    type === opt.value ? opt.color : "border-border text-muted-foreground hover:border-border/50",
                  )}
                >
                  {opt.icon}
                  <div>
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[0.55rem] opacity-70">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Banners informativos */}
            {type === "carona_compartilhada" && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-secondary/50 border border-border">
                <Users className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <p>O sistema busca passageiros com destinos próximos para dividir a corrida.</p>
              </div>
            )}
            {type === "agendada" && (
              <div className="flex items-start gap-2 text-xs text-accent p-3 rounded-xl bg-accent/10 border border-accent/20">
                <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <p>Pedido disponível antecipadamente para motoristas. Ideal para aeroporto e consultas.</p>
              </div>
            )}
            {type === "entrega" && (
              <div className="flex items-start gap-2 text-xs text-warning p-3 rounded-xl bg-warning/10 border border-warning/20">
                <Package className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <p>Envie documentos, compras, medicamentos e pequenas encomendas.</p>
              </div>
            )}

            {/* ── ORIGEM ── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                {type === "entrega" ? "Local de retirada" : "Origem"}
              </Label>
              <div className="relative">
                <Input
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    // Limpar coords se usuário editar manualmente
                    if (originCoords) setOriginCoords(null);
                    if (originLocationId) setOriginLocationId("");
                  }}
                  onBlur={() => {
                    if (!selectedPoint && origin.trim() && !originCoords) {
                      void resolveTypedAddress(origin, "origin");
                    }
                  }}
                  placeholder={loadingOriginGps ? "Obtendo localização..." : "Digite o endereço de origem"}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground pr-20"
                  required
                  disabled={loadingOriginGps || geocodingOrigin}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {(loadingOriginGps || geocodingOrigin) && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  {origin && !loadingOriginGps && (
                    <button
                      type="button"
                      onClick={() => { setOrigin(""); setOriginCoords(null); setOriginLocationId(""); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Limpar origem"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={captureOriginGps}
                    disabled={loadingOriginGps}
                    className={cn(
                      "flex items-center gap-1 text-[0.65rem] font-medium px-2 py-1 rounded-lg transition-all",
                      originCoords
                        ? "text-success bg-success/10"
                        : "text-primary bg-primary/10 hover:bg-primary/20"
                    )}
                    aria-label="Usar minha localização"
                  >
                    <Navigation className="h-3 w-3" />
                    {originCoords ? "GPS ativo" : "GPS"}
                  </button>
                </div>
              </div>

              {/* Ponto de embarque (apenas viagem/compartilhada) */}
              {type !== "entrega" && (
                <button
                  type="button"
                  onClick={() => setShowPointSelector(true)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left text-xs",
                    selectedPoint
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-dashed border-border text-muted-foreground hover:border-border/80"
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  {selectedPoint
                    ? <span className="font-medium">{selectedPoint.name} - {selectedPoint.address}</span>
                    : <span>Ou escolher ponto de embarque do bairro</span>
                  }
                  {selectedPoint && (
                    <X
                      className="h-3 w-3 ml-auto flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); setSelectedPoint(null); }}
                    />
                  )}
                </button>
              )}
            </div>

            {/* ── DESTINO ── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-warning flex-shrink-0" />
                {type === "entrega" ? "Destino da entrega" : "Destino"}
              </Label>
              <div className="relative">
                <Input
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    if (destinationCoords) setDestinationCoords(null);
                    if (destinationLocationId) setDestinationLocationId("");
                  }}
                  onBlur={() => {
                    if (destination.trim() && !destinationCoords) {
                      void resolveTypedAddress(destination, "destination");
                    }
                  }}
                  placeholder="Para onde você vai?"
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground pr-8"
                  required
                  disabled={geocodingDestination}
                />
                {destination && (
                  <button
                    type="button"
                    onClick={() => { setDestination(""); setDestinationCoords(null); setDestinationLocationId(""); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpar destino"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {geocodingDestination && (
                  <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Estimativa de rota */}
            {priceEstimate && originCoords && destinationCoords && (
              <div className="space-y-1">
                <RouteEstimateCard
                  estimate={{
                    distance: priceEstimate.metadata.distanceKm,
                    duration: priceEstimate.metadata.durationMinutes,
                    price: priceEstimate.estimatedPrice,
                    eta: `${priceEstimate.metadata.durationMinutes} min`,
                    fare: {
                      base: priceEstimate.breakdown?.baseFare || 0,
                      distance: priceEstimate.breakdown?.distanceFare || 0,
                      time: priceEstimate.breakdown?.timeFare || 0,
                      total: priceEstimate.estimatedPrice,
                      formatted: `R$ ${priceEstimate.estimatedPrice.toFixed(2)}`,
                    },
                  }}
                  variant="compact"
                />
                {priceEstimate.metadata.peakHourMultiplier > 1 && (
                  <p className="flex items-center gap-1 text-[0.6rem] text-warning">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    Horário de pico ({priceEstimate.metadata.peakHourMultiplier}x)
                  </p>
                )}
              </div>
            )}

            {/* Horário (apenas agendada) */}
            {type === "agendada" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Data e hora
                </Label>
                <Input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground"
                  required
                />
              </div>
            )}

            {/* Valor */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Valor sugerido {priceEstimate && <span className="text-success">(calculado)</span>}
              </Label>
              <Input
                type="number"
                min="1"
                step="0.5"
                value={suggestedPrice}
                onChange={(e) => { setSuggestedPrice(e.target.value); setUserEditedPrice(true); }}
                placeholder="R$ 0,00 (opcional)"
                className="bg-secondary/50 border-border text-foreground"
              />
            </div>

            {/* Vagas (compartilhada) */}
            {type === "carona_compartilhada" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 text-accent" /> Vagas para compartilhar
                </Label>
                <Input
                  type="number" min="1" max="4" value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground"
                />
              </div>
            )}

            {/* Pagamento */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PAYMENT_METHOD.PIX)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all text-xs font-medium",
                    paymentMethod === PAYMENT_METHOD.PIX ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Pix
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PAYMENT_METHOD.DINHEIRO as unknown as PaymentMethod)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-all text-xs font-medium",
                    String(paymentMethod) === PAYMENT_METHOD.DINHEIRO ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground",
                  )}
                >
                  <Banknote className="h-3.5 w-3.5" /> Dinheiro
                </button>
              </div>
            </div>

            {/* Filtro de confiança */}
            {type !== "entrega" && (
              <TrustRideFilter value={trustPreference} onChange={setTrustPreference} />
            )}

            {/* Observação */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {type === "entrega" ? "Descrição do objeto (obrigatório)" : "Observação (opcional)"}
              </Label>
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder={type === "entrega" ? "Ex: remédio, documento, bolsa" : "Alguma informação adicional..."}
                className="bg-secondary/50 border-border text-foreground resize-none h-16"
                maxLength={200}
                required={type === "entrega"}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full text-primary-foreground font-semibold rounded-xl h-11 shadow-lg",
                type === "viagem" && "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-primary/20",
                type === "entrega" && "bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 shadow-warning/20",
                type === "agendada" && "bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-accent/20",
                type === "carona_compartilhada" && "bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 shadow-secondary/20",
              )}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedOpt?.icon}
              <span className="ml-2">{submitting ? "Solicitando..." : `Solicitar ${selectedOpt?.label}`}</span>
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

