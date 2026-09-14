import { forwardRef, lazy, Suspense } from "react";
import { loadMapLibreRuntime } from "../../runtime/loadMapLibreRuntime";
import type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapter";

const loadAdapterRuntime = async () => {
  const [, adapterModule] = await Promise.all([
    loadMapLibreRuntime(),
    import("./MapLibreAdapter"),
  ]);

  return { default: adapterModule.MapLibreAdapter };
};

const LazyMapLibreRuntime = lazy(loadAdapterRuntime);

export function preloadMapLibreAdapterRuntime(): Promise<void> {
  return loadAdapterRuntime().then(() => undefined);
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
