import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";

interface ModuleLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleBasePath: string;
  onApplyPath: (path: string) => void;
  initialSlugs?: {
    stateSlug?: string | null;
    citySlug?: string | null;
    districtSlug?: string | null;
  };
}

export function ModuleLocationDialog({
  open,
  onOpenChange,
  moduleBasePath,
  onApplyPath,
  initialSlugs,
}: ModuleLocationDialogProps) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  const { states, cities, neighborhoods } = useLocationCascade(selectedStateId, selectedCityId);

  useEffect(() => {
    if (!open) return;
    if (!initialSlugs?.stateSlug) return;
    const state = states.find((item) => item.slug === initialSlugs.stateSlug);
    if (state) setSelectedStateId(state.id);
  }, [initialSlugs?.stateSlug, open, states]);

  useEffect(() => {
    if (!open) return;
    if (!initialSlugs?.citySlug) return;
    const city = cities.find((item) => item.slug === initialSlugs.citySlug);
    if (city) setSelectedCityId(city.id);
  }, [cities, initialSlugs?.citySlug, open]);

  useEffect(() => {
    if (!open) return;
    if (!initialSlugs?.districtSlug) return;
    const district = neighborhoods.find((item) => item.slug === initialSlugs.districtSlug);
    if (district) setSelectedDistrictId(district.id);
  }, [initialSlugs?.districtSlug, neighborhoods, open]);

  const selectedStateSlug = useMemo(
    () => states.find((item) => item.id === selectedStateId)?.slug ?? "",
    [selectedStateId, states],
  );
  const selectedCitySlug = useMemo(
    () => cities.find((item) => item.id === selectedCityId)?.slug ?? "",
    [cities, selectedCityId],
  );
  const selectedDistrictSlug = useMemo(
    () => neighborhoods.find((item) => item.id === selectedDistrictId)?.slug ?? "",
    [neighborhoods, selectedDistrictId],
  );

  const handleApply = () => {
    if (!selectedStateSlug || !selectedCitySlug) {
      onApplyPath(moduleBasePath);
      onOpenChange(false);
      return;
    }
    const suffix = selectedDistrictSlug
      ? `/${selectedStateSlug}/${selectedCitySlug}/${selectedDistrictSlug}`
      : `/${selectedStateSlug}/${selectedCitySlug}`;
    onApplyPath(`${moduleBasePath}${suffix}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Alterar localização</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Estado</label>
            <Select
              value={selectedStateId ?? "__none__"}
              onValueChange={(value) => {
                if (value === "__none__") {
                  setSelectedStateId(null);
                  setSelectedCityId(null);
                  setSelectedDistrictId(null);
                  return;
                }
                setSelectedStateId(value);
                setSelectedCityId(null);
                setSelectedDistrictId(null);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecione</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Cidade</label>
            <Select
              value={selectedCityId ?? "__none__"}
              onValueChange={(value) => {
                if (value === "__none__") {
                  setSelectedCityId(null);
                  setSelectedDistrictId(null);
                  return;
                }
                setSelectedCityId(value);
                setSelectedDistrictId(null);
              }}
              disabled={!selectedStateId}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Selecione</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Bairro (opcional)</label>
            <Select
              value={selectedDistrictId ?? "__none__"}
              onValueChange={(value) => setSelectedDistrictId(value === "__none__" ? null : value)}
              disabled={!selectedCityId}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Toda a cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Toda a cidade</SelectItem>
                {neighborhoods.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => {
                setSelectedStateId(null);
                setSelectedCityId(null);
                setSelectedDistrictId(null);
              }}
            >
              Limpar
            </Button>
            <Button className="flex-1 rounded-xl" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

