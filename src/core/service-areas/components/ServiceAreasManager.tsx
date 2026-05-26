import { useState } from "react";
import { Plus, Trash2, MapPin, Edit2, Star } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { useSessionContext } from "@/core/session";
import {
  useServiceAreas,
  useCreateServiceArea,
  useUpdateServiceArea,
  useDeleteServiceArea,
  useSetPrimaryServiceArea,
  type ServiceArea,
  type CreateServiceAreaData,
  type UpdateServiceAreaData,
} from "@/core/service-areas";
import { logger } from "@/shared/utils/logger";

interface ServiceAreasManagerProps {
  profileId?: string;
}

export function ServiceAreasManager({ profileId }: ServiceAreasManagerProps) {
  const { activeProfile } = useSessionContext();
  const targetProfileId = profileId || activeProfile?.id;
  const { confirm, ConfirmDialog } = useConfirmActionDialog();

  // Hooks do service
  const { data: areas = [], isLoading: loading } = useServiceAreas(
    targetProfileId || "",
  );
  const createAreaMutation = useCreateServiceArea();
  const updateAreaMutation = useUpdateServiceArea();
  const deleteAreaMutation = useDeleteServiceArea();
  const setPrimaryMutation = useSetPrimaryServiceArea();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);

  // Form state
  const [city, setCity] = useState("");
  const [neighborhoods, setNeighborhoods] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);

  function openCreateDialog() {
    setEditingArea(null);
    setCity("");
    setNeighborhoods("");
    setRadiusKm("5");
    setIsPrimary(areas.length === 0); // Primeira área é primária
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEditDialog(area: ServiceArea) {
    setEditingArea(area);
    setCity(area.city);
    setNeighborhoods(area.neighborhoods?.join(", ") || "");
    setRadiusKm(area.radius_km.toString());
    setIsPrimary(area.is_primary);
    setIsActive(area.is_active);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!targetProfileId || !city) {
      return;
    }

    try {
      const neighborhoodsArray = neighborhoods
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      const areaData = {
        profile_id: targetProfileId,
        city,
        neighborhoods:
          neighborhoodsArray.length > 0 ? neighborhoodsArray : undefined,
        radius_km: parseFloat(radiusKm),
        is_primary: isPrimary,
        is_active: isActive,
      };

      if (editingArea) {
        await updateAreaMutation.mutateAsync({
          id: editingArea.id,
          data: areaData,
        });
      } else {
        await createAreaMutation.mutateAsync(areaData as CreateServiceAreaData);
      }

      setDialogOpen(false);
    } catch (error) {
      logger.error("Error saving service area:", error);
    }
  }

  async function handleDelete(areaId: string) {
    const confirmed = await confirm({
      title: "Remover area de atuacao",
      description: "Esta area sera removida do perfil e deixara de aparecer na cobertura de atendimento.",
      confirmLabel: "Remover",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      await deleteAreaMutation.mutateAsync(areaId);
    } catch (error) {
      logger.error("Error deleting service area:", error);
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
      logger.error("Error setting primary area:", error);
    }
  }

  async function handleToggleActive(areaId: string, currentActive: boolean) {
    try {
      await updateAreaMutation.mutateAsync({
        id: areaId,
        data: { is_active: !currentActive },
      });
    } catch (error) {
      logger.error("Error toggling area:", error);
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
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Áreas de Atuação</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie onde você atende
          </p>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Área
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Nenhuma área de atuação cadastrada
          </p>
          <Button onClick={openCreateDialog} variant="outline" size="sm">
            Adicionar Primeira Área
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {areas.map((area) => (
            <Card key={area.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold">{area.city}</h4>
                    {area.is_primary && (
                      <Badge variant="default" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Primária
                      </Badge>
                    )}
                    {!area.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inativa
                      </Badge>
                    )}
                  </div>

                  {area.neighborhoods && area.neighborhoods.length > 0 && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Bairros: {area.neighborhoods.join(", ")}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Raio: {area.radius_km} km
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={area.is_active}
                    onCheckedChange={() =>
                      handleToggleActive(area.id, area.is_active)
                    }
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
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(area.id)}
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
              {editingArea ? "Editar" : "Adicionar"} Área de Atuação
            </DialogTitle>
            <DialogDescription>Configure onde você atende</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Cidade *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: cidade atendida"
              />
            </div>

            <div>
              <Label>Bairros (opcional)</Label>
              <Input
                value={neighborhoods}
                onChange={(e) => setNeighborhoods(e.target.value)}
                placeholder="Ex: Centro, Zona Norte, bairros atendidos"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separe por vírgula. Deixe vazio para atender toda a cidade.
              </p>
            </div>

            <div>
              <Label>Raio de Atendimento (km) *</Label>
              <Input
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Área Primária</Label>
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Ativa</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}
