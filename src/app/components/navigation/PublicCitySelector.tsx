import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Input } from "@/shared/components/ui/input";
import { useLocations } from "@/core/location/hooks/useLocations";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import { useCityMetadataList } from "@/core/city/hooks/useCityMetadataList";
import { resolveFallbackCityStatus, type CityStatus } from "@/core/city/services/CityService";

function buildModulePath(module: string, state: string, city: string): string {
  return `/${module}/${state}/${city}`;
}

function buildPathForCurrentContext(pathname: string, state: string, city: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${state}/${city}`;

  const module = parts[0];
  const moduleSet = new Set([
    "empresas",
    "servicos",
    "gastronomia",
    "eventos",
    "classificados",
    "vagas",
    "buscar",
    "mapa",
    "educacao",
    "pontos-turisticos",
    "comunidade",
  ]);

  if (moduleSet.has(module)) {
    return buildModulePath(module, state, city);
  }

  return `/${state}/${city}`;
}

function normalizeCitySlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCityOperationalLabel(status: CityStatus): "Ativa" | "Em implantação" {
  return status === "active" ? "Ativa" : "Em implantação";
}

interface PublicCitySelectorProps {
  compact?: boolean;
}

export function PublicCitySelector({ compact = false }: PublicCitySelectorProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { active, setSelectedCity } = usePublicBrowsingCity();
  const { data: locations = [] } = useLocations();
  const { data: cityMetadata = [] } = useCityMetadataList();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const cityStatusMap = useMemo(() => {
    const map = new Map<string, CityStatus>();
    for (const city of cityMetadata) {
      const state = city.state.toLowerCase();
      const slug = normalizeCitySlug(city.city);
      map.set(`${state}:${slug}`, city.city_status ?? "coming_soon");
    }
    return map;
  }, [cityMetadata]);

  const cities = useMemo(
    () => locations.filter((loc) => loc.type === "city" && loc.status === "active"),
    [locations],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((city) => city.name.toLowerCase().includes(q));
  }, [cities, query]);

  const currentLabel = useMemo(() => {
    const current = cities.find((city) => {
      const parts = city.geographic_path.split("/").filter(Boolean);
      return parts[1] === active.state && parts[2] === active.city;
    });
    return current?.name ?? active.city;
  }, [cities, active.city, active.state]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-between text-sm ${compact ? "h-9 px-2" : "h-10 rounded-xl px-3"}`}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">
              Cidade: <strong>{currentLabel}</strong>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] rounded-2xl border-border/80 p-3 shadow-xl" align="start">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Navegação pública por cidade. Não altera endereço residencial ou comunidade.
          </p>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cidade..."
          />
          <div className="max-h-72 overflow-y-auto rounded-xl border">
            {filtered.map((city) => {
              const parts = city.geographic_path.split("/").filter(Boolean);
              const state = parts[1];
              const citySlug = parts[2];
              const isActive = state === active.state && citySlug === active.city;
              const statusKey = `${state.toLowerCase()}:${citySlug.toLowerCase()}`;
              const cityStatus = getCityOperationalLabel(
                cityStatusMap.get(statusKey) ?? resolveFallbackCityStatus(state, citySlug),
              );

              return (
                <button
                  key={city.id}
                  type="button"
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-accent ${
                    isActive ? "bg-accent" : ""
                  }`}
                  onClick={() => {
                    setSelectedCity(state, citySlug);
                    navigate(buildPathForCurrentContext(pathname, state, citySlug));
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate">{city.name}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        cityStatus === "Ativa" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {cityStatus}
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">{state}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
