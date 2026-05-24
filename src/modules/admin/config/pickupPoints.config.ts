import { MAP_DEFAULT_COORDINATES } from "@/shared/config/mapDefaults";

export const PICKUP_POINTS_DEFAULTS: {
  neighborhood: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
} = {
  neighborhood: "",
  coordinates: MAP_DEFAULT_COORDINATES,
};
