import { forwardRef, lazy, Suspense } from "react";
import { loadMapLibreRuntime } from "../../runtime/loadMapLibreRuntime";
import type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapterRuntime";

const loadAdapterRuntime = async () => {
  const [, adapterModule] = await Promise.all([
    loadMapLibreRuntime(),
    import("./MapLibreAdapterRuntime"),
  ]);

  return { default: adapterModule.MapLibreAdapter };
};

const LazyMapLibreRuntime = lazy(loadAdapterRuntime);

export function preloadMapLibreAdapterRuntime(): Promise<void> {
  return loadAdapterRuntime().then(() => undefined);
}

/**
 * Owner público canônico do MapLibre.
 *
 * Todo consumidor deve importar este caminho (diretamente ou pelo barrel).
 * A implementação pesada permanece interna em MapLibreAdapterRuntime.tsx.
 */
export const MapLibreAdapter = forwardRef<
  MapLibreAdapterHandle,
  MapLibreAdapterProps
>(function MapLibreAdapter(props, ref) {
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

export type {
  MapLibreAdapterHandle,
  MapLibreAdapterProps,
} from "./MapLibreAdapterRuntime";
