import { useState, useCallback } from "react";
import { logger } from "@/shared/utils/logger";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionGranted: false,
  });

  const requestPermission = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocalizacao nao suportada neste navegador.",
        permissionGranted: false,
      }));
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false,
        error: null,
        permissionGranted: true,
      });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao obter localizacao";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        permissionGranted: false,
      }));
      return false;
    }
  }, []);

  const watchPosition = useCallback(() => {
    if (!("geolocation" in navigator)) return null;

    return navigator.geolocation.watchPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          permissionGranted: true,
        }));
      },
      (error) => logger.error("Erro no watchPosition", error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const updateUserLocation = useCallback(
    async (userId: string) => {
      if (!state.latitude || !state.longitude) return false;
      logger.info("Localizacao do usuario", {
        userId,
        lat: state.latitude,
        lng: state.longitude,
      });
      return true;
    },
    [state.latitude, state.longitude],
  );

  return { ...state, requestPermission, updateUserLocation, watchPosition };
}
