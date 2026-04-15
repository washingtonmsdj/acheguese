import React from "react";
import { useEffect, useState } from "react";
import { WifiOff, Wifi, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DRIVER_STATUS } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);

      // Esconder após 3 segundos
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener(DRIVER_STATUS.ONLINE, handleOnline);
    window.addEventListener(DRIVER_STATUS.OFFLINE, handleOffline);

    // Mostrar indicador se já estiver offline
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener(DRIVER_STATUS.ONLINE, handleOnline);
      window.removeEventListener(DRIVER_STATUS.OFFLINE, handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 ${
            isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Conexão restaurada</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Você está offline</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-500 font-medium">
            Modo Offline - Alguns recursos podem estar limitados
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-yellow-500 hover:text-yellow-400 underline"
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

      // Estimar tamanho do cache
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
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Download className="w-4 h-4" />
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
