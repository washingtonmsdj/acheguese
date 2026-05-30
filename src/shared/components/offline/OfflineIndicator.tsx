/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi, Download } from "lucide-react";
import { DRIVER_STATUS } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";

function isNavigatorOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(isNavigatorOnline);
  const [showIndicator, setShowIndicator] = useState(!isNavigatorOnline());
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearHideTimeout = () => {
      if (!hideTimeoutRef.current) return;
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    };

    const scheduleHide = () => {
      clearHideTimeout();
      hideTimeoutRef.current = setTimeout(() => {
        setShowIndicator(false);
        hideTimeoutRef.current = null;
      }, 3000);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      scheduleHide();
    };

    const handleOffline = () => {
      clearHideTimeout();
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener(DRIVER_STATUS.ONLINE, handleOnline);
    window.addEventListener(DRIVER_STATUS.OFFLINE, handleOffline);

    if (!isNavigatorOnline()) {
      setShowIndicator(true);
    }

    return () => {
      clearHideTimeout();
      window.removeEventListener(DRIVER_STATUS.ONLINE, handleOnline);
      window.removeEventListener(DRIVER_STATUS.OFFLINE, handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-white shadow-lg transition-[opacity,transform] duration-200 ${
        isOnline ? "bg-green-500" : "bg-red-500"
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Conexão restaurada</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Você está offline</span>
        </>
      )}
    </div>
  );
}

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(isNavigatorOnline);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener(DRIVER_STATUS.ONLINE, handleOnline);
    window.addEventListener(DRIVER_STATUS.OFFLINE, handleOffline);

    return () => {
      window.removeEventListener(DRIVER_STATUS.ONLINE, handleOnline);
      window.removeEventListener(DRIVER_STATUS.OFFLINE, handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-500">
            Modo Offline - Alguns recursos podem estar limitados
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-yellow-500 underline hover:text-yellow-400"
        >
          Tentar reconectar
        </button>
      </div>
    </div>
  );
}

export function OfflineDataStatus() {
  const [hasCachedData, setHasCachedData] = useState(false);
  const [cacheSize, setCacheSize] = useState<string>("0 KB");

  useEffect(() => {
    checkCachedData();
  }, []);

  const checkCachedData = async () => {
    try {
      const cache = await caches.open("localconnect-critical-v1");
      const keys = await cache.keys();

      setHasCachedData(keys.length > 0);

      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        setCacheSize(formatBytes(usage));
      }
    } catch (error) {
      logger.error("Error verify cache:", error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const unit = sizes.at(Math.min(i, sizes.length - 1)) ?? "GB";
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${unit}`;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Download className="h-4 w-4" />
      <span>
        {hasCachedData ? (
          <>Dados offline: {cacheSize}</>
        ) : (
          <>Nenhum dado offline salvo</>
        )}
      </span>
    </div>
  );
}
