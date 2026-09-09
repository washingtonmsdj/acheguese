import { useState } from "react";
import { Edit2, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { CoverageType } from "@/core/coverage";
import { TerritorialSelector } from "@/core/location/components/TerritorialSelector";
import { useSessionContext } from "@/core/session";
import {
  useCreateServiceArea,
  useDeleteServiceArea,
  useServiceAreas,
  useSetPrimaryServiceArea,
  useUpdateServiceArea,
  type ServiceArea,
} from "@/core/service-areas";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";
import { logger } from "@/shared/utils/logger";

interface ServiceAreasManagerProps {
  profileId?: string;
}

const COVERAGE_LABEL: Record<CoverageType, string> = {
  [CoverageType.CITY]: "Cidade",
  [CoverageType.DISTRICT]: "Bairro/distrito",
  [CoverageType.RADIUS]: "Raio",
};

export function ServiceAreasManager({ profileId }: ServiceAreasManagerProps) {
  const { activeProfile } = useSessionContext();
  const targetProfileId = profileId || activeProfile?.id;
  const { confirm, ConfirmDialog } = useConfirmActionDialog();

  const { data: areas = [], isLoading: loading } = useServiceAreas(
    targetProfileId || "",
  );
  const createAreaMutation = useCreateServiceArea();
  const updateAreaMutation = useUpdateServiceArea();
  const deleteAreaMutation = useDeleteServiceArea();
  const setPrimaryMutation = useSetPrimaryServiceArea();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [selectorRevision, setSelectorRevision] = useState(0);
  const [coverageType, setCoverageType] = useState<CoverageType>(
    CoverageType.CITY,
  );
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [selectedLocationLabel, setSelectedLocationLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);

  function resetSelector() {
    setSelectorRevision((current) => current + 1);
  }

  function openCreateDialog() {
    setEditingArea(null);
    setCoverageType(CoverageType.CITY);
    setSelectedLocationId(null);
    setSelectedLocationLabel("");
    setRadiusKm("5");
    setIsPrimary(areas.length === 0);
    setIsActive(true);
    resetSelector();
    setDialogOpen(true);
  }

  function openEditDialog(area: ServiceArea) {
    setEditingArea(area);
    setCoverageType(area.coverage_type);
    setSelectedLocationId(area.location_id);
    setSelectedLocationLabel(area.location_full_name);
    setRadiusKm(String(area.radius_km ?? 5));
    setIsPrimary(area.is_primary);
    setIsActive(area.is_active);
    resetSelector();
    setDialogOpen(true);
  }

  function handleCoverageTypeChange(value: string) {
    setCoverageType(value as CoverageType);
    if (!editingArea) {
      setSelectedLocationId(null);
      setSelectedLocationLabel("");
    }
    resetSelector();
  }

  async function handleSave() {
    if (!targetProfileId || !selectedLocationId) return;

    const parsedRadius =
      coverageType === CoverageType.RADIUS ? Number(radiusKm) : null;

    if (
      coverageType === CoverageType.RADIUS &&
      (!Number.isFinite(parsedRadius) || parsedRadius! < 1 || parsedRadius! > 100)
    ) {
      return;
    }

    try {
      const areaData = {
        coverage_type: coverageType,
        location_id: selectedLocationId,
        radius_km: parsedRadius,
        is_primary: isPrimary,
        is_active: isActive,
      };

      if (editingArea) {
        await updateAreaMutation.mutateAsync({
          profileId: targetProfileId,
          id: editingArea.id,
          data: areaData,
        });
      } else {
        await createAreaMutation.mutateAsync({
          profile_id: targetProfileId,
          ...areaData,
        });
      }

      setDialogOpen(false);
    } catch (error) {
      logger.error("ServiceAreasManager.handleSave", error as Error, {
        profileId: targetProfileId,
        locationId: selectedLocationId,
        coverageType,
      });
    }
  }

  async function handleDelete(areaId: string) {
    if (!targetProfileId) return;

    const confirmed = await confirm({
      title: "Remover área de atuação",
      description:
        "Esta área deixará de participar da cobertura territorial do perfil.",
      confirmLabel: "Remover",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      await deleteAreaMutation.mutateAsync({
        profileId: targetProfileId,
        id: areaId,
      });
    } catch (error) {
      logger.error("ServiceAreasManager.handleDelete", error as Error, {
        profileId: targetProfileId,
        areaId,
      });
    }
  }

  async function handleSetPrimary(areaId: string) {
    if (!targetProfileId) return;

    try {
      await setPrimaryMutation.mutateAsync({
        profileId: targetProfileId,
        serviceAreaId: areaId,
      });
    } catch (error) {
      logger.error("ServiceAreasManager.handleSetPrimary", error as Error, {
        profileId: targetProfileId,
        areaId,
      });
    }
  }

  async function handleToggleActive(areaId: string, currentActive: boolean) {
    if (!targetProfileId) return;

    try {
      await updateAreaMutation.mutateAsync({
        profileId: targetProfileId,
        id: areaId,
        data: { is_active: !currentActive },
      });
    } catch (error) {
      logger.error("ServiceAreasManager.handleToggleActive", error as Error, {
        profileId: targetProfileId,
        areaId,
      });
    }
  }

  if (!targetProfileId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Perfil não encontrado</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Carregando áreas de atuação...
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Áreas de atuação</h3>
          <p className="text-sm text-muted-foreground">
            Defina cidades, bairros ou raios onde você aceita atendimento.
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card className="p-6 text-center">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">
            Nenhuma área de atuação cadastrada.
          </p>
          <Button onClick={openCreateDialog} variant="outline" size="sm">
            Adicionar primeira área
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">{area.location_full_name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {COVERAGE_LABEL[area.coverage_type]}
                    </Badge>
                    {area.is_primary && (
                      <Badge variant="default" className="text-xs">
                        <Star className="mr-1 h-3 w-3" />
                        Primária
                      </Badge>
                    )}
                    {!area.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inativa
                      </Badge>
                    )}
                  </div>

                  {area.coverage_type === CoverageType.RADIUS &&
                    area.radius_km != null && (
                      <p className="text-sm text-muted-foreground">
                        Raio de {area.radius_km} km a partir desta localização.
                      </p>
                    )}
                  {area.coverage_type === CoverageType.CITY && (
                    <p className="text-sm text-muted-foreground">
                      Abrange a cidade selecionada.
                    </p>
                  )}
                  {area.coverage_type === CoverageType.DISTRICT && (
                    <p className="text-sm text-muted-foreground">
                      Abrange o bairro ou distrito selecionado.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={area.is_active}
                    onCheckedChange={() =>
                      handleToggleActive(area.id, area.is_active)
                    }
                    aria-label="Ativar ou desativar área"
                  />

                  {!area.is_primary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(area.id)}
                      title="Definir como primária"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(area)}
                    title="Editar área"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(area.id)}
                    title="Remover área"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingArea ? "Editar" : "Adicionar"} área de atuação
            </DialogTitle>
            <DialogDescription>
              Use territórios oficiais do sistema. Não são salvos nomes livres.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="coverage-type">Tipo de cobertura</Label>
              <Select
                value={coverageType}
                onValueChange={handleCoverageTypeChange}
              >
                <SelectTrigger id="coverage-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CoverageType.CITY}>
                    Cidade inteira
                  </SelectItem>
                  <SelectItem value={CoverageType.DISTRICT}>
                    Bairro ou distrito
                  </SelectItem>
                  <SelectItem value={CoverageType.RADIUS}>
                    Raio a partir de um território
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TerritorialSelector
              key={`${selectorRevision}-${coverageType}`}
              initialLocationId={editingArea?.location_id}
              cityOnly={coverageType === CoverageType.CITY}
              allowCityOnly={coverageType === CoverageType.RADIUS}
              progressiveReveal
              onLocationChange={(locationId, locationData) => {
                setSelectedLocationId(locationId);
                setSelectedLocationLabel(
                  locationData
                    ? [locationData.neighborhoodName, locationData.cityName]
                        .filter(
                          (value, index, values) =>
                            value && values.indexOf(value) === index,
                        )
                        .join(" · ")
                    : "",
                );
              }}
            />

            {selectedLocationLabel && (
              <p className="text-xs text-muted-foreground">
                Selecionado: {selectedLocationLabel}
              </p>
            )}

            {coverageType === CoverageType.RADIUS && (
              <div className="space-y-2">
                <Label htmlFor="coverage-radius">
                  Raio de atendimento (km)
                </Label>
                <Input
                  id="coverage-radius"
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={radiusKm}
                  onChange={(event) => setRadiusKm(event.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Área primária</Label>
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Ativa</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !selectedLocationId ||
                  createAreaMutation.isPending ||
                  updateAreaMutation.isPending
                }
              >
                {editingArea ? "Salvar alterações" : "Adicionar área"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}
