/**
 * BuscandoMotoristaPage — Tela de busca de motorista.
 * Mobile-first, responsiva, fullscreen.
 *
 * Layout:
 * - Mobile: mapa ocupa ~60vh, bottom sheet fixo na base
 * - Desktop (md+): mapa à esquerda, painel à direita (split view)
 */
import { logger } from '@/shared/utils/logger';
import { useEffect, useRef, memo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion } from "framer-motion";
import { ArrowLeft, Navigation, X, Car } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { useMobilidade } from "@/modules/mobility/hooks/useMobilidade";
import { mobilityService } from "@/modules/mobility/services/MobilityService";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { RIDE_STATUS, MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/modules/mobility/constants";
import { BUSCANDO_MOTORISTA_PAGE_LABELS } from "@/modules/mobility/constants/buscandoMotoristaPageLabels";
import { PassengerSearchStatus } from "../components/PassengerSearchStatus";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { routingService } from "@/core/routing/instance";
import { CancelRideConfirmDialog } from "../components/CancelRideConfirmDialog";
// ── Mapa ──────────────────────────────────────────────────────────────────────

const RouteMap = memo(function RouteMap({
  originLat,
  originLng,
  destinationLat,
  destinationLng,
}: {
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [routeLoaded, setRouteLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const centerLng = originLng ?? destinationLng ?? -38.476;
    const centerLat = originLat ?? destinationLat ?? -12.975;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_TILE_STYLE.styleUrl,
      center: [centerLng, centerLat],
      zoom: 13,
      attributionControl: false,
      interactive: true,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.on("load", () => {
      // Marcador origem — círculo verde
      if (originLat && originLng) {
        const el = document.createElement("div");
        el.style.cssText = `
          width:18px;height:18px;
          background:#22c55e;border-radius:50%;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,.35);
        `;
        new maplibregl.Marker({ element: el })
          .setLngLat([originLng, originLat])
          .addTo(map);
      }

      // Marcador destino — quadrado vermelho
      if (destinationLat && destinationLng) {
        const el = document.createElement("div");
        el.style.cssText = `
          width:18px;height:18px;
          background:#ef4444;border-radius:4px;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,.35);
        `;
        new maplibregl.Marker({ element: el })
          .setLngLat([destinationLng, destinationLat])
          .addTo(map);
      }

      // ✅ GATE 1: Carregar rota real via OSRM
      if (originLat && originLng && destinationLat && destinationLng) {
        routingService
          .calculateRoute({
            origin: { latitude: originLat, longitude: originLng },
            destination: { latitude: destinationLat, longitude: destinationLng },
            options: { profile: 'car', alternatives: false },
          })
          .then((routeResponse) => {
            if (!routeResponse.routes || routeResponse.routes.length === 0) {
              logger.warn(BUSCANDO_MOTORISTA_PAGE_LABELS.LOG_NO_ROUTE);
              return;
            }

            const route = routeResponse.routes[0];
            const coordinates = route.geometry.map((coord) => [
              coord.longitude,
              coord.latitude,
            ]);

            // Adicionar source e layer da rota real
            map.addSource('route-real', {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates,
                },
                properties: {},
              },
            });

            map.addLayer({
              id: 'route-real-line',
              type: 'line',
              source: 'route-real',
              paint: {
                'line-color': '#6366f1',
                'line-width': 4,
                'line-opacity': 0.85,
              },
            });

            // Ajustar bounds para mostrar rota completa
            const bounds = new maplibregl.LngLatBounds();
            coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
            map.fitBounds(bounds, {
              padding: { top: 80, bottom: 80, left: 40, right: 40 },
              duration: 1000,
            });

            setRouteLoaded(true);
            logger.debug(BUSCANDO_MOTORISTA_PAGE_LABELS.LOG_ROUTE_SUCCESS);
          })
          .catch((error) => {
            logger.error(BUSCANDO_MOTORISTA_PAGE_LABELS.LOG_ROUTE_ERROR, error);
            // Fallback: ajustar bounds manualmente se rota falhar
            map.fitBounds(
              [
                [
                  Math.min(originLng, destinationLng) - 0.015,
                  Math.min(originLat, destinationLat) - 0.015,
                ],
                [
                  Math.max(originLng, destinationLng) + 0.015,
                  Math.max(originLat, destinationLat) + 0.015,
                ],
              ],
              { padding: { top: 80, bottom: 80, left: 40, right: 40 }, duration: 1000 }
            );
          });
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="w-full h-full" />;
});

// ── Painel de busca ───────────────────────────────────────────────────────────

function SearchPanel({
  originText,
  destinationText,
  suggestedPrice,
  onCancel,
}: {
  originText: string;
  destinationText: string;
  suggestedPrice?: number;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Status */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Navigation className="h-5 w-5 text-primary" />
          </motion.div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{BUSCANDO_MOTORISTA_PAGE_LABELS.SEARCH_TITLE}</p>
          <p className="text-xs text-muted-foreground">
            {BUSCANDO_MOTORISTA_PAGE_LABELS.SEARCH_SUBTITLE}
          </p>
        </div>
        {/* Dots animados */}
        <div className="flex gap-1 flex-shrink-0">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>

      {/* Percurso */}
      <div className="bg-secondary/50 rounded-2xl p-4 mb-5 flex-1">
        <div className="flex items-start gap-3">
          {/* Linha de percurso visual */}
          <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-0.5 flex-1 min-h-[24px] bg-border" />
            <div className="w-3 h-3 rounded-sm bg-destructive" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wider mb-0.5">
                {BUSCANDO_MOTORISTA_PAGE_LABELS.ROUTE_ORIGIN_LABEL}
              </p>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {originText}
              </p>
            </div>
            <div>
              <p className="text-[0.6rem] text-muted-foreground uppercase tracking-wider mb-0.5">
                {BUSCANDO_MOTORISTA_PAGE_LABELS.ROUTE_DESTINATION_LABEL}
              </p>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {destinationText}
              </p>
            </div>
          </div>
        </div>

        {suggestedPrice && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{BUSCANDO_MOTORISTA_PAGE_LABELS.PRICE_LABEL}</span>
            <span className="text-sm font-bold text-foreground">
              {BUSCANDO_MOTORISTA_PAGE_LABELS.PRICE_FORMAT(Number(suggestedPrice))}
            </span>
          </div>
        )}
      </div>

      {/* Cancelar */}
      <Button
        variant="outline"
        className="w-full rounded-2xl h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold"
        onClick={onCancel}
      >
        <X className="h-4 w-4 mr-2" />
        {BUSCANDO_MOTORISTA_PAGE_LABELS.BUTTON_CANCEL}
      </Button>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function BuscandoMotoristaPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const { cancelRide } = useMobilidade();
  const { user } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: ride } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.rideBuscando(rideId!),
    queryFn: () => mobilityService.getRideWithAddresses(rideId!),
    enabled: !!rideId,
    // ✅ REALTIME: Removido polling, dados atualizados via subscription
    staleTime: TIMEOUTS.CACHE_STALE_TIME_MEDIUM,
  });
  type RideWithAddresses = {
    status?: string | null;
    pickup_address?: { latitude?: number | null; longitude?: number | null; street?: string | null } | null;
    dropoff_address?: { latitude?: number | null; longitude?: number | null; street?: string | null } | null;
    pickup_location?: { name?: string | null } | null;
    dropoff_location?: { name?: string | null } | null;
    origin?: string | null;
    destination?: string | null;
    estimated_fare?: number | null;
    final_price?: number | null;
    suggested_price?: number | null;
  };
  const rideData = ride as RideWithAddresses | null | undefined;
  const rideStatus = String(rideData?.status ?? "");

  // Navegar quando motorista aceitar ou corrida terminar
  useEffect(() => {
    if (!rideStatus) return;

    const successStatuses: string[] = [
      RIDE_STATUS.DRIVER_ACCEPTED,
      RIDE_STATUS.DRIVER_ARRIVING,
      RIDE_STATUS.DRIVER_ASSIGNED,
      RIDE_STATUS.DRIVER_ON_THE_WAY,
      RIDE_STATUS.IN_PROGRESS,
    ];

    if (
      successStatuses.includes(rideStatus)
    ) {
      toast.success(BUSCANDO_MOTORISTA_PAGE_LABELS.TOAST_DRIVER_FOUND);
      navigate("/mobilidade/passageiro", { replace: true });
    }

    const terminalStatuses: string[] = [
      RIDE_STATUS.CANCELLED,
      RIDE_STATUS.CANCELLED_BY_PASSENGER,
      RIDE_STATUS.CANCELLED_BY_DRIVER,
      RIDE_STATUS.EXPIRED,
      RIDE_STATUS.FAILED,
    ];

    if (
      terminalStatuses.includes(rideStatus)
    ) {
      navigate("/mobilidade/passageiro", { replace: true });
    }
  }, [navigate, rideStatus]);

  const handleCancel = async () => {
    if (!rideId) return false;
    const ok = await cancelRide(rideId);
    if (ok) {
      navigate("/mobilidade/passageiro", { replace: true });
    }
    return ok;
  };

  const r = rideData;

  // Coordenadas — vêm da tabela addresses (join)
  const originLat = r?.pickup_address?.latitude;
  const originLng = r?.pickup_address?.longitude;
  const destinationLat = r?.dropoff_address?.latitude;
  const destinationLng = r?.dropoff_address?.longitude;

  // Textos de endereço — street do address ou nome da location como fallback
  const originText =
    r?.pickup_address?.street ||
    r?.pickup_location?.name ||
    BUSCANDO_MOTORISTA_PAGE_LABELS.ROUTE_ORIGIN_DEFAULT;
  const destinationText =
    r?.dropoff_address?.street ||
    r?.dropoff_location?.name ||
    BUSCANDO_MOTORISTA_PAGE_LABELS.ROUTE_DESTINATION_DEFAULT;

  return (
    /**
     * Layout:
     * - Mobile: coluna (mapa em cima, painel embaixo)
     * - md+: linha (mapa à esquerda 60%, painel à direita 40%)
     */
    <div className="fixed inset-0 bg-background flex flex-col md:flex-row overflow-hidden">

      {/* ── Botão voltar (flutuante, sempre visível) ── */}
      <div className="absolute top-4 left-4 z-30 safe-top">
        <button
          onClick={() => navigate("/mobilidade/passageiro", { replace: true })}
          className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label={BUSCANDO_MOTORISTA_PAGE_LABELS.ARIA_BACK_BUTTON}
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* ── MAPA ── */}
      {/* Mobile: altura fixa ~55vh | Desktop: flex-1 (ocupa toda a altura) */}
      <div className="relative h-[55vh] md:h-full md:flex-1 flex-shrink-0">
        <RouteMap
          originLat={originLat}
          originLng={originLng}
          destinationLat={destinationLat}
          destinationLng={destinationLng}
        />

        {/* Animação de busca centralizada no mapa */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-primary/50"
                initial={{ width: 56, height: 56, opacity: 0.7 }}
                animate={{ width: 56 + i * 48, height: 56 + i * 48, opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 z-10">
              <Car className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Legenda de marcadores — mobile only, canto inferior direito do mapa */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 md:hidden">
          <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[0.6rem] font-medium text-foreground shadow">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
            {BUSCANDO_MOTORISTA_PAGE_LABELS.LEGEND_ORIGIN}
          </div>
          <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[0.6rem] font-medium text-foreground shadow">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500 flex-shrink-0" />
            {BUSCANDO_MOTORISTA_PAGE_LABELS.LEGEND_DESTINATION}
          </div>
        </div>
      </div>

      {/* ── PAINEL ── */}
      {/* Mobile: bottom sheet animado | Desktop: painel lateral fixo */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={[
          // Base
          "bg-card z-10 flex flex-col",
          // Mobile: rounded top, padding bottom safe area
          "rounded-t-3xl px-5 pt-5 pb-6",
          "shadow-[0_-8px_32px_rgba(0,0,0,0.12)]",
          // Desktop: sem rounded, borda esquerda, largura fixa, scroll se necessário
          "md:rounded-none md:border-l md:border-border md:w-[380px] md:overflow-y-auto md:shadow-none md:pt-16",
        ].join(" ")}
      >
        {/* Handle — mobile only */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5 md:hidden" />

        {/* Legenda desktop */}
        <div className="hidden md:flex items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-green-500" /> {BUSCANDO_MOTORISTA_PAGE_LABELS.LEGEND_ORIGIN}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-red-500" /> {BUSCANDO_MOTORISTA_PAGE_LABELS.LEGEND_DESTINATION}
          </div>
        </div>

        {/* Status de Busca em Tempo Real */}
        {rideId && user?.id && (
          <div className="mb-4">
            <PassengerSearchStatus
              rideId={rideId}
              passengerProfileId={user.id}
            />
          </div>
        )}

        <SearchPanel
          originText={originText}
          destinationText={destinationText}
          suggestedPrice={r?.suggested_price}
          onCancel={() => setShowCancelDialog(true)}
        />
      </motion.div>

      {/* Diálogo de confirmação de cancelamento */}
      <CancelRideConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
        rideStatus={rideStatus}
        isDriver={false}
      />
    </div>
  );
}
