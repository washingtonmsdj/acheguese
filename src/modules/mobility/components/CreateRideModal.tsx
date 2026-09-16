import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  MapPin,
  Clock,
  Banknote,
  CreditCard,
  Calendar,
  Users,
  Navigation,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import type { PaymentMethod } from "@/core/mobility/types";
import { BoardingPointsPanel, type BoardingPoint } from "./BoardingPointsPanel";
import { TrustRideFilter, type TrustPreference } from "./TrustRideFilter";
import type { GeolocationCoordinates } from "@/modules/mobility/hooks/useGeolocation";
import { PAYMENT_METHOD } from "@/shared/types/constants";
import { AddressService } from "@/core/address/services/AddressService";
import { logger } from "@/shared/utils/logger";
import { geocodingService } from "@/core/maps/services/MapGeocodingAdapter";
import type { CreateRideRequestData } from "@/modules/mobility/hooks/useMobilidade";
import { GEOLOCATION_RUNTIME } from "@/shared/config/geolocation";
import { GeolocationService } from "@/shared/services/GeolocationService";

type RideRequestType = CreateRideRequestData["type"];

const rideTypeOptions: {
  value: RideRequestType;
  label: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
}[] = [
  {
    value: "viagem",
    label: "Viagem",
    icon: <Car className="h-4 w-4" />,
    color: "border-primary bg-primary/10 text-primary",
    desc: "Corrida rápida",
  },
  {
    value: "agendada",
    label: "Agendada",
    icon: <Calendar className="h-4 w-4" />,
    color: "border-accent bg-accent/10 text-accent",
    desc: "Para o futuro",
  },
  {
    value: "carona_compartilhada",
    label: "Compartilhada",
    icon: <Users className="h-4 w-4" />,
    color: "border-secondary bg-secondary/10 text-secondary-foreground",
    desc: "Compartilhe a viagem",
  },
];

interface CreateRideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRideRequestData) => void | Promise<void>;
  initialType?: RideRequestType;
}

export function CreateRideModal({
  open,
  onOpenChange,
  onSubmit,
  initialType = "viagem",
}: CreateRideModalProps) {
  const addressService = useMemo(() => new AddressService(), []);
  const [type, setType] = useState<RideRequestType>(initialType);
  const [showPointSelector, setShowPointSelector] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<BoardingPoint | null>(null);

  const [origin, setOrigin] = useState("");
  const [originCoords, setOriginCoords] = useState<GeolocationCoordinates | null>(null);
  const [originLocationId, setOriginLocationId] = useState("");
  const [loadingOriginGps, setLoadingOriginGps] = useState(false);
  const [geocodingOrigin, setGeocodingOrigin] = useState(false);

  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<GeolocationCoordinates | null>(null);
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [geocodingDestination, setGeocodingDestination] = useState(false);

  const [departureTime, setDepartureTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHOD.PIX);
  const [observation, setObservation] = useState("");
  const [seats, setSeats] = useState("1");
  const [trustPreference, setTrustPreference] = useState<TrustPreference>("qualquer");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setType(initialType);
  }, [initialType, open]);

  useEffect(() => {
    if (type !== "agendada" && !departureTime) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      setDepartureTime(now.toISOString().slice(0, 16));
    }
  }, [type, departureTime]);

  const inferLocationId = useCallback(
    (info: ReturnType<typeof geocodingService.extractLocationInfo>): string | undefined =>
      info.locationId ?? undefined,
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
      if (!trimmedText) return null;

      if (kind === "origin") setGeocodingOrigin(true);
      else setGeocodingDestination(true);

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

        const coords: GeolocationCoordinates = {
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
        if (kind === "origin") setGeocodingOrigin(false);
        else setGeocodingDestination(false);
      }
    },
    [],
  );

  const captureOriginGps = useCallback(async () => {
    setLoadingOriginGps(true);
    try {
      const result = await GeolocationService.getCurrentLocation({
        useCache: false,
        forcePrompt: true,
        allowIpFallback: false,
        gpsMode: "precise",
        timeout: GEOLOCATION_RUNTIME.requestTimeoutMs,
        maxRetries: 1,
      });
      const coords: GeolocationCoordinates = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
      };
      setOriginCoords(coords);

      const reverseResult = await geocodingService.reverseGeocode(
        coords.latitude,
        coords.longitude,
      );
      if (reverseResult) {
        setOrigin(geocodingService.formatCompactAddress(reverseResult));
        const locationId = inferLocationId(
          geocodingService.extractLocationInfo(reverseResult),
        );
        if (locationId) setOriginLocationId(locationId);
      }
    } catch (error) {
      logger.debug("CreateRideModal.captureOriginGps", error);
    } finally {
      setLoadingOriginGps(false);
    }
  }, [inferLocationId]);

  useEffect(() => {
    if (!open || origin || originCoords) return;
    void captureOriginGps();
  }, [open, origin, originCoords, captureOriginGps]);

  const createAddress = useCallback(
    async (
      locationId: string,
      street: string,
      coords: GeolocationCoordinates,
    ): Promise<string> => {
      const hasText = street.trim().length > 0;
      const address = await addressService.createAddress({
        location_id: locationId,
        street: hasText ? street : null,
        address_type: hasText ? "approximate" : "gps_only",
        latitude: coords.latitude,
        longitude: coords.longitude,
        geocoding_source: "gps",
      });
      return address.id;
    },
    [addressService],
  );

  const resetForm = useCallback(() => {
    setOrigin("");
    setDestination("");
    setDepartureTime("");
    setObservation("");
    setSeats("1");
    setSelectedPoint(null);
    setTrustPreference("qualquer");
    setOriginCoords(null);
    setDestinationCoords(null);
    setOriginLocationId("");
    setDestinationLocationId("");
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const finalOrigin = selectedPoint
      ? `${selectedPoint.name} - ${selectedPoint.address}`
      : origin;

    if (!finalOrigin.trim() || !destination.trim()) return;
    if (type === "agendada" && !departureTime) return;

    setSubmitting(true);
    try {
      let resolvedOriginCoords = originCoords;
      let resolvedDestinationCoords = destinationCoords;
      let pickupLocationId = originLocationId;
      let dropoffLocationId = destinationLocationId;
      const originLookupText = selectedPoint ? selectedPoint.address : finalOrigin;

      if (!resolvedOriginCoords || !pickupLocationId) {
        const resolved = await resolveTypedAddress(originLookupText, "origin");
        if (!resolved) return;
        pickupLocationId = resolved.locationId;
        resolvedOriginCoords = resolved.coords;
      }

      if (!resolvedDestinationCoords || !dropoffLocationId) {
        const resolved = await resolveTypedAddress(destination, "destination");
        if (!resolved) return;
        dropoffLocationId = resolved.locationId;
        resolvedDestinationCoords = resolved.coords;
      }

      const [pickupAddressId, dropoffAddressId] = await Promise.all([
        createAddress(pickupLocationId, finalOrigin, resolvedOriginCoords),
        createAddress(dropoffLocationId, destination, resolvedDestinationCoords),
      ]);

      const combinedObservation = [
        observation.trim(),
        trustPreference !== "qualquer"
          ? `[Preferência: ${trustPreference === "verificado" ? "Motorista Verificado" : "Vizinho do Bairro"}]`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      await onSubmit({
        origin: finalOrigin,
        destination,
        departure_time: new Date(departureTime || Date.now()).toISOString(),
        type,
        payment_method: paymentMethod,
        observation: combinedObservation || undefined,
        available_seats:
          type === "carona_compartilhada" ? Number.parseInt(seats, 10) : undefined,
        origin_lat: resolvedOriginCoords.latitude,
        origin_lng: resolvedOriginCoords.longitude,
        destination_lat: resolvedDestinationCoords.latitude,
        destination_lng: resolvedDestinationCoords.longitude,
        search_radius_km: 5,
        pickup_address_id: pickupAddressId,
        dropoff_address_id: dropoffAddressId,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      logger.error("CreateRideModal.handleSubmit", error as Error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao criar corrida. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setShowPointSelector(false);
      }}
    >
      <DialogContent className="bg-card border-border text-foreground max-w-md max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {showPointSelector ? "Ponto de embarque" : "Nova corrida"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Solicite uma corrida usando endereços reconciliados. O preço comercial é definido somente pela cotação oficial do servidor.
        </DialogDescription>

        {showPointSelector ? (
          <div className="space-y-4">
            <BoardingPointsPanel
              selectable
              selectedId={selectedPoint?.id}
              onSelect={(point) => {
                setSelectedPoint(point);
                setShowPointSelector(false);
              }}
            />
            <Button
              variant="ghost"
              onClick={() => setShowPointSelector(false)}
              className="w-full text-muted-foreground rounded-xl"
            >
              Voltar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {rideTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={cn(
                    "flex flex-col gap-1.5 p-2.5 rounded-xl border-2 transition-all text-left",
                    type === option.value
                      ? option.color
                      : "border-border text-muted-foreground hover:border-border/50",
                  )}
                >
                  {option.icon}
                  <div>
                    <p className="text-xs font-semibold">{option.label}</p>
                    <p className="text-[0.55rem] opacity-70">{option.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {type === "carona_compartilhada" && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-secondary/50 border border-border">
                <Users className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <p>O sistema busca passageiros com destinos próximos para compartilhar a viagem.</p>
              </div>
            )}

            {type === "agendada" && (
              <div className="flex items-start gap-2 text-xs text-accent p-3 rounded-xl bg-accent/10 border border-accent/20">
                <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <p>Pedido disponível antecipadamente para motoristas.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" /> Origem
              </Label>
              <div className="relative">
                <Input
                  value={origin}
                  onChange={(event) => {
                    setOrigin(event.target.value);
                    setOriginCoords(null);
                    setOriginLocationId("");
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
                  {(loadingOriginGps || geocodingOrigin) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                  {origin && !loadingOriginGps && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrigin("");
                        setOriginCoords(null);
                        setOriginLocationId("");
                      }}
                      className="text-muted-foreground hover:text-foreground"
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
                        : "text-primary bg-primary/10 hover:bg-primary/20",
                    )}
                    aria-label="Usar minha localização"
                  >
                    <Navigation className="h-3 w-3" />
                    {originCoords ? "GPS ativo" : "GPS"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPointSelector(true)}
                className={cn(
                  "w-full flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left text-xs",
                  selectedPoint
                    ? "border-warning/40 bg-warning/10 text-warning"
                    : "border-dashed border-border text-muted-foreground hover:border-border/80",
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {selectedPoint ? (
                  <span className="font-medium">
                    {selectedPoint.name} - {selectedPoint.address}
                  </span>
                ) : (
                  <span>Ou escolher ponto de embarque do bairro</span>
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-warning" /> Destino
              </Label>
              <div className="relative">
                <Input
                  value={destination}
                  onChange={(event) => {
                    setDestination(event.target.value);
                    setDestinationCoords(null);
                    setDestinationLocationId("");
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
                {geocodingDestination && (
                  <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                {destination && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestination("");
                      setDestinationCoords(null);
                      setDestinationLocationId("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Limpar destino"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
              O valor da corrida não é digitado pelo passageiro. A cotação oficial é calculada e validada pelo servidor no momento da solicitação.
            </div>

            {type === "agendada" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Data e hora
                </Label>
                <Input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(event) => setDepartureTime(event.target.value)}
                  className="bg-secondary/50 border-border text-foreground"
                  required
                />
              </div>
            )}

            {type === "carona_compartilhada" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 text-accent" /> Vagas para compartilhar
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={seats}
                  onChange={(event) => setSeats(event.target.value)}
                  className="bg-secondary/50 border-border text-foreground"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PAYMENT_METHOD.PIX)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-medium",
                    paymentMethod === PAYMENT_METHOD.PIX
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Pix
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(PAYMENT_METHOD.DINHEIRO as unknown as PaymentMethod)
                  }
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-medium",
                    String(paymentMethod) === PAYMENT_METHOD.DINHEIRO
                      ? "border-success bg-success/10 text-success"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Banknote className="h-3.5 w-3.5" /> Dinheiro
                </button>
              </div>
            </div>

            <TrustRideFilter value={trustPreference} onChange={setTrustPreference} />

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observação</Label>
              <Textarea
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                placeholder="Informações úteis para o motorista"
                className="bg-secondary/50 border-border min-h-20"
                maxLength={1000}
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || geocodingOrigin || geocodingDestination}
              className="w-full rounded-xl"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Car className="mr-2 h-4 w-4" />
              )}
              Solicitar corrida
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
