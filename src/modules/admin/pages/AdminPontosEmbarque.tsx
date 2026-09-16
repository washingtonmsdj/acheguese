import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Accessibility,
  Armchair,
  Building2,
  Bus,
  Church,
  Edit,
  Eye,
  EyeOff,
  Home,
  Landmark,
  Lightbulb,
  MapPin,
  MoreHorizontal,
  Plus,
  School,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { adminPickupPointsService } from "@/core/admin/services/AdminPickupPointsService";
import type { PickupPoint } from "@/core/admin/services/AdminPickupPointsService";
import { useLocationContext } from "@/core/location";
import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
import { PICKUP_POINTS_DEFAULTS } from "@/modules/admin/config/pickupPoints.config";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";
import { cn } from "@/shared/utils/cn";

type PickupPointFormData = {
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  type: string;
  capacity: number;
  has_shelter: boolean;
  has_bench: boolean;
  has_lighting: boolean;
  accessibility: boolean;
  active: boolean;
  notes: string;
};

type PickupPointTypeInfo = {
  icon: ReactNode;
  label: string;
  color: string;
};

function createEmptyFormData(territoryName = ""): PickupPointFormData {
  return {
    name: "",
    description: "",
    address: "",
    neighborhood: territoryName,
    latitude: PICKUP_POINTS_DEFAULTS.coordinates.latitude,
    longitude: PICKUP_POINTS_DEFAULTS.coordinates.longitude,
    type: "bus_stop",
    capacity: 10,
    has_shelter: false,
    has_bench: false,
    has_lighting: false,
    accessibility: false,
    active: true,
    notes: "",
  };
}

const typeConfig: Record<string, PickupPointTypeInfo> = {
  bus_stop: {
    icon: <Bus className="h-4 w-4" aria-hidden="true" />,
    label: "Ponto de ônibus",
    color: "bg-info/10 text-info",
  },
  landmark: {
    icon: <Landmark className="h-4 w-4" aria-hidden="true" />,
    label: "Ponto de referência",
    color: "bg-primary/10 text-primary",
  },
  square: {
    icon: <Square className="h-4 w-4" aria-hidden="true" />,
    label: "Praça",
    color: "bg-success/10 text-success",
  },
  school: {
    icon: <School className="h-4 w-4" aria-hidden="true" />,
    label: "Escola",
    color: "bg-warning/10 text-warning",
  },
  church: {
    icon: <Church className="h-4 w-4" aria-hidden="true" />,
    label: "Igreja",
    color: "bg-accent text-accent-foreground",
  },
  commercial: {
    icon: <Building2 className="h-4 w-4" aria-hidden="true" />,
    label: "Comercial",
    color: "bg-category-business/10 text-category-business",
  },
  other: {
    icon: <MoreHorizontal className="h-4 w-4" aria-hidden="true" />,
    label: "Outro",
    color: "bg-muted text-muted-foreground",
  },
};

export default function AdminPontosEmbarque() {
  const { canModerate, isChecking } = useAdminGuard();
  const { activeLocation } = useLocationContext();
  const activeLocationId = activeLocation?.id ?? null;
  const activeLocationName = activeLocation?.name ?? "";
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
  const [formData, setFormData] = useState<PickupPointFormData>(() =>
    createEmptyFormData(),
  );

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPickupPointsService.getAllPickupPoints(activeLocationId);
      setPoints(data);
    } catch (error: unknown) {
      toast.error("Erro ao carregar pontos", {
        description:
          error instanceof Error ? error.message : "Falha ao carregar pontos",
      });
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    if (!isChecking && canModerate) {
      void fetchPoints();
    }
  }, [canModerate, fetchPoints, isChecking]);

  useEffect(() => {
    if (!editingPoint) {
      setFormData((current) => ({
        ...current,
        neighborhood: activeLocationName,
      }));
    }
  }, [activeLocationName, editingPoint]);

  if (!isChecking && !canModerate) {
    return <AdminAccessDenied />;
  }

  const resetForm = () => {
    setFormData(createEmptyFormData(activeLocationName));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPoint(null);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!activeLocationId) {
      toast.error("Selecione um território antes de cadastrar pontos de embarque.");
      return;
    }

    try {
      const payload = {
        ...formData,
        location_id: activeLocationId,
      };

      if (editingPoint) {
        await adminPickupPointsService.updatePickupPoint(editingPoint.id, payload);
        toast.success("Ponto atualizado com sucesso!");
      } else {
        await adminPickupPointsService.createPickupPoint(payload);
        toast.success("Ponto criado com sucesso!");
      }

      closeModal();
      await fetchPoints();
    } catch (error: unknown) {
      toast.error("Erro ao salvar ponto", {
        description:
          error instanceof Error ? error.message : "Falha ao salvar ponto",
      });
    }
  };

  const handleEdit = (point: PickupPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      description: point.description || "",
      address: point.address,
      neighborhood: point.location_name || activeLocationName,
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
      type: point.type,
      capacity: point.capacity,
      has_shelter: point.has_shelter,
      has_bench: point.has_bench,
      has_lighting: point.has_lighting,
      accessibility: point.accessibility,
      active: point.active,
      notes: point.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir ponto de embarque",
      description:
        "Este ponto será removido da operação de embarque do território selecionado.",
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      await adminPickupPointsService.deletePickupPoint(id);
      toast.success("Ponto excluído com sucesso!");
      await fetchPoints();
    } catch (error: unknown) {
      toast.error("Erro ao excluir ponto", {
        description:
          error instanceof Error ? error.message : "Falha ao excluir ponto",
      });
    }
  };

  const toggleActive = async (point: PickupPoint) => {
    try {
      await adminPickupPointsService.togglePickupPointActive(
        point.id,
        !point.active,
      );
      toast.success(point.active ? "Ponto desativado" : "Ponto ativado");
      await fetchPoints();
    } catch (error: unknown) {
      toast.error("Erro ao atualizar status", {
        description:
          error instanceof Error ? error.message : "Falha ao atualizar status",
      });
    }
  };

  const openCreateModal = () => {
    setEditingPoint(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground" role="status">
        Carregando...
      </div>
    );
  }

  const activeCount = points.filter((point) => point.active).length;
  const accessibleCount = points.filter((point) => point.accessibility).length;
  const shelterCount = points.filter((point) => point.has_shelter).length;

  return (
    <div className="mx-auto max-w-7xl p-4 text-foreground md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
            Pontos de embarque
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os pontos de embarque do território selecionado.
          </p>
        </div>
        <Button onClick={openCreateModal} disabled={!activeLocationId}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Novo ponto
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={MapPin}
          iconClassName="text-primary"
          label="Total"
          value={points.length}
        />
        <StatCard
          icon={Eye}
          iconClassName="text-success"
          label="Ativos"
          value={activeCount}
          valueClassName="text-success"
        />
        <StatCard
          icon={Accessibility}
          iconClassName="text-info"
          label="Acessíveis"
          value={accessibleCount}
          valueClassName="text-info"
        />
        <StatCard
          icon={Home}
          iconClassName="text-warning"
          label="Com abrigo"
          value={shelterCount}
          valueClassName="text-warning"
        />
      </div>

      {points.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-card-foreground md:p-12">
          <MapPin
            className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60"
            aria-hidden="true"
          />
          <p className="mb-2 text-muted-foreground">
            Nenhum ponto de embarque cadastrado
          </p>
          <p className="text-sm text-muted-foreground">
            Selecione um território e cadastre o primeiro ponto operacional.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {points.map((point) => {
            const typeInfo = typeConfig[point.type] || typeConfig.other;

            return (
              <article
                key={point.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-4 text-card-foreground transition-opacity",
                  !point.active && "opacity-65",
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className={cn("rounded-lg p-2", typeInfo.color)}>
                      {typeInfo.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {point.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      point.active
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground"
                    }
                  >
                    {point.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <p className="mb-3 text-xs text-muted-foreground">{point.address}</p>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {point.has_shelter ? (
                    <FeatureBadge icon={Home} label="Abrigo" className="text-warning" />
                  ) : null}
                  {point.has_bench ? (
                    <FeatureBadge icon={Armchair} label="Banco" className="text-info" />
                  ) : null}
                  {point.has_lighting ? (
                    <FeatureBadge
                      icon={Lightbulb}
                      label="Luz"
                      className="text-warning"
                    />
                  ) : null}
                  {point.accessibility ? (
                    <FeatureBadge
                      icon={Accessibility}
                      label="Acessível"
                      className="text-success"
                    />
                  ) : null}
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Cap: {point.capacity}</span>
                  <span aria-hidden="true">•</span>
                  <span className="font-mono">
                    {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(point)}
                    className="h-8 flex-1 text-xs"
                  >
                    <Edit className="mr-1 h-3 w-3" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void toggleActive(point)}
                    className="h-8 px-3"
                    aria-label={point.active ? "Desativar ponto" : "Ativar ponto"}
                  >
                    {point.active ? (
                      <EyeOff className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Eye className="h-3 w-3" aria-hidden="true" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleDelete(point.id)}
                    className="h-8 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Excluir ${point.name}`}
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (open) setShowModal(true);
          else closeModal();
        }}
      >
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto border-border bg-popover text-popover-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              {editingPoint ? "Editar ponto" : "Novo ponto"}
            </DialogTitle>
            <DialogDescription>
              {editingPoint
                ? "Atualize os dados operacionais do ponto de embarque."
                : "Cadastre um ponto de embarque no território ativo."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nome do ponto *">
              <Input
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                placeholder="Ex: Ponto da Praça"
                required
              />
            </Field>

            <Field label="Descrição">
              <Textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData({ ...formData, description: event.target.value })
                }
                placeholder="Descrição opcional do ponto"
                className="min-h-[60px]"
              />
            </Field>

            <Field label="Endereço *">
              <Input
                value={formData.address}
                onChange={(event) =>
                  setFormData({ ...formData, address: event.target.value })
                }
                placeholder="Rua, número"
                required
              />
            </Field>

            <Field label="Território *">
              <Input
                value={formData.neighborhood}
                placeholder="Selecione um território no contexto do admin"
                disabled
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Latitude *">
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      latitude: Number.parseFloat(event.target.value),
                    })
                  }
                  required
                />
              </Field>
              <Field label="Longitude *">
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      longitude: Number.parseFloat(event.target.value),
                    })
                  }
                  required
                />
              </Field>
            </div>

            <div>
              <Label className="mb-2 block text-xs text-muted-foreground">
                Tipo *
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: key })}
                    aria-pressed={formData.type === key}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      formData.type === key
                        ? `${config.color} border-ring/40`
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Capacidade *">
              <Input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    capacity: Number.parseInt(event.target.value, 10),
                  })
                }
                required
              />
            </Field>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Características</Label>
              <FeatureSwitch
                icon={Home}
                iconClassName="text-warning"
                label="Possui abrigo/cobertura"
                checked={formData.has_shelter}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, has_shelter: checked })
                }
              />
              <FeatureSwitch
                icon={Armchair}
                iconClassName="text-info"
                label="Possui banco"
                checked={formData.has_bench}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, has_bench: checked })
                }
              />
              <FeatureSwitch
                icon={Lightbulb}
                iconClassName="text-warning"
                label="Possui iluminação"
                checked={formData.has_lighting}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, has_lighting: checked })
                }
              />
              <FeatureSwitch
                icon={Accessibility}
                iconClassName="text-success"
                label="Acessível para cadeirantes"
                checked={formData.accessibility}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, accessibility: checked })
                }
              />
              <FeatureSwitch
                icon={Eye}
                iconClassName="text-primary"
                label="Ponto ativo"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
            </div>

            <Field label="Notas internas">
              <Textarea
                value={formData.notes}
                onChange={(event) =>
                  setFormData({ ...formData, notes: event.target.value })
                }
                placeholder="Observações internas (não visível para usuários)"
                className="min-h-[60px]"
              />
            </Field>

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingPoint ? "Atualizar" : "Criar"} ponto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  valueClassName = "text-foreground",
}: {
  icon: typeof MapPin;
  iconClassName: string;
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
    </div>
  );
}

function FeatureBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: typeof Home;
  label: string;
  className: string;
}) {
  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      <Icon className="mr-1 h-3 w-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function FeatureSwitch({
  icon: Icon,
  iconClassName,
  label,
  checked,
  onCheckedChange,
}: {
  icon: typeof Home;
  iconClassName: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
        <span className="text-sm">{label}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
