import { forwardRef, lazy, Suspense } from "react";
import {
  loadMapLibreRuntime,
  preloadMapLibreRuntime,
} from "../../runtime/loadMapLibreRuntime";
import type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapterRuntime";

const loadFullAdapterRuntime = async () => {
  const [, adapterModule] = await Promise.all([
    loadMapLibreRuntime(),
    import("./MapLibreAdapterRuntime"),
  ]);

  return { default: adapterModule.MapLibreAdapter };
};

const loadPassiveAdapterRuntime = async () => {
  const [, adapterModule] = await Promise.all([
    loadMapLibreRuntime(),
    import("./MapLibrePassiveRuntime"),
  ]);

  return { default: adapterModule.MapLibrePassiveRuntime };
};

const LazyFullMapLibreRuntime = lazy(loadFullAdapterRuntime);
const LazyPassiveMapLibreRuntime = lazy(loadPassiveAdapterRuntime);

/**
 * Aquece somente engine/CSS/worker. O runtime React correto continua sendo
 * escolhido pelas props quando o mapa realmente montar.
 */
export function preloadMapLibreAdapterRuntime(): Promise<void> {
  return preloadMapLibreRuntime();
}

function canUsePassiveRuntime(props: MapLibreAdapterProps): boolean {
  return (
    props.interactive === false &&
    (props.markers?.length ?? 0) === 0 &&
    !props.controls &&
    !props.circle &&
    !props.onMarkerClick &&
    !props.onMapClick &&
    !props.onViewportChange &&
    !props.enableClustering &&
    !props.userLocationMarker?.enabled &&
    !props.radiusControl?.enabled
  );
}

/**
 * Owner público canônico do MapLibre.
 *
 * Mapas passivos recebem um runtime interno enxuto; mapas interativos recebem
 * o runtime completo. Consumidores mantêm uma única API/SSOT.
 */
export const MapLibreAdapter = forwardRef<
  MapLibreAdapterHandle,
  MapLibreAdapterProps
>(function MapLibreAdapter(props, ref) {
  const usePassiveRuntime = canUsePassiveRuntime(props);

  return (
    <Suspense
      fallback={
        <div
          className={props.className}
          aria-label="Carregando mapa"
          aria-busy="true"
        />
      }
    >
      {usePassiveRuntime ? (
        <LazyPassiveMapLibreRuntime {...props} ref={ref} />
      ) : (
        <LazyFullMapLibreRuntime {...props} ref={ref} />
      )}
    </Suspense>
  );
});

export type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapterRuntime";
