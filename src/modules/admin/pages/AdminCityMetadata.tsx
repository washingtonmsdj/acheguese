import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CityService, type CityMetadata } from "@/core/city/services/CityService";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/components/ui/use-toast";
import { Loader2, Save, MapPin, Users, Building2, GraduationCap, Wrench, Bus } from "lucide-react";

function formatCityOption(city: CityMetadata): string {
  return `${city.city} - ${city.state.toUpperCase()}`;
}

export default function AdminCityMetadata() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCityId, setSelectedCityId] = useState<string>("");

  const { data: cities = [], isLoading: isLoadingCities } = useQuery({
    queryKey: ["admin-city-metadata-list"],
    queryFn: () => CityService.listCities(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!selectedCityId && cities.length > 0) {
      setSelectedCityId(cities[0].id);
    }
  }, [cities, selectedCityId]);

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  );

  const { data: cityData, isLoading: isLoadingCityData } = useQuery({
    queryKey: ["admin-city-metadata", selectedCityId],
    queryFn: () => CityService.getCityMetadataById(selectedCityId),
    enabled: Boolean(selectedCityId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: Partial<CityMetadata>) => CityService.updateCityMetadata(selectedCityId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-city-metadata", selectedCityId] });
      queryClient.invalidateQueries({ queryKey: ["admin-city-metadata-list"] });
      queryClient.invalidateQueries({ queryKey: ["city-metadata"] });
      toast({
        title: "Sucesso",
        description: "Metadados da cidade atualizados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCityId) return;

    const formData = new FormData(e.currentTarget);
    const values: Partial<CityMetadata> = {
      population: Number(formData.get("population") || 0),
      districts_count: Number(formData.get("districts_count") || 0),
      active_businesses: Number(formData.get("active_businesses") || 0),
      schools_count: Number(formData.get("schools_count") || 0),
      professionals_count: Number(formData.get("professionals_count") || 0),
      bus_lines_count: Number(formData.get("bus_lines_count") || 0),
      description: String(formData.get("description") || ""),
      founded_year: Number(formData.get("founded_year") || 0) || null,
      area_km2: Number(formData.get("area_km2") || 0) || null,
    };

    updateMutation.mutate(values);
  };

  if (isLoadingCities) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Metadados da Cidade</h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma cidade cadastrada em city_metadata.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingCityData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Metadados da Cidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie as informacoes de cidade exibidas nas paginas publicas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cidade ativa</CardTitle>
          <CardDescription>Selecione a cidade para editar os metadados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="city-selector">Cidade</Label>
          <select
            id="city-selector"
            value={selectedCityId}
            onChange={(event) => setSelectedCityId(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {formatCityOption(city)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {selectedCity ? formatCityOption(selectedCity) : "Cidade"}
          </CardTitle>
          <CardDescription>Atualize os indicadores oficiais da cidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="population" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Populacao
                </Label>
                <Input id="population" name="population" type="number" defaultValue={cityData?.population ?? 0} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="districts_count" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Numero de bairros
                </Label>
                <Input id="districts_count" name="districts_count" type="number" defaultValue={cityData?.districts_count ?? 0} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="active_businesses" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-warning" />
                  Empresas ativas
                </Label>
                <Input id="active_businesses" name="active_businesses" type="number" defaultValue={cityData?.active_businesses ?? 0} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schools_count" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-success" />
                  Escolas
                </Label>
                <Input id="schools_count" name="schools_count" type="number" defaultValue={cityData?.schools_count ?? 0} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionals_count" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-violet-500" />
                  Profissionais
                </Label>
                <Input id="professionals_count" name="professionals_count" type="number" defaultValue={cityData?.professionals_count ?? 0} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bus_lines_count" className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-rose-500" />
                  Linhas de onibus
                </Label>
                <Input id="bus_lines_count" name="bus_lines_count" type="number" defaultValue={cityData?.bus_lines_count ?? 0} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="founded_year">Ano de fundacao</Label>
                <Input id="founded_year" name="founded_year" type="number" defaultValue={cityData?.founded_year ?? ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_km2">Area (km2)</Label>
                <Input id="area_km2" name="area_km2" type="number" step="0.01" defaultValue={cityData?.area_km2 ?? ""} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao da cidade</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={cityData?.description ?? ""}
                rows={4}
                placeholder="Resumo institucional da cidade"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending || !selectedCityId} className="gap-2">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar alteracoes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Observacoes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>• Os dados sao exibidos nas paginas publicas da cidade.</p>
          <p>• Use valores oficiais para evitar inconsistencias territoriais.</p>
          <p>
            • Ultima atualizacao: {cityData?.updated_at ? new Date(cityData.updated_at).toLocaleString("pt-BR") : "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
