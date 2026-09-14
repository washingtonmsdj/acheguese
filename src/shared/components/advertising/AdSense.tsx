/**
 * Componente reutilizável para Google AdSense.
 * SSOT: o Publisher ID vem de VITE_ADSENSE_CLIENT_ID.
 *
 * O script do provider só é carregado quando um slot real monta. A carga é
 * deduplicada por client ID e a inicialização do anúncio aguarda o evento real
 * de `load`, em vez de depender de um timeout arbitrário de rede.
 */

import { useEffect, useRef } from "react";

interface AdSenseProps {
  slot: string;
  client?: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  layout?: "in-article" | "in-feed";
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const adsenseScriptPromises = new Map<string, Promise<void>>();

function isConfiguredAdSenseClient(clientId: string | undefined): clientId is string {
  return Boolean(clientId && clientId !== "ca-pub-XXXXXXXXXXXXXXXX");
}

function getAdSenseScriptSelector(clientId: string): string {
  return `script[src*="adsbygoogle.js"][src*="${clientId}"]`;
}

function loadAdSenseScript(clientId: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (typeof window !== "undefined" && window.adsbygoogle) {
    return Promise.resolve();
  }

  const pending = adsenseScriptPromises.get(clientId);
  if (pending) return pending;

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      getAdSenseScriptSelector(clientId),
    );
    const script = existingScript ?? document.createElement("script");

    const handleLoad = () => resolve();
    const handleError = () => reject(new Error("adsense_script_failed"));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.achegueseAdsense = "true";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    adsenseScriptPromises.delete(clientId);
    throw error;
  });

  adsenseScriptPromises.set(clientId, promise);
  return promise;
}

export function AdSense(props: AdSenseProps) {
  const {
    slot,
    client = import.meta.env.VITE_ADSENSE_CLIENT_ID,
    format = "auto",
    responsive = true,
    layout,
    style,
    className = "",
  } = props;

  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);
  const adsenseConfigured = isConfiguredAdSenseClient(client);

  useEffect(() => {
    if (!adsenseConfigured || isInitialized.current) return;

    let cancelled = false;

    void loadAdSenseScript(client)
      .then(() => {
        if (cancelled || isInitialized.current || !adRef.current) return;

        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        isInitialized.current = true;
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("AdSense initialization error:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adsenseConfigured, client]);

  const defaultStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    minHeight:
      format === "horizontal"
        ? "90px"
        : format === "vertical"
          ? "250px"
          : "90px",
    ...style,
  };

  if (!adsenseConfigured) {
    return import.meta.env.DEV ? (
      <AdSensePlaceholder text="Configure VITE_ADSENSE_CLIENT_ID no .env.local" />
    ) : null;
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={defaultStyle}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
        {...(layout && { "data-ad-layout": layout })}
      />
    </div>
  );
}

export function AdSensePlaceholder(props: { height?: string; text?: string }) {
  const { height = "90px", text = "Espaço para anúncio" } = props;
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-muted/40 border border-border/50 text-muted-foreground text-sm"
      style={{ minHeight: height }}
    >
      {text}
    </div>
  );
}
