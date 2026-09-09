/**
 * LostFoundMiniMap — Mini mapa para achados e perdidos.
 * Engine: MapLibre GL JS (via SSOT de mapa).
 */

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { createMapPopupContent } from "@/shared/components/maps/mapPopupContent";

interface LostFoundMiniMapProps {
  latitude: number;
  longitude: number;
  title: string;
  tipo: "perdido" | "encontrado";
  className?: string;
}

export function LostFoundMiniMap({
  latitude,
  longitude,
  title,
  tipo,
  className = "",
}: LostFoundMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_TILE_STYLE.styleUrl,
      center: [longitude, latitude],
      zoom: 16,
      attributionControl: false,
      scrollZoom: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("load", () => {
      const color = tipo === "perdido" ? "#EF4444" : "#10B981";
      const markerAbbr = tipo === "perdido" ? "P" : "E";

      const el = document.createElement("div");
      el.style.cssText = `width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;`;
      const inner = document.createElement("span");
      inner.style.cssText = "transform:rotate(45deg);font-size:12px;line-height:1;font-weight:800;color:white;font-family:Arial,sans-serif;";
      inner.textContent = markerAbbr;
      el.appendChild(inner);

      markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([longitude, latitude])
        .setPopup(
          new maplibregl.Popup({ closeButton: false }).setDOMContent(
            createMapPopupContent({
              title,
              description: tipo === "perdido" ? "Item Perdido" : "Item Encontrado",
              titleTone: tipo === "perdido" ? "danger" : "success",
            }),
          ),
        )
        .addTo(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLngLat([longitude, latitude]);
    mapRef.current.easeTo({ center: [longitude, latitude], zoom: 16 });
  }, [latitude, longitude]);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-3 pointer-events-none">
        <div className="flex items-center gap-2 text-white">
          <MapPin className="h-4 w-4" />
          <span className="text-xs font-semibold">Localizacao Exata</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden border-2 border-border"
        style={{ minHeight: 300 }}
      />

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-2 pointer-events-none">
        <div className="text-white text-[10px] text-center font-mono">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
      </div>
    </div>
  );
}
