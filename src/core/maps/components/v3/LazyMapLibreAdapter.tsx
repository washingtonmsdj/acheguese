import { forwardRef, lazy, Suspense } from "react";
import type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapter";

const LazyMapLibreRuntime = lazy(async () => {
  const [{ ensureMapLibreWorkerConfigured }, adapterModule] = await Promise.all([
    import("../../config/maplibreWorkerRuntime"),
    import("./MapLibreAdapter"),
  ]);

  ensureMapLibreWorkerConfigured();

  return { default: adapterModule.MapLibreAdapter };
});

/**
 * Owner público do runtime MapLibre.
 *
 * Mantém a mesma API do MapLibreAdapter, mas deixa maplibre-gl e seu worker
 * fora do bundle inicial até um mapa realmente ser renderizado.
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
