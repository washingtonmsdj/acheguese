import { useQuery } from "@tanstack/react-query";
import { CityService } from "@/core/city/services/CityService";

export function useCityMetadataList() {
  return useQuery({
    queryKey: ["city-metadata", "list"],
    queryFn: () => CityService.listCities(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

