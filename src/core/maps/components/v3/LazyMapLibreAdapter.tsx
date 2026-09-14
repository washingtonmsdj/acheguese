import { forwardRef, lazy, Suspense } from "react";
import type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapter";

const loadMapLibreRuntime = async () => {
  const [{ ensureMapLibreWorkerConfigured }, adapterModule] = await Promise.all([
    import("../../config/maplibreWorkerRuntime"),
    import("./MapLibreAdapter"),
  ]);

  ensureMapLibreWorkerConfigured();
  return { default: adapterModule.MapLibreAdapter };
};

const LazyMapLibreRuntime = lazy(loadMapLibreRuntime);

export function preloadMapLibreAdapterRuntime(): Promise<void> {
  return loadMapLibreRuntime().then(() => undefined);
}

/**
 * Owner público do runtime MapLibre.
 * Mantém a mesma API do adapter pesado e permite preload pós-paint.
 */
export const MapLibreAdapter = forwardRef<
  MapLibreAdapterHandle,
  MapLibreAdapterProps
>(function LazyMapLibreAdapter(props, ref) {
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
      <LazyMapLibreRuntime {...props} ref={ref} />
    </Suspense>
  );
});

export type { MapLibreAdapterHandle, MapLibreAdapterProps } from "./MapLibreAdapter";
