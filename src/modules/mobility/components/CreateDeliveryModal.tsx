/**
 * CreateDeliveryModal - modal de solicitacao de motoboy.
 *
 * Regras SSOT:
 * - Enderecos precisam ser reconciliados com location_id valido.
 * - Sem location_id reconciliado nao envia solicitacao.
 *
 * Compatibilidade:
 * - API nova: open/onOpenChange/onSubmit/defaultPickup
 * - API legada: isOpen/onClose/sourceType/sourceId
 */

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
  Package,
  User,
  Phone,
  FileText,
  Loader2,
  X,
  Navigation,
  Banknote,
  CreditCard,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { usePriceEstimate } from "@/core/pricing/hooks/usePriceEstimate";
import { AddressService } from "@/core/address/services/AddressService";
import { geocodingService } from "@/core/maps/services/GeocodingService";
import { logger } from "@/shared/utils/logger";
import type { CreateDeliveryData } from "../hooks/useDelivery";
import { useDelivery } from "../hooks/useDelivery";
import { useLocationContext } from "@/core/location";
import type { SourceType, PackageSize } from "../constants";
import { MotoboySourceResolverService } from "../services/MotoboySourceResolverService";

interface PickupPoint {
  addressId?: string;
  locationId: string;
  lat: number;
  lng: number;
  label: string;
}

interface CreateDeliveryModalProps {
  // API nova (controlada)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: CreateDeliveryData) => Promise<{ success: boolean; error?: string }>;
  defaultPickup?: PickupPoint;
  isSubmitting?: boolean;

  // API legada (compat)
  isOpen?: boolean;
  onClose?: () => void;
  businessName?: string;

  // Comum
  sourceType: SourceType;
  sourceId?: string;
}

const packageSizeOptions: { value: PackageSize; label: string; desc: string }[] = [
  { value: "small", label: "Pequeno", desc: "Envelope, documento" },
  { value: "medium", label: "Medio", desc: "Sacola, caixa pequena" },
  { value: "large", label: "Grande", desc: "Caixa grande" },
];

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractCoordsFromMetadata(metadata: Record<string, unknown> | null | undefined): {
  lat: number | null;
  lng: number | null;
} {
  if (!metadata) return { lat: null, lng: null };

  const lat =
    toNumber(metadata.center_latitude) ??
    toNumber(metadata.center_lat) ??
    toNumber(metadata.latitude) ??
    toNumber(metadata.canonical_lat);

  const lng =
    toNumber(metadata.center_longitude) ??
    toNumber(metadata.center_lng) ??
    toNumber(metadata.longitude) ??
    toNumber(metadata.canonical_lng);

  return { lat, lng };
}


export function CreateDeliveryModal({
  open,
  onOpenChange,
  onSubmit,
  defaultPickup,
  isSubmitting = false,
  isOpen,
  onClose,
  businessName,
  sourceType,
  sourceId,
}: CreateDeliveryModalProps) {
  const addressService = useMemo(() => new AddressService(), []);
  const { activeLocation } = useLocationContext();

  const { createDelivery: fallbackCreateDelivery, isSubmitting: fallbackSubmitting } = useDelivery(
    sourceType,
    sourceId,
  );

  const modalOpen = typeof open === "boolean" ? open : Boolean(isOpen);

  const closeModal = useCallback(() => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  }, [onClose, onOpenChange]);

  const setModalOpen = useCallback(
    (nextOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(nextOpen);
      }
      if (!nextOpen && onClose) {
        onClose();
      }
    },
    [onClose, onOpenChange],
  );

  const submitDelivery = onSubmit ?? fallbackCreateDelivery;

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [dropoffText, setDropoffText] = useState("");
  const [dropoffCoords, setDropoffCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [loadingDropoffGps, setLoadingDropoffGps] = useState(false);
  const [geocodingDropoff, setGeocodingDropoff] = useState(false);

  const [packageSize, setPackageSize] = useState<PackageSize>("small");
  const [packageDescription, setPackageDescription] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro">("pix");

  const [submitting, setSubmitting] = useState(false);
  const [resolvingPickup, setResolvingPickup] = useState(false);
  const [resolvedPickup, setResolvedPickup] = useState<PickupPoint | null>(null);

  const effectivePickup = defaultPickup ?? resolvedPickup;

  const canEstimate = !!effectivePickup && !!dropoffCoords;
  const { data: priceEstimate } = usePriceEstimate(
    canEstimate
      ? {
          mode: "motoboy",
          origin: { latitude: effectivePickup.lat, longitude: effectivePickup.lng },
          destination: dropoffCoords!,
          options: { includeBreakdown: false },
        }
      : null,
  );

  const resolvePickupPoint = useCallback(async () => {
    if (defaultPickup) {
      setResolvedPickup(defaultPickup);
      return;
    }

    setResolvingPickup(true);

    try {
      let locationId: string | null = activeLocation?.id ?? null;
      let pickupLabel = businessName?.trim() || "";

      if (sourceId) {
        const sourceProfile = await MotoboySourceResolverService.getProfileSummaryById(sourceId);

        if (sourceProfile) {
          locationId = sourceProfile.location_id ?? locationId;
          if (!pickupLabel) {
            const parts = [sourceProfile.name, sourceProfile.neighborhood, sourceProfile.city].filter(Boolean);
            pickupLabel = parts.join(" - ");
          }
        } else {
          const sourceBusiness = await MotoboySourceResolverService.getBusinessDataFromSource(sourceId);
          if (sourceBusiness) {
            locationId = sourceBusiness.location_id ?? locationId;
            if (!pickupLabel) {
              const parts = [sourceBusiness.business_name, sourceBusiness.business_city].filter(Boolean);
              pickupLabel = parts.join(" - ");
            }
          }
        }
      }

      if (!locationId) {
        setResolvedPickup(null);
        return;
      }

      const locationData = await MotoboySourceResolverService.getLocationSummaryById(locationId);

      let lat: number | null = null;
      let lng: number | null = null;

      if (locationData?.metadata) {
        const extracted = extractCoordsFromMetadata(locationData.metadata as Record<string, unknown>);
        lat = extracted.lat;
        lng = extracted.lng;
      }

      if ((lat === null || lng === null) && activeLocation?.id === locationId) {
        const extractedActive = extractCoordsFromMetadata((activeLocation.metadata || {}) as Record<string, unknown>);
        lat = extractedActive.lat;
        lng = extractedActive.lng;
      }

      if (lat === null || lng === null) {
        const geocodeTarget = locationData?.full_name || locationData?.name || pickupLabel;
        if (geocodeTarget) {
          const geocoded = await geocodingService.geocode(geocodeTarget);
          if (geocoded.length > 0) {
            lat = geocoded[0].latitude;
            lng = geocoded[0].longitude;
          }
        }
      }

      if (lat === null || lng === null) {
        setResolvedPickup(null);
        return;
      }

      setResolvedPickup({
        locationId,
        lat,
        lng,
        label: pickupLabel || locationData?.name || "Ponto de coleta",
      });
    } catch (error) {
      logger.error("CreateDeliveryModal.resolvePickupPoint", error as Error);
      setResolvedPickup(null);
    } finally {
      setResolvingPickup(false);
    }
  }, [activeLocation, businessName, defaultPickup, sourceId]);

  useEffect(() => {
    if (!modalOpen) return;
    if (defaultPickup) {
      setResolvedPickup(defaultPickup);
      return;
    }
    if (resolvedPickup) return;
    void resolvePickupPoint();
  }, [defaultPickup, modalOpen, resolvePickupPoint, resolvedPickup]);

  const resolveDropoffByText = async (text: string) => {
    if (!text.trim()) return;

    setGeocodingDropoff(true);
    try {
      const results = await geocodingService.geocode(text);
      if (!results || results.length === 0) {
        toast.error("Endereco nao encontrado. Tente ser mais especifico.");
        return;
      }

      const bestMatch = results.find((result) => result.locationId) ?? results[0];
      setDropoffText(bestMatch.displayName);
      setDropoffCoords({ latitude: bestMatch.latitude, longitude: bestMatch.longitude });

      const info = geocodingService.extractLocationInfo(bestMatch);
      const locationId = info.locationId ?? "";
      setDropoffLocationId(locationId);

      if (!locationId) {
        toast.error("Endereco fora da cobertura territorial atendida.");
      }
    } catch (err) {
      logger.warn("CreateDeliveryModal.resolveDropoffByText", err);
      toast.error("Falha ao validar endereco de entrega.");
    } finally {
      setGeocodingDropoff(false);
    }
  };

  const captureDropoffGps = async () => {
    setLoadingDropoffGps(true);
    try {
      const coords = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        }),
      );

      const latitude = coords.coords.latitude;
      const longitude = coords.coords.longitude;

      setDropoffCoords({ latitude, longitude });

      const result = await geocodingService.reverseGeocode(latitude, longitude);
      if (!result) {
        toast.error("Nao foi possivel resolver endereco para a localizacao atual.");
        setDropoffLocationId("");
        return;
      }

      setDropoffText(geocodingService.formatCompactAddress(result));

      const info = geocodingService.extractLocationInfo(result);
      const locationId = info.locationId ?? "";
      setDropoffLocationId(locationId);

      if (!locationId) {
        toast.error("Localizacao fora da cobertura territorial atendida.");
      }
    } catch {
      toast.error("Nao foi possivel obter sua localizacao.");
      setDropoffLocationId("");
    } finally {
      setLoadingDropoffGps(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectivePickup) {
      toast.error("Nao foi possivel resolver o endereco de coleta. Verifique o perfil e o territorio ativo.");
      return;
    }

    if (!recipientName.trim()) {
      toast.error("Nome do destinatario e obrigatorio.");
      return;
    }

    if (!dropoffCoords) {
      toast.error("Geocodifique o endereco de entrega antes de continuar.");
      return;
    }

    if (!dropoffLocationId) {
      toast.error("Esse endereco ainda nao foi reconciliado com o territorio atendido.");
      return;
    }

    setSubmitting(true);
    try {
      let pickupAddressId = effectivePickup.addressId;

      if (!pickupAddressId) {
        const pickupAddr = await addressService.createAddress({
          location_id: effectivePickup.locationId,
          street: effectivePickup.label,
          address_type: "approximate",
          latitude: effectivePickup.lat,
          longitude: effectivePickup.lng,
          geocoding_source: "manual",
        });
        pickupAddressId = pickupAddr.id;
      }

      const dropoffAddr = await addressService.createAddress({
        location_id: dropoffLocationId,
        street: dropoffText.trim() || null,
        address_type: "approximate",
        latitude: dropoffCoords.latitude,
        longitude: dropoffCoords.longitude,
        geocoding_source: "manual",
      });

      const data: CreateDeliveryData = {
        pickupAddressId,
        dropoffAddressId: dropoffAddr.id,
        pickupLocationId: effectivePickup.locationId,
        dropoffLocationId,
        originLat: effectivePickup.lat,
        originLng: effectivePickup.lng,
        destinationLat: dropoffCoords.latitude,
        destinationLng: dropoffCoords.longitude,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
        packageSize,
        packageDescription: packageDescription.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        sourceType,
        sourceId,
        paymentMethod,
      };

      const result = await submitDelivery(data);
      if (result.success) {
        setModalOpen(false);
        resetForm();
      }
    } catch (err: unknown) {
      logger.error("CreateDeliveryModal.handleSubmit", err);
      toast.error(err instanceof Error ? err.message : "Erro ao solicitar entrega.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRecipientName("");
    setRecipientPhone("");
    setDropoffText("");
    setDropoffCoords(null);
    setDropoffLocationId("");
    setPackageSize("small");
    setPackageDescription("");
    setDeliveryNotes("");
    setPaymentMethod("pix");
  };

  const busy = isSubmitting || fallbackSubmitting || submitting || resolvingPickup;
  const isValid = !!effectivePickup && recipientName.trim().length > 0 && !!dropoffCoords && !!dropoffLocationId;

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Solicitar Motoboy
          </DialogTitle>
          <DialogDescription>
            O motoboy mais proximo sera acionado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {effectivePickup ? (
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Coleta
              </div>
              <p className="text-sm font-medium text-foreground">{effectivePickup.label}</p>
              <p className="text-[0.65rem] text-muted-foreground">
                {effectivePickup.lat.toFixed(5)}, {effectivePickup.lng.toFixed(5)}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive space-y-2">
              <div className="text-xs font-medium">Coleta nao configurada.</div>
              <div className="text-xs">
                Nao foi possivel resolver automaticamente o ponto de coleta para esse perfil.
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void resolvePickupPoint()}
                disabled={resolvingPickup}
                className="h-7 text-xs"
              >
                {resolvingPickup ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Tentar novamente
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" /> Destinatario
            </h3>
            <div>
              <Label htmlFor="recipientName">Nome *</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nome de quem vai receber"
                required
              />
            </div>
            <div>
              <Label htmlFor="recipientPhone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telefone
              </Label>
              <Input
                id="recipientPhone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-red-500" />
              Endereco de entrega *
            </Label>
            <div className="relative">
              <Input
                value={dropoffText}
                onChange={(e) => {
                  setDropoffText(e.target.value);
                  setDropoffCoords(null);
                  setDropoffLocationId("");
                }}
                onBlur={() => {
                  if (dropoffText.trim() && !dropoffCoords && !geocodingDropoff) {
                    void resolveDropoffByText(dropoffText);
                  }
                }}
                placeholder="Rua, numero, bairro"
                className="pr-24"
                required
                disabled={geocodingDropoff}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {(geocodingDropoff || loadingDropoffGps) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
                {dropoffCoords && dropoffLocationId && !geocodingDropoff && (
                  <span className="text-[0.6rem] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    GPS ok
                  </span>
                )}
                {dropoffText && (
                  <button
                    type="button"
                    onClick={() => {
                      setDropoffText("");
                      setDropoffCoords(null);
                      setDropoffLocationId("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={captureDropoffGps}
                  disabled={loadingDropoffGps}
                  className="text-[0.6rem] font-medium text-primary bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                  title="Usar minha localizacao atual como destino"
                >
                  <Navigation className="h-3 w-3" />
                  GPS
                </button>
              </div>
            </div>
            {dropoffText && !dropoffCoords && !geocodingDropoff && (
              <button type="button" onClick={() => void resolveDropoffByText(dropoffText)} className="text-xs text-primary underline">
                Buscar endereco
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" /> Pacote
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {packageSizeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPackageSize(opt.value)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    packageSize === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[0.6rem] opacity-70 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <Input
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="Descricao: pizza, remedio, documento..."
            />
          </div>

          <div>
            <Label htmlFor="deliveryNotes" className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Observacoes para o motoboy
            </Label>
            <Textarea
              id="deliveryNotes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Portao azul, deixar com porteiro, ligar antes..."
              rows={2}
            />
          </div>

          <div>
            <Label>Pagamento</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-medium transition-all",
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <CreditCard className="h-3.5 w-3.5" /> PIX
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("dinheiro")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-medium transition-all",
                  paymentMethod === "dinheiro"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                    : "border-border text-muted-foreground",
                )}
              >
                <Banknote className="h-3.5 w-3.5" /> Dinheiro
              </button>
            </div>
          </div>

          {priceEstimate && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">Estimativa</p>
              <p className="text-lg font-bold text-primary">R$ {priceEstimate.estimatedPrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Valor final pode variar</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={closeModal} disabled={busy}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!isValid || busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                "Solicitar Motoboy"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
